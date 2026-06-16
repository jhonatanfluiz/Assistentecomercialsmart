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
  numeroPedidoEntrada?: string;
  local: string;
  dataIdentificacao?: string;
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
  let queryVendas = supabase
    .from('historico_estoque_vendas')
    .select('codigo, descricao, fabricante, vendas, loja, estoque_geral, estoque_loja, criado_em')
    .neq('id', '00000000-0000-0000-0000-000000000000'); // apenas para forçar uma query

  // Aplica os filtros de local se houver
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
    .select('codigo, data_movimento, quantidade, fornecedor, local, pedido')
    .in('codigo', codigos)
    .order('data_movimento', { ascending: false });

  const entradasMap: Record<string, { data: string, qtd: number, fornecedor: string, local: string, pedido: string }> = {};

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
          local: ent.local || 'Desconhecido',
          pedido: ent.pedido || ''
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
      numeroPedidoEntrada: entrada?.pedido || '-',
      local: lojaOriginal || 'Desconhecido',
      dataIdentificacao: formatDataBR(item.criado_em)
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

export type DetalhamentoGeral = {
  codigo: string;
  descricao: string;
  fabricante: string;
  vendas: number;
  estoqueGeral: number;
  estoqueLoja: number;
  totalEstoque: number;
  giro: number;
  requisicoes: number;
  local: string;
};

export async function getDetalhamentoEstoqueTotal(filtros?: DashboardFiltros): Promise<DetalhamentoGeral[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from('historico_estoque_vendas').select('*');
  if (filtros?.fabricante) query = query.eq('fabricante', filtros.fabricante);
  if (filtros?.local) query = query.eq('loja', filtros.local);

  const { data, error } = await query;
  if (error || !data) return [];

  const itens = data.map(item => {
    const v = Number(item.vendas) || 0;
    const eg = Number(item.estoque_geral) || 0;
    const el = Number(item.estoque_loja) || 0;
    const req = Number(item.requisicoes) || 0;
    const tot = eg + el;
    const giro = tot > 0 ? (v / tot) * 100 : 0;
    
    return {
      codigo: item.codigo,
      descricao: item.descricao || 'N/A',
      fabricante: item.fabricante || 'N/A',
      vendas: v,
      estoqueGeral: eg,
      estoqueLoja: el,
      totalEstoque: tot,
      giro: giro,
      requisicoes: req,
      local: item.loja || 'Desconhecido'
    };
  }).filter(i => i.totalEstoque > 0);

  return itens.sort((a, b) => b.totalEstoque - a.totalEstoque);
}

export async function getDetalhamentoVolumeVendas(filtros?: DashboardFiltros): Promise<DetalhamentoGeral[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from('historico_estoque_vendas').select('*');
  if (filtros?.fabricante) query = query.eq('fabricante', filtros.fabricante);
  if (filtros?.local) query = query.eq('loja', filtros.local);

  const { data, error } = await query;
  if (error || !data) return [];

  const itens = data.map(item => {
    const v = Number(item.vendas) || 0;
    const eg = Number(item.estoque_geral) || 0;
    const el = Number(item.estoque_loja) || 0;
    const req = Number(item.requisicoes) || 0;
    const tot = eg + el;
    const giro = tot > 0 ? (v / tot) * 100 : 0;
    
    return {
      codigo: item.codigo,
      descricao: item.descricao || 'N/A',
      fabricante: item.fabricante || 'N/A',
      vendas: v,
      estoqueGeral: eg,
      estoqueLoja: el,
      totalEstoque: tot,
      giro: giro,
      requisicoes: req,
      local: item.loja || 'Desconhecido'
    };
  }).filter(i => i.vendas > 0);

  return itens.sort((a, b) => b.vendas - a.vendas);
}

export async function getDetalhamentoGiroEstoque(filtros?: DashboardFiltros): Promise<DetalhamentoGeral[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from('historico_estoque_vendas').select('*');
  if (filtros?.fabricante) query = query.eq('fabricante', filtros.fabricante);
  if (filtros?.local) query = query.eq('loja', filtros.local);

  const { data, error } = await query;
  if (error || !data) return [];

  const itens = data.map(item => {
    const v = Number(item.vendas) || 0;
    const eg = Number(item.estoque_geral) || 0;
    const el = Number(item.estoque_loja) || 0;
    const req = Number(item.requisicoes) || 0;
    const tot = eg + el;
    const giro = tot > 0 ? (v / tot) * 100 : 0;
    
    return {
      codigo: item.codigo,
      descricao: item.descricao || 'N/A',
      fabricante: item.fabricante || 'N/A',
      vendas: v,
      estoqueGeral: eg,
      estoqueLoja: el,
      totalEstoque: tot,
      giro: giro,
      requisicoes: req,
      local: item.loja || 'Desconhecido'
    };
  }).filter(i => i.giro > 0);

  return itens.sort((a, b) => b.giro - a.giro);
}

export async function getDetalhamentoRequisicoes(filtros?: DashboardFiltros): Promise<DetalhamentoGeral[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from('historico_estoque_vendas').select('*');
  if (filtros?.fabricante) query = query.eq('fabricante', filtros.fabricante);
  if (filtros?.local) query = query.eq('loja', filtros.local);

  const { data, error } = await query;
  if (error || !data) return [];

  const itens = data.map(item => {
    const v = Number(item.vendas) || 0;
    const eg = Number(item.estoque_geral) || 0;
    const el = Number(item.estoque_loja) || 0;
    const req = Number(item.requisicoes) || 0;
    const tot = eg + el;
    const giro = tot > 0 ? (v / tot) * 100 : 0;
    
    return {
      codigo: item.codigo,
      descricao: item.descricao || 'N/A',
      fabricante: item.fabricante || 'N/A',
      vendas: v,
      estoqueGeral: eg,
      estoqueLoja: el,
      totalEstoque: tot,
      giro: giro,
      requisicoes: req,
      local: item.loja || 'Desconhecido'
    };
  }).filter(i => i.requisicoes > 0);

  return itens.sort((a, b) => b.requisicoes - a.requisicoes);
}

export type HistoricoGraficoData = {
  mes: string; // Ex: '06/2026'
  vendas: number;
  entradas: number;
  mediaMensal: number;
};

export async function getHistoricoEntradasSaidasItem(codigo: string, local: string): Promise<HistoricoGraficoData[]> {
  const supabase = getSupabaseClient();
  const codTrim = String(codigo).trim();

  const normalizarLocal = (loc: string) => {
    const l = String(loc || '').trim().toUpperCase();
    if (l === 'CD' || l.includes('TAQUARI')) return 'CD_TAQUARI';
    if (l === 'SJC' || l === '33-SJS') return 'SJC_SJS';
    if (l.includes('ABDO')) return 'ABDO';
    if (l.includes('MOOCA')) return 'MOOCA';
    if (l.includes('SUZ')) return 'SUZ';
    if (l.includes('SAM')) return 'SAM';
    return l;
  };

  const locNormReq = normalizarLocal(local);

  // Buscar vendas
  const { data: vendasData } = await supabase
    .from('historico_estoque_vendas')
    .select('mes_referencia, vendas, loja')
    .eq('codigo', codTrim);

  // Buscar entradas
  const { data: entradasData } = await supabase
    .from('historico_entradas')
    .select('data_movimento, quantidade, local')
    .eq('codigo', codTrim);

  const mesMap: Record<string, { vendas: number, entradas: number }> = {};

  // Processar vendas
  if (vendasData) {
    for (const v of vendasData) {
      if (locNormReq !== '' && normalizarLocal(v.loja) !== locNormReq) continue;
      
      const mes = String(v.mes_referencia).trim(); // Formato esperado 'MM/YYYY' ou 'YYYY-MM'
      let mesFormatado = mes;
      // Tentar padronizar se vier 'YYYY-MM'
      if (mes.includes('-') && mes.length === 7) {
        const parts = mes.split('-');
        mesFormatado = `${parts[1]}/${parts[0]}`;
      }

      if (!mesMap[mesFormatado]) mesMap[mesFormatado] = { vendas: 0, entradas: 0 };
      mesMap[mesFormatado].vendas += (Number(v.vendas) || 0);
    }
  }

  // Processar entradas
  if (entradasData) {
    for (const e of entradasData) {
      if (locNormReq !== '' && normalizarLocal(e.local) !== locNormReq) continue;

      const dataStr = String(e.data_movimento).trim();
      let mesFormatado = '00/0000';
      
      // Assumindo data_movimento como 'DD/MM/YYYY' ou 'YYYY-MM-DD'
      if (dataStr.includes('/')) {
        const parts = dataStr.split('/');
        if (parts.length >= 3) {
          mesFormatado = `${parts[1]}/${parts[2]}`; // MM/YYYY
        }
      } else if (dataStr.includes('-')) {
        const parts = dataStr.split('-');
        if (parts.length >= 3) {
          mesFormatado = `${parts[1]}/${parts[0]}`; // MM/YYYY (de YYYY-MM-DD)
        }
      }

      if (!mesMap[mesFormatado]) mesMap[mesFormatado] = { vendas: 0, entradas: 0 };
      mesMap[mesFormatado].entradas += (Number(e.quantidade) || 0);
    }
  }

  // Gerar array final ordenado por data
  const result: HistoricoGraficoData[] = Object.keys(mesMap).map(mes => ({
    mes,
    vendas: mesMap[mes].vendas,
    entradas: mesMap[mes].entradas,
    mediaMensal: 0 // Será calculado abaixo
  }));

  // Ordenar cronologicamente: assumindo formato 'MM/YYYY'
  result.sort((a, b) => {
    const [ma, ya] = a.mes.split('/');
    const [mb, yb] = b.mes.split('/');
    const dateA = new Date(Number(ya), Number(ma) - 1);
    const dateB = new Date(Number(yb), Number(mb) - 1);
    return dateA.getTime() - dateB.getTime();
  });

  // Calcular média mensal de vendas até aquele mês (média acumulada) ou média fixa de todo período
  // Vamos usar uma média fixa de todo o período retornado para servir como uma "linha base" ou "potencial"
  const totalVendas = result.reduce((acc, item) => acc + item.vendas, 0);
  const mediaFixa = result.length > 0 ? Math.round(totalVendas / result.length) : 0;

  result.forEach(item => {
    item.mediaMensal = mediaFixa;
  });

  return result;
}

export type ProdutoBusca = {
  codigo: string;
  descricao: string;
  fabricante: string;
  loja: string;
  estoqueGeral: number;
  estoqueLoja: number;
  vendasTotais: number;
};

export async function buscarTodosProdutos(termo: string): Promise<ProdutoBusca[]> {
  const supabase = getSupabaseClient();
  
  if (!termo || termo.length < 2) return [];

  const t = termo.trim().toLowerCase();

  const { data, error } = await supabase
    .from('historico_estoque_vendas')
    .select('codigo, descricao, fabricante, loja, estoque_geral, estoque_loja, vendas')
    .or(`codigo.ilike.%${t}%,descricao.ilike.%${t}%`)
    .limit(200);

  if (error || !data) return [];

  // Agrupar para não repetir (código + loja) pegando a última entrada ou somando
  // O banco tem várias linhas por mês_referencia. Precisamos agrupar para a listagem não ficar repetitiva.
  const map: Record<string, ProdutoBusca> = {};

  for (const row of data) {
    const key = `${row.codigo}_${row.loja}`;
    if (!map[key]) {
      map[key] = {
        codigo: row.codigo,
        descricao: row.descricao || 'N/A',
        fabricante: row.fabricante || 'N/A',
        loja: row.loja || 'Desconhecido',
        estoqueGeral: Number(row.estoque_geral) || 0,
        estoqueLoja: Number(row.estoque_loja) || 0,
        vendasTotais: 0
      };
    }
    // Somar vendas de todo histórico disponível para essa listagem
    map[key].vendasTotais += (Number(row.vendas) || 0);
  }

  const result = Object.values(map);
  // Ordenar pelos que mais venderam
  result.sort((a, b) => b.vendasTotais - a.vendasTotais);

  return result.slice(0, 30); // Retorna top 30 para a UI não ficar pesada
}
