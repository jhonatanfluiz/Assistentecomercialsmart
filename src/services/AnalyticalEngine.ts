import { createClient } from '@supabase/supabase-js';

// Definição dos parâmetros configuráveis do motor
export interface AnalyticalConfig {
  limiarDesaparecendo: number; // Ex: 0.70 (70% de queda)
  limiarEmQueda: number;       // Ex: 0.30 (30% de queda)
  diasSemCompra: number;       // Ex: 30 dias
  historicoBase: number;       // Ex: 6 últimos pedidos para fazer a média
}

export const defaultConfig: AnalyticalConfig = {
  limiarDesaparecendo: 0.70,
  limiarEmQueda: 0.30,
  diasSemCompra: 30,
  historicoBase: 6
};

// Tipagem dos dados brutos esperados (simulando retorno do BD)
export interface HistoricoVendaRaw {
  cliente_id: string;
  produto_id: string;
  fabricante_id: string;
  data_pedido: string | Date;
  quantidade: number;
  valor_total: number;
  preco_unitario: number;
}

export class AnalyticalEngine {
  private config: AnalyticalConfig;
  private supabase: any;

  constructor(config: Partial<AnalyticalConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    
    // Setup Supabase (server-side context)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Função principal que processa um array bruto de histórico de vendas
   * e classifica cada produto por cliente nos critérios de risco.
   */
  public processarOportunidades(historico: HistoricoVendaRaw[]) {
    const agrupamento: Record<string, HistoricoVendaRaw[]> = {};

    // 1. Agrupar por Cliente + Produto
    for (const row of historico) {
      const key = `${row.cliente_id}_${row.produto_id}`;
      if (!agrupamento[key]) agrupamento[key] = [];
      agrupamento[key].push(row);
    }

    const produtosDesaparecendo = [];
    const produtosEmQueda = [];
    const produtosSemPedido = [];
    let dinheiroEscondidoTotal = 0;
    
    // Armazena vendas totais por fabricante para calcular market share
    const vendasPorFabricante: Record<string, number> = {};
    let faturamentoTotal = 0;

    const dataAtual = new Date();

    // 2. Analisar cada combinação Cliente-Produto
    for (const [key, pedidos] of Object.entries(agrupamento)) {
      // Ordena do mais recente para o mais antigo
      pedidos.sort((a, b) => new Date(b.data_pedido).getTime() - new Date(a.data_pedido).getTime());

      const ultimoPedido = pedidos[0];
      const clienteId = ultimoPedido.cliente_id;
      const produtoId = ultimoPedido.produto_id;
      const fabricanteId = ultimoPedido.fabricante_id;

      // Soma financeira para market share
      const valorPedido = ultimoPedido.valor_total || (ultimoPedido.quantidade * ultimoPedido.preco_unitario);
      vendasPorFabricante[fabricanteId] = (vendasPorFabricante[fabricanteId] || 0) + valorPedido;
      faturamentoTotal += valorPedido;

      // Cálculo de Dias Sem Compra
      const diffTempo = dataAtual.getTime() - new Date(ultimoPedido.data_pedido).getTime();
      const diffDias = diffTempo / (1000 * 3600 * 24);

      if (diffDias > this.config.diasSemCompra) {
        produtosSemPedido.push({ clienteId, produtoId, dias: Math.round(diffDias) });
      }

      // Se tivermos histórico suficiente, calcular a média
      if (pedidos.length > 1) {
        // Pega os últimos N pedidos (pulando o pedido atual que é o índice 0)
        const baseHistorica = pedidos.slice(1, this.config.historicoBase + 1);
        
        const mediaQtd = baseHistorica.reduce((acc, p) => acc + p.quantidade, 0) / baseHistorica.length;
        const qtdAtual = ultimoPedido.quantidade;

        // Se a média histórica for maior que 0, calculamos a queda
        if (mediaQtd > 0) {
          const percentualQueda = (mediaQtd - qtdAtual) / mediaQtd;

          let classificadoRisco = false;

          // Regra 1: Desaparecendo (> 70% de queda)
          if (percentualQueda >= this.config.limiarDesaparecendo) {
            produtosDesaparecendo.push({ clienteId, produtoId, queda: percentualQueda });
            classificadoRisco = true;
          } 
          // Regra 2: Em Queda (> 30% e < 70%)
          else if (percentualQueda >= this.config.limiarEmQueda) {
            produtosEmQueda.push({ clienteId, produtoId, queda: percentualQueda });
            classificadoRisco = true;
          }

          // Regra 4: Dinheiro Escondido
          // Se o produto sofreu queda (mesmo sem pedido), calcula a diferença de faturamento projetado
          if (classificadoRisco || diffDias > this.config.diasSemCompra) {
            const preco = ultimoPedido.preco_unitario || (ultimoPedido.valor_total / ultimoPedido.quantidade);
            const gapQtd = mediaQtd - qtdAtual; 
            if (gapQtd > 0) {
              const valorOculto = gapQtd * preco;
              dinheiroEscondidoTotal += valorOculto;
            }
          }
        }
      }
    }

    // Regra 5: Participação por Fabricante (Market Share)
    const participacaoFabricante = Object.entries(vendasPorFabricante).map(([id, valor]) => ({
      fabricante_id: id,
      valor_total: valor,
      participacao_percentual: faturamentoTotal > 0 ? (valor / faturamentoTotal) * 100 : 0
    }));

    return {
      metricas: {
        totalDesaparecendo: produtosDesaparecendo.length,
        totalEmQueda: produtosEmQueda.length,
        totalSemPedido: produtosSemPedido.length,
        dinheiroEscondido: dinheiroEscondidoTotal
      },
      listas: {
        desaparecendo: produtosDesaparecendo,
        emQueda: produtosEmQueda,
        semPedido: produtosSemPedido
      },
      participacaoFabricante
    };
  }

  /**
   * Método que pode ser chamado diretamente de uma Server Action 
   * para buscar no banco e processar automaticamente.
   */
  public async executarAnaliseGeralBanco(tenantId: string) {
    if (!this.supabase) throw new Error("Supabase client não configurado.");

    // Busca os dados reais utilizando as tabelas que criamos
    const { data: rawData, error } = await this.supabase
      .from('itens_pedido')
      .select(`
        quantidade,
        preco_unitario,
        produtos ( id, fabricante_id ),
        pedidos_importados ( cliente_id, data_pedido, tenant_id )
      `)
      .eq('pedidos_importados.tenant_id', tenantId)
      // Otimização: buscar apenas últimos 12 meses
      .gte('pedidos_importados.data_pedido', new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString());

    if (error || !rawData) {
      console.error("Erro ao buscar histórico:", error);
      return null;
    }

    // Formata o retorno complexo relacional do Supabase para o formato esperado pelo Motor
    const formatado: HistoricoVendaRaw[] = rawData
      .filter((d: any) => d.pedidos_importados && d.produtos)
      .map((d: any) => ({
        cliente_id: d.pedidos_importados.cliente_id,
        produto_id: d.produtos.id,
        fabricante_id: d.produtos.fabricante_id,
        data_pedido: d.pedidos_importados.data_pedido,
        quantidade: d.quantidade,
        preco_unitario: d.preco_unitario,
        valor_total: d.quantidade * d.preco_unitario
      }));

    return this.processarOportunidades(formatado);
  }
}
