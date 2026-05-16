"""Tool quote_freight — fase 3 do MudançAI.

Gera cotações de frete mockadas com base no volume e caixas.
"""

from __future__ import annotations

from typing import Annotated, Any, Dict, List

from langchain_core.messages import ToolMessage
from langchain_core.tools import tool, InjectedToolCallId
from langgraph.types import Command
from pydantic import BaseModel

class Cotacao(BaseModel):
    transportadora_id: str
    nome: str
    logo: str
    preco_brl: float
    prazo_dias: int
    avaliacao: float
    inclui_seguro: bool
    observacoes: str

@tool
def quote_freight(
    volume_total_l: Annotated[float, "Volume total da mudança em litros"],
    num_caixas: Annotated[int, "Quantidade total de caixas planejadas"],
    tem_frageis: Annotated[bool, "Verdadeiro se houver itens ou caixas com itens frágeis"],
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> Command:
    """Consulta cotações de transportadoras para uma mudança residencial.
    
    Deve ser chamada após a aprovação do plano de caixas (fase 'embalagem').
    Retorna uma lista de cotações mockadas, atualiza state.cotacoes e avança
    state.fase_atual para 'cotacao'.
    """
    print(f"--- QUOTE FREIGHT START ---")
    print(f"Volume: {volume_total_l}L | Caixas: {num_caixas} | Frágeis: {tem_frageis}")
    
    # Mock data logic (similar to fixtures.ts)
    base_price = (volume_total_l * 0.15) + (num_caixas * 5)
    if tem_frageis:
        base_price *= 1.2
        
    cotacoes = [
        Cotacao(
            transportadora_id="transp-001",
            nome="Rapidez Mudanças",
            logo="🚚",
            preco_brl=round(base_price * 1.1, 2),
            prazo_dias=2,
            avaliacao=4.5,
            inclui_seguro=False,
            observacoes="Rápido, mas sem seguro para itens frágeis." if tem_frageis else "Entrega expressa."
        ).model_dump(),
        Cotacao(
            transportadora_id="transp-002",
            nome="Segurança Total Logística",
            logo="🛡️",
            preco_brl=round(base_price * 1.4, 2),
            prazo_dias=5,
            avaliacao=4.9,
            inclui_seguro=True,
            observacoes="Especialista em frágeis, seguro total incluso."
        ).model_dump(),
        Cotacao(
            transportadora_id="transp-003",
            nome="Econômica Fretes",
            logo="💰",
            preco_brl=round(base_price * 0.8, 2),
            prazo_dias=7,
            avaliacao=4.1,
            inclui_seguro=False,
            observacoes="Melhor custo-benefício, prazo estendido."
        ).model_dump()
    ]
    
    # Sort by price
    cotacoes.sort(key=lambda x: x["preco_brl"])
    
    summary = (
        f"Busca de cotações finalizada: {len(cotacoes)} transportadoras encontradas. "
        f"Melhor preço: R$ {cotacoes[0]['preco_brl']:.2f} ({cotacoes[0]['nome']})."
    )

    return Command(
        update={
            "cotacoes": cotacoes,
            "fase_atual": "cotacao",
            "header": {
                "title": "MudançAI - Cotação",
                "subtitle": f"{len(cotacoes)} propostas recebidas",
            },
            "messages": [
                ToolMessage(content=summary, tool_call_id=tool_call_id)
            ],
        }
    )
