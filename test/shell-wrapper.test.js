'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),bash=require('./helpers/host-tools').requireBash();
const available=spawnSync(bash,['--version'],{encoding:'utf8'}).status===0;
const posix=p=>p.replace(/\\/g,'/').replace(/^([A-Za-z]):/,(_,drive)=>'/'+drive.toLowerCase());
test('Bash wrapper maps every mode and option to the existing core, including paths with spaces',{skip:!available},()=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'gathin shell ')),fixture=path.join(base,'source tree'),home=path.join(base,'private home'),bin=path.join(base,'bin'),capture=path.join(base,'args.json');
 for(const p of [fixture,home,bin,path.join(fixture,'scripts'),path.join(fixture,'lib')])fs.mkdirSync(p,{recursive:true});
 fs.copyFileSync(path.join(repo,'android/MAC-WebOSTV-AutoSetup.sh'),path.join(fixture,'MAC-WebOSTV-AutoSetup.sh'));
 for(const file of ['scripts/host-paths.js','scripts/shell-prompts.sh','lib/host-platform.js'])fs.copyFileSync(path.join(repo,file),path.join(fixture,file));
 for(const name of ['ssh2','ws']){const dir=path.join(fixture,'node_modules',name);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.js'),'module.exports={};');}
 fs.writeFileSync(path.join(fixture,'scripts/verify.js'),'console.log("verification fixture");');fs.writeFileSync(path.join(fixture,'scripts/check-root.js'),'process.exit(0);');
 fs.writeFileSync(path.join(fixture,'scripts/run.js'),`const fs=require('fs');const args=process.argv.slice(2);require(${JSON.stringify(path.join(repo,'scripts/run.js'))}).parse([...args]);fs.writeFileSync(process.env.CAPTURE,JSON.stringify({args,state:process.env.GATHIN_STATE_DIRECTORY,session:process.env.GATHIN_RECOVERY_SESSION,log:process.env.GATHIN_SESSION_LOG}));`);
 fs.writeFileSync(path.join(bin,'node'),'#!/usr/bin/env bash\nif [[ $1 == --version ]]; then printf "%s\\n" "${TEST_NODE_VERSION:-v20.0.0}"; exit 0; fi\nexec "$TEST_REAL_NODE" "$@"\n');fs.chmodSync(path.join(bin,'node'),0o755);
 function run(args,env={}){fs.rmSync(capture,{force:true});const result=spawnSync(bash,['-c','export PATH="$1:$PATH"; shift; exec bash "$@"','--',posix(bin),posix(path.join(fixture,'MAC-WebOSTV-AutoSetup.sh')),...args],{encoding:'utf8',env:{...process.env,HOME:home.replace(/\\/g,'/'),GATHIN_STATE_DIRECTORY:path.join(home,'state'),TEST_REAL_NODE:posix(process.execPath),CAPTURE:capture,...env}});return {...result,record:fs.existsSync(capture)?JSON.parse(fs.readFileSync(capture)):null};}
 try{
  const flags=['--already-rooted','--dry-run','--trust-new-host','--no-reboot','--remove-extra-apps','--key',path.join(home,'root key.pem'),'--developer-key',path.join(home,'developer key.pem'),'--backup-file',path.join(home,'owner backup.tar.gz'),'--output-dir',path.join(home,'backups with spaces')];
  for(const mode of ['Setup','Restore','Doctor','Backup','Apps','Sync','Disable','Rollback']){
   const r=run(['--mode',mode,'--host','192.0.2.44',...flags]);assert.equal(r.status,0,r.stderr+r.stdout);assert.equal(r.record.args[0],mode);assert.deepEqual(r.record.args.slice(1).map(s=>s.replace(/\\/g,'/')),['--host','192.0.2.44',...flags].map(s=>s.replace(/\\/g,'/')));assert(!r.record.session.includes(fixture));assert.notEqual(r.record.session,r.record.log);
  }
  assert.equal(run(['Doctor','192.0.2.44']).status,0);
  const rollback=run(['Rollback','192.0.2.44','--session',path.join(home,'snapshot with spaces.json'),'--yes','--dry-run']);assert.equal(rollback.status,0,rollback.stderr);assert(rollback.record.args.includes('--session'));assert(rollback.record.args.includes('--yes'));
  assert.equal(run(['Setup','192.0.2.44','--expected-model','55SK8000PTA','--expected-firmware','05.50.70']).status,0);
  const passphrase=run(['Setup','192.0.2.44','--expected-model','F02CFB','--expected-firmware','05.50.70']);assert.equal(passphrase.status,2);assert.equal(passphrase.record,null);assert.match(passphrase.stderr,/not the Developer Mode passphrase/);
  const webos=run(['Setup','192.0.2.44','--expected-model','55SK8000PTA','--expected-firmware','4.4.0']);assert.equal(webos.status,2);assert.equal(webos.record,null);
  const auto=run(['Setup','192.0.2.44']);assert.equal(auto.status,0,auto.stderr);assert(!auto.record.args.includes('--expected-firmware'));assert.match(auto.stdout,/AUTO/);
  const skipped=run(['Setup','192.0.2.44','--skip-preflight','--expected-model','55QNED80SQA']);assert.equal(skipped.status,0,skipped.stderr);assert(skipped.record.args.includes('55QNED80SQA'));assert(!skipped.record.args.includes('--skip-preflight'));assert(!skipped.record.args.includes('--expected-firmware'));
  for(const args of [['--mode','Doctor'],['Doctor','http://tv'],['Doctor','tv','--unknown'],['Doctor','tv','--key']]){const r=run(args);assert.equal(r.status,2,r.stderr);assert.equal(r.record,null);}
  const older=run(['Doctor','tv'],{TEST_NODE_VERSION:'v19.9.0'});assert.equal(older.status,2);assert.match(older.stderr,/>=20/);
  const backup=run(['Backup','tv'],{PREFIX:'/data/data/com.termux/files/usr'});assert.equal(backup.status,0,backup.stderr);assert.match(backup.stdout,/Backup destination:/);assert(backup.record.args.at(-1).endsWith('MAC-WebOSTV-Backups'));
  fs.mkdirSync(path.join(home,'storage','downloads'),{recursive:true});const shared=run(['Backup','tv'],{PREFIX:'/data/data/com.termux/files/usr'});assert.equal(shared.status,0,shared.stderr);assert(shared.record.args.at(-1).includes('storage/downloads/'));
  fs.unlinkSync(path.join(fixture,'node_modules/ws/index.js'));const missingDependency=run(['Doctor','tv']);assert.equal(missingDependency.status,2);assert.match(missingDependency.stderr,/npm ci --omit=dev --omit=optional --ignore-scripts/);
 }finally{fs.rmSync(base,{recursive:true,force:true});}
});
test('missing system Node prints Termux prerequisites without running a package manager',{skip:!available},()=>{
 const r=spawnSync(bash,['-c','PATH=/no-such-directory; export PATH; source "$1" --mode Doctor --host tv','--',posix(path.join(repo,'android/MAC-WebOSTV-AutoSetup.sh'))],{encoding:'utf8',env:{...process.env,PREFIX:'/data/data/com.termux/files/usr'}});assert.equal(r.status,2,r.stderr);assert.match(r.stderr,/pkg install nodejs/);assert.match(r.stderr,/OpenSSH is optional/);
});
test('both shell entry templates have valid Bash syntax and use LF',{skip:!available},()=>{
 for(const name of ['android/MAC-WebOSTV-AutoSetup.sh','scripts/shell-prompts.sh','scripts/install-android.template.sh']){assert(!fs.readFileSync(path.join(repo,name)).includes(13));const r=spawnSync(bash,['-n',posix(path.join(repo,name))],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);}
});
function prompt(command,input,language='vi'){
 return spawnSync(bash,['-c','set -Eeuo pipefail; source "$1"; '+command,'--',posix(path.join(repo,'scripts/shell-prompts.sh'))],{encoding:'utf8',input,env:{...process.env,GATHIN_LANGUAGE:language}});
}
test('Termux menu explains rooted/unrooted branches and retries invalid choices',{skip:!available},()=>{
 const r=prompt('shell_menu; printf "MODE=%s\\n" "$mode"','wrong\n1\n');assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/TV CHUA ROOT/);assert.match(r.stdout,/TV DA ROOT/);assert.match(r.stderr,/Nhap so tu 0 den 9/);assert.match(r.stdout,/MODE=Setup/);
 for(const [input,mode]of [['TV chua root','Setup'],['TV chưa root','Setup'],['2','Restore'],['3','Doctor'],['4','Debloat'],['5','Rollback'],['6','Backup'],['7','Apps'],['8','Sync'],['9','Disable'],['0','Exit']]){const r=prompt('shell_menu; printf "MODE=%s\\n" "$mode"',input+'\n');assert.equal(r.status,0,r.stderr);assert(r.stdout.includes('MODE='+mode));}
 assert.equal(prompt('shell_menu','').status,2);
});
test('Termux model prompt rejects Developer Mode passphrase and firmware prompt retries webOS version',{skip:!available},()=>{
 const r=prompt('shell_model; shell_firmware; printf "RESULT=%s/%s\\n" "$model" "$firmware"','F02CFB\nOLED65C2PSA\n4.4.0\nF02CFB\n33.31.68\n');assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/KHONG nhap passphrase/);assert.match(r.stderr,/khong phai model/);assert.match(r.stderr,/00\.00\.00/);assert.match(r.stdout,/RESULT=OLED65C2PSA\/33\.31\.68/);
 const alternate=prompt('shell_model; shell_firmware; printf "RESULT=%s/%s\\n" "$model" "$firmware"','55SK8000PTA\n05.50.70\n','en');assert.equal(alternate.status,0,alternate.stderr);assert.match(alternate.stdout,/Do NOT enter the 6-character/);assert.match(alternate.stdout,/RESULT=55SK8000PTA\/05\.50\.70/);
});
test('Termux language prompt retries and exports Vietnamese selection',{skip:!available},()=>{
 const r=prompt('unset GATHIN_LANGUAGE; shell_language; printf "LANG=%s\\n" "$GATHIN_LANGUAGE"','invalid\n2\n');assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/LANG=vi/);assert.match(r.stderr,/Nhap so 1 hoac 2/);
});
test('Termux Enter or SKIP uses authenticated detection instead of inventing webOS22 firmware',{skip:!available},()=>{
 for(const input of ['\n','SKIP\n','AUTO\n']){const r=prompt('model=""; firmware=""; skip_preflight=false; shell_model; printf "SKIP=%s/MODEL=%s\\n" "$skip_preflight" "$model"',input);assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/SKIP=true\/MODEL=\n/);}
 const r=prompt('model=55QNED80SQA; firmware=""; skip_preflight=false; shell_firmware; printf "SKIP=%s/MODEL=%s/FW=%s\\n" "$skip_preflight" "$model" "$firmware"','webOS22 / 7.6.0-1901\nSKIP\n');assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/Cap nhat phan mem/);assert.match(r.stdout,/SKIP=true\/MODEL=55QNED80SQA\/FW=\n/);
});
