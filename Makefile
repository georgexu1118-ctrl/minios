# minios — portable build for unix-like toolchains (clang or i686-elf-gcc).
# On Windows, prefer build.ps1 / run.ps1 instead.

TARGET ?= i386-pc-none-elf
CC     ?= clang
LD     ?= ld.lld
QEMU   ?= qemu-system-i386
OUT    ?= build

CFLAGS  := --target=$(TARGET) -m32 -march=i386 -ffreestanding \
           -fno-stack-protector -fno-pic -fno-pie -nostdlib \
           -Wall -Wextra -Wno-unused-command-line-argument -O2 -std=gnu11
LDFLAGS := -m elf_i386 -z max-page-size=0x1000 -z noseparate-code -T linker.ld -nostdlib

OBJS := $(OUT)/boot.o $(OUT)/kernel.o

all: $(OUT)/kernel.bin

$(OUT):
	mkdir -p $(OUT)

$(OUT)/boot.o: src/boot.s | $(OUT)
	$(CC) $(CFLAGS) -c $< -o $@

$(OUT)/kernel.o: src/kernel.c | $(OUT)
	$(CC) $(CFLAGS) -c $< -o $@

$(OUT)/kernel.bin: $(OBJS)
	$(LD) $(LDFLAGS) -o $@ $(OBJS)

run: all
	$(QEMU) -kernel $(OUT)/kernel.bin -serial stdio

run-headless: all
	$(QEMU) -kernel $(OUT)/kernel.bin -serial stdio -display none -no-reboot

clean:
	rm -rf $(OUT)

.PHONY: all run run-headless clean
