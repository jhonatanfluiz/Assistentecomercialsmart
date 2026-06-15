"use client";

import React, { useState } from 'react';
import { Upload, CheckCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { processarImportacao } from './actions';

type Etapa = 'UPLOAD' | 'MAPEAMENTO' | 'PREVIA' | 'PROCESSANDO' | 'SUCESSO';

export default function ImportarPage() {
  const [etapa, setEtapa] = useState<Etapa>('UPLOAD');
  const [arquivoInfo, setArquivoInfo] = useState<{ nome: string; linhas: any[] } | null>(null);
  
  // Mapeamento: Coluna Banco -> Coluna Planilha
  const [mapeamento, setMapeamento] = useState<Record<string, string>>({
    fabricante: '',
    codigo_produto: '',
    descricao_produto: '',
    quantidade: '',
    valor: '',
    data_pedido: '',
    cliente: '',
  });

  const colunasBanco = [
    { key: 'fabricante', label: 'Fabricante', required: true },
    { key: 'codigo_produto', label: 'Código do Produto (SKU)', required: false },
    { key: 'descricao_produto', label: 'Descrição do Produto', required: true },
    { key: 'quantidade', label: 'Quantidade', required: true },
    { key: 'valor', label: 'Valor Unitário/Total', required: true },
    { key: 'data_pedido', label: 'Data do Pedido', required: true },
    { key: 'cliente', label: 'Cliente (Razão Social)', required: true },
  ];

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
    const novoMap = { ...mapeamento };
    colunasBanco.forEach(cb => {
      const match = colunasPlanilha.find(cp => cp.toLowerCase().includes(cb.label.split(' ')[0].toLowerCase()));
      if (match) novoMap[cb.key] = match;
    });
    setMapeamento(novoMap);
  };

  const iniciarImportacao = async () => {
    setEtapa('PROCESSANDO');
    
    // Mapeia os dados brutos para o formato que a action espera
    const dadosMapeados = arquivoInfo?.linhas.map(linha => {
      return {
        fabricante: linha[mapeamento.fabricante],
        codigo_produto: linha[mapeamento.codigo_produto] || '',
        descricao_produto: linha[mapeamento.descricao_produto],
        quantidade: Number(linha[mapeamento.quantidade]),
        valor: Number(linha[mapeamento.valor]),
        data_pedido: linha[mapeamento.data_pedido],
        cliente: linha[mapeamento.cliente],
      };
    }) || [];

    try {
      const resultado = await processarImportacao(dadosMapeados);
      if (resultado.sucesso) {
        setEtapa('SUCESSO');
      } else {
        alert("Erro ao importar: " + resultado.erro);
        setEtapa('PREVIA');
      }
    } catch (e) {
      alert("Erro fatal ao processar.");
      setEtapa('PREVIA');
    }
  };

  const colunasPlanilha = arquivoInfo ? Object.keys(arquivoInfo.linhas[0] || {}) : [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
          <FileSpreadsheet className="text-blue-600" />
          Importar Histórico de Vendas
        </h1>

        {/* ETAPA: UPLOAD */}
        {etapa === 'UPLOAD' && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-gray-50 transition-colors">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">Arraste sua planilha CSV ou Excel aqui</p>
            <p className="text-sm text-gray-400 mb-4">ou clique para selecionar</p>
            <input 
              type="file" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="hidden" 
              id="file-upload"
              onChange={handleFileUpload}
            />
            <label htmlFor="file-upload" className="bg-blue-600 text-white px-6 py-2 rounded-md cursor-pointer hover:bg-blue-700">
              Selecionar Arquivo
            </label>
          </div>
        )}

        {/* ETAPA: MAPEAMENTO */}
        {etapa === 'MAPEAMENTO' && (
          <div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-blue-700">Arquivo <strong>{arquivoInfo?.nome}</strong> lido com sucesso. Identificamos {arquivoInfo?.linhas.length} linhas. Agora, associe as colunas do seu arquivo com os campos do sistema.</p>
            </div>
            
            <div className="space-y-4 mb-8">
              {colunasBanco.map((col) => (
                <div key={col.key} className="flex items-center gap-4 bg-gray-50 p-3 rounded">
                  <div className="w-1/3 font-medium text-gray-700">
                    {col.label} {col.required && <span className="text-red-500">*</span>}
                  </div>
                  <div className="flex-1">
                    <select 
                      className="w-full p-2 border rounded"
                      value={mapeamento[col.key]}
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

            <div className="flex justify-end gap-4">
              <button onClick={() => setEtapa('UPLOAD')} className="px-6 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={() => setEtapa('PREVIA')} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Ver Prévia</button>
            </div>
          </div>
        )}

        {/* ETAPA: PREVIA */}
        {etapa === 'PREVIA' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Prévia dos Dados (5 primeiras linhas)</h2>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                  <tr>
                    {colunasBanco.map(c => <th key={c.key} className="px-4 py-3">{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {arquivoInfo?.linhas.slice(0, 5).map((linha, idx) => (
                    <tr key={idx} className="bg-white border-b">
                      {colunasBanco.map(c => (
                        <td key={c.key} className="px-4 py-3">{linha[mapeamento[c.key]] || '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center text-amber-600 gap-2">
                <AlertTriangle size={20} />
                <span className="text-sm">Registros duplicados serão ignorados automaticamente.</span>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setEtapa('MAPEAMENTO')} className="px-6 py-2 border rounded text-gray-600">Voltar</button>
                <button onClick={iniciarImportacao} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">Confirmar e Importar</button>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA: PROCESSANDO */}
        {etapa === 'PROCESSANDO' && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">Processando e validando {arquivoInfo?.linhas.length} registros...</h2>
            <p className="text-gray-500 mt-2">Isso pode levar alguns minutos dependendo do tamanho do arquivo.</p>
          </div>
        )}

        {/* ETAPA: SUCESSO */}
        {etapa === 'SUCESSO' && (
          <div className="text-center py-12">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Importação Concluída!</h2>
            <p className="text-gray-600 mb-6">Os dados foram processados com sucesso. Fornecedores, Clientes e Produtos novos foram registrados no sistema.</p>
            <button onClick={() => setEtapa('UPLOAD')} className="px-6 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50">
              Importar Nova Planilha
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
