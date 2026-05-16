"""MudancAIStateMiddleware — declares the canvas fields on the
agent's TypedDict state schema so they survive STATE_SNAPSHOT round-trips,
and hydrates a fresh thread's canvas from the canonical store on the
first turn.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Annotated, Any, Literal, Optional

from langchain.agents.middleware.types import AgentMiddleware, AgentState
from typing_extensions import NotRequired, TypedDict


class _Header(TypedDict, total=False):
    title: str
    subtitle: str


class _SyncMeta(TypedDict, total=False):
    databaseId: str
    databaseTitle: str
    syncedAt: Optional[str]


class _ItemFilter(TypedDict, total=False):
    categorias: list[str]
    comodos: list[str]
    search: str


class _Item(TypedDict, total=False):
    id: str
    nome: str
    categoria: str
    quantidade: int
    comodo: str
    instrucao_embalagem: str
    peso_estimado_kg: float
    volume_estimado_l: float


class _Caixa(TypedDict, total=False):
    id: str
    etiqueta: str
    itens_ids: list[str]
    materiais: list[str]
    instrucoes: str
    peso_total_kg: float
    frageis: bool
    prioridade_descarga: int


class _Cotacao(TypedDict, total=False):
    transportadora_id: str
    nome: str
    logo: str
    preco_brl: float
    prazo_dias: int
    avaliacao: float
    inclui_seguro: bool
    observacoes: str


class _Segment(TypedDict, total=False):
    id: str
    name: str
    description: str
    color: str
    leadIds: list[str]


def _replace(_left: Any, right: Any) -> Any:
    return right


class LeadCanvasState(AgentState):
    leads: NotRequired[Annotated[list[_Item], _replace]]
    caixas: NotRequired[Annotated[list[_Caixa], _replace]]
    cotacoes: NotRequired[Annotated[list[_Cotacao], _replace]]
    filter: NotRequired[Annotated[_ItemFilter, _replace]]
    view: NotRequired[Annotated[str, _replace]]
    segments: NotRequired[Annotated[list[_Segment], _replace]]
    highlightedLeadIds: NotRequired[Annotated[list[str], _replace]]
    selectedLeadId: NotRequired[Annotated[Optional[str], _replace]]
    header: NotRequired[Annotated[_Header, _replace]]
    sync: NotRequired[Annotated[_SyncMeta, _replace]]
    fase_atual: NotRequired[Annotated[Literal["inicio", "inventario", "embalagem", "cotacao", "finalizado"], _replace]]


class MudancAIStateMiddleware(AgentMiddleware[LeadCanvasState, Any]):  # type: ignore[type-arg]
    state_schema = LeadCanvasState

    def before_agent(self, state: Any, runtime: Any) -> dict[str, Any] | None:
        existing_leads = (state or {}).get("leads") if isinstance(state, dict) else None
        if existing_leads:
            return None

        try:
            from .lead_store import get_store

            store = get_store()
            rows = store.list_leads()
        except Exception:
            return None

        if not rows:
            return None

        source_label = "local starter data" if store.is_local() else "Notion"
        db_id = (
            os.getenv("NOTION_LEADS_DATABASE_ID", "")
            or ("local" if store.is_local() else "")
        )

        return {
            "leads": rows,
            "header": {
                "title": "MudançAI",
                "subtitle": (
                    f"{len(rows)} itens de {source_label} · "
                    f"itens registrados"
                ),
            },
            "sync": {
                "databaseId": db_id,
                "databaseTitle": store.database_title(),
                "syncedAt": datetime.now(timezone.utc).isoformat(),
            },
        }
