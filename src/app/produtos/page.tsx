"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Box, TrendingUp, AlertCircle, BarChart3, Package } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { buscarTodosProdutos, getHistoricoEntradasSaidasItem, ProdutoBusca, HistoricoGraficoData } from '@/actions/dashboard';

export default function ConsultaProdutosPage() {
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<ProdutoBusca[]>([]);
  const [loading, setLoading] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoBusca | null>(null);
  const [historicoGrafico, setHistoricoGrafico] = useState<HistoricoGraficoData[]>([]);
  const [loadingGrafico, setLoadingGrafico] = useState(false);

  // Debounce effect para pesquisa
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      realizarBusca(termo);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [termo]);

  const realizarBusca = async (texto: string) => {
    setLoading(true);
    try {
      const res = await buscarTodosProdutos(texto);
      setResultados(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selecionarProduto = async (prod: ProdutoBusca) => {
    setProdutoSelecionado(prod);
    setHistoricoGrafico([]);
    setLoadingGrafico(true);
    try {
      const hist = await getHistoricoEntradasSaidasItem(prod.codigo, prod.loja);
      setHistoricoGrafico(hist);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGrafico(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto mb-8 flex justify-between items-center">
        <Link 
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-medium transition-colors border border-slate-700"
        >
          <ArrowLeft size={18} />
          Voltar ao Painel
        </Link>
      </div>

      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header e Barra de Pesquisa */}
        <div className="bg-[#111827] rounded-3xl p-6 md:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="flex items-center gap-4 mb-8 relative z-10">
            <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
              <Search className="text-blue-400" size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Consulta de Produtos</h1>
              <p className="text-slate-400">Pesquise por código ou descrição para ver o histórico detalhado.</p>
            </div>
          </div>

          <div className="relative z-10">
            <input 
              type="text" 
              placeholder="Digite o código ou nome do produto..." 
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4 text-lg outline-none text-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"
            />
            {loading && (
              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>

          {/* Resultados da Busca */}
          {resultados.length > 0 && (
            <div className="mt-6 border border-slate-700 rounded-2xl overflow-hidden bg-slate-900/50 relative z-10">
              <div className="max-h-80 overflow-y-auto">
                {resultados.map((prod, idx) => {
                  const isSelected = produtoSelecionado?.codigo === prod.codigo && produtoSelecionado?.loja === prod.loja;
                  return (
                    <button 
                      key={`${prod.codigo}_${prod.loja}_${idx}`}
                      onClick={() => selecionarProduto(prod)}
                      className={`w-full text-left p-4 border-b border-slate-800 transition-colors flex flex-col md:flex-row gap-2 md:items-center justify-between ${
                        isSelected ? 'bg-blue-900/40 border-l-4 border-l-blue-500' : 'hover:bg-slate-800/80'
                      }`}
                    >
                      <div>
                        <h3 className={`font-bold ${isSelected ? 'text-blue-400' : 'text-slate-200'}`}>{prod.descricao}</h3>
                      <div className="text-sm text-slate-400 flex items-center gap-3 mt-1">
                        <span>Cód: <span className="text-slate-300 font-medium">{prod.codigo}</span></span>
                        <span>•</span>
                        <span>Loja: <span className="text-blue-400 font-medium">{prod.loja}</span></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                      <div className="text-right">
                        <p className="text-slate-500">Estoque</p>
                        <p className="font-bold text-slate-300">{prod.estoqueGeral + prod.estoqueLoja}</p>
                      </div>
                      <div className="h-8 w-px bg-slate-800"></div>
                      <div className="text-right">
                        <p className="text-slate-500">Vendas (Histórico)</p>
                        <p className="font-bold text-emerald-400">{prod.vendasTotais}</p>
                      </div>
                    </div>
                  </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Produto Selecionado */}
        {produtoSelecionado && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                <Box className="text-blue-400" /> Detalhes do Produto
              </h2>
              <button 
                onClick={() => setProdutoSelecionado(null)}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Limpar seleção
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#111827] rounded-2xl p-6 border border-slate-800 col-span-1 md:col-span-4">
                <h3 className="text-2xl font-bold text-white mb-2">{produtoSelecionado.descricao}</h3>
                <div className="flex flex-wrap items-center gap-4 text-slate-400 mt-4">
                  <span className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">Cód: {produtoSelecionado.codigo}</span>
                  <span className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">Local: {produtoSelecionado.loja}</span>
                  <span className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">Fabricante: {produtoSelecionado.fabricante}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-900/40 to-[#111827] rounded-2xl p-6 border border-blue-800/30 flex flex-col justify-center items-center text-center">
                <Package className="text-blue-400 mb-2" size={24} />
                <p className="text-xs text-blue-200 uppercase tracking-wider">Estoque Atual</p>
                <p className="text-3xl font-black text-white mt-1">{produtoSelecionado.estoqueGeral + produtoSelecionado.estoqueLoja}</p>
              </div>

              <div className="bg-gradient-to-br from-sky-900/40 to-[#111827] rounded-2xl p-6 border border-sky-800/30 flex flex-col justify-center items-center text-center">
                <TrendingUp className="text-sky-400 mb-2" size={24} />
                <p className="text-xs text-sky-200 uppercase tracking-wider">Média Mensal</p>
                <p className="text-3xl font-black text-white mt-1">
                  {historicoGrafico.length > 0 ? historicoGrafico[0].mediaMensal : 0}
                </p>
              </div>

              <div className="bg-gradient-to-br from-pink-900/40 to-[#111827] rounded-2xl p-6 border border-pink-800/30 flex flex-col justify-center items-center text-center">
                <BarChart3 className="text-pink-400 mb-2" size={24} />
                <p className="text-xs text-pink-200 uppercase tracking-wider">Saídas (Últ. Mês)</p>
                <p className="text-3xl font-black text-white mt-1">
                  {historicoGrafico.length > 0 ? historicoGrafico[historicoGrafico.length - 1].vendas : 0}
                </p>
              </div>

              <div className="bg-gradient-to-br from-emerald-900/40 to-[#111827] rounded-2xl p-6 border border-emerald-800/30 flex flex-col justify-center items-center text-center">
                <Box className="text-emerald-400 mb-2" size={24} />
                <p className="text-xs text-emerald-200 uppercase tracking-wider">Entradas (Últ. Mês)</p>
                <p className="text-3xl font-black text-white mt-1">
                  {historicoGrafico.length > 0 ? historicoGrafico[historicoGrafico.length - 1].entradas : 0}
                </p>
              </div>
            </div>

            {/* Gráfico Histórico */}
            <div className="bg-[#111827] rounded-2xl p-6 border border-slate-800 shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                <BarChart3 className="text-blue-400" size={24} />
                <h2 className="text-lg font-bold text-slate-100">Histórico: Entradas vs Saídas (12 Meses)</h2>
              </div>
              
              {loadingGrafico ? (
                <div className="h-80 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-slate-400">Processando histórico do item...</p>
                </div>
              ) : historicoGrafico.length > 0 ? (
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={historicoGrafico} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                        itemStyle={{ color: '#e2e8f0' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="entradas" name="Reposição (Entradas)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                      <Line type="monotone" dataKey="mediaMensal" name="Média Mensal (Vendas)" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-center">
                  <AlertCircle className="text-slate-600 mb-4" size={48} />
                  <p className="text-slate-400 max-w-md">Não há dados históricos de entradas ou saídas para este produto no local especificado.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
