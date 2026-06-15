"use client";

import React, { useState } from 'react';
import { Upload, CheckCircle, AlertTriangle, FileSpreadsheet, ArrowLeft, ArrowRightLeft } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { processarImportacao, processarImportacaoEntradas } from './actions';
import Link from 'next/link';

type Etapa = 'UPLOAD' | 'MAPEAMENTO' | 'PREVIA' | 'PROCESSANDO' | 'SUCESSO';
type TipoImportacao = 'SAIDAS' | 'ENTRADAS';

export default function ImportarPage() {
  const [etapa, setEtapa] = useState<Etapa>('UPLOAD');
  const [tipoImportacao, setTipoImportacao] = useState<TipoImportacao>('SAIDAS');
  const [arquivoInfo, setArquivoInfo] = useState<{ nome: string; linhas: any[] } | null>(null);
  
  // Metadados Globais do Upload
  const [nomeFabricante, setNomeFabricante] = useState('');
  const [mesReferencia, setMesReferencia] = useState('');
  
  // Mapeamento dinâmico
  const [mapeamento, setMapeamento] = useState<Record<string, string>>({});

  const colunasBancoSaidas = [
    { key: 'status', label: 'Status', required: false },
    { key: 'loja', label: 'Loja', required: false },
    { key: 'zona', label: 'Zona', required: false },
    { key: 'periodo_analisado', label: 'Período Analisado', required: false },
    { key: 'codigo', label: 'Codigo', required: true },
    { key: 'descricao', label: 'Descricao', required: true },
    { key: 'caixa_master', label: 'Caixa Master', required: false },
    { key: 'familia', label: 'Família', required: false },
    { key: 'estoque_geral', label: 'Estoque Geral', required: false },
    { key: 'inventario', label: 'Inventário', required: false },
    { key: 'devolucoes', label: 'Devoluções', required: false },
    { key: 'entradas_deposito', label: 'Entradas Depósito', required: false },
    { key: 'requisicoes', label: 'Requisições', required: false },
    { key: 'requisicoes_abdo', label: 'Requisições ABDO', required: false },
    { key: 'vendas', label: 'Vendas', required: false },
    { key: 'estoque_loja', label: 'Estoque Loja', required: false },
    { key: 'pedidos', label: 'Pedidos', required: false },
    { key: 'entradas_loja', label: 'Entradas Loja', required: false },
    { key: 'prioridade', label: 'Prioridade', required: false },
    { key: 'comentario', label: 'Comentario', required: false },
    { key: 'total', label: 'Total', required: false },
  ];

  const colunasBancoEntradas = [
    { key: 'codigo', label: 'Código do Item', required: true },
    { key: 'descricao', label: 'Item Descrição', required: true },
    { key: 'fabricante', label: 'Família', required: false },
    { key: 'fornecedor', label: 'Origem Movimento', required: false },
    { key: 'data_movimento', label: 'Data Movimento', required: true },
    { key: 'quantidade', label: 'Quantidade', required: true },
  ];

  const colunasAtuais = tipoImportacao === 'SAIDAS' ? colunasBancoSaidas : colunasBancoEntradas;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isCSV = file.name.endsWith('.csv');
    
    if (isCSV) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setArquivoInfo({ nome: file.name, linhas: results.data });
          preencherMapeamentoAutomatico(Object.keys(results.data[0] || {}));
          setEtapa('MAPEAMENTO');
        }
      });
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setArquivoInfo({ nome: file.name, linhas: data });
        preencherMapeamentoAutomatico(Object.keys(data[0] || {}));
        setEtapa('MAPEAMENTO');
      };
      reader.readAsBinaryString(file);
    }
  };

  const preencherMapeamentoAutomatico = (colunasPlanilha: string[]) => {
    const novoMap: Record<string, string> = {};
    colunasAtuais.forEach(cb => {
      novoMap[cb.key] = '';
      const match = colunasPlanilha.find(cp => cp.toLowerCase().includes(cb.label.split(' ')[0].toLowerCase()));
      if (match) novoMap[cb.key] = match;
    });
    setMapeamento(novoMap);
  };

  const iniciarImportacao = async () => {
    setEtapa('PROCESSANDO');
    
    try {
      if (tipoImportacao === 'SAIDAS') {
        const dadosMapeados = arquivoInfo?.linhas.map(linha => {
          return {
            status: linha[mapeamento.status] || '',
            loja: linha[mapeamento.loja] || '',
            zona: linha[mapeamento.zona] || '',
            periodo_analisado: linha[mapeamento.periodo_analisado] || '',
            codigo: linha[mapeamento.codigo] || '',
            descricao: linha[mapeamento.descricao] || '',
            caixa_master: linha[mapeamento.caixa_master] ? Number(linha[mapeamento.caixa_master]) : null,
            familia: linha[mapeamento.familia] || '',
            estoque_geral: linha[mapeamento.estoque_geral] ? Number(linha[mapeamento.estoque_geral]) : null,
            inventario: linha[mapeamento.inventario] ? Number(linha[mapeamento.inventario]) : null,
            devolucoes: linha[mapeamento.devolucoes] ? Number(linha[mapeamento.devolucoes]) : null,
            entradas_deposito: linha[mapeamento.entradas_deposito] ? Number(linha[mapeamento.entradas_deposito]) : null,
            requisicoes: linha[mapeamento.requisicoes] ? Number(linha[mapeamento.requisicoes]) : null,
            requisicoes_abdo: linha[mapeamento.requisicoes_abdo] ? Number(linha[mapeamento.requisicoes_abdo]) : null,
            vendas: linha[mapeamento.vendas] ? Number(linha[mapeamento.vendas]) : null,
            estoque_loja: linha[mapeamento.estoque_loja] ? Number(linha[mapeamento.estoque_loja]) : null,
            pedidos: linha[mapeamento.pedidos] ? Number(linha[mapeamento.pedidos]) : null,
            entradas_loja: linha[mapeamento.entradas_loja] ? Number(linha[mapeamento.entradas_loja]) : null,
            prioridade: linha[mapeamento.prioridade] || '',
            comentario: linha[mapeamento.comentario] || '',
            total: linha[mapeamento.total] ? Number(linha[mapeamento.total]) : null,
          };
        }) || [];
        const resultado = await processarImportacao(dadosMapeados, nomeFabricante, mesReferencia);
        if (resultado.sucesso) setEtapa('SUCESSO');
        else throw new Error(resultado.erro);
      } else {
        const dadosMapeados = arquivoInfo?.linhas.map(linha => {
          return {
            codigo: linha[mapeamento.codigo] || '',
            descricao: linha[mapeamento.descricao] || '',
            fabricante: linha[mapeamento.fabricante] || '',
            fornecedor: linha[mapeamento.fornecedor] || '',
            data_movimento: linha[mapeamento.data_movimento] || '',
            quantidade: linha[mapeamento.quantidade] ? Number(linha[mapeamento.quantidade]) : null,
          };
        }) || [];
        const resultado = await processarImportacaoEntradas(dadosMapeados);
        if (resultado.sucesso) setEtapa('SUCESSO');
        else throw new Error(resultado.erro);
      }
    } catch (e: any) {
      alert("Erro ao importar: " + (e.message || "Erro fatal"));
      setEtapa('PREVIA');
    }
  };

  const colunasPlanilha = arquivoInfo ? Object.keys(arquivoInfo.linhas[0] || {}) : [];

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard" className="p-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="text-blue-500" />
            Importação de Dados
          </h1>
        </div>

        {etapa === 'UPLOAD' && (
          <div className="flex gap-2 mb-6 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800 w-fit">
            <button 
              onClick={() => setTipoImportacao('SAIDAS')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${tipoImportacao === 'SAIDAS' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              1. Estoque e Saídas
            </button>
            <button 
              onClick={() => setTipoImportacao('ENTRADAS')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tipoImportacao === 'ENTRADAS' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              <ArrowRightLeft size={16} />
              2. Relatório de Entradas
            </button>
          </div>
        )}

        <div className="bg-slate-900 rounded-xl shadow-xl shadow-black/20 border border-slate-800 p-6 md:p-8">
          {etapa === 'UPLOAD' && (
            <div className="space-y-6">
              
              {tipoImportacao === 'SAIDAS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 mb-2 font-medium">Nome do Fabricante</label>
                    <input 
                      type="text" 
                      placeholder="Ex: TALLISMA"
                      value={nomeFabricante}
                      onChange={(e) => setNomeFabricante(e.target.value)}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-2 font-medium">Semana ou Mês Analisado</label>
                    <input 
                      type="month" 
                      value={mesReferencia}
                      onChange={(e) => setMesReferencia(e.target.value)}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {tipoImportacao === 'ENTRADAS' && (
                <div className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-lg">
                  <h3 className="text-emerald-400 font-medium mb-1">Upload do Relatório de Entradas</h3>
                  <p className="text-slate-400 text-sm">Este arquivo alimentará a tabela de entradas para mostrar as datas exatas no dashboard.</p>
                </div>
              )}

              <div className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${(tipoImportacao === 'SAIDAS' && (!nomeFabricante || !mesReferencia)) ? 'border-slate-800 bg-slate-950/30 opacity-50 cursor-not-allowed' : 'border-slate-700 bg-slate-950/50 hover:bg-slate-900'}`}>
                <Upload className={`mx-auto h-14 w-14 mb-4 ${tipoImportacao === 'ENTRADAS' ? 'text-emerald-500/60' : 'text-blue-500/60'}`} />
                <p className="text-slate-300 font-medium mb-2 text-lg">Arraste sua planilha CSV ou Excel aqui</p>
                <p className="text-sm text-slate-500 mb-6">ou clique no botão abaixo para selecionar</p>
                <input 
                  type="file" 
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  className="hidden" 
                  id="file-upload"
                  onChange={handleFileUpload}
                  disabled={tipoImportacao === 'SAIDAS' && (!nomeFabricante || !mesReferencia)}
                />
                <label htmlFor="file-upload" className={`inline-block px-8 py-3 rounded-lg font-medium transition-colors shadow-lg ${(tipoImportacao === 'SAIDAS' && (!nomeFabricante || !mesReferencia)) ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : (tipoImportacao === 'ENTRADAS' ? 'bg-emerald-600 text-white cursor-pointer hover:bg-emerald-500 shadow-emerald-900/20' : 'bg-blue-600 text-white cursor-pointer hover:bg-blue-500 shadow-blue-900/20')}`}>
                  Selecionar Arquivo
                </label>
              </div>
            </div>
          )}

          {etapa === 'MAPEAMENTO' && (
            <div>
              <div className="bg-blue-950/40 border border-blue-900/50 p-4 rounded-lg mb-8 flex items-start gap-3">
                <CheckCircle className="text-blue-400 mt-0.5" size={20} />
                <p className="text-blue-200">
                  Arquivo <strong className="text-white">{arquivoInfo?.nome}</strong> lido. Identificamos <strong className="text-white">{arquivoInfo?.linhas.length}</strong> linhas. <br/>
                  <span className="text-blue-300/80 text-sm">Associe as colunas abaixo:</span>
                </p>
              </div>
              
              <div className="space-y-4 mb-8">
                {colunasAtuais.map((col) => (
                  <div key={col.key} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                    <div className="md:w-1/3 font-medium text-slate-300">
                      {col.label} {col.required && <span className="text-red-400">*</span>}
                    </div>
                    <div className="flex-1">
                      <select 
                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        value={mapeamento[col.key] || ''}
                        onChange={(e) => setMapeamento({...mapeamento, [col.key]: e.target.value})}
                      >
                        <option value="">-- Selecione a coluna correspondente --</option>
                        {colunasPlanilha.map(cp => (
                          <option key={cp} value={cp}>{cp}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col-reverse md:flex-row justify-end gap-4 pt-4 border-t border-slate-800">
                <button onClick={() => setEtapa('UPLOAD')} className="px-6 py-2.5 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">Cancelar</button>
                <button onClick={() => setEtapa('PREVIA')} className={`px-6 py-2.5 text-white font-medium rounded-lg transition-colors shadow-lg ${tipoImportacao === 'ENTRADAS' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'}`}>Ver Prévia dos Dados</button>
              </div>
            </div>
          )}

          {etapa === 'PREVIA' && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-slate-200">Prévia dos Dados (5 primeiras linhas)</h2>
              <div className="overflow-x-auto mb-8 border border-slate-800 rounded-lg bg-slate-950/50">
                <table className="w-full text-sm text-left text-slate-300">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-900 border-b border-slate-800">
                    <tr>
                      {colunasAtuais.map(c => <th key={c.key} className="px-4 py-3 font-medium">{c.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {arquivoInfo?.linhas.slice(0, 5).map((linha, idx) => (
                      <tr key={idx} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-900/50">
                        {colunasAtuais.map(c => (
                          <td key={c.key} className="px-4 py-3">{linha[mapeamento[c.key]] || <span className="text-slate-600">-</span>}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 border-t border-slate-800">
                <div className="flex items-start md:items-center text-amber-500/90 gap-2 bg-amber-950/20 p-3 rounded-lg border border-amber-900/30">
                  <AlertTriangle size={20} className="shrink-0 mt-0.5 md:mt-0" />
                  <span className="text-sm">Tudo certo com a prévia? Vamos importar para o Supabase.</span>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <button onClick={() => setEtapa('MAPEAMENTO')} className="flex-1 md:flex-none px-6 py-2.5 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">Voltar</button>
                  <button onClick={iniciarImportacao} className={`flex-1 md:flex-none px-6 py-2.5 text-white font-medium rounded-lg transition-colors shadow-lg ${tipoImportacao === 'ENTRADAS' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'}`}>Confirmar e Importar</button>
                </div>
              </div>
            </div>
          )}

          {etapa === 'PROCESSANDO' && (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-t-2 border-blue-500 mx-auto mb-6"></div>
              <h2 className="text-xl font-semibold text-slate-200">Enviando <span className="text-blue-400">{arquivoInfo?.linhas.length}</span> registros para o banco de dados...</h2>
            </div>
          )}

          {etapa === 'SUCESSO' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold text-slate-100 mb-3">Importação Concluída!</h2>
              <div className="flex justify-center gap-4 mt-8">
                <Link href="/dashboard" className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
                  Ir para o Dashboard
                </Link>
                <button onClick={() => { setEtapa('UPLOAD'); setArquivoInfo(null); }} className="px-6 py-3 border border-slate-700 text-slate-300 font-medium rounded-lg hover:bg-slate-800 transition-colors">
                  Importar Outra Planilha
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
