'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const {downloadPinned,configuration}=require('../lib/assets');
const {state,sha256}=require('../lib/local');
function asset(){const data=Buffer.from('immutable reviewed artifact');return {data,pin:{name:'test-'+crypto.randomUUID()+'.bin',url:'https://github.com/example/project/releases/download/v1/test.bin',size:data.length,sha256:sha256(data)}};}
test('pinned cached bytes are accepted without network access',async t=>{
 const {data,pin}=asset();const file=path.join(state,'assets',pin.name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,data);
 t.mock.method(global,'fetch',()=>{throw new Error('Network must not be used');});
 try{assert.equal(await downloadPinned(pin),file);}finally{fs.unlinkSync(file);}
});
test('changed downloaded code is rejected before it can be cached or executed',async t=>{
 const {pin}=asset();const file=path.join(state,'assets',pin.name);
 t.mock.method(global,'fetch',async()=>new Response('changed upstream content',{status:200}));
 await assert.rejects(downloadPinned(pin),/SHA-256 mismatch/);assert.equal(fs.existsSync(file),false);
});
test('untrusted download origins are refused',async()=>{
 const {pin}=asset();await assert.rejects(downloadPinned({...pin,url:'http://github.com/test'}),/origin/);
 await assert.rejects(downloadPinned({...pin,url:'https://example.com/test'}),/origin/);
});
test('root configuration uses immutable faultmanager source and pinned package versions',()=>{
 const config=configuration();assert.equal(config.upstream,'https://github.com/throwaway96/faultmanager-autoroot');
 assert.match(config.commit,/^[a-f0-9]{40}$/);assert(config.autoroot.url.includes('/'+config.commit+'/'));
 for(const entry of [config.autoroot,config.license,config.homebrew,...config.apps]){assert.match(entry.sha256,/^[a-f0-9]{64}$/);assert(entry.size>0);assert(!entry.url.includes('/latest/'));}
});
