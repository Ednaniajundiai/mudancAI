import { z } from "zod";

// ---------------------------------------------------------------------------
// Contratos de dados — IMUTÁVEIS
// Alinhados com apps/agent/src/tools/ (Python Pydantic)
// ---------------------------------------------------------------------------

export const itemSchema = z.object({
  id: z.string().describe('Formato "item-001"'),
  nome: z.string(),
  categoria: z.enum(["fragil", "utensilio", "eletro", "alimento", "outro"]),
  quantidade: z.number().int().positive(),
  comodo: z.string(),
  instrucao_embalagem: z.string(),
  peso_estimado_kg: z.number().nonnegative(),
  volume_estimado_l: z.number().nonnegative(),
});

export type Item = z.infer<typeof itemSchema>;

export const caixaSchema = z.object({
  id: z.string().describe('"caixa-1"'),
  etiqueta: z.string(),
  itens_ids: z.array(z.string()),
  materiais: z.array(z.string()),
  instrucoes: z.string(),
  peso_total_kg: z.number().nonnegative(),
  frageis: z.boolean(),
  prioridade_descarga: z.number().int().positive(),
});

export type Caixa = z.infer<typeof caixaSchema>;

export const cotacaoSchema = z.object({
  transportadora_id: z.string(),
  nome: z.string(),
  logo: z.string(),
  preco_brl: z.number().nonnegative(),
  prazo_dias: z.number().int().positive(),
  avaliacao: z.number().min(0).max(5),
  inclui_seguro: z.boolean(),
  observacoes: z.string(),
});

export type Cotacao = z.infer<typeof cotacaoSchema>;

// ---------------------------------------------------------------------------
// Input schema da tool quote_freight (chamada pelo agente Python via MCP)
// ---------------------------------------------------------------------------

export const quoteFreightInput = z.object({
  volume_total_l: z
    .number()
    .nonnegative()
    .describe("Volume total estimado da mudança em litros."),
  num_caixas: z
    .number()
    .int()
    .nonnegative()
    .describe("Número total de caixas embaladas."),
  tem_frageis: z
    .boolean()
    .describe("Indica se há itens frágeis no inventário."),
});

export type QuoteFreightInput = z.infer<typeof quoteFreightInput>;

// ---------------------------------------------------------------------------
// Input schema da tool show_quote_cards (widget visual)
// ---------------------------------------------------------------------------

export const showQuoteCardsInput = z.object({
  cotacoes: z
    .array(cotacaoSchema)
    .default([])
    .describe(
      "Lista de cotações retornadas por quote_freight. " +
        "Omitir para usar dados de demonstração.",
    ),
  volume_total_l: z.number().nonnegative().default(500),
  num_caixas: z.number().int().nonnegative().default(10),
  tem_frageis: z.boolean().default(false),
});

export type ShowQuoteCardsInput = z.infer<typeof showQuoteCardsInput>;
