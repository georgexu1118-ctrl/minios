<#
.SYNOPSIS
    Build minios into build/kernel.bin using clang + ld.lld (LLVM).
.DESCRIPTION
    clang is used as a cross-compiler targeting bare-metal i386 ELF, so no
    separate i686-elf-gcc is required. ld.lld links against the custom
    linker script. Tools are located on PATH or under C:\Program Files\LLVM.
#>
[CmdletBinding()]
param(
    [string]$OutDir = "build"
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Find-Tool($name, $fallback) {
    $c = Get-Command $name -ErrorAction SilentlyContinue
    if ($c) { return $c.Source }
    if (Test-Path $fallback) { return $fallback }
    throw "Could not find '$name'. Install LLVM:  winget install -e --id LLVM.LLVM"
}

$clang = Find-Tool "clang"  "C:\Program Files\LLVM\bin\clang.exe"
$lld   = Find-Tool "ld.lld" "C:\Program Files\LLVM\bin\ld.lld.exe"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$target = "i386-pc-none-elf"
$cflags = @(
    "--target=$target", "-m32", "-march=i386",
    "-ffreestanding", "-fno-stack-protector",
    "-fno-pic", "-fno-pie", "-nostdlib",
    "-Wall", "-Wextra", "-Wno-unused-command-line-argument"
)

Write-Host "[1/3] Assembling src/boot.s"
& $clang @cflags -c "src/boot.s" -o "$OutDir/boot.o"
if ($LASTEXITCODE -ne 0) { throw "assemble failed ($LASTEXITCODE)" }

Write-Host "[2/3] Compiling  src/kernel.c"
& $clang @cflags -std=gnu11 -O2 -c "src/kernel.c" -o "$OutDir/kernel.o"
if ($LASTEXITCODE -ne 0) { throw "compile failed ($LASTEXITCODE)" }

Write-Host "[3/3] Linking    $OutDir/kernel.bin"
& $lld -m elf_i386 -z max-page-size=0x1000 -z noseparate-code -T "linker.ld" -nostdlib -o "$OutDir/kernel.bin" "$OutDir/boot.o" "$OutDir/kernel.o"
if ($LASTEXITCODE -ne 0) { throw "link failed ($LASTEXITCODE)" }

Write-Host ""
Write-Host "OK -> $OutDir/kernel.bin"
