'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),zlib=require('node:zlib');
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'mac-tv-recovery-'));process.env.GATHIN_STATE_DIRECTORY=folder;
const {sha256}=require('../lib/local'),ROOTS=require('../config/recovery-roots.json');
function tar(entries){const chunks=[];for(const e of entries){const b=Buffer.from(e.data||''),h=Buffer.alloc(512);h.write(e.path.replace(/^\//,''));h.write('0000644\0',100);h.write(b.length.toString(8).padStart(11,'0')+'\0',124);h.fill(32,148,156);h[156]=(e.type||'0').charCodeAt(0);if(e.target)h.write(e.target,157);h.write(h.reduce((a,b)=>a+b,0).toString(8).padStart(6,'0')+'\0 ',148);chunks.push(h,b,Buffer.alloc((512-b.length%512)%512));}return zlib.gzipSync(Buffer.concat([...chunks,Buffer.alloc(1024)]));}
let captures=0,uploads=0,recoveryFails=false,wrongTV=false;
const device={modelName:'fixture',firmwareVersion:'01.00.00',boardType:'test'},source=tar([{path:ROOTS[0]+'/control-token.js',data:'private test token'}]);
require('../lib/ssh');require.cache[require.resolve('../lib/ssh')].exports={
 async exec(c,command){if(command==='id -u')return '0';if(command.includes('restore.py')){if(recoveryFails)throw Error('Recovery channel lost');return 'Restored';}return JSON.stringify({present:[ROOTS[0]],active:[],parents:Object.fromEntries(ROOTS.map(p=>[p,path.posix.dirname(p)]))});},
 async archive(c,files,destination){captures++;fs.writeFileSync(destination,source);return {file:destination,size:source.length,sha256:sha256(source)};},
 async luna(c,api){return api.includes('getSystemInfo')?{...device,modelName:wrongTV?'another TV':device.modelName}:{};},
 async connect(){return {end(){}};},async upload(){uploads++;}
};
const recovery=require('../lib/recovery');
let record;const options={host:'192.0.2.44',recoverySession:path.join(folder,'session.json')};
test('first snapshot is durable, includes private runtime roots, and is never replaced mid-session',async()=>{
 record=await recovery.capture({},options,{info:device,apps:[]});assert.equal(captures,1);assert(fs.existsSync(record.saved.file+'.sha256'));
 recovery.markMutation(options,'failed update');const again=await recovery.capture({},options,{info:device,apps:[{id:'newly installed'}]});assert.equal(captures,1);assert.equal(again.saved.sha256,record.saved.sha256);assert.deepEqual(again.apps,[]);assert(again.mutationsStarted);
 for(const name of ['gathin-remote','gathin-controls','gathin-wallpaper'])assert(ROOTS.some(p=>p.endsWith('/'+name)));
});
test('no snapshot and wrong-host sessions refuse mutations',()=>{
 assert.throws(()=>recovery.markMutation({host:options.host,recoverySession:path.join(folder,'missing.json')}),/backup is required/);
 assert.throws(()=>recovery.markMutation({...options,host:'192.0.2.45'}),/another TV/);
});
test('snapshot checksum, out-of-scope paths and symlink traversal are rejected',()=>{
 const file=path.join(folder,'bad.tar.gz');
 for(const [entries,message] of [[[{path:'/etc/passwd',data:'bad'}],/outside snapshot/],[[{path:ROOTS[0]+'/link',type:'2',target:'/etc'}],/Unsafe recovery symlink/],[[{path:ROOTS[0]+'/link',type:'2',target:ROOTS[1]},{path:ROOTS[0]+'/link/child',data:'bad'}],/descends through a symlink/]]){const bytes=tar(entries);fs.writeFileSync(file,bytes);assert.throws(()=>recovery.validateSnapshot({...record,saved:{file,sha256:sha256(bytes)}}),message);}
 assert.throws(()=>recovery.validateSnapshot({...record,saved:{...record.saved,sha256:'0'.repeat(64)}}),/checksum mismatch/);
});
test('rollback verifies TV identity before upload and preserves retry record on recovery failure',async()=>{
 wrongTV=true;await assert.rejects(recovery.rollback(options),/identity mismatch/);assert.equal(uploads,0);wrongTV=false;
 recoveryFails=true;await assert.rejects(recovery.rollback(options),/channel lost/);assert(recovery.loadSession(options).mutationsStarted);recoveryFails=false;
 await recovery.rollback(options);assert.equal(recovery.loadSession(options).mutationsStarted,false);assert(recovery.loadSession(options).rolledBackAt);
});
test.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
