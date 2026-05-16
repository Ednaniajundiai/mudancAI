import { MCPServer, text, widget } from "mcp-use/server";
import { z } from "zod";
import { quoteFreightInput, showQuoteCardsInput } from "./src/lib/mudancai/types";
import { gerarCotacoes, SAMPLE_COTACOES } from "./src/lib/mudancai/fixtures";

// ---------------------------------------------------------------------------
// MudançAI MCP Server
// Responsabilidade da Pessoa C (Platform Engineer + Demo Owner)
//
// Tools expostas:
//   1. quote_freight     — chamada pelo agente Python (apps/agent/)
//                          retorna JSON com lista de cotações (Cotacao[])
//   2. show_quote_cards  — widget visual para o chat (ChatGPT / Claude / mcp-use inspector)
//                          renderiza cards comparativos de transportadoras
// ---------------------------------------------------------------------------

const server = new MCPServer({
  name: "mudancai-mcp",
  title: "MudançAI — Cotações de Mudança",
  version: "1.0.0",
  description:
    "MCP server do MudançAI: cotações de transportadoras residenciais em tempo real. " +
    "Recebe volume total, número de caixas e flag de frágeis; retorna lista ordenada " +
    "por preço com prazo, avaliação, seguro e observações.",
  baseUrl: process.env.MCP_URL || "http://localhost:3011",
  favicon: "favicon.ico",
  websiteUrl: "https://mcp-use.com",
  icons: [
    {
      src: "icon.svg",
      mimeType: "image/svg+xml",
      sizes: ["512x512"],
    },
  ],
});

// ---------------------------------------------------------------------------
// Tool 1: quote_freight
// Chamada pelo agente Python via MCP tool call.
// Retorna JSON puro (sem widget) — o agente persiste no estado CopilotKit.
// ---------------------------------------------------------------------------

server.tool(
  {
    name: "quote_freight",
    description:
      "Retorna cotações de transportadoras para uma mudança residencial. " +
      "Recebe o volume total em litros, o número de caixas e se há itens frágeis. " +
      "Retorna uma lista de cotações ordenadas por preço (menor primeiro), cada uma " +
      "com transportadora_id, nome, logo, preco_brl, prazo_dias, avaliacao, " +
      "inclui_seguro e observacoes. Chamar após generate_packing_plan.",
    schema: quoteFreightInput,
  },
  async ({ volume_total_l, num_caixas, tem_frageis }) => {
    const cotacoes = gerarCotacoes(volume_total_l, num_caixas, tem_frageis);

    const resumo =
      cotacoes.length > 0
        ? `${cotacoes.length} cotações geradas. ` +
          `Menor preço: R$ ${cotacoes[0].preco_brl.toFixed(2)} (${cotacoes[0].nome}). ` +
          `Entrega mais rápida: ${Math.min(...cotacoes.map((c) => c.prazo_dias))} dia(s).`
        : "Nenhuma cotação disponível.";

    return text(JSON.stringify({ cotacoes, resumo }, null, 2));
  },
);

// ---------------------------------------------------------------------------
// Tool 2: show_quote_cards
// Widget visual para exibir cotações de forma comparativa no chat.
// Pode ser chamada diretamente pelo usuário ou pelo agente após quote_freight.
// ---------------------------------------------------------------------------

server.tool(
  {
    name: "show_quote_cards",
    description:
      "Renderiza um widget visual comparativo de cotações de transportadoras para mudança residencial. " +
      "Aceita a lista de cotações retornada por quote_freight. " +
      "Se omitido ou vazio, usa cotações de demonstração (apartamento 2 quartos típico). " +
      "Exibe preço, prazo, avaliação, inclusão de seguro e observações de cada transportadora.",
    schema: showQuoteCardsInput,
    widget: {
      name: "quote-cards",
      invoking: "Buscando cotações…",
      invoked: "Cotações prontas",
    },
  },
  async (input) => {
    const cotacoes =
      input.cotacoes && input.cotacoes.length > 0 ? input.cotacoes : SAMPLE_COTACOES;

    const melhor = cotacoes[0];
    const resumo =
      melhor != null
        ? `${cotacoes.length} transportadoras comparadas. ` +
          `Melhor opção: ${melhor.nome} por R$ ${melhor.preco_brl.toFixed(2)} ` +
          `em ${melhor.prazo_dias} dia(s).`
        : "Nenhuma cotação disponível para exibir.";

    return widget({
      props: {
        cotacoes,
        volume_total_l: input.volume_total_l,
        num_caixas: input.num_caixas,
        tem_frageis: input.tem_frageis,
      },
      output: text(resumo),
    });
  },
);

// ---------------------------------------------------------------------------
// Tool 3: show_moving_summary
// Widget de resumo da mudança: inventário + caixas + melhor cotação.
// Usado na fase final da demo (roteiro 02:00+).
// ---------------------------------------------------------------------------

const movingSummaryInput = z.object({
  num_itens: z.number().int().nonnegative().default(0),
  num_comodos: z.number().int().nonnegative().default(0),
  num_caixas: z.number().int().nonnegative().default(0),
  volume_total_l: z.number().nonnegative().default(0),
  tem_frageis: z.boolean().default(false),
  cotacao_escolhida: z
    .object({
      nome: z.string(),
      logo: z.string(),
      preco_brl: z.number(),
      prazo_dias: z.number().int(),
      inclui_seguro: z.boolean(),
    })
    .optional()
    .describe("Cotação selecionada pelo usuário. Omitir se ainda não escolheu."),
});

server.tool(
  {
    name: "show_moving_summary",
    description:
      "Renderiza um painel resumo da mudança residencial: total de itens, cômodos, " +
      "caixas, volume e a cotação escolhida. Chamar ao final do fluxo, após o usuário " +
      "selecionar a transportadora. Use os dados do estado do agente.",
    schema: movingSummaryInput,
    widget: {
      name: "moving-summary",
      invoking: "Preparando resumo…",
      invoked: "Resumo pronto",
    },
  },
  async (input) => {
    const { num_itens, num_comodos, num_caixas, volume_total_l, tem_frageis, cotacao_escolhida } =
      input;

    const linhas = [
      `📦 Resumo da mudança`,
      `• Itens catalogados: ${num_itens}`,
      `• Cômodos: ${num_comodos}`,
      `• Caixas embaladas: ${num_caixas}`,
      `• Volume total: ${volume_total_l.toLocaleString("pt-BR")} L`,
      tem_frageis ? "• ⚠ Possui itens frágeis" : "",
      cotacao_escolhida
        ? `• Transportadora: ${cotacao_escolhida.logo} ${cotacao_escolhida.nome} — R$ ${cotacao_escolhida.preco_brl.toFixed(2)} em ${cotacao_escolhida.prazo_dias} dia(s)`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    return widget({
      props: input,
      output: text(linhas),
    });
  },
);

// ---------------------------------------------------------------------------

server.listen().then(() => {
  console.log("🚚 MudançAI MCP server rodando na porta 3011");
  console.log("   Tools: quote_freight | show_quote_cards | show_moving_summary");
});
