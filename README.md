# minios

A tiny, freestanding **x86 (32-bit) operating-system kernel** that boots under
QEMU via the Multiboot protocol, prints a banner to both the VGA text screen
and the COM1 serial port, then halts.

It is deliberately small — the goal is a clean, well-commented starting point
you can actually build and boot, not a full OS.

```
================================
   minios: hello from the kernel
================================
Booted via Multiboot in 32-bit protected mode.
VGA text + COM1 serial output online.
Nothing left to do -- halting CPU.
```

## How it works

| File         | Role |
|--------------|------|
| `src/boot.s` | Multiboot1 header + `_start`: sets up a stack and calls `kernel_main`. |
| `src/kernel.c` | The kernel: VGA text driver, COM1 serial driver, prints the banner. |
| `linker.ld`  | Lays the kernel out as a Multiboot ELF loaded at the 1 MiB mark. |
| `build.ps1` / `Makefile` | Build with `clang` + `ld.lld`. |
| `run.ps1`    | Boot in QEMU (windowed, or `-Headless` for automated verification). |

`clang` is used as a cross-compiler (`--target=i386-pc-none-elf`), so **no
separate `i686-elf-gcc` toolchain is required** — LLVM ships every backend.
QEMU's built-in `-kernel` loader understands Multiboot, so we don't need GRUB
or an ISO just to boot.

## Prerequisites

- **LLVM** (clang + ld.lld): `winget install -e --id LLVM.LLVM`
- **QEMU**: `winget install -e --id SoftwareFreedomConservancy.QEMU`

## Build & run (Windows / PowerShell)

```powershell
./build.ps1            # -> build/kernel.bin
./run.ps1              # opens a QEMU window
./run.ps1 -Headless    # no window; verifies serial output, exits 0/1
```

## Build & run (Unix-like, clang or i686-elf-gcc)

```sh
make            # -> build/kernel.bin
make run        # boot in QEMU
make clean
```

## Verification

`./run.ps1 -Headless` boots the kernel with no display, captures the COM1
serial port to `build/serial.log`, and asserts the banner is present —
returning exit code 0 on success. This is the hook a CI job would call.

## Roadmap

- [ ] `printf`-style formatted output (`%x`, `%d`, `%s`)
- [ ] GDT + IDT, exception handlers
- [ ] PIC remap + keyboard (PS/2) interrupt driver
- [ ] PIT timer + a simple scheduler
- [ ] Physical page frame allocator, then paging
- [ ] Bootable ISO via GRUB (`grub-mkrescue`) in addition to `-kernel`

## License

MIT — see `LICENSE`.
