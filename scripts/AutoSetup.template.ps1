[CmdletBinding()]
param(
 [ValidateSet('Setup','Restore','Backup','Doctor','Apps','Sync','Disable','Prepare','Extract')][string]$Mode='Setup',
 [string]$HostName,
 [switch]$AlreadyRooted,[switch]$DryRun,[switch]$TrustNewHost,[switch]$NoReboot,[switch]$RemoveExtraApps,[switch]$PortableNode,[switch]$NoPause,
 [string]$RootKeyPath,[string]$DeveloperKeyPath,[string]$BackupFile,[string]$OutputDirectory,
 [string]$DataDirectory=(Join-Path $env:LOCALAPPDATA 'MAC-WebOSTV')
)
$ErrorActionPreference='Stop'
[Console]::OutputEncoding=New-Object System.Text.UTF8Encoding($false)
$OutputEncoding=[Console]::OutputEncoding
if(-not $PSBoundParameters.ContainsKey('DataDirectory')){
 $taskLegacyData=Join-Path $env:LOCALAPPDATA 'GathinTV'
 if(Test-Path -LiteralPath (Join-Path $taskLegacyData 'state')){$DataDirectory=$taskLegacyData}
}
trap { Write-Host ('Stopped: '+$_.Exception.Message) -ForegroundColor Red; if(-not $NoPause){[void](Read-Host 'Press Enter to close')}; exit 1 }
Write-Host 'MAC-WebOSTV by 20khzpc 3.4.0: record the target TV IP and Developer Mode passphrase. Use the credentials of THIS TV, not another TV.'
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
$release=Join-Path $DataDirectory ('releases/3.4.0-'+$expected.Substring(0,12))
if($Mode -eq 'Extract'){
 if(-not $OutputDirectory){$OutputDirectory=Join-Path $PSScriptRoot 'MAC-WebOSTV-Source'}
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
if(-not $PSBoundParameters.ContainsKey('Mode') -and -not $AlreadyRooted){
 Write-Host '1 - TV not rooted (check supported model/firmware first)'
 Write-Host '2 - TV already rooted (install launcher, no rooting exploit)'
 Write-Host '3 - Check TV features and show report (no reinstall)'
 $taskRootChoice=Read-Host 'Choose 1, 2 or 3'
 if($taskRootChoice.Trim() -eq '2'){$Mode='Restore';$AlreadyRooted=$true}
 elseif($taskRootChoice.Trim() -eq '3'){$Mode='Doctor';$AlreadyRooted=$true}
 elseif($taskRootChoice.Trim() -ne '1'){throw 'Choose 1, 2 or 3. No TV changes made.'}
}
function Read-MacTvAddress([string]$InitialAddress){
 $taskAddress=$InitialAddress.Trim()
 while($taskAddress -notmatch '^(?=.{1,253}$)[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?$'){
  if($taskAddress){Write-Host 'Enter only the TV IP or hostname, without http://, port or spaces.' -ForegroundColor Yellow}
  $taskInput=Read-Host 'TV IP address (example: 192.168.3.27)'
  if($null -eq $taskInput){throw 'Console input is unavailable. Open Start-Setup.cmd in a new window.'}
  $taskAddress=$taskInput.Trim()
 }
 return $taskAddress
}
$HostName=Read-MacTvAddress ([string]$HostName)
if($Mode -ne 'Setup' -or $AlreadyRooted){
 if(-not $RootKeyPath){
  $taskHostHash=[Security.Cryptography.SHA256]::Create()
  try{$taskKeyId=([BitConverter]::ToString($taskHostHash.ComputeHash([Text.Encoding]::UTF8.GetBytes($HostName)))).Replace('-','').ToLowerInvariant().Substring(0,16)}finally{$taskHostHash.Dispose()}
  $taskSavedRootKey=Join-Path $DataDirectory ('state/keys/root-'+$taskKeyId+'.pem')
  if(Test-Path -LiteralPath $taskSavedRootKey){Write-Host 'Using the root SSH key saved for this TV.' -ForegroundColor Cyan}
  else{
   Write-Host 'Root SSH login: 1 = TV root password, 2 = existing private key file.'
   $taskLoginChoice=Read-Host 'Choose 1 or 2 (Enter = 1)'
   while($taskLoginChoice.Trim() -notin @('','1','2')){$taskLoginChoice=Read-Host 'Enter 1 for root password or 2 for private key'}
   if($taskLoginChoice.Trim() -eq '2'){
    do{$RootKeyPath=(Read-Host 'Private SSH key file path (never share this file)').Trim().Trim('"');$taskKeyExists=$RootKeyPath -and (Test-Path -LiteralPath $RootKeyPath -PathType Leaf);if(-not $taskKeyExists){Write-Host 'Private key file not found. Enter its full path.' -ForegroundColor Yellow}}while(-not $taskKeyExists)
   }else{Write-Host 'Use the TV root SSH password, not the LG account password or Developer Mode passphrase.'}
  }
 }
}
$taskKnownHosts=Join-Path $DataDirectory 'state/known-hosts.json'
$taskKnown=$false
if(Test-Path -LiteralPath $taskKnownHosts){try{$taskEntries=Get-Content -LiteralPath $taskKnownHosts -Raw|ConvertFrom-Json;$taskPort=if($Mode -eq 'Setup' -and -not $AlreadyRooted){9922}else{22};$taskKnown=$null -ne $taskEntries.PSObject.Properties[($HostName+':'+$taskPort)]}catch{}}
if(-not $TrustNewHost -and -not $taskKnown){
 Write-Host ('First connection to '+$HostName+'. Check this IP on YOUR TV before accepting its new SSH host key.')
 $taskAnswer=Read-Host 'Type YES only if this is your TV on your trusted home network'
 if($taskAnswer.Trim() -ine 'YES'){throw 'Connection cancelled before trusting the TV. Check the IP and try again.'}
 $TrustNewHost=$true
}
if($Mode -eq 'Setup' -and -not $AlreadyRooted){
 Write-Host 'On the TV: install Developer Mode, enable Dev Mode Status, allow its reboot, then enable Key Server.'
 Write-Host 'Enter the Developer Mode passphrase when prompted. The remaining compatible steps run automatically.'
}
if(-not $OutputDirectory){$OutputDirectory=Join-Path $PSScriptRoot 'MAC-WebOSTV-Backups'}
$env:GATHIN_STATE_DIRECTORY=Join-Path $DataDirectory 'state'
$arguments=@((Join-Path $release 'scripts/run.js'),$Mode,'--host',$HostName,'--output-dir',[IO.Path]::GetFullPath($OutputDirectory))
foreach($pair in @(@($AlreadyRooted,'--already-rooted'),@($DryRun,'--dry-run'),@($TrustNewHost,'--trust-new-host'),@($NoReboot,'--no-reboot'),@($RemoveExtraApps,'--remove-extra-apps'))){if($pair[0]){$arguments+=$pair[1]}}
foreach($pair in @(@($RootKeyPath,'--key'),@($DeveloperKeyPath,'--developer-key'),@($BackupFile,'--backup-file'))){if($pair[0]){$arguments+=@($pair[1],[IO.Path]::GetFullPath($pair[0]))}}
$taskReportStarted=Get-Date
& $node @arguments
if($LASTEXITCODE -ne 0){throw "Stopped with exit code $LASTEXITCODE. Logs and keys: $env:GATHIN_STATE_DIRECTORY"}

if(-not $DryRun -and $Mode -in @('Setup','Restore','Doctor')){
 $taskReportDirectory=Join-Path $env:GATHIN_STATE_DIRECTORY 'feature-reports'
 $taskReportFile=Get-ChildItem -LiteralPath $taskReportDirectory -Filter 'features-*.json' -ErrorAction SilentlyContinue | Where-Object {$_.LastWriteTime -ge $taskReportStarted.AddSeconds(-2)} | Sort-Object LastWriteTime -Descending | Select-Object -First 1
 if($taskReportFile){
  $taskReport=Get-Content -LiteralPath $taskReportFile.FullName -Encoding UTF8 -Raw | ConvertFrom-Json
  Write-Host '
========== BAO CAO CHUC NANG / FEATURE REPORT ==========' -ForegroundColor Cyan
  Write-Host ('TV: '+$taskReport.host+' | '+$taskReport.at)
  foreach($taskResult in $taskReport.results){
   $taskDetail=if($taskResult.detail -is [string]){$taskResult.detail}else{$taskResult.detail | ConvertTo-Json -Compress -Depth 6}
   switch($taskResult.status){
    'verified' {Write-Host ('[OK] '+$taskResult.feature+' - '+$taskDetail) -ForegroundColor Green}
    'present' {Write-Host ('[DA CO / PRESENT] '+$taskResult.feature) -ForegroundColor Green}
    'installed' {Write-Host ('[DA CAI / INSTALLED] '+$taskResult.feature+' - '+$taskDetail) -ForegroundColor Green}
    'manual-check-required' {Write-Host ('[THU TREN TV / MANUAL] '+$taskResult.feature+' - '+$taskDetail) -ForegroundColor Yellow}
    default {Write-Host ('[CAN KIEM TRA / CHECK] '+$taskResult.feature+' - '+$taskDetail) -ForegroundColor Red}
   }
  }
  Write-Host ('Full report: '+$taskReportFile.FullName)
  Write-Host 'MANUAL means not verified yet; it does not mean the feature passed.'
 }else{Write-Host 'No new feature report was generated. Previous reports were not used.' -ForegroundColor Yellow}
}
if(-not $NoPause -and $Mode -in @('Setup','Restore','Doctor')){[void](Read-Host 'Completed. Press Enter to close')}
