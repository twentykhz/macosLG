param(
    [string]$HostName = '192.168.1.11',
    [switch]$DryRun,
    [switch]$AlreadyRooted,
    [switch]$TrustNewHost,
    [switch]$NoExtraApps,
    [string]$DeveloperKeyPath,
    [string]$RootKeyPath
)
$ErrorActionPreference = 'Stop'
$SourceRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $SourceRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 20+ LTS, then reopen PowerShell.' }
if (-not (Test-Path -LiteralPath (Join-Path $SourceRoot 'node_modules/ssh2'))) {
    & npm.cmd ci --ignore-scripts --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
}
$tvArguments = @('scripts/bootstrap.js', '--host', $HostName)
if ($DryRun) { $tvArguments += '--dry-run' }
if ($AlreadyRooted) { $tvArguments += '--already-rooted' }
if ($TrustNewHost) { $tvArguments += '--trust-new-host' }
if ($NoExtraApps) { $tvArguments += '--no-extra-apps' }
if ($DeveloperKeyPath) { $tvArguments += @('--developer-key', $DeveloperKeyPath) }
if ($RootKeyPath) { $tvArguments += @('--root-key', $RootKeyPath) }
& node @tvArguments
exit $LASTEXITCODE
