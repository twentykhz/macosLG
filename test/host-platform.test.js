'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const host=require('../lib/host-platform');
test('Windows state remains unchanged; Linux, Android/Termux and macOS use private home state',()=>{
 const root=path.resolve(__dirname,'..'),home=path.join(os.tmpdir(),'mac-webostv-path-fixture-'+require('crypto').randomUUID());
 for(const platform of ['linux','android','darwin'])assert.equal(host.stateDirectory(root,{platform,env:{},home}),path.join(home,'.mac-webostv','state'));
 assert.equal(host.stateDirectory(root,{platform:'win32',env:{},home}),path.join(root,'.local'));
 assert.equal(host.platform({platform:'linux',env:{PREFIX:'/data/data/com.termux/files/usr'}}),'termux');
 assert.equal(host.platform({platform:'win32',env:{TERMUX_VERSION:'fixture'}}),'windows');
 assert.equal(host.stateDirectory(root,{env:{GATHIN_STATE_DIRECTORY:path.join(home,'custom state')}}),path.join(home,'custom state'));
 assert.throws(()=>host.outsideRepository(path.join(root,'state'),root),/outside the repository/);
});
test('renamed host state finds legacy backups and keys, preferring the current directory when present',()=>{
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'mac-webostv-state-')),root=path.resolve(__dirname,'..'),legacy=path.join(home,'.gathin'+'tv','state'),current=path.join(home,'.mac-webostv','state');
 try{fs.mkdirSync(legacy,{recursive:true});fs.writeFileSync(path.join(legacy,'saved-key-marker'),'fixture');assert.equal(host.stateDirectory(root,{platform:'linux',env:{},home}),legacy);fs.mkdirSync(current,{recursive:true});assert.equal(host.stateDirectory(root,{platform:'linux',env:{},home}),current);assert.equal(fs.readFileSync(path.join(legacy,'saved-key-marker'),'utf8'),'fixture');}finally{assert(path.resolve(home).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(home,{recursive:true,force:true});}
});
test('Termux shared downloads fall back when missing or denied; explicit backup paths retain spaces',()=>{
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'gathin platform ')),root=path.resolve(__dirname,'..');
 try{
  const options={platform:'android',env:{},home};assert.equal(host.backupDirectory(root,null,options),path.join(home,'MAC-WebOSTV-Backups'));
  fs.mkdirSync(path.join(home,'storage','downloads'),{recursive:true});assert.equal(host.backupDirectory(root,null,options),path.join(home,'storage','downloads','MAC-WebOSTV-Backups'));
  const io={...fs,mkdirSync(p,o){if(p.includes('storage'))throw Object.assign(Error('Permission denied'),{code:'EACCES'});return fs.mkdirSync(p,o);}};
  assert.equal(host.backupDirectory(root,null,{...options,fs:io}),path.join(home,'MAC-WebOSTV-Backups'));
  assert.equal(host.backupDirectory(root,path.join(home,'custom exports'),options),path.join(home,'custom exports'));
 }finally{fs.rmSync(home,{recursive:true,force:true});}
});
