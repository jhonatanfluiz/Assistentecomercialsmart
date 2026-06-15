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
};

export async function getDashboardMetrics(filtros?: DashboardFiltros) {
  const supabase = getSupabaseClient();
  
  let query = supabase.from('historico_estoque_vendas').select('estoque_geral, estoque_loja, vendas, devolucoes, requisicoes, entradas_loja');
  
  if (filtros?.fabricante && filtros.fabricante !== '') {
    query = query.eq('fabricante', filtros.fabricante);
  }

  const { data, error } = await query;
  
  if (error || !data) {
    console.error("Erro ao buscar métricas:", error);
    return {
      estoqueGeralTotal: { valor: 0, variacao: '0%', descricao: 'Total de produtos em CD e Lojas' },
      vendasTotais: { valor: 0, variacao: '0%', descricao: 'Volume total vendido no período' },
      giroDeEstoque: { valor: 0, variacao: '0%', descricao: 'Velocidade de giro (Vendas vs Estoque)' },
      devolucoesTotal: { valor: 0, variacao: '0%', descricao: 'Volume de produtos devolvidos' },
      requisicoesAtivas: { valor: 0, variacao: '0%', descricao: 'Requisições pendentes/transferências' },
      produtosSemGiro: { valor: 0, variacao: '0', descricao: 'Itens parados no estoque' }
    };
  }

  let estoque_geral_sum = 0;
  let estoque_loja_sum = 0;
  let vendas_sum = 0;
  let devolucoes_sum = 0;
  let requisicoes_sum = 0;
  let produtos_sem_giro = 0;

  for (const row of data) {
    const eg = Number(row.estoque_geral) || 0;
    const el = Number(row.estoque_loja) || 0;
    const v = Number(row.vendas) || 0;
    
    estoque_geral_sum += eg;
    estoque_loja_sum += el;
    vendas_sum += v;
    devolucoes_sum += Number(row.devolucoes) || 0;
    requisicoes_sum += Number(row.requisicoes) || 0;
    
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
    devolucoesTotal: {
      valor: devolucoes_sum,
      variacao: 'Real',
      descricao: 'Volume de produtos devolvidos'
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
