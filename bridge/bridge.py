#!/usr/bin/env python3
"""
minios serial bridge: kernel <-> COM1 (QEMU TCP serial) <-> OpenAI.

Data flow:
    you type --> bridge --(>question)--> kernel --(?question)--> bridge
              --> OpenAI --> bridge --(<answer)--> kernel (renders on VGA)

The kernel echoes each question back as "?question"; that echo is what
triggers the OpenAI call, so the kernel is genuinely in the round-trip.

Live US-stock data: the model is given a `get_stock` tool backed by the
yfinance library. When you ask about a ticker (AAPL, MSFT, TSLA, ...), the
model calls the tool, the bridge fetches real Yahoo Finance data, and the
model answers with live numbers.

The API key is read from OPENAI_API_KEY (bridge.ps1 decrypts it from DPAPI).
Pass --mock to skip OpenAI entirely.
"""
import argparse
import json
import os
import socket
import sys
import time
import urllib.error
import urllib.request


def log(*a):
    print("[bridge]", *a, file=sys.stderr, flush=True)


# --------------------------------------------------------------------------- #
# Serial link to QEMU's COM1 (exposed as a TCP server)
# --------------------------------------------------------------------------- #
class SerialLink:
    def __init__(self, host, port, connect_timeout=20, io_timeout=60):
        self.buf = b""
        deadline = time.time() + connect_timeout
        while True:
            try:
                self.sock = socket.create_connection((host, port), timeout=5)
                break
            except OSError as e:
                if time.time() > deadline:
                    raise SystemExit(
                        f"could not connect to QEMU serial {host}:{port}: {e}\n"
                        "Start the kernel first:  ./run.ps1 -Chat")
                time.sleep(0.3)
        self.sock.settimeout(io_timeout)

    def readline(self):
        while b"\n" not in self.buf:
            try:
                chunk = self.sock.recv(4096)
            except socket.timeout:
                return None
            if not chunk:
                return None
            self.buf += chunk
        line, self.buf = self.buf.split(b"\n", 1)
        return line.rstrip(b"\r").decode("utf-8", "replace")

    def send(self, text):
        self.sock.sendall(text.encode("utf-8"))


def sanitize(text, limit=1000):
    """Collapse to a single ASCII line that fits the kernel's line buffer."""
    text = text.replace("\r", " ").replace("\n", " ")
    text = "".join(ch if 32 <= ord(ch) < 127 else "?" for ch in text)
    text = " ".join(text.split())
    return text[:limit]


# --------------------------------------------------------------------------- #
# yfinance tool: live quote/stats for a single US-listed stock
# --------------------------------------------------------------------------- #
def get_stock(symbol):
    symbol = (symbol or "").strip().upper()
    if not symbol:
        return {"error": "no symbol given"}
    try:
        import yfinance as yf
    except ImportError:
        return {"error": "yfinance not installed (pip install -r bridge/requirements.txt)"}

    def fi_get(fi, name):
        try:
            return getattr(fi, name)
        except Exception:
            try:
                return fi[name]
            except Exception:
                return None

    try:
        t = yf.Ticker(symbol)
        fi = t.fast_info
        last = fi_get(fi, "last_price")
        prev = fi_get(fi, "previous_close")
        data = {
            "symbol": symbol,
            "currency": fi_get(fi, "currency"),
            "last_price": last,
            "previous_close": prev,
            "open": fi_get(fi, "open"),
            "day_high": fi_get(fi, "day_high"),
            "day_low": fi_get(fi, "day_low"),
            "year_high": fi_get(fi, "year_high"),
            "year_low": fi_get(fi, "year_low"),
            "market_cap": fi_get(fi, "market_cap"),
        }
        if isinstance(last, (int, float)) and isinstance(prev, (int, float)) and prev:
            data["change"] = round(last - prev, 4)
            data["change_pct"] = round((last - prev) / prev * 100.0, 2)
        # richer fields (slower / sometimes flaky) — best effort
        try:
            info = t.info or {}
            for k in ("shortName", "longName", "trailingPE", "forwardPE",
                      "dividendYield", "sector", "industry"):
                if info.get(k) is not None:
                    data[k] = info[k]
        except Exception:
            pass

        if data.get("last_price") is None and "shortName" not in data:
            return {"error": f"no data found for '{symbol}' (is it a valid US ticker?)"}
        return data
    except Exception as e:  # noqa: BLE001
        return {"error": f"yfinance error for '{symbol}': {e}"}


def get_web_search(query, max_results=5):
    query = (query or "").strip()
    if not query:
        return {"error": "empty query"}
    try:
        try:
            from ddgs import DDGS            # current package name
        except ImportError:
            from duckduckgo_search import DDGS  # older package name
    except ImportError:
        return {"error": "ddgs not installed (pip install -r bridge/requirements.txt)"}
    try:
        hits = DDGS().text(query, max_results=max_results) or []
        results = [{"title": h.get("title"),
                    "url": h.get("href"),
                    "snippet": (h.get("body") or "")[:300]}
                   for h in hits[:max_results]]
        if not results:
            return {"error": f"no web results for '{query}'"}
        return {"query": query, "results": results}
    except Exception as e:  # noqa: BLE001
        return {"error": f"web search failed: {e}"}


STOCK_TOOL = {
    "type": "function",
    "function": {
        "name": "get_stock",
        "description": ("Get live quote and key statistics for a single "
                        "US-listed stock by ticker symbol (e.g. AAPL, MSFT, "
                        "TSLA, NVDA). Returns price, daily change, 52-week "
                        "range, market cap, P/E and more from Yahoo Finance."),
        "parameters": {
            "type": "object",
            "properties": {
                "symbol": {"type": "string",
                           "description": "Ticker symbol, e.g. AAPL"}
            },
            "required": ["symbol"],
        },
    },
}

WEB_TOOL = {
    "type": "function",
    "function": {
        "name": "web_search",
        "description": ("Search the live web (DuckDuckGo) for current events, "
                        "recent facts, figures, or anything that may have "
                        "changed after your training cutoff. Returns result "
                        "titles, URLs and snippets."),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "the search query"},
            },
            "required": ["query"],
        },
    },
}

SYSTEM_PROMPT = (
    "You are AAOS, the Autonomous AI OS — an advanced AI assistant running "
    "inside a custom 32-bit OS kernel. "
    "Use the get_stock tool for questions about individual US stocks (live "
    "Yahoo Finance data). Use the web_search tool whenever a question needs "
    "current events, recent facts, or anything that may have changed after "
    "your training cutoff -- search instead of guessing or saying you don't "
    "know. Answer general knowledge from your own training. Reply in at most "
    "2-3 short sentences, plain ASCII only, with the key facts or numbers."
)


# --------------------------------------------------------------------------- #
# OpenAI chat with tool-calling
# --------------------------------------------------------------------------- #
# --------------------------------------------------------------------------- #
# Provider registry — same OpenAI Chat Completions wire format across all.
# Selected with --provider {openai,hermes,gpt-oss}. Each provider has its own
# env var so users can mix and match without overwriting keys.
# --------------------------------------------------------------------------- #
PROVIDERS = {
    "openai": {
        "base_url": "https://api.openai.com/v1/chat/completions",
        "env":      "OPENAI_API_KEY",
        "default_model": "gpt-4o-mini",
        "label":    "OpenAI (closed)",
    },
    "hermes": {
        # Nous Research's Hermes 4 70B via OpenRouter (OpenAI-compatible).
        "base_url": "https://openrouter.ai/api/v1/chat/completions",
        "env":      "OPENROUTER_API_KEY",
        "default_model": "nousresearch/hermes-4-70b",
        "label":    "Hermes 4 70B (Nous Research, open)",
        "extra_headers": {
            "HTTP-Referer": "https://aaos-research.vercel.app",
            "X-Title":      "AAOS Kernel Bridge",
        },
    },
    "gpt-oss": {
        # OpenAI's open-weight 20B via Groq for lowest latency.
        "base_url": "https://api.groq.com/openai/v1/chat/completions",
        "env":      "GROQ_API_KEY",
        "default_model": "openai/gpt-oss-20b",
        "label":    "GPT-OSS 20B via Groq (open)",
    },
}


def _chat(provider_key, key, model, messages, tools=None):
    provider = PROVIDERS[provider_key]
    payload = {"model": model, "messages": messages,
               "temperature": 0.3, "max_tokens": 320}
    if tools:
        payload["tools"] = tools
    headers = {"Authorization": "Bearer " + key,
               "Content-Type": "application/json"}
    headers.update(provider.get("extra_headers", {}))
    req = urllib.request.Request(
        provider["base_url"],
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST")
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.loads(r.read().decode("utf-8"))


def ask_openai(key, question, model, provider_key="openai"):
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": question},
    ]
    try:
        for _ in range(4):  # allow a few tool-call rounds
            resp = _chat(provider_key, key, model, messages, tools=[STOCK_TOOL, WEB_TOOL])
            msg = resp["choices"][0]["message"]
            calls = msg.get("tool_calls")
            if not calls:
                return msg.get("content") or "[no answer]"
            messages.append(msg)
            for c in calls:
                name = c["function"]["name"]
                try:
                    args = json.loads(c["function"].get("arguments") or "{}")
                except json.JSONDecodeError:
                    args = {}
                if name == "get_stock":
                    result = get_stock(args.get("symbol", ""))
                elif name == "web_search":
                    result = get_web_search(args.get("query", ""))
                else:
                    result = {"error": f"unknown tool {name}"}
                log(f"tool {name}({args}) ->",
                    json.dumps(result, default=str)[:200])
                messages.append({"role": "tool", "tool_call_id": c["id"],
                                 "content": json.dumps(result, default=str)})
        return msg.get("content") or "[stopped after tool rounds]"
    except urllib.error.HTTPError as e:
        return f"[{provider_key} http {e.code}: {e.read().decode('utf-8', 'replace')[:160]}]"
    except Exception as e:  # noqa: BLE001
        return f"[bridge error: {e}]"


def reply_for(args, key, question):
    if args.mock:
        return f"[mock] you asked: {question} -- AAOS is a 32-bit Multiboot kernel."
    model = args.model or PROVIDERS[args.provider]["default_model"]
    return sanitize(ask_openai(key, question, model, provider_key=args.provider))


# --------------------------------------------------------------------------- #
# protocol helpers
# --------------------------------------------------------------------------- #
def wait_for_ready(link):
    deadline = time.time() + 20
    while time.time() < deadline:
        ln = link.readline()
        if ln is None:
            raise SystemExit("serial closed before kernel sent READY")
        log("kernel:", ln)
        if ln.strip() == "READY":
            return True
    log("warning: never saw READY; continuing")
    return False


def turn(link, args, key, question):
    """Seed the kernel, wait for its '?' echo, then answer it."""
    link.send(">" + question + "\n")
    deadline = time.time() + 60
    while time.time() < deadline:
        ln = link.readline()
        if ln is None:
            return None
        if ln.startswith("?"):
            ans = reply_for(args, key, ln[1:])
            link.send("<" + ans + "\n")
            return ans
    return None


def main():
    ap = argparse.ArgumentParser(description="AAOS serial <-> LLM bridge")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=4555)
    ap.add_argument("--provider", choices=list(PROVIDERS.keys()), default="openai",
                    help="LLM provider: openai (gpt-4o-mini), hermes (Nous Hermes 4 70B via OpenRouter), "
                         "gpt-oss (OpenAI gpt-oss-20b via Groq)")
    ap.add_argument("--model", default=None,
                    help="override model id (defaults to provider's recommended model)")
    ap.add_argument("--mock", action="store_true",
                    help="don't call any LLM; return a canned reply (no key needed)")
    ap.add_argument("--once", metavar="QUESTION",
                    help="run one question then exit (for testing)")
    args = ap.parse_args()

    provider = PROVIDERS[args.provider]
    key = os.environ.get(provider["env"], "")
    if not args.mock and not key:
        raise SystemExit(
            f"{provider['env']} not set for provider '{args.provider}' ({provider['label']}). "
            f"Export the key or pass --mock.")

    model = args.model or provider["default_model"]
    link = SerialLink(args.host, args.port)
    log(f"connected to kernel at {args.host}:{args.port}"
        + (" [MOCK]" if args.mock else f" [provider={args.provider}, model={model}, +yfinance]"))
    wait_for_ready(link)

    if args.once is not None:
        ans = turn(link, args, key, args.once)
        ok = ans is not None
        if ok:
            log("answered:", ans)
        print("ROUND-TRIP OK" if ok else "ROUND-TRIP FAILED")
        time.sleep(0.5)
        sys.exit(0 if ok else 1)

    print("minios chat ready. Ask anything -- incl. US stocks, e.g.")
    print("  'what is AAPL trading at?'   'is TSLA up today?'   'MSFT vs NVDA market cap'\n")
    try:
        while True:
            try:
                q = input("you> ").strip()
            except EOFError:
                break
            if not q:
                continue
            ans = turn(link, args, key, q)
            print("ai>  " + (ans if ans else "[no response from kernel]") + "\n")
    except KeyboardInterrupt:
        pass
    log("bye")


if __name__ == "__main__":
    main()
