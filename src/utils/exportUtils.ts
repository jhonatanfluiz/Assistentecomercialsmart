import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Tipagem genérica para dados tabulares
type ExportData = Record<string, any>[];

/**
 * Utilitário estrutural para futuras personalizações de exportação de dados.
 */

// 1. Exportação para CSV (via PapaParse)
export function exportToCSV(data: ExportData, filename: string = 'exportacao.csv') {
  if (!data || data.length === 0) return;
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 2. Exportação para Excel (via XLSX)
export function exportToExcel(data: ExportData, filename: string = 'exportacao.xlsx', sheetName: string = 'Dados') {
  if (!data || data.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

// 3. Exportação para PDF (Estrutura Básica com jsPDF + autoTable)
export function exportToPDF(columns: string[], rows: any[][], title: string = 'Relatório', filename: string = 'documento.pdf') {
  const doc = new jsPDF();

  // Cabeçalho básico padrão
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  // Geração da tabela (Sem customização de layout avançado por enquanto)
  autoTable(doc, {
    startY: 30,
    head: [columns],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save(filename);
}
