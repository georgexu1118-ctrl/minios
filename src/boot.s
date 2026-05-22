# minios — Multiboot1 entry stub (GAS / AT&T syntax, i386)
#
# Declares a Multiboot header so QEMU's `-kernel` loader (and GRUB) will
# load us directly in 32-bit protected mode, sets up a stack, and hands
# control to kernel_main() in C. On return we disable interrupts and halt.

.set ALIGN,    1<<0              # align loaded modules on page boundaries
.set MEMINFO,  1<<1              # provide a memory map
.set FLAGS,    ALIGN | MEMINFO   # Multiboot 'flag' field
.set MAGIC,    0x1BADB002        # 'magic number' lets the bootloader find us
.set CHECKSUM, -(MAGIC + FLAGS)  # checksum: magic + flags + checksum == 0

# The Multiboot header must appear in the first 8 KiB of the binary and be
# 4-byte aligned. The linker script places .multiboot at the very start.
.section .multiboot, "a"
.align 4
.long MAGIC
.long FLAGS
.long CHECKSUM

# Reserve a 16 KiB stack. The System V ABI wants esp 16-byte aligned.
.section .bss
.align 16
stack_bottom:
.skip 16384                      # 16 KiB
stack_top:

.section .text
.global _start
.type _start, @function
_start:
    mov $stack_top, %esp         # set up the stack

    call kernel_main             # enter C

    cli                          # if kernel_main returns, halt forever
.Lhang:
    hlt
    jmp .Lhang

.size _start, . - _start
