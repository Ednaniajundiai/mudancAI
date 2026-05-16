import React from "react";
import type { Cotacao } from "../lib/mudancai/types";

interface QuoteCardsProps {
  cotacoes: Cotacao[];
  volume_total_l: number;
  num_caixas: number;
  tem_frageis: boolean;
}

/** Widget MCP: lista de cotações de transportadoras para mudança residencial */
export function QuoteCards({
  cotacoes,
  volume_total_l,
  num_caixas,
  tem_frageis,
}: QuoteCardsProps) {
  const melhor = cotacoes[0];

  return (
    <div className="w-full p-4 text-neutral-900 dark:text-neutral-50">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-semibold">🚚 Cotações de Transportadoras</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {cotacoes.length} opções disponíveis ·{" "}
            <span className="font-medium text-neutral-700 dark:text-neutral-200">
              {volume_total_l.toLocaleString("pt-BR")} L
            </span>{" "}
            · {num_caixas} caixas
            {tem_frageis && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-500/30 dark:text-amber-300">
                ⚠ Frágeis
              </span>
            )}
          </p>
        </div>

        {/* KPI tiles */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          <Tile
            label="Menor preço"
            value={
              melhor
                ? `R$ ${melhor.preco_brl.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                : "—"
            }
            accent="emerald"
          />
          <Tile
            label="Mais rápida"
            value={
              cotacoes.length
                ? `${Math.min(...cotacoes.map((c) => c.prazo_dias))} dia(s)`
                : "—"
            }
            accent="sky"
          />
          <Tile
            label="Melhor avaliação"
            value={
              cotacoes.length
                ? `${Math.max(...cotacoes.map((c) => c.avaliacao)).toFixed(1)} ★`
                : "—"
            }
            accent="violet"
          />
        </div>

        {/* Cards de cotações */}
        <div className="space-y-3">
          {cotacoes.map((cotacao, idx) => (
            <QuoteCard key={cotacao.transportadora_id} cotacao={cotacao} isMelhor={idx === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}

function QuoteCard({ cotacao, isMelhor }: { cotacao: Cotacao; isMelhor: boolean }) {
  return (
    <div
      className={`relative rounded-xl border p-4 transition-all ${
        isMelhor
          ? "border-emerald-500/50 bg-emerald-500/5 dark:border-emerald-400/30 dark:bg-emerald-400/5"
          : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      }`}
    >
      {isMelhor && (
        <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Melhor opção
        </span>
      )}

      <div className="flex items-start gap-3">
        {/* Logo / emoji */}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-2xl dark:bg-neutral-800">
          {cotacao.logo}
        </div>

        <div className="min-w-0 flex-1">
          {/* Nome + seguro */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{cotacao.nome}</span>
            {cotacao.inclui_seguro && (
              <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium text-sky-700 ring-1 ring-inset ring-sky-500/30 dark:text-sky-300">
                🛡 Seguro incluso
              </span>
            )}
          </div>

          {/* Avaliação */}
          <div className="mt-0.5 flex items-center gap-1">
            <Stars rating={cotacao.avaliacao} />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {cotacao.avaliacao.toFixed(1)}
            </span>
          </div>

          {/* Observações */}
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
            {cotacao.observacoes}
          </p>
        </div>

        {/* Preço + prazo */}
        <div className="flex-shrink-0 text-right">
          <div className="text-lg font-bold tabular-nums">
            R${" "}
            {cotacao.preco_brl.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            {cotacao.prazo_dias === 1
              ? "Entrega em 1 dia"
              : `Entrega em ${cotacao.prazo_dias} dias`}
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "emerald" | "sky" | "violet";
}) {
  const accentClass = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    sky: "text-sky-600 dark:text-sky-400",
    violet: "text-violet-600 dark:text-violet-400",
  }[accent];

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </div>
      <div className={`mt-1 truncate text-base font-bold tabular-nums ${accentClass}`}>
        {value}
      </div>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`h-3 w-3 ${s <= Math.round(rating) ? "text-amber-400" : "text-neutral-300 dark:text-neutral-600"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}
