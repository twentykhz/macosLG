'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),zig=process.env.ZIG_BINARY||path.join(root,'.local/tools/zig-x86_64-windows-0.14.1/zig.exe'),source=path.join(root,'payload/portable/input-helper.c'),dest=path.join(root,'payload/portable/native');
if(!fs.existsSync(zig))throw Error('Set ZIG_BINARY to verified Zig 0.14.1. See docs/DEVELOPMENT for its official checksum.');
fs.mkdirSync(dest,{recursive:true});const rows=[];
for(const [arch,target,machine,bits]of [['armv7l','arm-linux-musleabi',40,32],['aarch64','aarch64-linux-musl',183,64]]){
 const file=path.join(dest,'gathin-input-'+arch);cp.execFileSync(zig,['cc','-Os','-static','-s','-fno-sanitize=all','-target',target,source,'-o',file],{stdio:'inherit'});const bytes=fs.readFileSync(file);if(bytes.subarray(0,4).toString('hex')!=='7f454c46'||bytes[5]!==1||bytes[4]!==bits/32||bytes.readUInt16LE(18)!==machine)throw Error('Native helper ABI mismatch');
 const at=bits===64?Number(bytes.readBigUInt64LE(32)):bytes.readUInt32LE(28),size=bytes.readUInt16LE(bits===64?54:42),count=bytes.readUInt16LE(bits===64?56:44);for(let i=0;i<count;i++)if(bytes.readUInt32LE(at+i*size)===3)throw Error('Helper unexpectedly requires a dynamic loader');
 rows.push({arch,file:path.basename(file),bits,eventSize:bits===32?16:24,elfMachine:machine,size:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
fs.writeFileSync(path.join(dest,'manifest.json'),JSON.stringify({protocol:1,compiler:'Zig 0.14.1; static musl',sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),files:rows},null,2)+'\n');
const test=path.join(root,'.local/input-helper-selftest.exe');if(process.platform==='win32'){cp.execFileSync(zig,['cc','-Os',source,'-o',test],{stdio:'inherit'});cp.execFileSync(test,['--self-test'],{stdio:'inherit'});}console.log('Static ARM32/ARM64 helpers built and ELF loader/ABI verified.');
