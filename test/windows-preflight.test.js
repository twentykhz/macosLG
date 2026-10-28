'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
test('Windows preflight accepts AUTO/SKIP and distinguishes webOS22 from firmware',{skip:process.platform!=='win32'},()=>{
 const script=`$ErrorActionPreference='Stop'
$tokens=$null;$errors=$null;$ast=[System.Management.Automation.Language.Parser]::ParseFile((Join-Path (Get-Location) 'scripts/AutoSetup.template.ps1'),[ref]$tokens,[ref]$errors);if($errors.Count){throw 'Invalid PowerShell template'}
foreach($name in @('L','Read-MacTvPreflight')){$fn=$ast.Find({param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq $name},$true);Invoke-Expression $fn.Extent.Text}
$Language='vi'
function Read-Host {param($Prompt) if(-not $script:answers.Count){throw 'Unexpected extra prompt'};return $script:answers.Dequeue()}
function Inputs([string[]]$items){$script:answers=New-Object 'System.Collections.Generic.Queue[string]';foreach($item in $items){$script:answers.Enqueue($item)}}
Inputs @('');$r=Read-MacTvPreflight '' '' $false;if(-not $r.Skip -or $r.Model -or $r.Firmware){throw 'Enter AUTO failed'}
Inputs @('SKIP');$r=Read-MacTvPreflight '55QNED80SQA' '' $false;if(-not $r.Skip -or $r.Model -ne '55QNED80SQA' -or $r.Firmware){throw 'Firmware skip failed'}
Inputs @('webOS22 / 7.6.0-1901','SKIP');$r=Read-MacTvPreflight '55QNED80SQA' '' $false;if(-not $r.Skip -or $r.Firmware){throw 'OS was treated as firmware'}
Inputs @('F02CFB','55QNED80SQA','03.33.65');$r=Read-MacTvPreflight '' '' $false;if($r.Skip -or $r.Model -ne '55QNED80SQA' -or $r.Firmware -ne '03.33.65'){throw 'Manual retry failed'}
Inputs @();$r=Read-MacTvPreflight '' '' $true;if(-not $r.Skip){throw 'Switch skip failed'}
Inputs @();$r=Read-MacTvPreflight '55QNED80SQA' '03.33.65' $false;if($r.Skip){throw 'Known manual values failed'}
Write-Output 'Windows AUTO/SKIP preflight OK'`;
 const r=spawnSync('powershell.exe',['-NoProfile','-Command',script],{encoding:'utf8'});assert.equal(r.status,0,r.stderr||r.stdout);assert.match(r.stdout,/Windows AUTO\/SKIP preflight OK/);
});
