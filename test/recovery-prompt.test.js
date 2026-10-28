'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
test('actual PowerShell failure handler accepts mixed-case CO/YES and never selects another run or TV',{skip:process.platform!=='win32'},()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'mac-tv-prompt-')),scripts=path.join(folder,'scripts');fs.mkdirSync(scripts);
 const template=fs.readFileSync(path.join(__dirname,'../scripts/AutoSetup.template.ps1'),'utf8'),handler=template.slice(template.indexOf('trap {'),template.indexOf("if($Mode -notin @('Prepare','Extract'))"));
 fs.writeFileSync(path.join(scripts,'recover-session.js'),"require('fs').writeFileSync(process.env.TEST_RECOVERY_RESULT,JSON.stringify(process.argv.slice(2)));");
 const quote=s=>"'"+s.replace(/'/g,"''")+"'",session=path.join(folder,'session.json'),result=path.join(folder,'result.json'),harness=path.join(folder,'harness.ps1');
 try{
  for(const [answer,host,changed,expected] of [['cO','192.0.2.44',true,true],['yEs','192.0.2.44',true,true],['no','192.0.2.44',true,false],['YES','192.0.2.45',true,false],['YES','192.0.2.44',false,false]]){
   fs.rmSync(result,{force:true});fs.writeFileSync(session,JSON.stringify({host,mutationsStarted:changed,createdAt:'fixture',folder:'original first snapshot'}));
   fs.writeFileSync(harness,`$ErrorActionPreference='Stop'
function L($en,$vi){return $en}
function Test-MacTvConfirmation([string]$Value){return $Value.Trim().ToUpperInvariant() -in @('YES','CO')}
function Read-Host($Prompt){Write-Host $Prompt;return ${quote(answer)}}
$Mode='Restore';$HostName='192.0.2.44';$NoPause=$true;$DryRun=$false;$taskTranscript=$false
$release=${quote(folder)};$node=${quote(process.execPath)}
$env:GATHIN_RECOVERY_SESSION=${quote(session)};$env:TEST_RECOVERY_RESULT=${quote(result)}
${handler}
throw 'simulated partial installation failure'
`);
   const run=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',harness],{encoding:'utf8',windowsHide:true});assert.equal(run.status,1,run.stdout+run.stderr);assert.match(run.stdout,/simulated partial installation failure/);
   assert.equal(fs.existsSync(result),expected,answer+'/'+host+'/'+changed);if(expected)assert.deepEqual(JSON.parse(fs.readFileSync(result)),['--session',session,'--host','192.0.2.44']);
  }
 }finally{fs.rmSync(folder,{recursive:true,force:true});}
});
