'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),os=require('os');
test('older backup restores app lock changes across later sessions in reverse order for the same TV',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gathin-lock-history-')),history=require('../lib/app-lock-history'),ssh=require('../lib/ssh'),saved=ssh.luna,calls=[];
 const records=[0,1,2].map(n=>({host:'192.0.2.44',hostFingerprint:'SHA256:same-tv',createdAt:'2026-10-29T0'+n+':00:00Z',folder:path.join(dir,String(n))}));for(const r of records)fs.mkdirSync(r.folder);
 try{
  history.save(records[1],{session:records[1].createdAt,apps:[{id:'other.app',locked:false}]});history.save(records[2],{session:records[2].createdAt,apps:[{id:'other.app',locked:true},{id:'unknown.app',locked:null,restoreLock:false,applied:true},{id:'failed.app',locked:null,restoreLock:false,applied:false}]});
  const current={session:records[2].createdAt,apps:JSON.parse(fs.readFileSync(path.join(records[2].folder,'app-locks-before.json'))).apps},journals=history.collect(records[0],current,records.map(record=>({record})));assert.deepEqual(journals.map(j=>j.session),[records[2].createdAt,records[1].createdAt]);
  ssh.luna=async(c,api,data)=>api.endsWith('/listApps')?{apps:[{id:'other.app'},{id:'unknown.app'},{id:'failed.app'}]}:calls.push(data);await history.restore({},journals);assert.deepEqual(calls,[{id:'other.app',lock:true},{id:'unknown.app',lock:false},{id:'other.app',lock:false}]);
  assert.equal(history.collect({...records[0],hostFingerprint:'SHA256:other'},null,records.map(record=>({record}))).length,0);assert(!history.valid({session:records[0].createdAt,apps:[{id:'$(reboot)',locked:false}]}));
 }finally{ssh.luna=saved;assert(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(dir,{recursive:true,force:true});}
});
