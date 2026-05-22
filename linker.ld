/* minios linker script — lay the kernel out as a Multiboot ELF at 1 MiB. */

ENTRY(_start)

SECTIONS
{
    /* Conventional load address for a Multiboot kernel. */
    . = 1M;

    /* .multiboot must come first so the header is within the first 8 KiB. */
    .text :
    {
        *(.multiboot)
        *(.text)
    }

    .rodata :
    {
        *(.rodata)
    }

    .data :
    {
        *(.data)
    }

    .bss :
    {
        *(COMMON)
        *(.bss)
    }
}
