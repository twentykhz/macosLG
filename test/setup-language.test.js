'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{spawnSync}=require('node:child_process');
test('PowerShell language selection and YES/CO confirmation accept mixed case and whitespace',{skip:process.platform!=='win32'},()=>{
 const script=`$tokens=$null;$errors=$null;$ast=[System.Management.Automation.Language.Parser]::ParseFile((Join-Path (Get-Location) 'scripts/AutoSetup.template.ps1'),[ref]$tokens,[ref]$errors);if($errors.Count){throw 'Invalid PowerShell template'}
foreach($name in @('L','Test-MacTvConfirmation')){$fn=$ast.Find({param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq $name},$true);Invoke-Expression $fn.Extent.Text}
foreach($value in @('YES','yes','YeS','CO','co','Co','  cO  ')){if(-not (Test-MacTvConfirmation $value)){throw 'Valid confirmation rejected'}}
foreach($value in @('NO','KHONG','y','C','')){if(Test-MacTvConfirmation $value){throw 'Invalid confirmation accepted'}}
$Language='en';if((L 'English' 'Tieng Viet') -ne 'English'){throw 'English failed'}
$Language='vi';if((L 'English' 'Tieng Viet') -ne 'Tieng Viet'){throw 'Vietnamese failed'}
Write-Output 'Language and confirmations OK'`;
 const r=spawnSync('powershell.exe',['-NoProfile','-Command',script],{cwd:path.resolve(__dirname,'..'),encoding:'utf8'});assert.equal(r.status,0,r.stderr||r.stdout);assert.match(r.stdout,/confirmations OK/);
});
