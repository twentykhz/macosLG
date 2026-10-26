param(
    [string]$HostName = '192.168.1.11',
    [switch]$DryRun,
    [switch]$Privacy,
    [switch]$TrustNewHost,
    [string]$KeyPath
)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 20+ LTS, then reopen PowerShell.' }
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'node_modules/ssh2'))) {
    & npm.cmd ci --ignore-scripts --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
}
$tvArguments = @('scripts/tv.js', 'restore', '--host', $HostName)
if ($DryRun) { $tvArguments += '--dry-run' }
if ($Privacy) { $tvArguments += '--privacy' }
if ($TrustNewHost) { $tvArguments += '--trust-new-host' }
if ($KeyPath) { $tvArguments += @('--key', $KeyPath) }
& node @tvArguments
exit $LASTEXITCODE
