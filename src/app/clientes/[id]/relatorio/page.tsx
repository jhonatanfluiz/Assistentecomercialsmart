import React from 'react';
import { gerarRelatorioEstrategico } from '@/actions/relatorioInteligente';
import PrintButton from '@/components/PrintButton';
import { ShieldAlert, Target, AlertCircle, ArrowLeft, BrainCircuit, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default async function RelatorioEstrategicoPage({ params }: { params: { id: string } }) {
  const data = await gerarRelatorioEstrategico(params.id);

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 p-4 md:p-8 font-sans print:bg-white print:text-black">
      
      {/* Botões de Ação (Ocultos na Impressão) */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
        <Link 
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-medium transition-colors border border-slate-700"
        >
          <ArrowLeft size={18} />
          Voltar ao Painel
        </Link>
        <PrintButton />
      </div>

      {/* Container Principal do Relatório (A4 Size approximation) */}
      <div className="max-w-4xl mx-auto bg-[#111827] print:bg-white rounded-3xl p-8 md:p-12 border border-slate-800 print:border-slate-300 print:shadow-none shadow-2xl">
        
        {/* Cabeçalho do Relatório */}
        <div className="border-b border-slate-800 print:border-slate-300 pb-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 print:bg-purple-100 print:text-purple-800 text-xs font-bold rounded-full uppercase tracking-wider">
                Battle Card
              </span>
              <span className="text-slate-500 print:text-slate-500 text-sm">Gerado por IA</span>
            </div>
            <h1 className="text-3xl font-bold text-white print:text-black mb-1">{data.cliente.nome}</h1>
            <p className="text-slate-400 print:text-slate-600">ID do Cliente: #{data.cliente.id}</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex gap-6 text-right">
            <div>
              <p className="text-xs text-slate-500 print:text-slate-500 uppercase tracking-wider mb-1">Curva</p>
              <p className="text-xl font-bold text-blue-400 print:text-blue-700">{data.cliente.curvaABC}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 print:text-slate-500 uppercase tracking-wider mb-1">Frequência</p>
              <p className="text-xl font-bold text-slate-200 print:text-slate-800">{data.cliente.frequenciaMedia}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 print:text-slate-500 uppercase tracking-wider mb-1">Ticket Médio</p>
              <p className="text-xl font-bold text-emerald-400 print:text-emerald-700">{data.cliente.ticketMedio}</p>
            </div>
          </div>
        </div>

        {/* Recomendação da IA */}
        <div className="bg-purple-900/20 print:bg-purple-50 border border-purple-500/30 print:border-purple-200 rounded-2xl p-6 mb-10">
          <div className="flex items-center gap-3 mb-3">
            <BrainCircuit className="text-purple-400 print:text-purple-700" size={24} />
            <h2 className="text-lg font-bold text-purple-300 print:text-purple-800">Plano de Abordagem Sugerido (IA)</h2>
          </div>
          <p className="text-slate-300 print:text-slate-700 leading-relaxed text-lg italic">
            "{data.argumentoVendas}"
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:gap-4">
          
          {/* Coluna 1: DEFESA */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-orange-500/30 print:border-orange-200 pb-3">
              <ShieldAlert className="text-orange-400 print:text-orange-600" size={28} />
              <h2 className="text-2xl font-bold text-white print:text-black">Defesa</h2>
              <span className="ml-auto text-xs bg-orange-500/20 text-orange-400 print:bg-orange-100 print:text-orange-800 px-2 py-1 rounded-md font-bold">Risco de Ruptura</span>
            </div>

            {data.defesa.produtosEmQueda.map(item => (
              <div key={item.id} className="bg-slate-800/50 print:bg-white print:border print:border-slate-200 p-5 rounded-xl border border-slate-700 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 print:bg-orange-500"></div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-100 print:text-black pr-4">{item.nome}</h3>
                  <span className="text-orange-400 font-bold whitespace-nowrap">Queda de {item.queda}</span>
                </div>
                <p className="text-sm text-slate-400 print:text-slate-600 flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-orange-400/70" />
                  {item.motivo}
                </p>
              </div>
            ))}

            {data.defesa.produtosEsquecidos.map(item => (
              <div key={item.id} className="bg-slate-800/50 print:bg-white print:border print:border-slate-200 p-5 rounded-xl border border-slate-700 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 print:bg-red-500"></div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-100 print:text-black pr-4">{item.nome}</h3>
                  <span className="text-red-400 font-bold whitespace-nowrap">{item.dias} dias</span>
                </div>
                <p className="text-sm text-slate-400 print:text-slate-600 flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400/70" />
                  {item.motivo}
                </p>
              </div>
            ))}
          </div>

          {/* Coluna 2: ATAQUE */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-emerald-500/30 print:border-emerald-200 pb-3">
              <Target className="text-emerald-400 print:text-emerald-600" size={28} />
              <h2 className="text-2xl font-bold text-white print:text-black">Ataque</h2>
              <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-400 print:bg-emerald-100 print:text-emerald-800 px-2 py-1 rounded-md font-bold">Oportunidade</span>
            </div>

            {data.ataque.upsellOportunidades.map(item => (
              <div key={item.id} className="bg-slate-800/50 print:bg-white print:border print:border-slate-200 p-5 rounded-xl border border-slate-700 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 print:bg-emerald-500"></div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-100 print:text-black pr-4">{item.nome}</h3>
                  <span className="text-emerald-400 font-bold flex items-center gap-1 whitespace-nowrap">
                    <TrendingUp size={14} />
                    {item.potencial}
                  </span>
                </div>
                <p className="text-sm text-slate-400 print:text-slate-600 flex items-start gap-2">
                  <Target size={16} className="shrink-0 mt-0.5 text-emerald-400/70" />
                  {item.motivo}
                </p>
              </div>
            ))}
            
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
    </div>
  );
}
