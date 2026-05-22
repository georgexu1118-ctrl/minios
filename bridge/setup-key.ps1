<#
.SYNOPSIS
    Securely store (or rotate) your OpenAI API key for the minios bridge.
.DESCRIPTION
    Prompts for the key with hidden input (it never appears on screen or in
    your shell history), encrypts it with Windows DPAPI (decryptable only by
    your Windows account on this machine), and writes the ciphertext OUTSIDE
    the git repo so it can never be committed.
.EXAMPLE
    ./bridge/setup-key.ps1
#>
[CmdletBinding()]
param(
    [string]$KeyFile = "$env:USERPROFILE\.minios\openai_key.dpapi"
)
$ErrorActionPreference = "Stop"

$dir = Split-Path -Parent $KeyFile
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$sec = Read-Host -AsSecureString "Paste your OpenAI API key (input hidden)"
if ($sec.Length -eq 0) { throw "No key entered." }

$sec | ConvertFrom-SecureString | Set-Content -Path $KeyFile -Encoding ASCII
Write-Host "Encrypted key saved to $KeyFile"
Write-Host "(DPAPI, current Windows user only; not in the repo)."
