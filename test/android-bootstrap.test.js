'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),vm=require('node:vm'),{spawnSync}=require('node:child_process');
const {tarGzip}=require('../lib/release-archive');const root=path.resolve(__dirname,'..'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function fixture(){const data=Buffer.from('#!/usr/bin/env bash\necho fixture\n'),manifest=Buffer.from(JSON.stringify({version:'3.4.0',files:[{path:'MAC-WebOSTV-AutoSetup.sh',sha256:hash(data)}]})),bytes=tarGzip([{name:'MAC-WebOSTV-AutoSetup.sh',data},{name:'runtime-manifest.json',data:manifest}]);return {bytes,pin:{version:'3.4.0',url:'https://github.com/twentykhz/macosLG/releases/download/v3.4.0/fixture.tar.gz',sha256:hash(bytes),size:bytes.length,manifestSha256:hash(manifest)}};}
async function run(home,pin,bytes){let downloaded=0,output='',error='';const status={stdout:{write:s=>output+=s}};const source=fs.readFileSync(path.join(root,'scripts/bootstrap-android.js'),'utf8').replace('__RELEASE_PIN__',()=>JSON.stringify(pin)).replace('__ARCHIVE_READER__',()=>fs.readFileSync(path.join(root,'lib/release-archive.js'),'utf8'));
 await vm.runInNewContext(source,{Buffer,AbortSignal,process:status,console:{error:s=>error+=s+'\n'},require(name){return name==='node:os'?{homedir:()=>home}:require(name);},async fetch(url){assert.equal(url,pin.url);downloaded++;return {ok:true,body:[bytes]};}});
 return {downloaded,output,error,exitCode:status.exitCode};
}
test('bootstrap verifies pinned archive and cached files; extra native code forces clean download',async()=>{
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'gathin bootstrap ')),{pin,bytes}=fixture();try{
  const first=await run(home,pin,bytes);assert.equal(first.exitCode,undefined,first.error);assert.equal(first.downloaded,1);assert(fs.existsSync(path.join(first.output,'MAC-WebOSTV-AutoSetup.sh')));
  const bash=require('./helpers/host-tools').requireBash(),alias=path.join(home,'.mac-webostv/MAC-WebOSTV-AutoSetup.sh');
  if(spawnSync(bash,['--version']).status===0){const launched=spawnSync(bash,[alias],{encoding:'utf8'});assert.equal(launched.status,0,launched.stderr);assert.match(launched.stdout,/fixture/);}
  assert.equal((await run(home,pin,bytes)).downloaded,0);
  fs.writeFileSync(path.join(first.output,'unexpected.node'),'not executable fixture');const repaired=await run(home,pin,bytes);assert.equal(repaired.exitCode,undefined,repaired.error);assert.equal(repaired.downloaded,1);assert(!fs.existsSync(path.join(repaired.output,'unexpected.node')));
 }finally{fs.rmSync(home,{recursive:true,force:true});}
});
test('bootstrap never extracts or runs a mismatched download',async()=>{
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'gathin rejected ')),{pin,bytes}=fixture();try{const result=await run(home,{...pin,sha256:'0'.repeat(64)},bytes);assert.equal(result.exitCode,1);assert.match(result.error,/checksum mismatch; nothing executed/);assert.deepEqual(fs.readdirSync(path.join(home,'.mac-webostv','releases')),[]);}finally{fs.rmSync(home,{recursive:true,force:true});}
});
