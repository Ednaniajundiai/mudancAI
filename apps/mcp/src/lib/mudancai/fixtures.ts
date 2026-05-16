import type { Cotacao } from "./types";

// ---------------------------------------------------------------------------
// Dados de demonstração — 5 transportadoras fictícias
// Espelha data/fixtures/transportadoras.json (fonte de verdade para o demo)
// ---------------------------------------------------------------------------

interface TransportadoraConfig {
  transportadora_id: string;
  nome: string;
  logo: string;
  avaliacao: number;
  inclui_seguro: boolean;
  observacoes: string;
  precos_base: {
    por_litro: number;
    por_caixa: number;
    taxa_frageis: number;
    minimo: number;
  };
  prazo_base_dias: number;
}

export const TRANSPORTADORAS: TransportadoraConfig[] = [
  {
    transportadora_id: "trans-001",
    nome: "MudaFácil Express",
    logo: "🚛",
    avaliacao: 4.8,
    inclui_seguro: true,
    observacoes:
      "Especialista em mudanças residenciais. Equipe treinada para itens frágeis.",
    precos_base: {
      por_litro: 0.12,
      por_caixa: 8.5,
      taxa_frageis: 25.0,
      minimo: 350.0,
    },
    prazo_base_dias: 2,
  },
  {
    transportadora_id: "trans-002",
    nome: "TransLar Logística",
    logo: "🏠",
    avaliacao: 4.5,
    inclui_seguro: false,
    observacoes:
      "Seguro opcional disponível por +R$80. Melhor custo-benefício para volumes médios.",
    precos_base: {
      por_litro: 0.09,
      por_caixa: 6.0,
      taxa_frageis: 40.0,
      minimo: 250.0,
    },
    prazo_base_dias: 3,
  },
  {
    transportadora_id: "trans-003",
    nome: "CargoHome Premium",
    logo: "⭐",
    avaliacao: 4.9,
    inclui_seguro: true,
    observacoes:
      "Serviço premium com embalagem incluída. Garantia de entrega no prazo ou reembolso.",
    precos_base: {
      por_litro: 0.18,
      por_caixa: 12.0,
      taxa_frageis: 0.0,
      minimo: 600.0,
    },
    prazo_base_dias: 1,
  },
  {
    transportadora_id: "trans-004",
    nome: "EcoMove",
    logo: "🌱",
    avaliacao: 4.3,
    inclui_seguro: false,
    observacoes:
      "Frota elétrica. Ideal para distâncias curtas. Sem taxa adicional para frágeis com embalagem adequada.",
    precos_base: {
      por_litro: 0.1,
      por_caixa: 7.0,
      taxa_frageis: 15.0,
      minimo: 200.0,
    },
    prazo_base_dias: 2,
  },
  {
    transportadora_id: "trans-005",
    nome: "MudaBem Cooperativa",
    logo: "🤝",
    avaliacao: 4.6,
    inclui_seguro: true,
    observacoes: "Cooperativa local de São Paulo. Preços justos, atendimento humanizado.",
    precos_base: {
      por_litro: 0.11,
      por_caixa: 7.5,
      taxa_frageis: 20.0,
      minimo: 300.0,
    },
    prazo_base_dias: 2,
  },
];

// ---------------------------------------------------------------------------
// Lógica de cotação
// ---------------------------------------------------------------------------

/**
 * Calcula o preço de uma transportadora dado o volume, número de caixas e
 * presença de frágeis. Aplica o mínimo configurado.
 */
export function calcularPreco(
  trans: TransportadoraConfig,
  volume_total_l: number,
  num_caixas: number,
  tem_frageis: boolean,
): number {
  const base =
    trans.precos_base.por_litro * volume_total_l +
    trans.precos_base.por_caixa * num_caixas;
  const taxaFrageis = tem_frageis ? trans.precos_base.taxa_frageis : 0;
  const total = base + taxaFrageis;
  return Math.max(total, trans.precos_base.minimo);
}

/**
 * Gera cotações de todas as transportadoras, ordenadas por preço crescente.
 */
export function gerarCotacoes(
  volume_total_l: number,
  num_caixas: number,
  tem_frageis: boolean,
): Cotacao[] {
  return TRANSPORTADORAS.map((t) => ({
    transportadora_id: t.transportadora_id,
    nome: t.nome,
    logo: t.logo,
    preco_brl: Math.round(calcularPreco(t, volume_total_l, num_caixas, tem_frageis) * 100) / 100,
    prazo_dias: t.prazo_base_dias,
    avaliacao: t.avaliacao,
    inclui_seguro: t.inclui_seguro,
    observacoes: t.observacoes,
  })).sort((a, b) => a.preco_brl - b.preco_brl);
}

// ---------------------------------------------------------------------------
// Demo fallback — cotações para um apartamento 2 quartos típico
// ---------------------------------------------------------------------------

export const SAMPLE_COTACOES: Cotacao[] = gerarCotacoes(2227, 3, true);
