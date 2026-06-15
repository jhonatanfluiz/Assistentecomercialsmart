"use server";

import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, supabaseKey);
}

export type DashboardFiltros = {
  fabricante?: string;
  periodo?: string; // mes_referencia na verdade
  local?: string;
};

export async function getDashboardMetrics(filtros?: DashboardFiltros) {
  const supabase = getSupabaseClient();
  
  let query = supabase.from('historico_estoque_vendas').select('codigo, estoque_geral, estoque_loja, vendas, devolucoes, requisicoes, entradas_loja');
  
  if (filtros?.fabricante && filtros.fabricante !== '') {
    query = query.eq('fabricante', filtros.fabricante);
  }
  
  if (filtros?.local && filtros.local !== '') {
    query = query.eq('loja', filtros.local);
  }

  const { data, error } = await query;
  
  if (error || !data) {
    console.error("Erro ao buscar métricas:", error);
    return {
      estoqueGeralTotal: { valor: 0, variacao: '0%', descricao: 'Total de produtos em CD e Lojas' },
      vendasTotais: { valor: 0, variacao: '0%', descricao: 'Volume total vendido no período' },
      giroDeEstoque: { valor: 0, variacao: '0%', descricao: 'Velocidade de giro (Vendas vs Estoque)' },
      estoqueZerado: { valor: 0, variacao: '0', descricao: 'Itens com estoque zerado' },
      requisicoesAtivas: { valor: 0, variacao: '0%', descricao: 'Requisições pendentes/transferências' },
      produtosSemGiro: { valor: 0, variacao: '0', descricao: 'Itens parados no estoque' }
    };
  }

  let estoque_geral_sum = 0;
  let estoque_loja_sum = 0;
  let vendas_sum = 0;
  let estoque_zerado_count = 0;
  let requisicoes_sum = 0;
  let produtos_sem_giro = 0;

  for (const row of data) {
    const eg = Number(row.estoque_geral) || 0;
    const el = Number(row.estoque_loja) || 0;
    const v = Number(row.vendas) || 0;
    
    estoque_geral_sum += eg;
    estoque_loja_sum += el;
    vendas_sum += v;
    requisicoes_sum += Number(row.requisicoes) || 0;
    
    if (eg === 0 && el === 0) {
      estoque_zerado_count += 1;
    }
    
    if (v === 0 && eg > 0) {
      produtos_sem_giro += 1;
    }
  }

  const estoque_total = estoque_geral_sum + estoque_loja_sum;
  const giro = estoque_total > 0 ? ((vendas_sum / estoque_total) * 100).toFixed(1) : 0;

  return {
    estoqueGeralTotal: {
      valor: estoque_total,
      variacao: 'Real',
      descricao: 'Total de produtos em CD e Lojas'
    },
    vendasTotais: {
      valor: vendas_sum,
      variacao: 'Real',
      descricao: 'Volume total vendido no período'
    },
    giroDeEstoque: {
      valor: giro,
      variacao: 'Real',
      descricao: 'Giro (Vendas / Estoque) %'
    },
    estoqueZerado: {
      valor: estoque_zerado_count,
      variacao: 'Real',
      descricao: 'Itens com estoque zerado no momento'
    },
    requisicoesAtivas: {
      valor: requisicoes_sum,
      variacao: 'Real',
      descricao: 'Requisições pendentes/transferências'
    },
    produtosSemGiro: {
      valor: produtos_sem_giro,
      variacao: 'Real',
      descricao: 'Itens parados no estoque (Giro 0)'
    }
  };
}

export async function getSalesTrendChart(filtros?: DashboardFiltros) {
  const supabase = getSupabaseClient();
  
  let query = supabase.from('historico_estoque_vendas').select('mes_referencia, vendas, entradas_loja');
  
  if (filtros?.fabricante && filtros.fabricante !== '') {
    query = query.eq('fabricante', filtros.fabricante);
  }
  
  if (filtros?.local && filtros.local !== '') {
    query = query.eq('loja', filtros.local);
  }

  const { data, error } = await query;
  
  if (error || !data) {
    return [];
  }

  // Agrupar por mes_referencia
  const agrupado: Record<string, { vendas: number, projetado: number }> = {};
  
  for (const row of data) {
    const mes = row.mes_referencia || 'N/A';
    if (!agrupado[mes]) agrupado[mes] = { vendas: 0, projetado: 0 };
    
    agrupado[mes].vendas += Number(row.vendas) || 0;
    agrupado[mes].projetado += Number(row.entradas_loja) || 0; // Usando entradas como meta/projeção
  }

  return Object.keys(agrupado).map(mes => ({
    name: mes,
    vendas: agrupado[mes].vendas,
    projetado: agrupado[mes].projetado
  })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getFabricantes() {
  const supabase = getSupabaseClient();
  // Busca fabricantes distintos para o select
  const { data, error } = await supabase.from('historico_estoque_vendas').select('fabricante');
  
  if (error || !data) return [];
  
  const fabs = Array.from(new Set(data.map(d => d.fabricante))).filter(Boolean);
  return fabs.sort();
}

export type ItemZerado = {
  codigo: string;
  descricao: string;
  fabricante: string;
  fornecedor: string;
  vendasPeriodo: number;
  dataUltimaEntrada: string;
  qtdUltimaEntrada: number;
  local: string;
};

function formatDataBR(isoDate: string) {
  if (!isoDate || isoDate === 'Sem registro') return isoDate;
  try {
    const d = new Date(isoDate);
    const dia = String(d.getUTCDate()).padStart(2, '0');
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
    const ano = d.getUTCFullYear();
    if (isNaN(ano)) return isoDate;
    return `${dia}/${mes}/${ano}`;
  } catch(e) {
    return isoDate;
  }
}

export async function getItensEstoqueZerado(filtros?: DashboardFiltros): Promise<ItemZerado[]> {
  const supabase = getSupabaseClient();
  
  // 1. Busca os itens zerados na tabela de vendas
  let queryVendas = supabase.from('historico_estoque_vendas')
    .select('codigo, descricao, fabricante, vendas, estoque_geral, estoque_loja, loja');
    
  if (filtros?.fabricante && filtros.fabricante !== '') {
    queryVendas = queryVendas.eq('fabricante', filtros.fabricante);
  }
  
  if (filtros?.local && filtros.local !== '') {
    queryVendas = queryVendas.eq('loja', filtros.local);
  }

  const { data: dadosVendas, error: errVendas } = await queryVendas;
  if (errVendas || !dadosVendas) return [];

  const itensZerados = dadosVendas.filter(row => 
    (Number(row.estoque_geral) || 0) === 0 && (Number(row.estoque_loja) || 0) === 0
  );

  if (itensZerados.length === 0) return [];

  // Pega os códigos para cruzar (removendo espaços em branco extras)
  const codigos = itensZerados.map(item => String(item.codigo).trim());

  // 2. Busca o histórico de entradas para esses códigos
  const { data: dadosEntradas, error: errEntradas } = await supabase
    .from('historico_entradas')
    .select('codigo, data_movimento, quantidade, fornecedor, local')
    .in('codigo', codigos)
    .order('data_movimento', { ascending: false });

  const entradasMap: Record<string, { data: string, qtd: number, fornecedor: string, local: string }> = {};

  // Função auxiliar para normalizar e mapear locais equivalentes
  const normalizarLocal = (loc: string) => {
    const l = String(loc).trim().toUpperCase();
    if (l === 'CD' || l.includes('TAQUARI')) return 'CD_TAQUARI';
    if (l === 'SJC' || l === '33-SJS') return 'SJC_SJS';
    if (l.includes('ABDO')) return 'ABDO';
    if (l.includes('MOOCA')) return 'MOOCA';
    if (l.includes('SUZ')) return 'SUZ';
    if (l.includes('SAM')) return 'SAM';
    return l;
  };

  if (!errEntradas && dadosEntradas) {
    for (const ent of dadosEntradas) {
      const codTrim = String(ent.codigo).trim();
      const locNorm = normalizarLocal(ent.local);
      const key = `${codTrim}_${locNorm}`;
      
      // Armazenamos a entrada mais recente (a query já vem ordernada DESC)
      if (!entradasMap[key]) {
        entradasMap[key] = { 
          data: ent.data_movimento, 
          qtd: Number(ent.quantidade) || 0,
          fornecedor: ent.fornecedor || 'Desconhecido',
          local: ent.local || 'Desconhecido'
        };
      }
    }
  }

  // 3. Mescla os dados
  const resultadoFinal = itensZerados.map(item => {
    const codTrim = String(item.codigo).trim();
    const lojaOriginal = String(item.loja || '').trim();
    const locNorm = normalizarLocal(lojaOriginal);
    const key = `${codTrim}_${locNorm}`;
    
    // Tenta encontrar a entrada para a mesma loja. Se não achar, não mostra de outra loja.
    const entrada = entradasMap[key];

    return {
      codigo: codTrim,
      descricao: item.descricao || 'N/A',
      fabricante: item.fabricante || 'N/A',
      fornecedor: entrada?.fornecedor || 'Desconhecido',
      vendasPeriodo: Number(item.vendas) || 0,
      dataUltimaEntrada: formatDataBR(entrada?.data || 'Sem registro'),
      qtdUltimaEntrada: entrada?.qtd || 0,
      local: lojaOriginal || 'Desconhecido'
    };
  });

  // Ordena por maior número de vendas (produtos que mais fazem falta)
  return resultadoFinal.sort((a, b) => b.vendasPeriodo - a.vendasPeriodo);
}

export async function getLocais() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('historico_estoque_vendas').select('loja');
  
  if (error || !data) return [];
  
  const locais = Array.from(new Set(data.map(d => d.loja))).filter(Boolean);
  return locais.sort();
}

export type ItemSemGiro = {
  codigo: string;
  descricao: string;
  fabricante: string;
  estoqueGeral: number;
  estoqueLoja: number;
  totalEstoque: number;
  local: string;
};

export async function getProdutosSemGiroDetalhamento(filtros?: DashboardFiltros): Promise<ItemSemGiro[]> {
  const supabase = getSupabaseClient();
  
  let query = supabase.from('historico_estoque_vendas')
    .select('codigo, descricao, fabricante, vendas, estoque_geral, estoque_loja, loja');
    
  if (filtros?.fabricante && filtros.fabricante !== '') {
    query = query.eq('fabricante', filtros.fabricante);
  }
  
  if (filtros?.local && filtros.local !== '') {
    query = query.eq('loja', filtros.local);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const itensSemGiro = data.filter(row => {
    const v = Number(row.vendas) || 0;
    const eg = Number(row.estoque_geral) || 0;
    const el = Number(row.estoque_loja) || 0;
    return v === 0 && (eg > 0 || el > 0);
  });

  return itensSemGiro.map(item => {
    const eg = Number(item.estoque_geral) || 0;
    const el = Number(item.estoque_loja) || 0;
    return {
      codigo: item.codigo,
      descricao: item.descricao || 'N/A',
      fabricante: item.fabricante || 'N/A',
      estoqueGeral: eg,
      estoqueLoja: el,
      totalEstoque: eg + el,
      local: item.loja || 'Desconhecido'
    };
  }).sort((a, b) => b.totalEstoque - a.totalEstoque);
}
