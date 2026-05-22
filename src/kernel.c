/*
 * minios — serial-bridge AI chat kernel
 *
 * The kernel is a tiny terminal that speaks a line protocol over COM1 to a
 * host-side Python bridge, which talks to the OpenAI API:
 *
 *     kernel  --(?question)-->  bridge  -->  OpenAI
 *     kernel  <--(<answer)----  bridge  <--  OpenAI
 *
 * Protocol (one message per line, '\n' terminated):
 *   bridge -> kernel : ">question"   a question seeded from the host console
 *   kernel -> bridge : "?question"   kernel forwards it to the bridge
 *   bridge -> kernel : "<answer"     the model's reply, to be displayed
 *
 * The conversation is rendered on the VGA text screen. Only protocol lines
 * ("?...") are ever written to the serial port, so the bridge sees a clean
 * stream.
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

/* ---------- VGA text mode (80x25), with scrolling ---------- */
#define VGA_MEM  ((volatile uint16_t *)0xB8000)
#define VGA_COLS 80
#define VGA_ROWS 25

static size_t  vrow = 0, vcol = 0;
static uint8_t vcolor = 0x0F; /* bright white on black */

static inline uint16_t cell(char c, uint8_t color) {
    return (uint16_t)(unsigned char)c | ((uint16_t)color << 8);
}
static void vga_clear(void) {
    for (size_t y = 0; y < VGA_ROWS; y++)
        for (size_t x = 0; x < VGA_COLS; x++)
            VGA_MEM[y * VGA_COLS + x] = cell(' ', vcolor);
    vrow = vcol = 0;
}
static void vga_scroll(void) {
    for (size_t y = 1; y < VGA_ROWS; y++)
        for (size_t x = 0; x < VGA_COLS; x++)
            VGA_MEM[(y - 1) * VGA_COLS + x] = VGA_MEM[y * VGA_COLS + x];
    for (size_t x = 0; x < VGA_COLS; x++)
        VGA_MEM[(VGA_ROWS - 1) * VGA_COLS + x] = cell(' ', vcolor);
    vrow = VGA_ROWS - 1;
}
static void vga_putc(char c) {
    if (c == '\n') { vcol = 0; if (++vrow == VGA_ROWS) vga_scroll(); return; }
    VGA_MEM[vrow * VGA_COLS + vcol] = cell(c, vcolor);
    if (++vcol == VGA_COLS) { vcol = 0; if (++vrow == VGA_ROWS) vga_scroll(); }
}
static void vga_puts(const char *s) { for (; *s; s++) vga_putc(*s); }
static void vga_puts_c(const char *s, uint8_t color) {
    uint8_t old = vcolor; vcolor = color; vga_puts(s); vcolor = old;
}

/* ---------- COM1 serial port (read + write) ---------- */
#define COM1 0x3F8

static void serial_init(void) {
    outb(COM1 + 1, 0x00);
    outb(COM1 + 3, 0x80);
    outb(COM1 + 0, 0x03); /* 38400 baud */
    outb(COM1 + 1, 0x00);
    outb(COM1 + 3, 0x03); /* 8N1 */
    outb(COM1 + 2, 0xC7);
    outb(COM1 + 4, 0x0B);
}
static int  serial_tx_ready(void) { return inb(COM1 + 5) & 0x20; }
static void serial_putc(char c)   { while (!serial_tx_ready()) {} outb(COM1, (uint8_t)c); }
static void serial_puts(const char *s) {
    for (; *s; s++) { if (*s == '\n') serial_putc('\r'); serial_putc(*s); }
}
static int  serial_rx_ready(void) { return inb(COM1 + 5) & 0x01; }
static char serial_getc(void)     { while (!serial_rx_ready()) {} return (char)inb(COM1); }

static void serial_readline(char *buf, size_t max) {
    size_t i = 0;
    for (;;) {
        char c = serial_getc();
        if (c == '\r' || c == '\n') break;
        if (c == 8 || c == 127) { if (i) i--; continue; } /* backspace */
        if (i + 1 < max) buf[i++] = c;
    }
    buf[i] = 0;
}

/* ---------- entry point ---------- */
void kernel_main(void) {
    serial_init();
    vga_clear();
    vga_puts_c("  minios :: serial-bridge AI chat\n", 0x0E);
    vga_puts_c("  ---------------------------------\n", 0x08);
    vga_puts  ("  COM1 linked to the host bridge. Type questions in the\n");
    vga_puts  ("  bridge console; answers appear here.\n\n");

    serial_puts("READY\n"); /* tell the bridge we have booted */

    static char line[1200];
    for (;;) {
        serial_readline(line, sizeof line);

        if (line[0] == '>') {            /* question seeded from the host */
            vga_puts_c("you> ", 0x0B);
            vga_puts(line + 1);
            vga_putc('\n');
            /* forward to the bridge: kernel -> COM1 -> bridge -> OpenAI */
            serial_putc('?');
            serial_puts(line + 1);
            serial_putc('\n');
        } else if (line[0] == '<') {     /* answer coming back from OpenAI */
            vga_puts_c("ai>  ", 0x0A);
            vga_puts(line + 1);
            vga_puts("\n\n");
        }
        /* any other line is ignored */
    }
}
