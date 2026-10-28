[CmdletBinding()]
param(
 [ValidateSet('Setup','Restore','Backup','Doctor','Apps','Sync','Disable','Prepare','Extract')][string]$Mode='Setup',
 [string]$HostName,
 [switch]$AlreadyRooted,[switch]$DryRun,[switch]$TrustNewHost,[switch]$NoReboot,[switch]$RemoveExtraApps,[switch]$PortableNode,[switch]$NoPause,
 [string]$RootKeyPath,[string]$DeveloperKeyPath,[string]$BackupFile,[string]$OutputDirectory,
 [ValidateSet('en','vi')][string]$Language,[string]$TVModel,[string]$FirmwareVersion,
 [string]$DataDirectory=(Join-Path $env:LOCALAPPDATA 'MAC-WebOSTV')
)
$ErrorActionPreference='Stop'
[Console]::OutputEncoding=New-Object System.Text.UTF8Encoding($false)
$OutputEncoding=[Console]::OutputEncoding
if(-not $Language){
 if($Mode -in @('Prepare','Extract')){$Language='en'}else{
  Write-Host '1 - English'
  Write-Host '2 - Tieng Viet khong dau'
  do{$taskLanguage=Read-Host 'Language / Ngon ngu (1/2)'}while($taskLanguage.Trim() -notin @('1','2'))
  $Language=if($taskLanguage.Trim() -eq '2'){'vi'}else{'en'}
 }
}
function L([string]$English,[string]$Vietnamese){if($Language -eq 'vi'){return $Vietnamese}else{return $English}}
function Test-MacTvConfirmation([string]$Value){return $Value.Trim().ToUpperInvariant() -in @('YES','CO')}
$env:GATHIN_LANGUAGE=$Language
$env:GATHIN_RECOVERY_SESSION=$null
if(-not $PSBoundParameters.ContainsKey('DataDirectory')){
 $taskLegacyData=Join-Path $env:LOCALAPPDATA 'GathinTV'
 if(Test-Path -LiteralPath (Join-Path $taskLegacyData 'state')){$DataDirectory=$taskLegacyData}
}
trap {
 $taskFailure=$_.Exception.Message
 if($Mode -in @('Setup','Restore') -and -not $DryRun -and $env:GATHIN_RECOVERY_SESSION -and (Test-Path -LiteralPath $env:GATHIN_RECOVERY_SESSION)){
  try{
   $taskSnapshot=Get-Content -LiteralPath $env:GATHIN_RECOVERY_SESSION -Raw -Encoding UTF8 | ConvertFrom-Json
   if($taskSnapshot.mutationsStarted -and $taskSnapshot.host -eq $HostName){
    Write-Host ('Backup: '+$taskSnapshot.folder+' | TV: '+$taskSnapshot.host+' | '+$taskSnapshot.createdAt) -ForegroundColor Yellow
    $taskRestoreAnswer=Read-Host (L 'Return to the initial TV snapshot from the start of this run? (YES/CO)' 'Ban co muon quay ve trang thai ban dau cua TV theo backup dau phien nay khong? (CO/YES)')
    if(Test-MacTvConfirmation $taskRestoreAnswer){
     $taskRecoveryArgs=@((Join-Path $release 'scripts/recover-session.js'),'--session',$env:GATHIN_RECOVERY_SESSION,'--host',$HostName)
     if($RootKeyPath){$taskRecoveryArgs+=@('--key',[IO.Path]::GetFullPath($RootKeyPath))}
     & $node @taskRecoveryArgs
     if($LASTEXITCODE -ne 0){Write-Host (L 'Recovery failed. Keep the backup and recovery log; do not reset the TV.' 'Khoi phuc that bai. Giu backup va log; khong reset TV.') -ForegroundColor Red}
    }
   }
  }catch{Write-Host ((L 'Recovery error: ' 'Loi khoi phuc: ')+$_.Exception.Message) -ForegroundColor Red}
 }
 Write-Host ((L 'Stopped: ' 'Da dung: ')+$taskFailure) -ForegroundColor Red; if($taskTranscript){Stop-Transcript|Out-Null}; if(-not $NoPause){[void](Read-Host (L 'Press Enter to close' 'Nhan Enter de dong'))}; exit 1 }
if($Mode -notin @('Prepare','Extract')){
 $taskLogDirectory=Join-Path $DataDirectory 'state/logs'
 [IO.Directory]::CreateDirectory($taskLogDirectory)|Out-Null
 $taskSetupLog=Join-Path $taskLogDirectory ('setup-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.log')
 $taskRuntimeLog=[IO.Path]::ChangeExtension($taskSetupLog,'runtime.log')
 $env:GATHIN_SESSION_LOG=[IO.Path]::GetFullPath($taskRuntimeLog)
 Start-Transcript -LiteralPath $taskSetupLog -Append|Out-Null
 $taskTranscript=$true
 Write-Host ((L 'Setup log: ' 'Log setup: ')+$taskSetupLog)
 Write-Host ((L 'Runtime log: ' 'Log tien trinh: ')+$taskRuntimeLog)
}
Write-Host (L 'MAC-WebOSTV by 20khzpc 3.4.0: use the IP and credentials of THIS TV.' 'MAC-WebOSTV by 20khzpc 3.4.0: dung IP va thong tin dang nhap cua chinh TV nay.')
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
if($Mode -eq 'Extract'){Write-Host ((L 'Source extracted: ' 'Da giai nen ma nguon: ')+$release);return}
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
  Write-Host (L 'Preparing portable Node.js from nodejs.org...' 'Dang chuan bi Node.js portable tu nodejs.org...')
  Invoke-WebRequest -UseBasicParsing -Uri $asset.url -OutFile $download
  if((Get-FileHash -LiteralPath $download -Algorithm SHA256).Hash.ToLowerInvariant() -ne $asset.sha256){throw 'Node.js download checksum mismatch.'}
  Expand-Archive -LiteralPath $download -DestinationPath $runtimeDir -Force
  Remove-Item -LiteralPath $download
 }
}
if($Mode -eq 'Prepare'){& $node (Join-Path $release 'scripts/verify.js');if($LASTEXITCODE -ne 0){throw (L 'Payload verification failed.' 'Kiem tra bo cai that bai.')};Write-Host (L 'PC is ready; no TV connection was made.' 'PC da san sang; chua ket noi hay thay doi TV.');return}
if(-not $PSBoundParameters.ContainsKey('Mode') -and -not $AlreadyRooted){
 Write-Host (L '1 - TV not rooted (check model/firmware before rooting)' '1 - TV chua root (kiem tra model/firmware truoc khi root)')
 Write-Host (L '2 - TV already rooted (install launcher, no rooting exploit)' '2 - TV da root (cai launcher, khong chay lai exploit)')
 Write-Host (L '3 - Check TV features and show report (no reinstall)' '3 - Kiem tra chuc nang TV va hien bao cao (khong cai lai)')
 do{$taskRootChoice=Read-Host (L 'Choose 1, 2 or 3' 'Chon 1, 2 hoac 3')}while($taskRootChoice.Trim() -notin @('1','2','3'))
 if($taskRootChoice.Trim() -eq '2'){$Mode='Restore';$AlreadyRooted=$true}
 elseif($taskRootChoice.Trim() -eq '3'){$Mode='Doctor';$AlreadyRooted=$true}
 elseif($taskRootChoice.Trim() -ne '1'){throw (L 'Choose 1, 2 or 3. No TV changes made.' 'Chon 1, 2 hoac 3. Chua thay doi TV.')}
}
$env:GATHIN_STATE_DIRECTORY=Join-Path $DataDirectory 'state'
if($Mode -eq 'Setup' -and -not $AlreadyRooted){
 if(-not $TVModel){$TVModel=(Read-Host (L 'TV model shown in Settings (example: 55SK8000PTA)' 'Nhap ma model TV trong Cai dat (vi du: 55SK8000PTA)')).Trim()}
 while($FirmwareVersion -notmatch '^\d{1,2}\.\d{2}\.\d{2}$'){$FirmwareVersion=(Read-Host (L 'Installed firmware version (00.00.00)' 'Nhap ban firmware dang cai (00.00.00)')).Trim()}
 & $node (Join-Path $release 'scripts/check-root.js') --model $TVModel --firmware $FirmwareVersion --language $Language
 if($LASTEXITCODE -eq 2){throw (L 'No known compatible software root method. Stopped before connecting or running an exploit.' 'Khong co cach root phan mem tuong thich da biet. Da dung truoc khi ket noi hay chay exploit.')}
 if($LASTEXITCODE -ne 0){throw (L 'Rootability is unknown. Check the model, firmware and Internet connection; no exploit was run.' 'Chua xac dinh kha nang root. Kiem tra model, firmware va Internet; chua chay exploit.')}
}
function Read-MacTvAddress([string]$InitialAddress){
 $taskAddress=$InitialAddress.Trim()
 while($taskAddress -notmatch '^(?=.{1,253}$)[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?$'){
  if($taskAddress){Write-Host (L 'Enter only the TV IP or hostname, without http://, port or spaces.' 'Chi nhap IP hoac hostname cua TV, khong co http://, cong hay dau cach.') -ForegroundColor Yellow}
  $taskInput=Read-Host (L 'TV IP address (example: 192.168.3.27)' 'Nhap IP TV (vi du: 192.168.3.27)')
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
  if(Test-Path -LiteralPath $taskSavedRootKey){Write-Host (L 'Using the root SSH key saved for this TV.' 'Dang dung khoa SSH root da luu cho TV nay.') -ForegroundColor Cyan}
  else{
   Write-Host (L 'Setup will try the default root SSH password automatically. Only a rejection asks for your own root password.' 'Setup tu thu mat khau root mac dinh. Chi khi TV tu choi moi hoi mat khau root rieng cua ban.')
  }
 }
}
$taskKnownHosts=Join-Path $DataDirectory 'state/known-hosts.json'
$taskKnown=$false
if(Test-Path -LiteralPath $taskKnownHosts){try{$taskEntries=Get-Content -LiteralPath $taskKnownHosts -Raw|ConvertFrom-Json;$taskPort=if($Mode -eq 'Setup' -and -not $AlreadyRooted){9922}else{22};$taskKnown=$null -ne $taskEntries.PSObject.Properties[($HostName+':'+$taskPort)]}catch{}}
if(-not $TrustNewHost -and -not $taskKnown){
 Write-Host ((L 'First connection. Check the IP on YOUR TV: ' 'Ket noi lan dau. Kiem tra IP tren chinh TV cua ban: ')+$HostName)
 $taskAnswer=Read-Host (L 'Type YES or CO if this is your TV (case insensitive)' 'Nhap YES hoac CO neu day la TV cua ban (khong phan biet hoa thuong)')
 if(-not (Test-MacTvConfirmation $taskAnswer)){throw (L 'Connection cancelled. Check the TV IP and try again.' 'Da huy ket noi. Kiem tra IP TV va thu lai.')}
 $TrustNewHost=$true
}
if($Mode -eq 'Setup' -and -not $AlreadyRooted){
 Write-Host (L 'For faultmanager: install Developer Mode, enable Dev Mode Status, allow its reboot, then enable Key Server.' 'De dung faultmanager: cai Developer Mode, bat Dev Mode Status, cho reboot, sau do bat Key Server.')
 Write-Host (L 'Enter the Developer Mode passphrase when prompted. Compatible fallback methods will be listed if faultmanager fails.' 'Nhap passphrase Developer Mode khi duoc hoi. Neu faultmanager that bai, setup se thu cac cach du phong con tuong thich.')
}
if(-not $OutputDirectory){$OutputDirectory=Join-Path $PSScriptRoot 'MAC-WebOSTV-Backups'}
$env:GATHIN_STATE_DIRECTORY=Join-Path $DataDirectory 'state'
$arguments=@((Join-Path $release 'scripts/run.js'),$Mode,'--host',$HostName,'--output-dir',[IO.Path]::GetFullPath($OutputDirectory))
foreach($pair in @(@($AlreadyRooted,'--already-rooted'),@($DryRun,'--dry-run'),@($TrustNewHost,'--trust-new-host'),@($NoReboot,'--no-reboot'),@($RemoveExtraApps,'--remove-extra-apps'))){if($pair[0]){$arguments+=$pair[1]}}
foreach($pair in @(@($RootKeyPath,'--key'),@($DeveloperKeyPath,'--developer-key'),@($BackupFile,'--backup-file'))){if($pair[0]){$arguments+=@($pair[1],[IO.Path]::GetFullPath($pair[0]))}}
if($Mode -eq 'Setup' -and -not $AlreadyRooted){$arguments+=@('--expected-model',$TVModel,'--expected-firmware',$FirmwareVersion)}
$env:GATHIN_RECOVERY_SESSION=Join-Path $env:GATHIN_STATE_DIRECTORY ('sessions/'+[guid]::NewGuid().ToString()+'.json')
$taskReportStarted=Get-Date
& $node @arguments
if($LASTEXITCODE -ne 0){throw ((L 'Stopped with exit code ' 'Da dung voi ma loi ')+$LASTEXITCODE+'. '+(L 'Logs: ' 'Log: ')+$env:GATHIN_STATE_DIRECTORY)}

if(-not $DryRun -and $Mode -in @('Setup','Restore','Doctor')){
 $taskReportDirectory=Join-Path $env:GATHIN_STATE_DIRECTORY 'feature-reports'
 $taskReportFile=Get-ChildItem -LiteralPath $taskReportDirectory -Filter 'features-*.json' -ErrorAction SilentlyContinue | Where-Object {$_.LastWriteTime -ge $taskReportStarted.AddSeconds(-2)} | Sort-Object LastWriteTime -Descending | Select-Object -First 1
 if($taskReportFile){
  $taskReport=Get-Content -LiteralPath $taskReportFile.FullName -Encoding UTF8 -Raw | ConvertFrom-Json
  Write-Host (L '========== FEATURE REPORT ==========' '========== BAO CAO CHUC NANG ==========') -ForegroundColor Cyan
  Write-Host ('TV: '+$taskReport.host+' | '+$taskReport.at)
  foreach($taskResult in $taskReport.results){
   $taskDetail=if($taskResult.detail -is [string]){$taskResult.detail}else{$taskResult.detail | ConvertTo-Json -Compress -Depth 6}
   if($Language -eq 'vi' -and $taskDetail){$taskDetail=($taskDetail.Normalize([Text.NormalizationForm]::FormD) -replace '\p{M}','').Replace([char]0x0111,[char]0x0064).Replace([char]0x0110,[char]0x0044)}
   switch($taskResult.status){
    'verified' {Write-Host ('[OK] '+$taskResult.feature+' - '+$taskDetail) -ForegroundColor Green}
    'present' {Write-Host ((L '[PRESENT] ' '[DA CO] ')+$taskResult.feature) -ForegroundColor Green}
    'installed' {Write-Host ((L '[INSTALLED] ' '[DA CAI] ')+$taskResult.feature+' - '+$taskDetail) -ForegroundColor Green}
    'manual-check-required' {Write-Host ((L '[MANUAL] ' '[THU TREN TV] ')+$taskResult.feature+' - '+$taskDetail) -ForegroundColor Yellow}
    default {Write-Host ((L '[CHECK] ' '[CAN KIEM TRA] ')+$taskResult.feature+' - '+$taskDetail) -ForegroundColor Red}
   }
  }
  Write-Host ((L 'Full report: ' 'Bao cao day du: ')+$taskReportFile.FullName)
  Write-Host (L 'MANUAL means not verified yet; it does not mean the feature passed.' 'THU TREN TV nghia la chua duoc xac minh; khong co nghia tinh nang da dat.')
 }else{Write-Host (L 'No new feature report was generated. Previous reports were not used.' 'Chua tao duoc bao cao moi. Khong dung lai bao cao cu.') -ForegroundColor Yellow}
}
if($taskTranscript){Write-Host ((L 'Setup log: ' 'Log setup: ')+$taskSetupLog);Stop-Transcript|Out-Null;$taskTranscript=$false}
if(-not $NoPause -and $Mode -in @('Setup','Restore','Doctor')){[void](Read-Host (L 'Completed. Press Enter to close' 'Da hoan tat. Nhan Enter de dong'))}
