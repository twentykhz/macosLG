'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {sandbox}=require('./helpers/tv-sandbox'),ROOTS=require('../config/recovery-roots.json'),{readArchive}=require('../lib/backup-reader'),{packApp}=require('../lib/app-archive');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function prepare(tv){const runtime='/tmp/gathin-portable-fixture/runtime.js';tv.put(runtime,'var GATHIN_ROOTS='+JSON.stringify(ROOTS)+';\n'+fs.readFileSync(path.resolve('scripts/tv-files.js'),'utf8'));let i=0;return async(op,data={})=>{const input='/tmp/gathin-portable-fixture/input-'+(++i)+'.json';tv.put(input,JSON.stringify(data));return JSON.parse(await tv.operation(runtime,op,input));};}
test('Node recovery validates before mutation, compensates an interrupted rename and allows retry',async()=>{
 const tv=sandbox(),run=prepare(tv);try{const metadata=await run('describe'),bytes=tv.archive(metadata.present),stage='/tmp/mac-tv-rollback-fixture';tv.put(stage+'/snapshot.tar.gz',bytes);
 const file=path.join(tv.directory,'snapshot.tar.gz');fs.writeFileSync(file,bytes);const entries=readArchive(file).map(e=>{const {data,...rest}=e;return data===undefined?rest:{...rest,sha256:hash(Buffer.from(data,'base64'))};});
 const record={...metadata,roots:ROOTS,saved:{sha256:hash(bytes)},entries},input={stage,record,tar:['/bin/tar']};
 tv.put(tv.APP+'/control-token.js','changed after backup');await run('rollback-verify',input);assert.equal(tv.io.readFileSync(tv.APP+'/control-token.js','utf8'),'changed after backup');
 const rename=tv.io.renameSync;let failed=false;tv.io.renameSync=(a,b)=>{if(!failed&&b===tv.APP){failed=true;throw Error('Injected rename interruption');}return rename(a,b);};
 await assert.rejects(run('rollback',input),/Injected rename/);assert(failed);assert.equal(tv.io.readFileSync(tv.APP+'/control-token.js','utf8'),'changed after backup');tv.io.renameSync=rename;
 const next='/tmp/mac-tv-rollback-retry';tv.put(next+'/snapshot.tar.gz',bytes);await run('rollback',{...input,stage:next});assert.equal(tv.io.readFileSync(tv.APP+'/control-token.js','utf8'),'window.GATHIN_CONTROL_TOKEN="original";');
 }finally{tv.dispose();}
});
test('same-version portable promotion verifies all files and preserves private wallpaper/token files',async()=>{
 const tv=sandbox(),run=prepare(tv);try{tv.put(tv.APP+'/dock-config.js','window.MAC_DOCK={ids:["com.example.extra"],apps:[]};');const packed=packApp(path.resolve('payload/app')),stage='/tmp/gathin-app-upgrade-fixture';tv.put(stage+'/app.tar.gz',packed.bytes);tv.put(stage+'/manifest.json',JSON.stringify(packed.files));await run('promote',{stage,tar:['/bin/tar']});assert.equal(tv.io.readFileSync(tv.APP+'/control-token.js','utf8'),'window.GATHIN_CONTROL_TOKEN="original";');assert(tv.io.existsSync(tv.APP+'/index.html'));assert.match(tv.io.readFileSync(tv.APP+'/dock-config.js','utf8'),/com.example.extra/);assert(tv.io.existsSync('/media/developer/temp/gathin-app-upgrade-previous/appinfo.json'));
 await run('cleanup',{paths:['/media/developer/temp/gathin-app-upgrade-previous',stage]});assert(!tv.io.existsSync(stage));await assert.rejects(run('cleanup',{paths:['/etc']}),/Unsafe cleanup/);
 }finally{tv.dispose();}
});
