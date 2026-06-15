"use client";

import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { PackageSearch, ChevronLeft, Calendar, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

type Pedido = {
  id: string;
  cliente_id: string;
  cenario: string;
  created_at: string;
  pedido_itens: {
    id: string;
    nome_produto: string;
    quantidade: number;
    motivo_ia: string;
  }[];
};

export default function PedidosSalvosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function carregarPedidos() {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('pedidos_salvos')
        .select(`
          id,
          cliente_id,
          cenario,
          created_at,
          pedido_itens (
            id,
            nome_produto,
            quantidade,
            motivo_ia
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erro ao buscar pedidos:", error);
      } else if (data) {
        setPedidos(data as any);
      }
      setLoading(false);
    }

    carregarPedidos();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 p-4 md:p-8 font-sans pb-32">
      <div className="max-w-[1200px] mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 font-medium transition-colors"
            >
              <ChevronLeft size={18} />
              Voltar ao Painel
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <PackageSearch className="text-blue-400" />
                Pedidos Salvos
              </h1>
              <p className="text-slate-400 text-sm">Histórico de pedidos gerados pela Inteligência Artificial</p>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="bg-[#111827]/80 p-12 rounded-3xl border border-slate-800 text-center">
            <PackageSearch size={48} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-medium text-slate-300">Nenhum pedido salvo ainda</h3>
            <p className="text-slate-500 mt-2">Vá até o painel estratégico e simule um pedido para vê-lo aqui.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => {
              const isExpanded = expandedId === pedido.id;
              
              return (
                <div key={pedido.id} className="bg-[#111827]/60 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-300 hover:border-slate-700">
                  <div 
                    className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                    onClick={() => setExpandedId(isExpanded ? null : pedido.id)}
                  >
                    <div className="flex items-center gap-6">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <FileText className="text-blue-400" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-100">Cliente #{pedido.cliente_id}</h3>
                        <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(pedido.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>•</span>
                          <span className="capitalize text-emerald-400 font-medium">{pedido.cenario}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="block text-xl font-bold text-white">{pedido.pedido_itens.length}</span>
                        <span className="text-xs text-slate-500 uppercase tracking-wider">Itens</span>
                      </div>
                      <div className="p-2 bg-slate-800/50 rounded-xl text-slate-400">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>

                  {/* Detalhes Expandidos */}
                  {isExpanded && (
                    <div className="border-t border-slate-800 p-6 bg-[#0a0f1c]/50">
                      <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Itens Sugeridos pela IA</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pedido.pedido_itens.map((item) => (
                          <div key={item.id} className="bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-slate-200">{item.nome_produto}</span>
                              <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-1 rounded-md">Qtd: {item.quantidade}</span>
                            </div>
                            <p className="text-xs text-slate-400 italic">"{item.motivo_ia}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
