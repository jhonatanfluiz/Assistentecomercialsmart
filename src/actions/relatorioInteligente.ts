"use server";

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'SUA_CHAVE_AQUI');

export type BattleCardData = {
  cliente: {
    id: string;
    nome: string;
    curvaABC: string;
    frequenciaMedia: string;
    ticketMedio: string;
  };
  defesa: {
    produtosEmQueda: { id: string; nome: string; motivo: string; queda: string }[];
    produtosEsquecidos: { id: string; nome: string; motivo: string; dias: number }[];
  };
  ataque: {
    upsellOportunidades: { id: string; nome: string; motivo: string; potencial: string }[];
  };
  argumentoVendas: string;
}

export async function gerarRelatorioEstrategico(clienteId: string): Promise<BattleCardData> {
  // Simulando dados que normalmente viriam do processamento do AnalyticalEngine
  const data: Omit<BattleCardData, 'argumentoVendas'> = {
    cliente: {
      id: clienteId,
      nome: "Supermercado Central",
      curvaABC: "A",
      frequenciaMedia: "15 dias",
      ticketMedio: "R$ 4.500,00"
    },
    defesa: {
      produtosEmQueda: [
        { id: "p1", nome: "Caixa de Parafusos 10mm (Gerdau)", motivo: "Volume reduziu 40% nos últimos 2 meses.", queda: "40%" }
      ],
      produtosEsquecidos: [
        { id: "p2", nome: "Cimento Votorantim 50kg", motivo: "Não compra há 45 dias. Risco de ruptura na gôndola.", dias: 45 }
      ]
    },
    ataque: {
      upsellOportunidades: [
        { id: "p3", nome: "Alicate Universal (Tramontina)", motivo: "Alto giro na região para este perfil de loja.", potencial: "R$ 800,00" },
        { id: "p4", nome: "Furadeira Impacto (Bosch)", motivo: "Produto premium que pode aumentar o ticket da loja.", potencial: "R$ 1.500,00" }
      ]
    }
  };

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Você é um diretor comercial estratégico de uma distribuidora. Escreva em um único parágrafo (max 4 linhas) uma sugestão agressiva de como o vendedor deve abordar o cliente ${data.cliente.nome}. 
Ele deve focar em recuperar a venda de ${data.defesa.produtosEmQueda[0].nome} (que caiu ${data.defesa.produtosEmQueda[0].queda}) e introduzir o novo produto ${data.ataque.upsellOportunidades[0].nome}. Seja persuasivo, motivacional e direto. Use tom profissional.`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return {
      ...data,
      argumentoVendas: text.replace(/\n/g, ' ').trim()
    };
  } catch (error) {
    console.error("Erro Gemini:", error);
    return {
      ...data,
      argumentoVendas: "Vendedor, inicie a conversa recuperando os itens que estão caindo. Reforce a importância de evitar rupturas na gôndola de Cimento e sugira os lançamentos para aumentar o giro."
    };
  }
}
