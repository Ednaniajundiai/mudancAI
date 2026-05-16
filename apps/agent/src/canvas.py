"""Canvas state schema + frontend tool reference (documentation only).

In CopilotKit v2, the **React side is the single source of truth** for
frontend tools: each `useFrontendTool({ name, parameters, handler })` call
in `apps/frontend/src/app/leads/page.tsx` declares the tool's schema to
the runtime AND provides the handler. The runtime forwards those
declarations into the agent's tool list at run time, so the LLM sees them
automatically.

The Python functions below are NOT registered with the agent — passing them
to `create_deep_agent(tools=[...])` would cause Gemini to reject the request
with "Duplicate function declaration found: <name>". They live here as a
quick contract reference for anyone reading the agent code. The actual
schema is in `apps/frontend/src/app/leads/page.tsx`.
"""

from typing import Annotated, Any, Dict, List, Literal, Optional, TypedDict
from typing_extensions import NotRequired


class Item(TypedDict, total=False):
    id: str
    nome: str
    categoria: str
    quantidade: int
    comodo: str
    instrucao_embalagem: str
    peso_estimado_kg: float
    volume_estimado_l: float


class ItemFilter(TypedDict):
    categorias: List[str]
    comodos: List[str]
    search: str


class SyncMeta(TypedDict):
    databaseId: str
    databaseTitle: str
    syncedAt: Optional[str]


class CanvasState(TypedDict):
    leads: List[Item]
    filter: ItemFilter
    highlightedLeadIds: List[str]
    selectedLeadId: Optional[str]
    header: NotRequired[Dict[str, str]]
    sync: NotRequired[SyncMeta]


# --- Frontend tool contract (documentation only — NOT registered) ---------

def setHeader(
    title: Annotated[Optional[str], "New workspace heading title."] = None,
    subtitle: Annotated[Optional[str], "New workspace heading subtitle."] = None,
) -> str:
    """Set the workspace heading."""
    return f"setHeader({title}, {subtitle})"


def setLeads(
    leads: Annotated[List[Item], "Full item list — replaces canvas state."],
) -> str:
    """REPLACE the entire canvas item list."""
    return f"setLeads({len(leads)} items)"


def setSyncMeta(
    databaseId: Annotated[Optional[str], "Notion DB id (or 'local')."] = None,
    databaseTitle: Annotated[Optional[str], "Notion DB title."] = None,
    syncedAt: Annotated[Optional[str], "ISO timestamp of last sync."] = None,
) -> str:
    """Record which store the canvas mirrors."""
    return f"setSyncMeta({databaseId}, {databaseTitle}, {syncedAt})"


def setFilter(
    patch: Annotated[Dict[str, Any], "Partial ItemFilter patch."],
) -> str:
    """Partial-merge into the canvas filter."""
    return f"setFilter({patch})"


def clearFilters() -> str:
    """Reset all filters to their empty defaults."""
    return "clearFilters()"


def highlightLeads(
    leadIds: Annotated[List[str], "Item ids to visually highlight."],
) -> str:
    """Highlight a set of cards (visual emphasis only — not a filter)."""
    return f"highlightLeads({leadIds})"


def selectLead(
    leadId: Annotated[Optional[str], "Item id to open, or None to close."],
) -> str:
    """Open / close the item detail panel."""
    return f"selectLead({leadId})"


frontend_tool_stubs: list = []
