"""Tool generate_packing_plan — fase 2 do MudançAI.

Gera um plano de caixas a partir do inventário usando Gemini 2.5 Flash.
"""

from __future__ import annotations

import json
import logging
from typing import Annotated, Any, Dict, List

from langchain_core.messages import ToolMessage
from langchain_core.tools import tool, InjectedToolCallId
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.types import Command
from langgraph.prebuilt import InjectedState
from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)

class Caixa(BaseModel):
    id: str
    etiqueta: str
    itens_ids: list[str]
    materiais: list[str]
    instrucoes: str
    peso_total_kg: float
    frageis: bool
    prioridade_descarga: int


@tool
def generate_packing_plan(
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
    state: Annotated[Dict[str, Any], InjectedState] = None,
) -> Command:
    """Gera um plano de empacotamento em caixas com base no inventário aprovado.

    Lê os itens de state.leads, agrupa-os inteligentemente em caixas, atualiza
    state.caixas e muda state.fase_atual para 'embalagem'.
    """
    try:
        inventario = (state or {}).get("leads", [])
        if not inventario:
            return Command(
                update={
                    "messages": [
                        ToolMessage(
                            content="Não há itens no inventário para embalar. Cadastre os itens primeiro.",
                            tool_call_id=tool_call_id,
                        )
                    ]
                }
            )

        print(f"--- GENERATE PACKING PLAN START ---")
        print(f"Total de itens no inventário: {len(inventario)}")

        inventario_str = json.dumps(inventario, ensure_ascii=False, indent=2)
        
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)
        
        prompt = f"""Dado o inventário abaixo, organize os itens em caixas seguindo 
estas regras:

REGRAS RÍGIDAS:
1. Frágeis NUNCA junto com pesados (>5kg)
2. Eletrodomésticos grandes ficam fora das caixas (caixa virtual com instrução)
3. Alimentos perecíveis em caixa separada com aviso
4. Máximo 15 itens por caixa
5. Materiais necessários por caixa (papel bolha, jornal, fita, isopor)

Inventário: {inventario_str}

Retorne APENAS JSON:
{{
  "caixas": [
    {{
      "etiqueta": "string descritiva (ex: 'Frágeis - Cozinha')",
      "itens_ids": ["item-001", "item-003"],
      "materiais": ["papel bolha", "jornal"],
      "instrucoes": "instrução específica de empacotamento",
      "peso_total_kg": float,
      "frageis": bool,
      "prioridade_descarga": int (1=primeiro a descer)
    }}
  ]
}}"""

        def attempt_parse() -> dict[str, Any]:
            response = llm.invoke(prompt)
            raw_text = response.content.strip()
            print(f"Output Raw LLM:\n{raw_text}")
            
            # Limpeza de markdown code blocks
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            elif raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
                
            return json.loads(raw_text.strip())

        data = None
        try:
            data = attempt_parse()
        except Exception as e:
            print(f"Erro no parsing inicial do plano, tentando novamente. Erro: {e}")
            data = attempt_parse()
            
        caixas: List[Dict[str, Any]] = []
        for i, raw_caixa in enumerate(data.get("caixas", [])):
            raw_caixa["id"] = f"caixa-{i+1}"
            validated = Caixa(**raw_caixa)
            caixas.append(validated.model_dump())

        summary = (
            f"Plano de embalagem gerado com sucesso: "
            f"{len(caixas)} caixas otimizadas."
        )

        return Command(
            update={
                "caixas": caixas,
                "fase_atual": "embalagem",
                "header": {
                    "title": "MudançAI - Embalagem",
                    "subtitle": f"{len(caixas)} caixas planejadas",
                },
                "messages": [
                    ToolMessage(content=summary, tool_call_id=tool_call_id)
                ],
            }
        )
    except ValidationError as exc:
        print(f"Erro de validação (Plano): {exc}")
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=f"Erro de validação ao gerar caixas: {exc}",
                        tool_call_id=tool_call_id,
                    )
                ]
            }
        )
    except Exception as exc:  # noqa: BLE001
        print(f"Erro geral (Plano): {exc}")
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=f"Erro ao planejar embalagem: {exc}",
                        tool_call_id=tool_call_id,
                    )
                ]
            }
        )
