[CmdletBinding()]
param(
 [ValidateSet('Setup','Restore','Backup','Doctor','Apps','Sync','Disable','Prepare','Extract')][string]$Mode='Setup',
 [string]$HostName,
 [switch]$AlreadyRooted,[switch]$DryRun,[switch]$TrustNewHost,[switch]$NoReboot,[switch]$RemoveExtraApps,[switch]$PortableNode,
 [string]$RootKeyPath,[string]$DeveloperKeyPath,[string]$BackupFile,[string]$OutputDirectory,
 [string]$DataDirectory=(Join-Path $env:LOCALAPPDATA 'GathinTV')
)
$ErrorActionPreference='Stop'
[Net.ServicePointManager]::SecurityProtocol=[Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
$bytes=[Convert]::FromBase64String(@'
__PAYLOAD_BASE64__
'@)
$expected='__PAYLOAD_SHA256__'
$sha=[Security.Cryptography.SHA256]::Create()
$actual=([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-','').ToLowerInvariant()
if($actual -ne $expected){throw 'Embedded package checksum mismatch; nothing executed.'}
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$release=Join-Path $DataDirectory ('releases/3.0.0-'+$expected.Substring(0,12))
if($Mode -eq 'Extract'){
 if(-not $OutputDirectory){$OutputDirectory=Join-Path $PSScriptRoot 'GathinTV-source'}
 $release=[IO.Path]::GetFullPath($OutputDirectory)
}
[IO.Directory]::CreateDirectory($release)|Out-Null
$base=[IO.Path]::GetFullPath($release).TrimEnd([IO.Path]::DirectorySeparatorChar)+[IO.Path]::DirectorySeparatorChar
$stream=New-Object IO.MemoryStream(,$bytes)
$zip=New-Object IO.Compression.ZipArchive($stream,[IO.Compression.ZipArchiveMode]::Read)
try {
 foreach($entry in $zip.Entries){
  $target=[IO.Path]::GetFullPath((Join-Path $release $entry.FullName))
  if(-not $target.StartsWith($base,[StringComparison]::OrdinalIgnoreCase)){throw 'Invalid embedded archive path.'}
  if($entry.FullName.EndsWith('/')){[IO.Directory]::CreateDirectory($target)|Out-Null;continue}
  [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target))|Out-Null
  [IO.Compression.ZipFileExtensions]::ExtractToFile($entry,$target,$true)
 }
} finally {$zip.Dispose();$stream.Dispose()}
if($Mode -eq 'Extract'){Write-Host "Source extracted: $release";return}
$node=$null
$found=Get-Command node -ErrorAction SilentlyContinue
if($found -and -not $PortableNode){
 try {$version=(& $found.Source --version).Trim();if([int]($version.TrimStart('v').Split('.')[0]) -ge 20){$node=$found.Source}}catch{}
}
if(-not $node){
 if(-not [Environment]::Is64BitOperatingSystem){throw 'This package needs 64-bit Windows.'}
 $runtime=Get-Content -LiteralPath (Join-Path $release 'config/node-runtime.json') -Raw|ConvertFrom-Json
 $arch='x64';if($env:PROCESSOR_ARCHITECTURE -eq 'ARM64' -or $env:PROCESSOR_ARCHITEW6432 -eq 'ARM64'){$arch='arm64'}
 $asset=$runtime.$arch
 $runtimeDir=Join-Path $DataDirectory ('runtime/'+$runtime.version+'-'+$arch)
 $node=Join-Path $runtimeDir ('node-'+$runtime.version+'-win-'+$arch+'/node.exe')
 if(-not (Test-Path -LiteralPath $node)){
  [IO.Directory]::CreateDirectory($runtimeDir)|Out-Null
  $download=Join-Path $runtimeDir 'node.zip'
  Write-Host 'Preparing portable Node.js from nodejs.org...'
  Invoke-WebRequest -UseBasicParsing -Uri $asset.url -OutFile $download
  if((Get-FileHash -LiteralPath $download -Algorithm SHA256).Hash.ToLowerInvariant() -ne $asset.sha256){throw 'Node.js download checksum mismatch.'}
  Expand-Archive -LiteralPath $download -DestinationPath $runtimeDir -Force
  Remove-Item -LiteralPath $download
 }
}
if($Mode -eq 'Prepare'){& $node (Join-Path $release 'scripts/verify.js');if($LASTEXITCODE -ne 0){throw 'Payload verification failed.'};Write-Host 'PC is ready; no TV connection was made.';return}
if(-not $HostName){$HostName=Read-Host 'TV IP address'}
if($HostName -notmatch '^[a-zA-Z0-9.-]+$'){throw 'Invalid TV address.'}
if($Mode -eq 'Setup' -and -not $AlreadyRooted){
 Write-Host 'On the TV: install Developer Mode, enable Dev Mode Status, allow its reboot, then enable Key Server.'
 Write-Host 'Enter the Developer Mode passphrase when prompted. The remaining compatible steps run automatically.'
}
if(-not $OutputDirectory){$OutputDirectory=Join-Path $PSScriptRoot 'GathinTV-Backups'}
$env:GATHIN_STATE_DIRECTORY=Join-Path $DataDirectory 'state'
$arguments=@((Join-Path $release 'scripts/run.js'),$Mode,'--host',$HostName,'--output-dir',[IO.Path]::GetFullPath($OutputDirectory))
foreach($pair in @(@($AlreadyRooted,'--already-rooted'),@($DryRun,'--dry-run'),@($TrustNewHost,'--trust-new-host'),@($NoReboot,'--no-reboot'),@($RemoveExtraApps,'--remove-extra-apps'))){if($pair[0]){$arguments+=$pair[1]}}
foreach($pair in @(@($RootKeyPath,'--key'),@($DeveloperKeyPath,'--developer-key'),@($BackupFile,'--backup-file'))){if($pair[0]){$arguments+=@($pair[1],[IO.Path]::GetFullPath($pair[0]))}}
& $node @arguments
if($LASTEXITCODE -ne 0){throw "Stopped with exit code $LASTEXITCODE. Logs and keys: $env:GATHIN_STATE_DIRECTORY"}
