"use client";

import React, { useState, useEffect } from 'react';
import { getLocais, getItensEstoqueZerado, ItemZerado } from '@/actions/dashboard';
import { gerarRelatorioRuptura, RelatorioRupturaData } from '@/actions/relatorioInteligente';
import PrintButton from '@/components/PrintButton';
import { AlertCircle, ArrowLeft, BrainCircuit, AlertTriangle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function RelatorioRupturaPage() {
  const [locais, setLocais] = useState<string[]>([]);
  const [itensZerados, setItensZerados] = useState<ItemZerado[]>([]);
  
  const [localSelecionado, setLocalSelecionado] = useState<string>('');
  const [itemSelecionado, setItemSelecionado] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [relatorio, setRelatorio] = useState<RelatorioRupturaData | null>(null);

  useEffect(() => {
    async function carregarFiltros() {
      try {
        const [listaLocais, listaItens] = await Promise.all([
          getLocais(),
          getItensEstoqueZerado() // Carrega todos os itens zerados
        ]);
        setLocais(listaLocais);
        setItensZerados(listaItens);
      } catch (e) {
        console.error("Erro ao carregar dados", e);
      } finally {
        setLoading(false);
      }
    }
    carregarFiltros();
  }, []);

  // Itens filtrados pelo local selecionado
  const itensFiltrados = localSelecionado 
    ? itensZerados.filter(i => i.local === localSelecionado)
    : itensZerados;

  const handleGerarRelatorio = async () => {
    if (!itemSelecionado || !localSelecionado) return;
    
    setGerando(true);
    setRelatorio(null);
    try {
      const item = itensZerados.find(i => i.codigo === itemSelecionado && i.local === localSelecionado);
      if (item) {
        const resultado = await gerarRelatorioRuptura(
          item.codigo,
          item.descricao,
          item.local,
          item.dataUltimaEntrada,
          item.qtdUltimaEntrada
        );
        setRelatorio(resultado);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 p-4 md:p-8 font-sans print:bg-white print:text-black">
      
      {/* Botões de Ação (Ocultos na Impressão) */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
        <Link 
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-medium transition-colors border border-slate-700"
        >
          <ArrowLeft size={18} />
          Voltar ao Painel
        </Link>
        <PrintButton />
      </div>

      <div className="max-w-4xl mx-auto mb-8 print:hidden">
        <div className="bg-[#111827] rounded-3xl p-6 border border-slate-800 shadow-2xl flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-400 mb-2">Selecione o Local</label>
            <select 
              value={localSelecionado} 
              onChange={e => { setLocalSelecionado(e.target.value); setItemSelecionado(''); setRelatorio(null); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none text-slate-200"
              disabled={loading}
            >
              <option value="">-- Selecione o Local --</option>
              {locais.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-400 mb-2">Item Zerado no Estoque</label>
            <select 
              value={itemSelecionado} 
              onChange={e => { setItemSelecionado(e.target.value); setRelatorio(null); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none text-slate-200"
              disabled={loading || !localSelecionado || itensFiltrados.length === 0}
            >
              <option value="">-- Selecione o Item --</option>
              {itensFiltrados.map(item => (
                <option key={item.codigo} value={item.codigo}>{item.codigo} - {item.descricao}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleGerarRelatorio}
            disabled={!itemSelecionado || !localSelecionado || gerando}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 whitespace-nowrap"
          >
            {gerando ? 'Gerando Plano IA...' : 'Gerar Relatório'}
          </button>
        </div>
      </div>

      {relatorio && (
        <div className="max-w-4xl mx-auto bg-[#111827] print:bg-white rounded-3xl p-8 md:p-12 border border-slate-800 print:border-slate-300 print:shadow-none shadow-2xl animate-fade-in">
          
          <div className="border-b border-slate-800 print:border-slate-300 pb-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-red-500/20 text-red-400 print:bg-red-100 print:text-red-800 text-xs font-bold rounded-full uppercase tracking-wider">
                  Risco de Ruptura
                </span>
                <span className="text-slate-500 print:text-slate-500 text-sm">Gerado por IA</span>
              </div>
              <h1 className="text-2xl font-bold text-white print:text-black mb-1">{relatorio.item}</h1>
              <p className="text-slate-400 print:text-slate-600">Local de Análise: {relatorio.local}</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex gap-6 text-right">
              <div>
                <p className="text-xs text-slate-500 print:text-slate-500 uppercase tracking-wider mb-1">Qtd Atual no Estoque</p>
                <p className="text-2xl font-bold text-red-500 print:text-red-700">0</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 print:text-slate-500 uppercase tracking-wider mb-1">Última Entrada</p>
                <p className="text-xl font-bold text-emerald-400 print:text-emerald-700">{relatorio.ultimaEntrada}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 print:text-slate-500 uppercase tracking-wider mb-1">Qtd. da Entrada</p>
                <p className="text-xl font-bold text-slate-200 print:text-slate-800">{relatorio.qtdUltimaEntrada} und</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-900/20 print:bg-purple-50 border border-purple-500/30 print:border-purple-200 rounded-2xl p-6 mb-10">
            <div className="flex items-center gap-3 mb-3">
              <BrainCircuit className="text-purple-400 print:text-purple-700" size={24} />
              <h2 className="text-lg font-bold text-purple-300 print:text-purple-800">Plano de Ação Sugerido (IA)</h2>
            </div>
            <p className="text-slate-300 print:text-slate-700 leading-relaxed text-lg italic">
              "{relatorio.planoAcao}"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:gap-4">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-orange-500/30 print:border-orange-200 pb-3">
                <ShieldAlert className="text-orange-400 print:text-orange-600" size={28} />
                <h2 className="text-2xl font-bold text-white print:text-black">Análise Crítica</h2>
              </div>
              <div className="bg-slate-800/50 print:bg-white print:border print:border-slate-200 p-5 rounded-xl border border-slate-700 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 print:bg-orange-500"></div>
                <h3 className="font-bold text-slate-100 print:text-black mb-2">Impacto Comercial</h3>
                <p className="text-sm text-slate-400 print:text-slate-600 flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-orange-400/70" />
                  Este produto consta sem estoque no sistema. Dependendo da demanda (giro), isso afeta negativamente o faturamento do dia.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-blue-500/30 print:border-blue-200 pb-3">
                <AlertTriangle className="text-blue-400 print:text-blue-600" size={28} />
                <h2 className="text-2xl font-bold text-white print:text-black">Direcionamento</h2>
              </div>
              <div className="mt-8 p-6 border-2 border-dashed border-slate-700 print:border-slate-300 rounded-xl">
                <h4 className="text-slate-300 print:text-slate-700 font-medium mb-2 text-center">Anotações do Consultor</h4>
                <div className="space-y-4 mt-6">
                  <div className="border-b border-slate-700 print:border-slate-300 w-full h-4"></div>
                  <div className="border-b border-slate-700 print:border-slate-300 w-full h-4"></div>
                  <div className="border-b border-slate-700 print:border-slate-300 w-full h-4"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {!relatorio && !gerando && (
        <div className="max-w-4xl mx-auto text-center p-12 bg-[#111827]/50 rounded-3xl border border-slate-800">
          <ShieldAlert className="mx-auto h-16 w-16 text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-300 mb-2">Relatório de Ruptura de Estoque</h3>
          <p className="text-slate-500">Selecione um local e um item zerado acima para que a inteligência artificial analise o histórico de entradas e gere um plano de ação estratégico.</p>
        </div>
      )}

    </div>
  );
}
