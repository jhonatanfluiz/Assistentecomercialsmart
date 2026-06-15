"use server";

import { createClient } from '@supabase/supabase-js';

// Função utilitária básica para Supabase no servidor
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, supabaseKey);
}

export type DashboardFiltros = {
  cliente?: string;
  fabricante?: string;
  categoria?: string;
  produto?: string;
  periodo?: string; // '30', '90', '180', 'ano'
};

export async function getDashboardMetrics(filtros?: DashboardFiltros) {
  // const supabase = getSupabaseClient();
  
  // Como ainda não populamos o banco com dados reais o suficiente para fazer
  // cruzamentos temporais avançados (média de 6 meses vs 1 mês), retornaremos
  // dados mockados estruturados com base na sua regra de negócio para a interface.
  // Na implementação final de produção, aqui rodariam as querys SQL complexas.

  // Simulando delay de rede/banco
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    dinheiroEscondido: {
      valor: 45600.50,
      variacao: '+12.5%',
      descricao: 'Receita potencial em produtos abandonados'
    },
    produtosDesaparecendo: {
      valor: 23,
      variacao: '-4',
      descricao: 'Produtos com queda de 50% na frequência'
    },
    produtosEmQueda: {
      valor: 8,
      variacao: '+2',
      descricao: 'Queda financeira em relação ao mês passado'
    },
    semCompraAcima30Dias: {
      valor: 15,
      variacao: 'Estável',
      descricao: 'Produtos curva A/B sem giro'
    },
    potencialRecuperavel: {
      valor: 128450.00,
      variacao: '+5%',
      descricao: 'Projeção se o cliente voltar ao padrão'
    },
    saudeCarteira: {
      valor: 76, // %
      variacao: '-2%',
      descricao: 'Clientes ativos (compra < 60 dias)'
    }
  };
}

export async function getSalesTrendChart(filtros?: DashboardFiltros) {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    { name: 'Jan', vendas: 4000, projetado: 4400 },
    { name: 'Fev', vendas: 3000, projetado: 3200 },
    { name: 'Mar', vendas: 2000, projetado: 2500 },
    { name: 'Abr', vendas: 2780, projetado: 3000 },
    { name: 'Mai', vendas: 1890, projetado: 2400 },
    { name: 'Jun', vendas: 2390, projetado: 3500 },
    { name: 'Jul', vendas: 3490, projetado: 4300 },
  ];
}
