'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const host=require('../lib/host-platform');
test('Windows state remains unchanged; Linux, Android/Termux and macOS use private home state',()=>{
 const root=path.resolve(__dirname,'..'),home=os.homedir();
 for(const platform of ['linux','android','darwin'])assert.equal(host.stateDirectory(root,{platform,env:{},home}),path.join(home,'.gathintv','state'));
 assert.equal(host.stateDirectory(root,{platform:'win32',env:{},home}),path.join(root,'.local'));
 assert.equal(host.platform({platform:'linux',env:{PREFIX:'/data/data/com.termux/files/usr'}}),'termux');
 assert.equal(host.platform({platform:'win32',env:{TERMUX_VERSION:'fixture'}}),'windows');
 assert.equal(host.stateDirectory(root,{env:{GATHIN_STATE_DIRECTORY:path.join(home,'custom state')}}),path.join(home,'custom state'));
 assert.throws(()=>host.outsideRepository(path.join(root,'state'),root),/outside the repository/);
});
test('Termux shared downloads fall back when missing or denied; explicit backup paths retain spaces',()=>{
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'gathin platform ')),root=path.resolve(__dirname,'..');
 try{
  const options={platform:'android',env:{},home};assert.equal(host.backupDirectory(root,null,options),path.join(home,'GathinTV-Backups'));
  fs.mkdirSync(path.join(home,'storage','downloads'),{recursive:true});assert.equal(host.backupDirectory(root,null,options),path.join(home,'storage','downloads','GathinTV-Backups'));
  const io={...fs,mkdirSync(p,o){if(p.includes('storage'))throw Object.assign(Error('Permission denied'),{code:'EACCES'});return fs.mkdirSync(p,o);}};
  assert.equal(host.backupDirectory(root,null,{...options,fs:io}),path.join(home,'GathinTV-Backups'));
  assert.equal(host.backupDirectory(root,path.join(home,'custom exports'),options),path.join(home,'custom exports'));
 }finally{fs.rmSync(home,{recursive:true,force:true});}
});
