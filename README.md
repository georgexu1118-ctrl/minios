# AAOS Research

**Autonomous AI OS** — a custom 32-bit x86 kernel with a full-stack AI chat interface.

AAOS boots under QEMU via the Multiboot protocol and drives the VGA text screen and COM1
serial port directly. A host-side Python bridge connects the kernel to OpenAI, with live
Yahoo Finance data and DuckDuckGo web search. A React/Next.js web interface provides a
beautiful Interstellar-themed chat UI backed by a FastAPI streaming API.

The web chat includes GPT-OSS PDF Q&A: users can upload a text-based PDF in the
browser, retrieve relevant page excerpts with Together AI embeddings, and receive
answers with page citations without storing the uploaded file.

## Architecture

```
Browser (Next.js) → FastAPI API → OpenAI (GPT-4o-mini/GPT-OSS)
                               → get_stock (Yahoo Finance)
                               → web_search (DuckDuckGo)

QEMU (AAOS kernel) ←→ bridge.py ←→ OpenAI
```

## Repository structure

| Path | Role |
|------|------|
| `src/boot.s` | Multiboot1 header + `_start` |
| `src/kernel.c` | VGA driver, COM1 serial, chat loop |
| `linker.ld` | Multiboot ELF at 1 MiB |
| `build.ps1` / `Makefile` | Compile with clang + lld |
| `run.ps1` | Boot in QEMU (windowed / headless / chat) |
| `bridge/bridge.py` | Serial ↔ OpenAI bridge |
| `bridge/bridge.ps1` | Launch bridge with DPAPI key |
| `api/main.py` | FastAPI backend (streaming SSE, tool-calling) |
| `api/requirements.txt` | Python deps for API |
| `api/supabase_schema.sql` | Supabase schema (sessions + messages) |
| `web/` | Next.js frontend (homepage + chat) |

## Prerequisites

- **LLVM** (clang + ld.lld): `winget install -e --id LLVM.LLVM`
- **QEMU**: `winget install -e --id SoftwareFreedomConservancy.QEMU`
- **Python 3.11+** with: `pip install -r bridge/requirements.txt` and `pip install -r api/requirements.txt`
- **Node.js 20+**: `winget install -e --id OpenJS.NodeJS.LTS`

## Build & run the kernel

```powershell
./build.ps1            # -> build/kernel.bin
./run.ps1              # QEMU window; COM1 on stdio
./run.ps1 -Headless    # verify READY handshake, exit 0/1
./run.ps1 -Chat        # TCP serial on port 4555
```

## AI chat bridge (terminal)

```powershell
# Terminal 1
./run.ps1 -Chat

# Terminal 2
./bridge/bridge.ps1          # real OpenAI
./bridge/bridge.ps1 -Mock    # offline mock
```

## Web interface

```powershell
# API server (Terminal 1)
Set-Location api
uvicorn main:app --reload --port 8000

# Frontend (Terminal 2)
Set-Location web
npx next dev
```

Open http://localhost:3000 — full homepage + chat at http://localhost:3000/chat.

For GPT-OSS PDF Q&A, configure `TOGETHER_API_KEY`. Text-based PDFs up to 5 MB are
indexed in the current browser tab using `intfloat/multilingual-e5-large-instruct`;
answers are generated with `openai/gpt-oss-20b`.

## One-time key setup

```powershell
./bridge/setup-key.ps1     # DPAPI-encrypt your OpenAI key
```

Key is stored at `%USERPROFILE%\.minios\openai_key.dpapi` — outside this repo.

## Supabase (optional persistence)

1. Create a free project at https://supabase.com
2. Run `api/supabase_schema.sql` in the SQL editor
3. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `~/.minios/api.env`

## Deployment

- **Frontend**: Deploy `web/` to Vercel (`vercel deploy` from repo root)
- **API**: Deploy `api/` to Railway or Render; set `OPENAI_API_KEY` env var

## License

MIT
