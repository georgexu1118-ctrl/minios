<#
.SYNOPSIS
    Boot build/kernel.bin in QEMU.
.DESCRIPTION
    Default: opens a QEMU window (VGA text output) and mirrors COM1 to this
    console. Use -Headless for automated verification: QEMU runs with no
    display, COM1 is written to build/serial.log, and the script checks the
    log for the kernel banner, exiting 0 (pass) or 1 (fail).
.EXAMPLE
    ./run.ps1
.EXAMPLE
    ./run.ps1 -Headless
#>
[CmdletBinding()]
param(
    [switch]$Headless,
    [int]$TimeoutSec = 3,
    [string]$OutDir = "build"
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Find-Tool($name, $fallback) {
    $c = Get-Command $name -ErrorAction SilentlyContinue
    if ($c) { return $c.Source }
    if (Test-Path $fallback) { return $fallback }
    throw "Could not find '$name'. Install QEMU:  winget install -e --id SoftwareFreedomConservancy.QEMU"
}

$qemu   = Find-Tool "qemu-system-i386" "C:\Program Files\qemu\qemu-system-i386.exe"
$kernel = Join-Path $OutDir "kernel.bin"
if (-not (Test-Path $kernel)) { throw "kernel not built: $kernel  (run ./build.ps1 first)" }

if ($Headless) {
    $log = Join-Path $OutDir "serial.log"
    if (Test-Path $log) { Remove-Item $log -Force }
    Write-Host "Running QEMU headless for ${TimeoutSec}s; COM1 -> $log"
    $args = @("-kernel", $kernel, "-serial", "file:$log", "-display", "none", "-no-reboot")
    $p = Start-Process -FilePath $qemu -ArgumentList $args -PassThru
    Start-Sleep -Seconds $TimeoutSec
    if (-not $p.HasExited) { Stop-Process -Id $p.Id -Force }

    if (-not (Test-Path $log)) { Write-Host "VERIFY: FAIL (no serial log produced)"; exit 1 }
    $out = Get-Content $log -Raw
    if ($null -eq $out) { $out = "" }
    Write-Host "----- COM1 serial output -----"
    Write-Host $out.TrimEnd()
    Write-Host "------------------------------"
    if ($out -match "hello from the kernel") { Write-Host "VERIFY: PASS"; exit 0 }
    Write-Host "VERIFY: FAIL (kernel banner not found in serial output)"; exit 1
}
else {
    Write-Host "Launching QEMU window; COM1 mirrored below. Close the window to quit."
    & $qemu -kernel $kernel -serial stdio
}
