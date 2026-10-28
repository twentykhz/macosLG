'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),zlib=require('node:zlib');
const archive=require('../lib/release-archive');
const files=[{name:'scripts/run.js',data:Buffer.from('core fixture')},{name:'path with spaces/GathinTV-AutoSetup.sh',data:Buffer.from('#!/usr/bin/env bash\n')}];
test('ZIP and tar contain only POSIX names and preserve file bytes',()=>{
 const zip=archive.zip(files);let p=0;const names=[];
 while(zip.readUInt32LE(p)===0x04034b50){const size=zip.readUInt32LE(p+18),nameLength=zip.readUInt16LE(p+26),extra=zip.readUInt16LE(p+28),name=zip.subarray(p+30,p+30+nameLength).toString();names.push(name);assert.equal(name.includes('\\'),false);const data=zlib.inflateRawSync(zip.subarray(p+30+nameLength+extra,p+30+nameLength+extra+size));assert.deepEqual(data,files.find(f=>f.name===name).data);p+=30+nameLength+extra+size;}
 assert(names.includes('scripts/run.js'));
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'gathin-tar-'));try{const names=archive.extractTarGzip(archive.tarGzip(files),folder);assert(names.includes('scripts/run.js'));for(const file of files)assert.deepEqual(fs.readFileSync(path.join(folder,...file.name.split('/'))),file.data);if(process.platform!=='win32')assert.equal(fs.statSync(path.join(folder,files[1].name)).mode&0o777,0o755);}finally{fs.rmSync(folder,{recursive:true,force:true});}
});
test('archive handling rejects traversal, backslashes, links, duplicates and corrupt headers',()=>{
 for(const name of ['scripts\\run.js','../outside','/etc/file','C:/outside','safe/../escape'])assert.throws(()=>archive.tarGzip([{name,data:Buffer.alloc(0)}]),/Unsafe archive/);
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'gathin-bad-tar-'));try{
  const original=zlib.gunzipSync(archive.tarGzip(files));
  for(const type of ['traversal','link','checksum']){const tar=Buffer.from(original);if(type==='checksum')tar[1]^=1;else{if(type==='traversal'){tar.fill(0,0,100);tar.write('../escape');}else tar[156]=50;tar.fill(32,148,156);tar.write(tar.subarray(0,512).reduce((a,b)=>a+b,0).toString(8).padStart(6,'0')+'\0 ',148);}assert.throws(()=>archive.extractTarGzip(zlib.gzipSync(tar),folder));}
  assert.throws(()=>archive.extractTarGzip(archive.tarGzip([files[0],files[0]]),folder),/Invalid archive member/);
 }finally{fs.rmSync(folder,{recursive:true,force:true});}
});
test('runtime dependency graph excludes bundled CLI tools and optional native optimizations',()=>{
 const root=path.resolve(__dirname,'..'),packages=require('../lib/production-dependencies').productionPackages(root).map(p=>path.relative(root,p).split(path.sep).join('/'));
 for(const name of ['ssh2','ws','bcrypt-pbkdf','tweetnacl'])assert(packages.includes('node_modules/'+name));
 assert(!packages.some(p=>/cpu-features|nan$|webos-tools|isomorphic-git/.test(p)));
});
