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
    const dadosParaInserir = dados.map(linha => ({
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
      vendas: linha.vendas,
      estoque_loja: linha.estoque_loja,
      pedidos: linha.pedidos,
      entradas_loja: linha.entradas_loja,
      prioridade: linha.prioridade,
      comentario: linha.comentario,
      total: linha.total,
    }));

    // Inserção em lotes no Supabase
    // O Supabase suporta inserção de array direto
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
