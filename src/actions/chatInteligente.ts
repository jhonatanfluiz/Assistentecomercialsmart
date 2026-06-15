"use server";

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDashboardMetrics, getProdutosSemGiroDetalhamento, getItensEstoqueZerado } from './dashboard';

// Instância do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MOCK_KEY');

export type AssistenteAcao = 
  | 'preparar_visita' 
  | 'resumo_cliente' 
  | 'produtos_em_queda' 
  | 'produtos_desaparecendo' 
  | 'dinheiro_escondido' 
  | 'perguntar_fabricantes'
  | 'livre';

export async function consultarAssistente(acao: AssistenteAcao, mensagemLivre?: string, clienteId?: string) {
  // Puxar dados reais do banco
  const metricasGerais = await getDashboardMetrics();
  const produtosZerados = await getItensEstoqueZerado();
  const produtosSemGiro = await getProdutosSemGiroDetalhamento();

  // Vamos montar um "JSON" com os dados consolidados para enviar para o Gemini
  const dadosBase = {
    clienteAlvo: clienteId ? `Cliente ID: ${clienteId}` : "Visão Geral (Todos os Clientes/Lojas)",
    produtosEmQueda: produtosSemGiro.slice(0, 5).map(p => ({
      nome: p.descricao,
      fabricante: p.fabricante,
      estoqueParado: p.totalEstoque
    })),
    produtosDesaparecendo: produtosZerados.slice(0, 5).map(p => ({
      nome: p.descricao,
      vendasPerdidasPeriodo: p.vendasPeriodo,
      ultimaEntrada: p.dataUltimaEntrada,
      local: p.local
    })),
    resumoDashboard: {
      vendasTotais: metricasGerais.vendasTotais.valor,
      estoqueZeradoCount: metricasGerais.estoqueZerado.valor,
      produtosSemGiroCount: metricasGerais.produtosSemGiro.valor
    }
  };

  let promptContexto = `
    Você é o Assistente Comercial B2B Smart. Sua função é interpretar dados reais de vendas e estoque que eu te passar
    e agir como um estrategista de vendas para o representante que está lendo.
    
    REGRA DE OURO: VOCÊ NUNCA CALCULA NADA. Apenas leia o JSON fornecido e explique em tom profissional e de forma super direta, sem rodeios.

    DADOS MATEMÁTICOS FORNECIDOS PELO SISTEMA (REAIS):
    ${JSON.stringify(dadosBase)}
  `;

  let promptComando = "";

  // Seleciona a estratégia baseada no clique do usuário
  switch (acao) {
    case 'preparar_visita':
      promptComando = `Monte um roteiro curto (bullet points) de como agir na estratégia de hoje, focando em recuperar itens sem giro (estoque parado) e itens zerados (ruptura).`;
      break;
    case 'resumo_cliente':
      promptComando = `Faça um resumo executivo de 2 parágrafos sobre a visão geral dos dados passados, destacando vendas totais e a quantidade de itens com ruptura ou sem giro.`;
      break;
    case 'produtos_em_queda':
      promptComando = `O representante clicou para ver 'O que está em queda?'. Liste os produtos sem giro informados no JSON (estoque parado) e dê um argumento prático de vendas (ex: oferecer desconto) para girar o estoque.`;
      break;
    case 'produtos_desaparecendo':
      promptComando = `O representante clicou para ver 'Produtos Desaparecidos'. Liste os produtos zerados do JSON (com vendas perdidas) e sugira a abordagem para repor imediatamente.`;
      break;
    case 'dinheiro_escondido':
      promptComando = `O usuário clicou em 'Dinheiro Escondido'. Use a quantidade de itens sem giro do JSON para motivar o vendedor a recuperar capital que está parado no estoque.`;
      break;
    case 'perguntar_fabricantes':
      promptComando = `Com base nos produtos zerados e sem giro, indique quais fabricantes precisam de mais atenção.`;
      break;
    case 'livre':
      promptComando = `O representante fez a seguinte pergunta: "${mensagemLivre}". Responda de forma direta usando os dados fornecidos no JSON base se aplicável.`;
      break;
  }

  const promptFinal = `${promptContexto}\n\nCOMANDO DO USUÁRIO:\n${promptComando}`;

  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MOCK_KEY') {
      await new Promise(r => setTimeout(r, 1200));
      return `(Simulação Local - Configure a chave do Gemini para respostas reais)\n\nEntendido! Segundo o motor analítico, os dados reais indicam vendas totais de ${dadosBase.resumoDashboard.vendasTotais} itens, com ${dadosBase.resumoDashboard.estoqueZeradoCount} produtos zerados.`;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent(promptFinal);
    return result.response.text();
    
  } catch (error) {
    console.error("Erro no Chat IA:", error);
    return "Desculpe, encontrei uma instabilidade ao conectar com o cérebro da Inteligência Artificial. Tente novamente.";
  }
}
