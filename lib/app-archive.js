'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {walk,sha256}=require('./local');
function packApp(directory){
 const chunks=[],files=[];
 function add(name,data){const h=Buffer.alloc(512);if(Buffer.byteLength(name)>100)throw Error('App path too long');h.write(name,0);const oct=(value,at,len)=>h.write(value.toString(8).padStart(len-1,'0')+'\0',at,len,'ascii');oct(0o644,100,8);oct(0,108,8);oct(0,116,8);oct(data.length,124,12);oct(Math.floor(Date.now()/1000),136,12);h.fill(32,148,156);h[156]=48;h.write('ustar\0',257);h.write('00',263);let sum=0;for(const b of h)sum+=b;h.write(sum.toString(8).padStart(6,'0')+'\0 ',148,8);chunks.push(h,data,Buffer.alloc((512-data.length%512)%512));}
 for(const file of walk(directory)){const relative=path.relative(directory,file).split(path.sep).join('/');if(relative==='control-token.js')continue;const bytes=fs.readFileSync(file);add(relative,bytes);files.push({path:relative,sha256:sha256(bytes)});}
 chunks.push(Buffer.alloc(1024));return {bytes:zlib.gzipSync(Buffer.concat(chunks)),files};
}
module.exports={packApp};
