# minios

A tiny, freestanding **x86 (32-bit) operating-system kernel** that boots under
QEMU via the Multiboot protocol and drives the VGA text screen and the COM1
serial port directly. Its party trick: it can hold a conversation with an LLM
through a host-side **serial bridge** — no in-kernel network stack required.

## How it works

| File | Role |
|------|------|
| `src/boot.s` | Multiboot1 header + `_start`: sets up a stack and calls `kernel_main`. |
| `src/kernel.c` | VGA text driver (with scrolling), COM1 serial read/write, and the chat loop. |
| `linker.ld` | Lays the kernel out as a Multiboot ELF loaded at 1 MiB. |
| `build.ps1` / `Makefile` | Build with `clang` + `ld.lld`. |
| `run.ps1` | Boot in QEMU: windowed, `-Headless` (verify), or `-Chat` (serial over TCP). |
| `bridge/bridge.py` | Host bridge: relays the kernel <-> OpenAI over the serial link. |
| `bridge/bridge.ps1` | Launches the bridge, decrypting your DPAPI-protected key at runtime. |
| `bridge/setup-key.ps1` | One-time: store/rotate your OpenAI key (DPAPI-encrypted, outside the repo). |

`clang` is used as a cross-compiler (`--target=i386-pc-none-elf`), so **no
separate `i686-elf-gcc` toolchain is required**. QEMU's `-kernel` loader
understands Multiboot, so no GRUB/ISO is needed to boot.

## Prerequisites

- **LLVM** (clang + ld.lld): `winget install -e --id LLVM.LLVM`
- **QEMU**: `winget install -e --id SoftwareFreedomConservancy.QEMU`
- **Python 3** (only for the chat bridge)

## Build & run

```powershell
./build.ps1            # -> build/kernel.bin
./run.ps1              # QEMU window; COM1 on stdio (try typing ">hello")
./run.ps1 -Headless    # no window; verifies the kernel's READY handshake, exits 0/1
```

Unix-like toolchains can use the `Makefile` (`make`, `make run`, `make clean`).

## AI chat over serial (host bridge)

The kernel has no network stack. Instead it speaks a one-line-per-message
protocol over COM1 to a small Python bridge on the host, which calls OpenAI:

```
kernel --(?question)--> bridge --> OpenAI --> bridge --(<answer)--> kernel
```

You type questions in the bridge console; the kernel renders the answers in the
QEMU window.

### One-time key setup

```powershell
./bridge/setup-key.ps1     # paste your OpenAI key (hidden input)
```

Your key is encrypted with **Windows DPAPI** (decryptable only by your Windows
account on this machine) and written to `%USERPROFILE%\.minios\openai_key.dpapi`
— **outside this repository**, so it can never be committed. The bridge decrypts
it into an environment variable for the lifetime of the process only.

### Start chatting

Terminal 1 — boot the kernel with COM1 as a TCP server (it waits for the bridge):

```powershell
./run.ps1 -Chat
```

Terminal 2 — start the bridge:

```powershell
./bridge/bridge.ps1            # real OpenAI
./bridge/bridge.ps1 -Mock      # offline; canned replies, no key needed
```

Then type a question. The reply appears in the QEMU window.

> **Security:** the API key exists only as DPAPI ciphertext on disk and as
> plaintext in process memory at runtime — never in the repo. `.gitignore`
> additionally blocks `*.dpapi`, `.env`, and similar files as defense in depth.
> If you ever paste a key somewhere it could be logged, rotate it.

### US stock questions (Yahoo Finance)

The bridge can answer questions about individual US stocks using live data from
[yfinance](https://github.com/ranaroussi/yfinance). The model is given a
`get_stock` tool (OpenAI tool-calling); when you ask about a ticker it fetches
real quote/stats and answers with live numbers. One-time install:

```powershell
pip install -r bridge/requirements.txt
```

Then just ask:

```
you> what is AAPL trading at right now?
you> is TSLA up or down today?
you> what's NVDA's market cap and P/E?
```

## Verification

`./run.ps1 -Headless` boots the kernel with no display and confirms it reaches
its `READY` handshake over serial (exit 0).

The full chat round-trip can be verified **without** OpenAI using the mock
bridge — terminal 1: `./run.ps1 -Chat`; terminal 2:
`./bridge/bridge.ps1 -Mock -Once "hello"`. It prints `ROUND-TRIP OK` when the
kernel correctly receives the question and echoes it back to the bridge.

## Roadmap

- [ ] `printf`-style formatted output (`%x`, `%d`, `%s`)
- [ ] GDT + IDT, CPU exception handlers
- [ ] PS/2 keyboard driver (type questions in the QEMU window directly)
- [ ] PIT timer + a simple scheduler
- [ ] Physical page frame allocator, then paging
- [ ] Bootable ISO via GRUB (`grub-mkrescue`) + CI

## License

MIT — see `LICENSE`.
