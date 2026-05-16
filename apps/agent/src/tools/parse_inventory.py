"""Tool parse_inventory — fase 1 do MudançAI (implementação real com Gemini).

Processa a descrição textual de um cômodo e extrai itens estruturados.
"""

from __future__ import annotations

import json
import logging
from typing import Annotated, Any, Dict, List, Literal

from langchain_core.messages import ToolMessage
from langchain_core.tools import tool, InjectedToolCallId
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.types import Command
from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)

class Item(BaseModel):
    id: str
    nome: str
    categoria: Literal["fragil", "utensilio", "eletro", "alimento", "outro"]
    quantidade: int
    comodo: str
    instrucao_embalagem: str
    peso_estimado_kg: float
    volume_estimado_l: float


@tool
def parse_inventory(
    descricao_comodo: Annotated[str, "Descrição textual do cômodo fornecida pelo usuário"],
    nome_comodo: Annotated[str, "Nome do cômodo (ex: Cozinha, Sala, Quarto)"],
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> Command:
    """Analisa a descrição de um cômodo e retorna os itens estruturados para o inventário.

    Atualiza state.leads com os itens encontrados e muda state.fase_atual para 'inventario'.
    """
    try:
        print(f"--- PARSE INVENTORY START ---")
        print(f"Cômodo: {nome_comodo}")
        print(f"Input: {descricao_comodo}")
        
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2)
        
        prompt = f"""Analise a descrição abaixo do cômodo '{nome_comodo}' e extraia 
TODOS os itens mencionados, agrupando em categorias.

Categorias:
- fragil: vidro, cerâmica, porcelana, eletrônicos delicados
- utensilio: panelas, talheres, utensílios de cozinha em geral
- eletro: geladeira, fogão, microondas, liquidificador, etc
- alimento: comidas, bebidas, mantimentos
- outro: o que não couber acima

Descrição: "{descricao_comodo}"

Retorne APENAS JSON válido seguindo o schema:
{{
  "items": [
    {{
      "nome": "string",
      "categoria": "fragil|utensilio|eletro|alimento|outro",
      "quantidade": int,
      "instrucao_embalagem": "string curta",
      "peso_estimado_kg": float,
      "volume_estimado_l": float
    }}
  ]
}}

Seja exaustivo. Quando o usuário disser "talheres para 8 pessoas", conte como 
quantidade=32 (4 peças por pessoa). Use estimativas razoáveis de peso/volume."""

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
            print(f"Erro no parsing inicial, tentando novamente (retry). Erro: {e}")
            data = attempt_parse()
            
        items: List[Dict[str, Any]] = []
        for i, raw_item in enumerate(data.get("items", [])):
            raw_item["id"] = f"item-{i+1:03d}"
            raw_item["comodo"] = nome_comodo
            
            validated = Item(**raw_item)
            items.append(validated.model_dump())

        summary = (
            f"Inventário do cômodo '{nome_comodo}' processado: "
            f"{len(items)} itens encontrados."
        )

        return Command(
            update={
                "leads": items,
                "fase_atual": "inventario",
                "header": {
                    "title": "MudançAI",
                    "subtitle": f"{len(items)} itens · {nome_comodo}",
                },
                "messages": [
                    ToolMessage(content=summary, tool_call_id=tool_call_id)
                ],
            }
        )
    except ValidationError as exc:
        print(f"Erro de validação: {exc}")
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=f"Erro de validação no inventário: {exc}",
                        tool_call_id=tool_call_id,
                    )
                ]
            }
        )
    except Exception as exc:  # noqa: BLE001
        print(f"Erro geral: {exc}")
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=f"Erro ao processar inventário: {exc}",
                        tool_call_id=tool_call_id,
                    )
                ]
            }
        )
