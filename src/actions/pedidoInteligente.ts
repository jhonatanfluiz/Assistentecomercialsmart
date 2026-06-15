"use server";

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSupabaseClient } from '@/lib/supabaseClient';
// Setup Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'SUA_CHAVE_AQUI');

export type ItemSugerido = {
  produtoId: string;
  nomeProduto: string;
  fabricante: string;
  quantidadeSugerida: number;
  quantidadeOriginal: number; // Para saber se houve remoção (Qtd zero)
  motivoIA: string;
  nivelConfianca: number; // 0 a 100
  isEmQueda: boolean;
  isSemPedido: boolean;
};

export type JustificativaPayload = {
  produtoId: string;
  tipoInsight: string;
  textoJustificativa: string;
};

export type CenariosPedido = {
  conservador: ItemSugerido[];
  equilibrado: ItemSugerido[];
  agressivo: ItemSugerido[];
};

export async function gerarPedidoInteligente(clienteId: string): Promise<CenariosPedido> {
  const supabase = getSupabaseClient();
  
  // 1. Em um cenário real, aqui puxaríamos o histórico do cliente do banco:
  // const { data } = await supabase.from('itens_pedido').select(`...`).eq('cliente_id', clienteId);
  
  // Para fins de desenvolvimento do MVP, criaremos um mock de dados mastigados que 
  // o Analytical Engine (criado no passo anterior) teria gerado para este cliente:
  const analiseClienteMock = [
    { id: 'p1', nome: 'Caixa de Parafusos 10mm', fab: 'Gerdau', mediaQtd: 50, ultimaQtd: 10, queda: 0.8, diasSemCompra: 15 },
    { id: 'p2', nome: 'Alicate Universal', fab: 'Tramontina', mediaQtd: 15, ultimaQtd: 15, queda: 0, diasSemCompra: 45 },
    { id: 'p3', nome: 'Tinta Acrílica Branca 18L', fab: 'Suvinil', mediaQtd: 5, ultimaQtd: 0, queda: 1, diasSemCompra: 90 }, // Desaparecido
  ];

  // 2. Cálculo Base Matemático
  // Conservador: Apenas o que gira e descontando o risco (vender um pouco menos que a média)
  // Equilibrado: Tentar bater a média cravada.
  // Agressivo: Jogar 20% acima da média e forçar os itens desaparecidos.
  const baseConservador = analiseClienteMock.map(p => ({
    produtoId: p.id,
    nomeProduto: p.nome,
    fabricante: p.fab,
    quantidadeBase: Math.floor(p.mediaQtd * 0.8), // 20% abaixo da média por segurança
    contexto: `Frequência atual: comprava ${p.mediaQtd}, último pedido foi ${p.ultimaQtd}.`
  })).filter(p => p.quantidadeBase > 0);

  const baseEquilibrado = analiseClienteMock.map(p => ({
    ...p,
    quantidadeBase: p.mediaQtd,
    contexto: `Tentativa de recuperar a média histórica de ${p.mediaQtd}.`
  }));

  const baseAgressivo = analiseClienteMock.map(p => ({
    ...p,
    quantidadeBase: Math.ceil(p.mediaQtd * 1.3), // 30% acima da média (upsell)
    contexto: `Ação agressiva (Upsell) jogando a meta para ${Math.ceil(p.mediaQtd * 1.3)} e reintroduzindo mix parado.`
  }));

  // 3. Chamada à Inteligência Artificial (Gemini) para gerar os scripts
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    
    // Processando o cenário Equilibrado como exemplo para o Gemini justificar
    const promptEquilibrado = `
      Atuando como estrategista comercial B2B de alta performance.
      Justifique de forma curta (máximo 2 frases persuasivas para o representante ler) 
      por que devemos sugerir as seguintes quantidades para o cliente:
      ${JSON.stringify(baseEquilibrado)}

      Retorne estritamente um Array JSON válido com o seguinte formato exato, sem Markdown ou crases:
      [
        { "produtoId": "p1", "motivoIA": "texto...", "nivelConfianca": 85 }
      ]
    `;

    // Chamada real ao Gemini (se a variável de ambiente estiver setada corretamente)
    let respostaJSON = [];
    if (process.env.GEMINI_API_KEY) {
      const result = await model.generateContent(promptEquilibrado);
      const text = result.response.text();
      // Limpa possíveis backticks de markdown que a IA possa retornar
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      respostaJSON = JSON.parse(cleanText);
    } else {
      // Fallback caso não haja chave (Para não quebrar a tela do desenvolvedor)
      respostaJSON = baseEquilibrado.map(p => ({
        produtoId: p.produtoId,
        motivoIA: `(Mock) Baseado na sua média de ${p.mediaQtd}, recomendamos manter este volume para não faltar estoque na ponta.`,
        nivelConfianca: 88
      }));
    }

    // 4. Montando o retorno final
    const mapearIA = (base: any[], fallbackNivel: number) => {
      return base.map(item => {
        const ia = respostaJSON.find((i: any) => i.produtoId === item.produtoId || i.produtoId === item.id);
        return {
          produtoId: item.produtoId || item.id,
          nomeProduto: item.nomeProduto || item.nome,
          fabricante: item.fabricante || item.fab,
          quantidadeSugerida: item.quantidadeBase,
          quantidadeOriginal: item.quantidadeBase,
          motivoIA: ia ? ia.motivoIA : `Sugestão algorítmica para bater a meta de estoque.`,
          nivelConfianca: ia ? ia.nivelConfianca : fallbackNivel,
          isEmQueda: item.queda >= 0.3, // Regra analítica de queda > 30%
          isSemPedido: item.diasSemCompra > 30 // Regra analítica de sumiço
        };
      });
    };

    return {
      conservador: mapearIA(baseConservador, 95), // Conservador tem alta confiança
      equilibrado: mapearIA(baseEquilibrado, 85),
      agressivo: mapearIA(baseAgressivo, 60)      // Agressivo é mais arriscado
    };

  } catch (error) {
    console.error("Erro ao gerar pedido inteligente:", error);
    throw new Error("Falha na comunicação com o motor de Inteligência Artificial.");
  }
}

export async function salvarSugestao(
  clienteId: string, 
  itens: ItemSugerido[], 
  cenario: string,
  justificativas: JustificativaPayload[] = []
) {
  const supabase = getSupabaseClient();
  
  // 1. Inserir Cabeçalho do Pedido
  const { data: pedidoData, error: pedidoError } = await supabase
    .from('pedidos_salvos')
    .insert({ cliente_id: clienteId, cenario })
    .select()
    .single();

  if (pedidoError) {
    console.error("Erro ao salvar cabeçalho:", pedidoError);
    throw new Error("Erro ao criar o pedido: " + pedidoError.message);
  }

  const pedidoId = pedidoData.id;

  // 2. Inserir Itens do Pedido
  const payloadItens = itens.map(item => ({
    pedido_id: pedidoId,
    produto_id: item.produtoId,
    nome_produto: item.nomeProduto,
    quantidade: item.quantidadeSugerida,
    motivo_ia: item.motivoIA,
    nivel_confianca: item.nivelConfianca,
    is_em_queda: item.isEmQueda || false,
    is_sem_pedido: item.isSemPedido || false
  }));

  const { data: itensCriados, error: itensError } = await supabase
    .from('pedido_itens')
    .insert(payloadItens)
    .select();

  if (itensError) {
    console.error("Erro ao salvar itens:", itensError);
    throw new Error("Erro ao salvar itens: " + itensError.message);
  }

  // 3. Inserir Justificativas (se houver)
  if (justificativas.length > 0 && itensCriados) {
    const payloadJustificativas = justificativas.map(just => {
      const itemSalvo = itensCriados.find(i => i.produto_id === just.produtoId);
      return {
        item_id: itemSalvo?.id,
        tipo_insight: just.tipoInsight,
        texto_justificativa: just.textoJustificativa
      };
    }).filter(just => just.item_id); // Filtra os que encontraram o item

    if (payloadJustificativas.length > 0) {
      const { error: justError } = await supabase
        .from('justificativas_itens')
        .insert(payloadJustificativas);
        
      if (justError) {
        console.error("Erro ao salvar justificativas:", justError);
        throw new Error("Erro ao salvar justificativas: " + justError.message);
      }
    }
  }

  return { sucesso: true, mensagem: `Pedido salvo com sucesso! ${justificativas.length} justificativas registradas.` };
}
