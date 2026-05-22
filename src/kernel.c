/*
 * minios — freestanding 32-bit kernel
 *
 * Entered from boot.s in protected mode with a valid stack. We bring up two
 * output devices and print a banner:
 *   - VGA text mode framebuffer at 0xB8000 (what you see in the QEMU window)
 *   - the COM1 serial port at 0x3F8 (what we capture for headless verification)
 *
 * No libc, no runtime — everything here is built on raw port I/O and memory.
 */

#include <stdint.h>
#include <stddef.h>

/* ---------- x86 port I/O ---------- */

static inline void outb(uint16_t port, uint8_t val) {
    __asm__ volatile("outb %0, %1" : : "a"(val), "Nd"(port));
}

static inline uint8_t inb(uint16_t port) {
    uint8_t ret;
    __asm__ volatile("inb %1, %0" : "=a"(ret) : "Nd"(port));
    return ret;
}

/* ---------- VGA text mode (80x25, 16-bit cells: char | attr<<8) ---------- */

#define VGA_MEM  ((volatile uint16_t *)0xB8000)
#define VGA_COLS 80
#define VGA_ROWS 25

static size_t  vga_row = 0;
static size_t  vga_col = 0;
static uint8_t vga_color = 0x0F; /* bright white on black */

static inline uint16_t vga_cell(char c, uint8_t color) {
    return (uint16_t)(unsigned char)c | ((uint16_t)color << 8);
}

static void vga_clear(void) {
    for (size_t y = 0; y < VGA_ROWS; y++)
        for (size_t x = 0; x < VGA_COLS; x++)
            VGA_MEM[y * VGA_COLS + x] = vga_cell(' ', vga_color);
    vga_row = vga_col = 0;
}

static void vga_putc(char c) {
    if (c == '\n') {
        vga_col = 0;
        if (++vga_row == VGA_ROWS) vga_row = 0;
        return;
    }
    VGA_MEM[vga_row * VGA_COLS + vga_col] = vga_cell(c, vga_color);
    if (++vga_col == VGA_COLS) {
        vga_col = 0;
        if (++vga_row == VGA_ROWS) vga_row = 0;
    }
}

/* ---------- COM1 serial port ---------- */

#define COM1 0x3F8

static void serial_init(void) {
    outb(COM1 + 1, 0x00); /* disable interrupts            */
    outb(COM1 + 3, 0x80); /* enable DLAB (set baud divisor)*/
    outb(COM1 + 0, 0x03); /* divisor low  = 3 -> 38400 baud*/
    outb(COM1 + 1, 0x00); /* divisor high = 0              */
    outb(COM1 + 3, 0x03); /* 8 bits, no parity, one stop   */
    outb(COM1 + 2, 0xC7); /* enable + clear FIFO, 14B thr  */
    outb(COM1 + 4, 0x0B); /* IRQs on, RTS/DSR set          */
}

static int serial_tx_ready(void) {
    return inb(COM1 + 5) & 0x20;
}

static void serial_putc(char c) {
    while (!serial_tx_ready()) { }
    outb(COM1, (uint8_t)c);
}

/* ---------- combined output ---------- */

static void kputc(char c) {
    if (c == '\n') serial_putc('\r'); /* terminals want CRLF */
    serial_putc(c);
    vga_putc(c);
}

static void kprint(const char *s) {
    for (; *s; s++) kputc(*s);
}

/* ---------- entry point ---------- */

void kernel_main(void) {
    serial_init();
    vga_clear();

    kprint("================================\n");
    kprint("   minios: hello from the kernel\n");
    kprint("================================\n");
    kprint("Booted via Multiboot in 32-bit protected mode.\n");
    kprint("VGA text + COM1 serial output online.\n");
    kprint("Nothing left to do -- halting CPU.\n");

    /* control returns to boot.s, which executes cli; hlt */
}
