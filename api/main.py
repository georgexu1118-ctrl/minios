"""
minios AI - FastAPI backend
Connects the web UI to the Hermes agent / OpenAI / minios kernel bridge.
"""
import asyncio
import json
import os
import time
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="minios AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Supabase client (optional — graceful degradation if not configured)
# ---------------------------------------------------------------------------
_supabase = None

def get_supabase():
    global _supabase
    if _supabase is not None:
        return _supabase
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    if url and key:
        try:
            from supabase import create_client
            _supabase = create_client(url, key)
        except Exception:
            pass
    return _supabase


# ---------------------------------------------------------------------------
# Tool definitions (same as bridge — kernel tools + web search + stock)
# ---------------------------------------------------------------------------
def get_stock(symbol: str) -> dict:
    symbol = (symbol or "").strip().upper()
    if not symbol:
        return {"error": "no symbol given"}
    try:
        import yfinance as yf
        t = yf.Ticker(symbol)
        fi = t.fast_info
        def g(n):
            try: return getattr(fi, n)
            except Exception:
                try: return fi[n]
                except Exception: return None
        data = {
            "symbol": symbol,
            "currency": g("currency"),
            "last_price": g("last_price"),
            "previous_close": g("previous_close"),
            "open": g("open"),
            "day_high": g("day_high"),
            "day_low": g("day_low"),
            "year_high": g("year_high"),
            "year_low": g("year_low"),
            "market_cap": g("market_cap"),
        }
        last, prev = data["last_price"], data["previous_close"]
        if isinstance(last, (int, float)) and isinstance(prev, (int, float)) and prev:
            data["change"] = round(last - prev, 4)
            data["change_pct"] = round((last - prev) / prev * 100.0, 2)
        try:
            info = t.info or {}
            for k in ("shortName", "longName", "trailingPE", "forwardPE",
                      "dividendYield", "sector", "industry"):
                if info.get(k) is not None:
                    data[k] = info[k]
        except Exception:
            pass
        return data
    except Exception as e:
        return {"error": str(e)}


def web_search(query: str, max_results: int = 5) -> dict:
    query = (query or "").strip()
    if not query:
        return {"error": "empty query"}
    try:
        try:
            from ddgs import DDGS
        except ImportError:
            from duckduckgo_search import DDGS
        hits = DDGS().text(query, max_results=max_results) or []
        results = [{"title": h.get("title"), "url": h.get("href"),
                    "snippet": (h.get("body") or "")[:400]} for h in hits[:max_results]]
        return {"query": query, "results": results} if results else {"error": f"no results for '{query}'"}
    except Exception as e:
        return {"error": str(e)}


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_stock",
            "description": "Get live quote and stats for a US-listed stock ticker (AAPL, MSFT, TSLA …).",
            "parameters": {
                "type": "object",
                "properties": {"symbol": {"type": "string"}},
                "required": ["symbol"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search DuckDuckGo for current events, recent facts, or anything post-training-cutoff.",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"],
            },
        },
    },
]

SYSTEM_PROMPT = (
    "You are minios AI — an advanced AI assistant running on a custom hobby OS kernel. "
    "You have a bold, precise personality inspired by interstellar exploration. "
    "Use get_stock for US stock questions (live Yahoo Finance data). "
    "Use web_search for current events, recent news, or anything beyond your training cutoff. "
    "Answer general knowledge from your own training without searching. "
    "Be concise, accurate, and confident. Prefer bullet points for multi-part answers."
)


# ---------------------------------------------------------------------------
# Chat endpoint — streaming SSE
# ---------------------------------------------------------------------------
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[Message]
    session_id: str | None = None
    model: str = "gpt-4o-mini"


async def stream_chat(req: ChatRequest, api_key: str) -> AsyncGenerator[str, None]:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=api_key)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages += [{"role": m.role, "content": m.content} for m in req.messages]

    tool_rounds = 0
    final_text = ""

    while tool_rounds < 4:
        tool_rounds += 1
        stream = await client.chat.completions.create(
            model=req.model,
            messages=messages,
            tools=TOOLS,
            temperature=0.4,
            max_tokens=600,
            stream=True,
        )

        collected_tool_calls: dict[int, dict] = {}
        collected_content = ""
        finish_reason = None

        async for chunk in stream:
            delta = chunk.choices[0].delta if chunk.choices else None
            if delta is None:
                continue
            finish_reason = chunk.choices[0].finish_reason or finish_reason

            if delta.content:
                collected_content += delta.content
                yield f"data: {json.dumps({'type': 'text', 'text': delta.content})}\n\n"

            if delta.tool_calls:
                for tc in delta.tool_calls:
                    idx = tc.index
                    if idx not in collected_tool_calls:
                        collected_tool_calls[idx] = {"id": "", "name": "", "arguments": ""}
                    if tc.id:
                        collected_tool_calls[idx]["id"] = tc.id
                    if tc.function.name:
                        collected_tool_calls[idx]["name"] += tc.function.name
                    if tc.function.arguments:
                        collected_tool_calls[idx]["arguments"] += tc.function.arguments

        if collected_content:
            final_text = collected_content

        if not collected_tool_calls or finish_reason == "stop":
            break

        # Execute tools
        assistant_msg: dict = {"role": "assistant", "content": collected_content or None, "tool_calls": []}
        tool_results = []

        for tc_data in collected_tool_calls.values():
            name = tc_data["name"]
            try:
                args = json.loads(tc_data["arguments"] or "{}")
            except json.JSONDecodeError:
                args = {}

            yield f"data: {json.dumps({'type': 'tool_call', 'tool': name, 'args': args})}\n\n"

            if name == "get_stock":
                result = await asyncio.to_thread(get_stock, args.get("symbol", ""))
            elif name == "web_search":
                result = await asyncio.to_thread(web_search, args.get("query", ""))
            else:
                result = {"error": f"unknown tool {name}"}

            yield f"data: {json.dumps({'type': 'tool_result', 'tool': name, 'result': result})}\n\n"

            assistant_msg["tool_calls"].append({
                "id": tc_data["id"],
                "type": "function",
                "function": {"name": name, "arguments": tc_data["arguments"]},
            })
            tool_results.append({
                "role": "tool",
                "tool_call_id": tc_data["id"],
                "content": json.dumps(result, default=str),
            })

        messages.append(assistant_msg)
        messages.extend(tool_results)

    yield f"data: {json.dumps({'type': 'done', 'text': final_text})}\n\n"


@app.post("/api/chat")
async def chat(req: ChatRequest):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")

    # Persist to Supabase if available
    db = get_supabase()
    if db and req.session_id:
        try:
            db.table("messages").insert([
                {"session_id": req.session_id, "role": m.role, "content": m.content}
                for m in req.messages[-1:]  # only latest user message
            ]).execute()
        except Exception:
            pass

    return StreamingResponse(
        stream_chat(req, api_key),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "minios-ai", "ts": int(time.time())}


@app.get("/api/sessions/{session_id}/messages")
async def get_messages(session_id: str):
    db = get_supabase()
    if not db:
        return {"messages": []}
    try:
        resp = db.table("messages").select("*").eq("session_id", session_id).order("created_at").execute()
        return {"messages": resp.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
