'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),zlib=require('node:zlib');
const {readBackup}=require('../lib/backup-reader');
function archive(name,data='abc',type='0'){
 const h=Buffer.alloc(512);h.write(name);h.write('0000644\0',100);h.write(data.length.toString(8).padStart(11,'0')+'\0',124);h.fill(32,148,156);h[156]=type.charCodeAt(0);let sum=h.reduce((a,b)=>a+b,0);h.write(sum.toString(8).padStart(6,'0')+'\0 ',148);return zlib.gzipSync(Buffer.concat([h,Buffer.from(data),Buffer.alloc((512-data.length%512)%512),Buffer.alloc(1024)]));
}
function use(bytes,fn){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gathin-backup-'));try{const file=path.join(dir,'owner.tar.gz');fs.writeFileSync(file,bytes);fn(file);}finally{fs.rmSync(dir,{recursive:true});}}
test('backup reader preserves static bytes and ignores links',()=>{use(archive('home/root/test','abc'),file=>assert.deepEqual(readBackup(file),[{path:'/home/root/test',data:'YWJj'}]));use(archive('home/root/link','abc','2'),file=>assert.deepEqual(readBackup(file),[]));});
test('backup reader rejects parent traversal',()=>use(archive('../outside'),file=>assert.throws(()=>readBackup(file),/Invalid backup path/)));
test('backup reader rejects a mismatched checksum sidecar',()=>use(archive('home/root/test'),file=>{fs.writeFileSync(file+'.sha256','0'.repeat(64));assert.throws(()=>readBackup(file),/checksum mismatch/);}));
