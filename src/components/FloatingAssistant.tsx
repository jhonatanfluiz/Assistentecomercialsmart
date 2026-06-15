"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, AlertCircle, ChevronDown, MessageSquare } from 'lucide-react';
import { consultarAssistente, AssistenteAcao } from '@/actions/chatInteligente';
import ReactMarkdown from 'react-markdown';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const CHIPS: { label: string, acao: AssistenteAcao }[] = [
  { label: 'Preparar visita', acao: 'preparar_visita' },
  { label: 'Resumo do cliente', acao: 'resumo_cliente' },
  { label: 'O que está em queda?', acao: 'produtos_em_queda' },
  { label: 'Produtos desaparecidos', acao: 'produtos_desaparecendo' },
  { label: 'Dinheiro escondido', acao: 'dinheiro_escondido' },
  { label: 'Analisar fabricantes', acao: 'perguntar_fabricantes' },
];

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Olá! Sou o seu Assistente Comercial IA. Os dados analíticos do cliente já foram processados. Como posso te ajudar na estratégia de hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleChipClick = async (chipLabel: string, acao: AssistenteAcao) => {
    enviarMensagemParaServidor(chipLabel, acao);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    enviarMensagemParaServidor(input, 'livre');
  };

  const enviarMensagemParaServidor = async (textoVisivel: string, acao: AssistenteAcao) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: textoVisivel };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Chama a Server Action do Gemini
      const resposta = await consultarAssistente(acao, textoVisivel);
      
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: resposta };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Ops, erro de conexão com a central IA.' }]);
    }
    setIsLoading(false);
  };

  return (
    <>
      {/* Botão Flutuante */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500 hover:scale-105 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <Sparkles size={24} className="animate-pulse" />
      </button>

      {/* Janela de Chat */}
      <div 
        className={`fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 w-[90vw] max-w-[400px] h-[80vh] max-h-[650px] bg-[#0a0f1c]/95 backdrop-blur-3xl border border-slate-700/50 shadow-2xl shadow-black/80 rounded-3xl flex flex-col overflow-hidden transition-all duration-500 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-50 opacity-0 pointer-events-none'}`}
      >
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-900/40 to-[#0a0f1c] p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-wide">Assistente Comercial IA</h3>
              <p className="text-emerald-400 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800/50 p-1.5 rounded-lg">
            <ChevronDown size={20} />
          </button>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md
                ${msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-sm' 
                  : 'bg-slate-800/80 text-slate-200 rounded-bl-sm border border-slate-700/50'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start">
              <div className="bg-slate-800/80 text-slate-400 rounded-2xl rounded-bl-sm border border-slate-700/50 px-4 py-3 flex gap-1 items-center">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chips de Ação Rápida */}
        <div className="shrink-0 p-3 bg-slate-900/50 border-t border-slate-800 overflow-x-auto no-scrollbar flex gap-2">
          {CHIPS.map(chip => (
            <button
              key={chip.acao}
              onClick={() => handleChipClick(chip.label, chip.acao)}
              disabled={isLoading}
              className="shrink-0 bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 text-slate-300 border border-slate-700 hover:border-blue-500/30 text-xs px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="shrink-0 p-4 bg-[#0a0f1c] border-t border-slate-800">
          <form onSubmit={handleFormSubmit} className="relative">
            <input 
              type="text" 
              placeholder="Digite uma pergunta livre..."
              className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-200 rounded-xl pl-4 pr-12 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
          <div className="text-center mt-2 flex items-center justify-center gap-1 opacity-50">
             <AlertCircle size={10} className="text-slate-400"/>
             <span className="text-[10px] text-slate-400">A IA interpreta dados, os cálculos vêm do motor base.</span>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}} />
    </>
  );
}
