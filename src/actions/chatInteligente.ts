"use server";

import { GoogleGenerativeAI } from '@google/generative-ai';

// Instância do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MOCK_KEY');

// Tipos de ações pré-configuradas (Chips)
export type AssistenteAcao = 
  | 'preparar_visita' 
  | 'resumo_cliente' 
  | 'produtos_em_queda' 
  | 'produtos_desaparecendo' 
  | 'dinheiro_escondido' 
  | 'perguntar_fabricantes'
  | 'livre';

// Como a instrução diz que a IA NÃO DEVE FAZER CÁLCULOS,
// Os cálculos estão mockados aqui simulando o AnalyticalEngine.
const dadosBaseSimulados = {
  clienteAlvo: "Supermercado São João (ID: 123)",
  produtosEmQueda: [
    { nome: "Leite Condensado 395g", queda: "35%", valorPerdido: "R$ 450,00" },
    { nome: "Achocolatado 800g", queda: "40%", valorPerdido: "R$ 200,00" }
  ],
  produtosDesaparecendo: [
    { nome: "Farinha de Trigo 1kg", queda: "100%", ultimoPedido: "60 dias atrás" }
  ],
  dinheiroEscondidoTotal: "R$ 1.580,00",
  marketShareFabricantes: [
    { fabricante: "Nestlé", share: "45%" },
    { fabricante: "Ambev", share: "30%" }
  ]
};

export async function consultarAssistente(acao: AssistenteAcao, mensagemLivre?: string, clienteId?: string) {
  // Monta o Prompt de Contexto Base (Instruções Fixas)
  let promptContexto = `
    Você é o Assistente Comercial B2B Smart. Sua função é interpretar dados matemáticos exatos que eu te passar
    e agir como um estrategista de vendas para o representante que está lendo.
    
    REGRA DE OURO: VOCÊ NUNCA CALCULA NADA. Apenas leia o JSON fornecido e explique em tom profissional e de forma super direta, sem rodeios.

    DADOS MATEMÁTICOS FORNECIDOS PELO SISTEMA:
    ${JSON.stringify(dadosBaseSimulados)}
  `;

  let promptComando = "";

  // Seleciona a estratégia baseada no clique do usuário
  switch (acao) {
    case 'preparar_visita':
      promptComando = `Monte um roteiro curto (bullet points) de como o representante deve agir na visita de hoje, focando em recuperar o dinheiro escondido e falar sobre os produtos que sumiram do radar.`;
      break;
    case 'resumo_cliente':
      promptComando = `Faça um resumo executivo de 2 parágrafos sobre o momento do cliente, destacando as forças (market share) e as fraquezas (quedas).`;
      break;
    case 'produtos_em_queda':
      promptComando = `O representante clicou para ver 'Produtos em Queda'. Liste quais são esses produtos informados no JSON e dê um argumento prático de vendas (ex: oferecer desconto ou perguntar se concorrência invadiu) para ele usar agora.`;
      break;
    case 'produtos_desaparecendo':
      promptComando = `O representante clicou para ver 'Produtos Desaparecendo'. Liste os produtos desaparecidos do JSON e sugira a abordagem exata para investigar o porquê o cliente parou de comprar.`;
      break;
    case 'dinheiro_escondido':
      promptComando = `O usuário clicou em 'Dinheiro Escondido'. Revele o valor total oculto informado no JSON e motive o vendedor a recuperar esse gap de faturamento.`;
      break;
    case 'perguntar_fabricantes':
      promptComando = `Com base no Market Share fornecido, explique como a carteira desse cliente está dividida entre os fabricantes e onde há espaço para introduzir outras marcas.`;
      break;
    case 'livre':
      promptComando = `O representante fez a seguinte pergunta: "${mensagemLivre}". Responda de forma direta usando os dados fornecidos no JSON base se aplicável.`;
      break;
  }

  const promptFinal = `${promptContexto}\n\nCOMANDO DO USUÁRIO:\n${promptComando}`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      // Fallback local se não houver chave
      await new Promise(r => setTimeout(r, 1200));
      return `(Simulação Local - Configure a chave do Gemini para respostas reais)\n\nEntendido! Segundo o motor analítico, o cliente tem **${dadosBaseSimulados.dinheiroEscondidoTotal}** em oportunidades perdidas. Focaria primeiro em recuperar o ${dadosBaseSimulados.produtosDesaparecendo[0].nome}.`;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent(promptFinal);
    return result.response.text();
    
  } catch (error) {
    console.error("Erro no Chat IA:", error);
    return "Desculpe, encontrei uma instabilidade ao conectar com o cérebro da Inteligência Artificial. Tente novamente.";
  }
}
