"use client";

import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  TrendingDown, 
  AlertOctagon, 
  Clock, 
  Activity, 
  HeartPulse,
  Filter,
  Sparkles,
  ChevronDown,
  Upload,
  ShoppingCart,
  PackageSearch,
  Printer,
  CheckCircle,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  getDashboardMetrics, 
  getSalesTrendChart, 
  getFabricantes, 
  getLocais, 
  getItensEstoqueZerado, 
  getProdutosSemGiroDetalhamento, 
  getDetalhamentoEstoqueTotal,
  getDetalhamentoVolumeVendas,
  getDetalhamentoGiroEstoque,
  getDetalhamentoRequisicoes,
  DashboardFiltros, 
  ItemZerado, 
  ItemSemGiro,
  DetalhamentoGeral
} from '@/actions/dashboard';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<DashboardFiltros>({ periodo: '90' });
  const [activeDetail, setActiveDetail] = useState<string | null>(null);
  const [fabricantesLista, setFabricantesLista] = useState<string[]>([]);
  const [locaisLista, setLocaisLista] = useState<string[]>([]);
  
  const [itensZerados, setItensZerados] = useState<ItemZerado[]>([]);
  const [itensSemGiro, setItensSemGiro] = useState<ItemSemGiro[]>([]);
  const [detalheEstoqueTotal, setDetalheEstoqueTotal] = useState<DetalhamentoGeral[]>([]);
  const [detalheVendas, setDetalheVendas] = useState<DetalhamentoGeral[]>([]);
  const [detalheGiro, setDetalheGiro] = useState<DetalhamentoGeral[]>([]);
  const [detalheRequisicoes, setDetalheRequisicoes] = useState<DetalhamentoGeral[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [m, c, f, l, z, sg, et, vv, ge, req] = await Promise.all([
          getDashboardMetrics(filtros),
          getSalesTrendChart(filtros),
          getFabricantes(),
          getLocais(),
          getItensEstoqueZerado(filtros),
          getProdutosSemGiroDetalhamento(filtros),
          getDetalhamentoEstoqueTotal(filtros),
          getDetalhamentoVolumeVendas(filtros),
          getDetalhamentoGiroEstoque(filtros),
          getDetalhamentoRequisicoes(filtros)
        ]);
        setMetrics(m);
        setChartData(c);
        setFabricantesLista(f);
        setLocaisLista(l);
        setItensZerados(z);
        setItensSemGiro(sg);
        setDetalheEstoqueTotal(et);
        setDetalheVendas(vv);
        setDetalheGiro(ge);
        setDetalheRequisicoes(req);
      } catch (error) {
        console.error("Erro", error);
      }
      setLoading(false);
    }
    loadData();
  }, [filtros]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 p-4 md:p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* PREMIUM HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-1">
          <div>
            <button onClick={() => setActiveDetail(null)} className="flex items-center gap-3 mb-2 cursor-pointer group text-left hover:opacity-80 transition-opacity">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                <Sparkles className="text-blue-400" size={24} />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">
                Painel Estratégico
              </h1>
            </button>
            <p className="text-slate-400 text-sm md:text-base font-light ml-14">
              Inteligência comercial e mapeamento de oportunidades ocultas.
            </p>
          </div>
          
          {/* MODERN FILTERS (GLASSMORPHISM) */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-800/40 backdrop-blur-xl p-2 rounded-2xl border border-slate-700/50 shadow-xl">
            <div className="flex items-center text-slate-400 px-3 py-2">
              <Filter size={18} className="mr-2" />
              <span className="text-sm font-medium tracking-wide">Filtros</span>
            </div>
            
            <div className="relative group">
              <select name="periodo" value={filtros.periodo} onChange={handleFilterChange} 
                className="appearance-none bg-slate-900/50 hover:bg-slate-900/80 border border-slate-700/50 text-slate-200 text-sm rounded-xl px-4 py-2.5 pr-10 outline-none transition-all cursor-pointer focus:ring-2 focus:ring-blue-500/50">
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
                <option value="180">Últimos 6 meses</option>
                <option value="ano">Este Ano</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-200 transition-colors" />
            </div>

            <div className="relative group hidden sm:block">
              <select name="fabricante" onChange={handleFilterChange} 
                className="appearance-none bg-slate-900/50 hover:bg-slate-900/80 border border-slate-700/50 text-slate-200 text-sm rounded-xl px-4 py-2.5 pr-10 outline-none transition-all cursor-pointer focus:ring-2 focus:ring-blue-500/50">
                <option value="">Todos Fabricantes</option>
                {fabricantesLista.map(fab => (
                  <option key={fab} value={fab}>{fab}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-200 transition-colors" />
            </div>

            <div className="relative group hidden sm:block">
              <select name="local" onChange={handleFilterChange} 
                className="appearance-none bg-slate-900/50 hover:bg-slate-900/80 border border-slate-700/50 text-slate-200 text-sm rounded-xl px-4 py-2.5 pr-10 outline-none transition-all cursor-pointer focus:ring-2 focus:ring-blue-500/50">
                <option value="">Todos os Locais</option>
                {locaisLista.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-200 transition-colors" />
            </div>

            <Link href="/pedidos-salvos" className="ml-2 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all border border-slate-700">
              <PackageSearch size={16} />
              <span className="hidden sm:inline">Pedidos Salvos</span>
            </Link>

            <Link href="/clientes/123/relatorio" className="ml-2 flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/20">
              <Printer size={16} />
              <span className="hidden sm:inline">Relatório</span>
            </Link>

            <Link href="/clientes/123/pedido" className="ml-2 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20">
              <ShoppingCart size={16} />
              <span className="hidden sm:inline">Criar Pedido</span>
            </Link>

            <Link href="/produtos" className="ml-2 flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-pink-500/20">
              <Search size={16} />
              <span className="hidden sm:inline">Produtos</span>
            </Link>

            <Link href="/importar" className="ml-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20">
              <Upload size={16} />
              <span className="hidden sm:inline">Importar</span>
            </Link>
          </div>
        </div>

        {activeDetail ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-6">
              <button 
                onClick={() => setActiveDetail(null)} 
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 font-medium transition-colors"
              >
                Voltar
              </button>
              <h2 className="text-2xl font-bold text-slate-100">Detalhamento: {activeDetail}</h2>
            </div>
            
            <div className="bg-[#111827]/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl">
              {activeDetail === 'estoqueZerado' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-xl font-bold text-slate-200 mb-6">Detalhamento: Itens com Estoque Zerado</h3>
                  
                  {itensZerados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
                        <CheckCircle className="text-emerald-400" size={32} />
                      </div>
                      <p className="text-slate-400">Excelente! Não há itens com estoque zerado no momento.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                      <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-700">
                          <tr>
                            <th className="px-4 py-3 font-medium">Local</th>
                            <th className="px-4 py-3 font-medium">Código</th>
                            <th className="px-4 py-3 font-medium">Descrição</th>
                            <th className="px-4 py-3 font-medium">Fabricante</th>
                            <th className="px-4 py-3 font-medium text-amber-500">Data Zeramento</th>
                            <th className="px-4 py-3 font-medium text-right">Vendas no Período</th>
                            <th className="px-4 py-3 font-medium">Última Entrada</th>
                            <th className="px-4 py-3 font-medium">Nº Pedido (Entrada)</th>
                            <th className="px-4 py-3 font-medium text-right">Qtd Entrada</th>
                            <th className="px-4 py-3 font-medium">Fornecedor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itensZerados.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                              <td className="px-4 py-3 text-slate-300 font-semibold">{item.local}</td>
                              <td className="px-4 py-3 text-slate-400">{item.codigo}</td>
                              <td className="px-4 py-3 font-medium text-slate-200">{item.descricao}</td>
                              <td className="px-4 py-3">{item.fabricante}</td>
                              <td className="px-4 py-3 text-amber-400 font-medium">{item.dataIdentificacao}</td>
                              <td className="px-4 py-3 text-right text-rose-400 font-bold">{item.vendasPeriodo}</td>
                              <td className="px-4 py-3">{item.dataUltimaEntrada}</td>
                              <td className="px-4 py-3 text-blue-400">{item.numeroPedidoEntrada}</td>
                              <td className="px-4 py-3 text-right font-medium">{item.qtdUltimaEntrada > 0 ? item.qtdUltimaEntrada : '-'}</td>
                              <td className="px-4 py-3 text-slate-400">{item.fornecedor}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : activeDetail === 'Produtos Sem Giro' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-xl font-bold text-slate-200 mb-6">Detalhamento: Produtos Sem Giro</h3>
                  
                  {itensSemGiro.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
                        <CheckCircle className="text-emerald-400" size={32} />
                      </div>
                      <p className="text-slate-400">Excelente! Não há itens parados no estoque.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                      <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-700">
                          <tr>
                            <th className="px-4 py-3 font-medium">Local</th>
                            <th className="px-4 py-3 font-medium">Código</th>
                            <th className="px-4 py-3 font-medium">Descrição</th>
                            <th className="px-4 py-3 font-medium">Fabricante</th>
                            <th className="px-4 py-3 font-medium text-right">Estoque Geral</th>
                            <th className="px-4 py-3 font-medium text-right">Estoque Loja</th>
                            <th className="px-4 py-3 font-medium text-right text-rose-400">Estoque Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itensSemGiro.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                              <td className="px-4 py-3 text-slate-300 font-semibold">{item.local}</td>
                              <td className="px-4 py-3 text-slate-400">{item.codigo}</td>
                              <td className="px-4 py-3 font-medium text-slate-200">{item.descricao}</td>
                              <td className="px-4 py-3">{item.fabricante}</td>
                              <td className="px-4 py-3 text-right">{item.estoqueGeral}</td>
                              <td className="px-4 py-3 text-right">{item.estoqueLoja}</td>
                              <td className="px-4 py-3 text-right font-bold text-rose-400">{item.totalEstoque}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : activeDetail === 'Estoque Total' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-xl font-bold text-slate-200 mb-6">Detalhamento: Estoque Total</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-700">
                    <table className="w-full text-sm text-left text-slate-300">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-700">
                        <tr>
                          <th className="px-4 py-3 font-medium">Local</th>
                          <th className="px-4 py-3 font-medium">Código</th>
                          <th className="px-4 py-3 font-medium">Descrição</th>
                          <th className="px-4 py-3 font-medium">Fabricante</th>
                          <th className="px-4 py-3 font-medium text-right text-blue-400">Total Estoque</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalheEstoqueTotal.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 text-slate-300 font-semibold">{item.local}</td>
                            <td className="px-4 py-3 text-slate-400">{item.codigo}</td>
                            <td className="px-4 py-3 font-medium text-slate-200">{item.descricao}</td>
                            <td className="px-4 py-3">{item.fabricante}</td>
                            <td className="px-4 py-3 text-right font-bold text-blue-400">{item.totalEstoque}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : activeDetail === 'Volume de Vendas' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-xl font-bold text-slate-200 mb-6">Detalhamento: Volume de Vendas</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-700">
                    <table className="w-full text-sm text-left text-slate-300">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-700">
                        <tr>
                          <th className="px-4 py-3 font-medium">Local</th>
                          <th className="px-4 py-3 font-medium">Código</th>
                          <th className="px-4 py-3 font-medium">Descrição</th>
                          <th className="px-4 py-3 font-medium">Fabricante</th>
                          <th className="px-4 py-3 font-medium text-right text-emerald-400">Vendas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalheVendas.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 text-slate-300 font-semibold">{item.local}</td>
                            <td className="px-4 py-3 text-slate-400">{item.codigo}</td>
                            <td className="px-4 py-3 font-medium text-slate-200">{item.descricao}</td>
                            <td className="px-4 py-3">{item.fabricante}</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-400">{item.vendas}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : activeDetail === 'Giro de Estoque' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-xl font-bold text-slate-200 mb-6">Detalhamento: Giro de Estoque</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-700">
                    <table className="w-full text-sm text-left text-slate-300">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-700">
                        <tr>
                          <th className="px-4 py-3 font-medium">Local</th>
                          <th className="px-4 py-3 font-medium">Código</th>
                          <th className="px-4 py-3 font-medium">Descrição</th>
                          <th className="px-4 py-3 font-medium text-right">Vendas</th>
                          <th className="px-4 py-3 font-medium text-right">Estoque</th>
                          <th className="px-4 py-3 font-medium text-right text-emerald-400">Giro (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalheGiro.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 text-slate-300 font-semibold">{item.local}</td>
                            <td className="px-4 py-3 text-slate-400">{item.codigo}</td>
                            <td className="px-4 py-3 font-medium text-slate-200">{item.descricao}</td>
                            <td className="px-4 py-3 text-right">{item.vendas}</td>
                            <td className="px-4 py-3 text-right">{item.totalEstoque}</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-400">{item.giro.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : activeDetail === 'Requisições' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-xl font-bold text-slate-200 mb-6">Detalhamento: Requisições Ativas</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-700">
                    <table className="w-full text-sm text-left text-slate-300">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-700">
                        <tr>
                          <th className="px-4 py-3 font-medium">Local</th>
                          <th className="px-4 py-3 font-medium">Código</th>
                          <th className="px-4 py-3 font-medium">Descrição</th>
                          <th className="px-4 py-3 font-medium text-right text-purple-400">Requisições</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalheRequisicoes.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 text-slate-300 font-semibold">{item.local}</td>
                            <td className="px-4 py-3 text-slate-400">{item.codigo}</td>
                            <td className="px-4 py-3 font-medium text-slate-200">{item.descricao}</td>
                            <td className="px-4 py-3 text-right font-bold text-purple-400">{item.requisicoes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : activeDetail === 'Tendência vs Potencial' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-xl font-bold text-slate-200 mb-6">Detalhamento: Tendência vs Potencial (Mês a Mês)</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-700">
                    <table className="w-full text-sm text-left text-slate-300">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-700">
                        <tr>
                          <th className="px-4 py-3 font-medium">Mês de Referência</th>
                          <th className="px-4 py-3 font-medium text-right text-blue-400">Vendas Realizadas</th>
                          <th className="px-4 py-3 font-medium text-right text-indigo-400">Potencial / Projetado</th>
                          <th className="px-4 py-3 font-medium text-right text-slate-400">Diferença</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-200">{item.name}</td>
                            <td className="px-4 py-3 text-right font-bold text-blue-400">R$ {item.vendas.toLocaleString('pt-BR')}</td>
                            <td className="px-4 py-3 text-right font-bold text-indigo-400">R$ {item.projetado.toLocaleString('pt-BR')}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-400">
                              R$ {(item.projetado - item.vendas).toLocaleString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 border border-blue-500/20">
                    <Activity className="text-blue-400" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-200 mb-2">Dados em Processamento</h3>
                  <p className="text-slate-400 max-w-md">
                    A visualização em tabela para o indicador <strong>{activeDetail}</strong> será carregada aqui em futuras atualizações.
                  </p>
                </div>
              )}
              <div className="text-center mt-6">
                <button onClick={() => setActiveDetail(null)} className="text-blue-400 hover:text-blue-300 font-medium">
                  Voltar para o painel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* LOADER */}
        {loading && (
          <div className="flex justify-center items-center py-32 h-[50vh]">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
            </div>
          </div>
        )}

        {/* KPI GRID */}
        {!loading && metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            
            <PremiumCard 
              title="Estoque Total (CD + Loja)" 
              value={metrics.estoqueGeralTotal.valor.toLocaleString('pt-BR')}
              subtitle={metrics.estoqueGeralTotal.descricao}
              trend={metrics.estoqueGeralTotal.variacao}
              icon={<PackageSearch className="text-blue-400" size={24} />}
              gradient="from-blue-500/10 to-indigo-500/5"
              borderColor="border-blue-500/20"
              iconBg="bg-blue-500/10"
              onClick={() => setActiveDetail('Estoque Total')}
            />

            <PremiumCard 
              title="Volume de Vendas" 
              value={metrics.vendasTotais.valor.toLocaleString('pt-BR')}
              subtitle={metrics.vendasTotais.descricao}
              trend={metrics.vendasTotais.variacao}
              icon={<DollarSign className="text-emerald-400" size={24} />}
              gradient="from-emerald-500/10 to-teal-500/5"
              borderColor="border-emerald-500/20"
              iconBg="bg-emerald-500/10"
              onClick={() => setActiveDetail('Volume de Vendas')}
            />

            <PremiumCard 
              title="Giro de Estoque" 
              value={`${metrics.giroDeEstoque.valor}%`}
              subtitle={metrics.giroDeEstoque.descricao}
              trend={metrics.giroDeEstoque.variacao}
              icon={<Activity className={Number(metrics.giroDeEstoque.valor) > 20 ? "text-emerald-400" : "text-amber-400"} size={24} />}
              gradient={Number(metrics.giroDeEstoque.valor) > 20 ? "from-emerald-500/10 to-transparent" : "from-amber-500/10 to-transparent"}
              borderColor={Number(metrics.giroDeEstoque.valor) > 20 ? "border-emerald-500/20" : "border-amber-500/20"}
              iconBg={Number(metrics.giroDeEstoque.valor) > 20 ? "bg-emerald-500/10" : "bg-amber-500/10"}
              onClick={() => setActiveDetail('Giro de Estoque')}
            />

            <PremiumCard 
              title="Produtos Sem Giro" 
              value={metrics.produtosSemGiro.valor}
              subtitle={metrics.produtosSemGiro.descricao}
              trend={metrics.produtosSemGiro.variacao}
              icon={<AlertOctagon className="text-rose-400" size={24} />}
              gradient="from-rose-500/10 to-red-500/5"
              borderColor="border-rose-500/20"
              iconBg="bg-rose-500/10"
              onClick={() => setActiveDetail('Produtos Sem Giro')}
            />

            <PremiumCard 
              title="Requisições Ativas" 
              value={metrics.requisicoesAtivas.valor}
              subtitle={metrics.requisicoesAtivas.descricao}
              trend={metrics.requisicoesAtivas.variacao}
              icon={<ShoppingCart className="text-purple-400" size={24} />}
              gradient="from-purple-500/10 to-fuchsia-500/5"
              borderColor="border-purple-500/20"
              iconBg="bg-purple-500/10"
              onClick={() => setActiveDetail('Requisições')}
            />

            <PremiumCard 
              title="Estoque Zerado" 
              value={metrics.estoqueZerado.valor}
              subtitle={metrics.estoqueZerado.descricao}
              trend={metrics.estoqueZerado.variacao}
              icon={<TrendingDown className="text-rose-400" size={24} />}
              gradient="from-rose-500/10 to-red-500/5"
              borderColor="border-rose-500/20"
              iconBg="bg-rose-500/10"
              onClick={() => setActiveDetail('estoqueZerado')}
            />

          </div>
        )}

        {/* CHART AREA */}
        {!loading && (
          <div 
            onClick={() => setActiveDetail('Tendência vs Potencial')}
            className="bg-[#111827]/80 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group cursor-pointer hover:border-blue-500/50 hover:shadow-blue-500/10 transition-all duration-300"
          >
            {/* Ambient glow behind chart */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100"></div>
            
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-100 group-hover:text-blue-400 transition-colors">Tendência vs Potencial Perdido</h2>
                <p className="text-slate-400 text-sm mt-1">Comparativo de vendas realizadas contra o projetado pela IA.</p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div> Vendas</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500/50"></div> Potencial</div>
              </div>
            </div>

            <div className="h-[350px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="colorProjetado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `R$${value/1000}k`} />
                  <Tooltip 
                    cursor={{fill: '#1e293b', opacity: 0.4}}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: '#e2e8f0' }}
                    formatter={(value: any) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
                  />
                  <Bar dataKey="vendas" fill="url(#colorVendas)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="projetado" fill="url(#colorProjetado)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        </>
        )}

      </div>
    </div>
  );
}

function PremiumCard({ title, value, subtitle, icon, gradient, borderColor, iconBg, trend, onClick }: any) {
  const isPositive = trend?.startsWith('+');
  const isNegative = trend?.startsWith('-');
  const trendColor = isPositive ? 'text-emerald-400 bg-emerald-400/10' : isNegative ? 'text-rose-400 bg-rose-400/10' : 'text-slate-400 bg-slate-400/10';

  return (
    <div 
      onClick={onClick}
      className={`group relative bg-[#111827]/60 backdrop-blur-xl p-6 rounded-3xl border ${borderColor} shadow-lg hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Background Subtle Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div className={`p-3.5 rounded-2xl ${iconBg} shadow-inner ring-1 ring-white/5`}>
            {icon}
          </div>
          {trend && (
            <div className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${trendColor}`}>
              {trend}
            </div>
          )}
        </div>
        
        <div className="mt-auto">
          <h3 className="text-3xl font-extrabold text-white tracking-tight mb-1">{value}</h3>
          <p className="text-slate-400 font-medium text-sm mb-1">{title}</p>
          <p className="text-slate-500 text-xs font-light">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
