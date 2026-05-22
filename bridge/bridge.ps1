<#
.SYNOPSIS
    Launch the minios serial bridge, decrypting the DPAPI-protected OpenAI key
    into this process's environment for its lifetime only.
.DESCRIPTION
    The key never appears on disk in plaintext and never enters the git repo.
    It is decrypted (Windows DPAPI, current user) into $env:OPENAI_API_KEY just
    before launching bridge.py, and the process exits when the bridge stops.
.EXAMPLE
    ./bridge/bridge.ps1                 # interactive chat (real OpenAI)
.EXAMPLE
    ./bridge/bridge.ps1 -Mock           # no API calls, canned replies
.EXAMPLE
    ./bridge/bridge.ps1 -Once "hello"   # single turn then exit (testing)
#>
[CmdletBinding()]
param(
    [int]$Port = 4555,
    [string]$ModelName = "gpt-4o-mini",
    [switch]$Mock,
    [string]$Once,
    [string]$KeyFile = "$env:USERPROFILE\.minios\openai_key.dpapi"
)
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not $Mock) {
    if (-not (Test-Path $KeyFile)) {
        throw "Encrypted key not found at $KeyFile. Run ./bridge/setup-key.ps1 first (or use -Mock)."
    }
    $sec  = Get-Content $KeyFile | ConvertTo-SecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
    try {
        $env:OPENAI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}

$pyArgs = @((Join-Path $here "bridge.py"), "--port", $Port, "--model", $ModelName)
if ($Mock) { $pyArgs += "--mock" }
if ($Once) { $pyArgs += @("--once", $Once) }

try {
    & python @pyArgs
    exit $LASTEXITCODE
} finally {
    Remove-Item Env:\OPENAI_API_KEY -ErrorAction SilentlyContinue
}
