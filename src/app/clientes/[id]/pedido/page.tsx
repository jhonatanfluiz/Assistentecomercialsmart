"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Scale, 
  Rocket, 
  Sparkles, 
  Save,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  X,
  Download,
  FileText,
  FileSpreadsheet,
  FileJson
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { 
  gerarPedidoInteligente, 
  salvarSugestao, 
  CenariosPedido, 
  ItemSugerido, 
  JustificativaPayload 
} from '@/actions/pedidoInteligente';
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/exportUtils';

type Tab = 'conservador' | 'equilibrado' | 'agressivo';

const MOTIVOS = [
  'Estoque elevado',
  'Concorrência',
  'Preço',
  'Produto parado',
  'Sazonalidade',
  'Substituição',
  'Outro'
];

export default function PedidoInteligentePage() {
  const params = useParams();
  const clienteId = params.id as string;

  const [cenarios, setCenarios] = useState<CenariosPedido | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<Tab>('equilibrado');
  const [loading, setLoading] = useState(true);
  
  const [itensEditaveis, setItensEditaveis] = useState<ItemSugerido[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  // Estados do Modal de Justificativa
  const [itensParaJustificar, setItensParaJustificar] = useState<ItemSugerido[]>([]);
  const [idxJustificativaAtual, setIdxJustificativaAtual] = useState(0);
  const [justificativasDigitadas, setJustificativasDigitadas] = useState<Record<string, { motivo: string, obs: string }>>({});
  const [modalAberto, setModalAberto] = useState(false);

  // Controle do menu de exportação
  const [menuExportOpen, setMenuExportOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const dados = await gerarPedidoInteligente(clienteId);
        setCenarios(dados);
        setItensEditaveis(dados['equilibrado']);
      } catch (error) {
        console.error("Erro ao carregar cenários:", error);
      }
      setLoading(false);
    }
    load();
  }, [clienteId]);

  const handleTabChange = (tab: Tab) => {
    setAbaAtiva(tab);
    if (cenarios) {
      setItensEditaveis(cenarios[tab]);
    }
  };

  const handleQuantityChange = (produtoId: string, novaQtd: string) => {
    const parsed = parseInt(novaQtd);
    if (isNaN(parsed)) return;

    setItensEditaveis(prev => 
      prev.map(item => 
        item.produtoId === produtoId ? { ...item, quantidadeSugerida: parsed } : item
      )
    );
  };

  const processarCheckout = () => {
    // Avalia quais itens precisam de justificativa
    const pendentes = itensEditaveis.filter(item => {
      const isRemovido = item.quantidadeOriginal > 0 && item.quantidadeSugerida === 0;
      const isRisco = item.isEmQueda || item.isSemPedido;
      return isRemovido || isRisco;
    });

    if (pendentes.length > 0) {
      setItensParaJustificar(pendentes);
      setIdxJustificativaAtual(0);
      setModalAberto(true);
    } else {
      executarSalvamento([]);
    }
  };

  const avancarJustificativa = () => {
    const itemAtual = itensParaJustificar[idxJustificativaAtual];
    const justAtual = justificativasDigitadas[itemAtual.produtoId];

    if (!justAtual || !justAtual.motivo || !justAtual.obs || justAtual.obs.length < 5) {
      alert("Por favor, selecione o motivo e preencha a observação obrigatória.");
      return;
    }

    if (idxJustificativaAtual < itensParaJustificar.length - 1) {
      setIdxJustificativaAtual(prev => prev + 1);
    } else {
      // Concluiu todas as justificativas
      setModalAberto(false);
      
      const payloadFormatado: JustificativaPayload[] = itensParaJustificar.map(item => ({
        produtoId: item.produtoId,
        tipoInsight: justificativasDigitadas[item.produtoId].motivo,
        textoJustificativa: justificativasDigitadas[item.produtoId].obs
      }));

      executarSalvamento(payloadFormatado);
    }
  };

  const executarSalvamento = async (justs: JustificativaPayload[]) => {
    setSalvando(true);
    try {
      await salvarSugestao(clienteId, itensEditaveis, abaAtiva, justs);
      setSucesso(true);
      setTimeout(() => setSucesso(false), 4000);
    } catch (e) {
      alert("Erro ao salvar o pedido.");
    }
    setSalvando(false);
  };

  const handleExport = (tipo: 'csv' | 'excel' | 'pdf') => {
    setMenuExportOpen(false);
    
    // Prepara dados tubulares básicos para exportação
    const dadosBasicos = itensEditaveis.map(i => ({
      Produto: i.nomeProduto,
      Fabricante: i.fabricante,
      QuantidadeSugerida: i.quantidadeSugerida,
      MotivoIA: i.motivoIA,
      Confianca: i.nivelConfianca + "%"
    }));

    if (tipo === 'csv') {
      exportToCSV(dadosBasicos, `pedido_cliente_${clienteId}.csv`);
    } else if (tipo === 'excel') {
      exportToExcel(dadosBasicos, `pedido_cliente_${clienteId}.xlsx`);
    } else if (tipo === 'pdf') {
      const colunas = ["Produto", "Fabricante", "Qtd", "Justificativa IA"];
      const linhas = itensEditaveis.map(i => [
        i.nomeProduto,
        i.fabricante,
        i.quantidadeSugerida,
        i.motivoIA
      ]);
      exportToPDF(colunas, linhas, `Pedido - Cliente ${clienteId}`, `pedido_cliente_${clienteId}.pdf`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] flex flex-col items-center justify-center">
        <div className="relative">
          <Sparkles className="animate-pulse text-blue-500 w-12 h-12 mb-4 mx-auto" />
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
        </div>
        <h2 className="text-xl text-slate-200 font-medium">A IA está analisando o histórico...</h2>
      </div>
    );
  }

  const itemCarrossel = itensParaJustificar[idxJustificativaAtual];
  const isCarrosselUltimo = idxJustificativaAtual === itensParaJustificar.length - 1;

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 p-4 md:p-8 font-sans pb-32">
      <div className="max-w-[1200px] mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.history.back()} 
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 font-medium transition-colors"
            >
              <ChevronLeft size={18} />
              Voltar
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Rocket className="text-emerald-400" />
                Pedido Inteligente
              </h1>
              <p className="text-slate-400 text-sm">Cenários baseados em IA para o Cliente #{clienteId}</p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-4 p-2 bg-[#111827] rounded-2xl border border-slate-800/50 w-fit overflow-x-auto">
          <TabButton 
            active={abaAtiva === 'conservador'} 
            onClick={() => handleTabChange('conservador')}
            icon={<ShieldCheck size={18} />}
            label="Conservador"
            activeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          />
          <TabButton 
            active={abaAtiva === 'equilibrado'} 
            onClick={() => handleTabChange('equilibrado')}
            icon={<Scale size={18} />}
            label="Equilibrado"
            activeColor="bg-blue-500/10 text-blue-400 border-blue-500/20"
          />
          <TabButton 
            active={abaAtiva === 'agressivo'} 
            onClick={() => handleTabChange('agressivo')}
            icon={<Rocket size={18} />}
            label="Agressivo (Upsell)"
            activeColor="bg-amber-500/10 text-amber-400 border-amber-500/20"
          />
        </div>

        {/* GRID DE PRODUTOS */}
        <div className="grid grid-cols-1 gap-4">
          {itensEditaveis.map((item) => (
            <div key={item.produtoId} className="bg-[#111827]/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row gap-6 items-start md:items-center hover:border-slate-700 transition-colors">
              <div className="flex-1">
                <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-1">{item.fabricante}</p>
                <h3 className="text-lg font-bold text-slate-200">{item.nomeProduto}</h3>
                
                {(item.isEmQueda || item.isSemPedido) && (
                  <div className="inline-block mt-2 px-2 py-1 bg-rose-500/10 border border-rose-500/20 rounded-md text-xs text-rose-400 font-medium">
                    ⚠️ Produto em Risco Identificado
                  </div>
                )}
                
                <div className="mt-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 flex gap-3 items-start">
                  <Sparkles className="text-indigo-400 mt-0.5 shrink-0" size={16} />
                  <p className="text-sm text-indigo-200/80 italic">"{item.motivoIA}"</p>
                </div>
              </div>

              <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                <div className="flex flex-col items-center md:items-end w-24">
                  <span className="text-xs text-slate-500 mb-1">Confiança IA</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${item.nivelConfianca > 80 ? 'text-emerald-400' : item.nivelConfianca > 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {item.nivelConfianca}%
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-end">
                  <span className="text-xs text-slate-500 mb-1">Qtd. Sugerida</span>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={item.quantidadeSugerida}
                      onChange={(e) => handleQuantityChange(item.produtoId, e.target.value)}
                      className="w-24 bg-slate-900 border border-slate-700 text-slate-200 text-lg font-bold rounded-xl py-2 px-3 text-center focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* FLOATING CHECKOUT BAR */}
      <div className="fixed bottom-0 left-0 w-full bg-[#0a0f1c]/90 backdrop-blur-2xl border-t border-slate-800 p-4 md:p-6 z-40">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-slate-400 text-sm">Resumo do Cenário: <strong className="text-slate-200 capitalize">{abaAtiva}</strong></p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            
            {/* Botão de Exportação */}
            <div className="relative">
              <button 
                onClick={() => setMenuExportOpen(!menuExportOpen)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 hover:border-slate-600"
              >
                <Download size={20} /> Exportar
              </button>
              
              {menuExportOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden py-1">
                  <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-3 flex items-center gap-3 text-slate-300 hover:bg-slate-700 transition-colors">
                    <FileText size={16} className="text-rose-400" /> PDF
                  </button>
                  <button onClick={() => handleExport('excel')} className="w-full text-left px-4 py-3 flex items-center gap-3 text-slate-300 hover:bg-slate-700 transition-colors">
                    <FileSpreadsheet size={16} className="text-emerald-400" /> Excel
                  </button>
                  <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-3 flex items-center gap-3 text-slate-300 hover:bg-slate-700 transition-colors">
                    <FileJson size={16} className="text-amber-400" /> CSV
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={processarCheckout}
              disabled={salvando || sucesso}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all
                ${sucesso ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'}`}
            >
              {sucesso ? (
                <><CheckCircle2 size={20} /> Salvo com Sucesso!</>
              ) : salvando ? (
                <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full"></div>
              ) : (
                <><Save size={20} /> Salvar e Efetivar Pedido</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL CARROSSEL DE JUSTIFICATIVAS */}
      {modalAberto && itemCarrossel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0a0f1c]/80 backdrop-blur-md" onClick={() => setModalAberto(false)}></div>
          
          <div className="relative w-full max-w-lg bg-[#111827] border border-slate-800 shadow-2xl shadow-black rounded-3xl p-6 overflow-hidden">
            <button onClick={() => setModalAberto(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white">
              <X size={24} />
            </button>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-rose-400 bg-rose-400/10 px-3 py-1 rounded-full">
                  Atenção Necessária
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {idxJustificativaAtual + 1} de {itensParaJustificar.length}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-4">{itemCarrossel.nomeProduto}</h2>
              <p className="text-sm text-slate-400 mt-1">
                {itemCarrossel.quantidadeOriginal > 0 && itemCarrossel.quantidadeSugerida === 0 
                  ? "Este item foi removido do pedido sugerido pela IA."
                  : "O motor analítico identificou risco neste produto (Queda ou Parado)."}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Motivo Principal</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={justificativasDigitadas[itemCarrossel.produtoId]?.motivo || ''}
                  onChange={(e) => setJustificativasDigitadas({
                    ...justificativasDigitadas,
                    [itemCarrossel.produtoId]: { ...justificativasDigitadas[itemCarrossel.produtoId], motivo: e.target.value }
                  })}
                >
                  <option value="">Selecione um motivo...</option>
                  {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Observação (Obrigatória)</label>
                <textarea 
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  placeholder="Justifique com detalhes o motivo..."
                  value={justificativasDigitadas[itemCarrossel.produtoId]?.obs || ''}
                  onChange={(e) => setJustificativasDigitadas({
                    ...justificativasDigitadas,
                    [itemCarrossel.produtoId]: { ...justificativasDigitadas[itemCarrossel.produtoId], obs: e.target.value }
                  })}
                ></textarea>
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center border-t border-slate-800 pt-6">
              <button 
                onClick={() => setIdxJustificativaAtual(prev => Math.max(0, prev - 1))}
                className={`text-slate-400 hover:text-white flex items-center gap-1 ${idxJustificativaAtual === 0 ? 'invisible' : ''}`}
              >
                <ChevronLeft size={20} /> Anterior
              </button>
              
              <button 
                onClick={avancarJustificativa}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2"
              >
                {isCarrosselUltimo ? 'Finalizar e Salvar' : 'Próximo'} {isCarrosselUltimo ? <Save size={18} /> : <ChevronRight size={18} />}
              </button>
            </div>

            {/* Progresso Inferior */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
              <div 
                className="h-full bg-blue-500 transition-all duration-300" 
                style={{ width: `${((idxJustificativaAtual + 1) / itensParaJustificar.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function TabButton({ active, onClick, icon, label, activeColor }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex whitespace-nowrap items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border
        ${active 
          ? activeColor
          : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800'
        }`}
    >
      {icon} {label}
    </button>
  );
}
