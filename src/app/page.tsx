"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function StatusPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    // Simulating a quick health check
    // In the future this can actually hit a Supabase endpoint to check DB connection
    setTimeout(() => {
      setStatus('success');
    }, 1500);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200 p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl text-center space-y-6">
        
        {/* Logo / Ícone */}
        <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white">Assistente Comercial Smart</h1>
        
        <div className="flex justify-center items-center gap-2 text-sm font-mono bg-slate-800/50 py-2 px-4 rounded-lg border border-slate-700/50">
          <span className="text-slate-400">Versão:</span>
          <span className="text-emerald-400 font-semibold">v0.1.0-MVP</span>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Status do Ambiente:</span>
            <span className="text-blue-400 font-medium">Produção</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Conexão Backend:</span>
            {status === 'loading' && <span className="text-amber-400 animate-pulse">Verificando...</span>}
            {status === 'success' && <span className="text-emerald-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Online</span>}
            {status === 'error' && <span className="text-red-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span> Offline</span>}
          </div>
        </div>

        <div className="pt-6">
          <Link href="/dashboard" className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-900/20">
            Acessar Sistema
          </Link>
        </div>
        
      </div>
    </div>
  );
}
