"use server";

import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn("Variáveis do Supabase não configuradas corretamente.");
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export type LinhaImportada = {
  status: string;
  loja: string;
  zona: string;
  periodo_analisado: string;
  codigo: string;
  descricao: string;
  caixa_master: number | null;
  familia: string;
  estoque_geral: number | null;
  inventario: number | null;
  devolucoes: number | null;
  entradas_deposito: number | null;
  requisicoes: number | null;
  requisicoes_abdo: number | null;
  vendas: number | null;
  estoque_loja: number | null;
  pedidos: number | null;
  entradas_loja: number | null;
  prioridade: string;
  comentario: string;
  total: number | null;
};

export async function processarImportacao(dados: LinhaImportada[], fabricante: string, mesReferencia: string) {
  try {
    const supabase = getSupabaseClient();
    
    console.log(`Iniciando processamento de ${dados.length} linhas para ${fabricante} - ${mesReferencia}...`);
    
    if (!dados || dados.length === 0) {
      return { sucesso: false, erro: "Nenhum dado válido para importar." };
    }

    // Preparar os dados para inserção adicionando fabricante e mes_referencia em todas as linhas
    const map = new Map<string, any>();

    for (const linha of dados) {
      const key = `${linha.codigo}_${linha.loja}`;
      if (!map.has(key)) {
        map.set(key, {
          fabricante: fabricante,
          mes_referencia: mesReferencia,
          status: linha.status,
          loja: linha.loja,
          zona: linha.zona,
          periodo_analisado: linha.periodo_analisado,
          codigo: linha.codigo,
          descricao: linha.descricao,
          caixa_master: linha.caixa_master,
          familia: linha.familia,
          estoque_geral: linha.estoque_geral,
          inventario: linha.inventario,
          devolucoes: linha.devolucoes,
          entradas_deposito: linha.entradas_deposito,
          requisicoes: linha.requisicoes,
          requisicoes_abdo: linha.requisicoes_abdo,
          vendas: Number(linha.vendas) || 0,
          estoque_loja: Number(linha.estoque_loja) || 0,
          pedidos: linha.pedidos,
          entradas_loja: linha.entradas_loja,
          prioridade: linha.prioridade,
          comentario: linha.comentario,
          total: linha.total,
        });
      } else {
        // Se já existe, soma as vendas e mantém o maior estoque para não perder dados da filial
        const existente = map.get(key);
        existente.vendas += (Number(linha.vendas) || 0);
        existente.estoque_loja = Math.max(existente.estoque_loja, Number(linha.estoque_loja) || 0);
      }
    }

    const dadosParaInserir = Array.from(map.values());

    // Para evitar duplicidade se o usuário importar a mesma planilha 2 vezes,
    // deletamos os dados anteriores desse mesmo fabricante e mês de referência.
    await supabase
      .from('historico_estoque_vendas')
      .delete()
      .eq('fabricante', fabricante)
      .eq('mes_referencia', mesReferencia);

    // Inserção em lotes no Supabase
    const { error } = await supabase
      .from('historico_estoque_vendas')
      .insert(dadosParaInserir);

    if (error) {
      console.error("Erro do Supabase ao inserir:", error);
      throw error;
    }

    // Grava log
    await supabase.from('logs').insert({
      acao: 'Importação Real de Planilha de Estoque',
      detalhes: { linhas_processadas: dados.length, fabricante, mesReferencia }
    });

    return { sucesso: true, mensagem: `${dados.length} registros inseridos com sucesso no banco oficial.` };
  } catch (error: any) {
    console.error("Erro na importação:", error);
    return { sucesso: false, erro: error.message || "Erro desconhecido" };
  }
}

export type LinhaEntrada = {
  codigo: string;
  descricao: string;
  fabricante: string;
  fornecedor: string;
  data_movimento: string;
  quantidade: number | null;
};

function parseDateBR(dateStr: string) {
  if (!dateStr) return null;
  // Se for DD/MM/YYYY
  if (dateStr.includes('/')) {
    const parts = dateStr.split(' ')[0].split('/');
    if (parts.length === 3) {
      // Retorna YYYY-MM-DD
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  return dateStr;
}

export async function processarImportacaoEntradas(dados: LinhaEntrada[]) {
  try {
    const supabase = getSupabaseClient();
    
    console.log(`Iniciando processamento de ${dados.length} linhas de entradas...`);
    
    if (!dados || dados.length === 0) {
      return { sucesso: false, erro: "Nenhum dado válido para importar." };
    }

    // Usar um Map para unificar linhas que tenham exatamente o mesmo código e mesma data
    // Isso evita duplicar a entrada caso a planilha tenha linhas repetidas
    const map = new Map<string, any>();

    for (const linha of dados) {
      const codigoStr = String(linha.codigo).trim();
      const dataMov = parseDateBR(linha.data_movimento);
      const qtd = Number(linha.quantidade) || 0;
      
      const key = `${codigoStr}_${dataMov}`;
      
      if (!map.has(key)) {
        map.set(key, {
          codigo: codigoStr,
          descricao: linha.descricao,
          fabricante: linha.fabricante,
          fornecedor: linha.fornecedor,
          data_movimento: dataMov,
          quantidade: qtd,
        });
      } else {
        // Se já tem entrada no mesmo dia para o mesmo produto, somamos as quantidades
        const existente = map.get(key);
        existente.quantidade += qtd;
      }
    }

    const dadosParaInserir = Array.from(map.values());

    // Como as entradas não têm "mês de referência", a forma mais limpa de evitar duplicação 
    // de reimportação sem apagar o histórico é apagar as entradas dos códigos contidos nesta planilha.
    // Atenção: Isso assume que a planilha de entradas enviada contém sempre o retrato completo ou as entradas mais recentes.
    // Vamos fazer isso em lotes se necessário, mas primeiro pegamos os códigos únicos
    const codigosUnicos = Array.from(new Set(dadosParaInserir.map(d => d.codigo)));
    
    if (codigosUnicos.length > 0) {
      // Deleta as entradas antigas desses mesmos códigos para não ficar duplicando
      await supabase
        .from('historico_entradas')
        .delete()
        .in('codigo', codigosUnicos);
    }

    const { error } = await supabase
      .from('historico_entradas')
      .insert(dadosParaInserir);

    if (error) {
      console.error("Erro do Supabase ao inserir entradas:", error);
      throw error;
    }

    // Grava log
    await supabase.from('logs').insert({
      acao: 'Importação de Entradas',
      detalhes: { linhas_processadas: dados.length, linhas_inseridas: dadosParaInserir.length }
    });

    return { sucesso: true, mensagem: `${dadosParaInserir.length} registros (após remoção de duplicatas) inseridos com sucesso.` };
  } catch (error: any) {
    console.error("Erro na importação de entradas:", error);
    return { sucesso: false, erro: error.message || "Erro desconhecido" };
  }
}
