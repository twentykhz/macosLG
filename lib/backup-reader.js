'use strict';
const fs=require('node:fs'),zlib=require('node:zlib'),crypto=require('node:crypto');
function readBackup(file){
 const compressed=fs.readFileSync(file);const side=file+'.sha256';
 if(fs.existsSync(side)){const expected=fs.readFileSync(side,'utf8').trim().split(/\s+/)[0];if(crypto.createHash('sha256').update(compressed).digest('hex')!==expected)throw Error('Backup checksum mismatch');}
 const tar=zlib.gunzipSync(compressed,{maxOutputLength:128*1024*1024});const files=[];let longName=null,pax={};
 const str=b=>b.toString('utf8').replace(/\0.*$/s,'');
 for(let p=0;p+512<=tar.length;){
  const h=tar.subarray(p,p+512);if(h.every(v=>v===0))break;
  const number=b=>{const s=str(b).trim();if(!/^[0-7]*$/.test(s))throw Error('Unsupported tar number');return parseInt(s||'0',8);};
  const size=number(h.subarray(124,136)),stored=number(h.subarray(148,156));let sum=0;for(let i=0;i<512;i++)sum+=(i>=148&&i<156)?32:h[i];if(sum!==stored)throw Error('Tar header checksum mismatch');
  p+=512;if(size>32*1024*1024||p+size>tar.length)throw Error('Invalid backup member size');const data=tar.subarray(p,p+size);p+=Math.ceil(size/512)*512;
  const type=String.fromCharCode(h[156]);let name=str(h.subarray(0,100));const prefix=str(h.subarray(345,500));if(prefix)name=prefix+'/'+name;
  if(type==='L'){longName=str(data);continue;}
  if(type==='x'){pax={};let i=0;while(i<data.length){let space=data.indexOf(32,i),len=Number(data.subarray(i,space).toString());if(space<0||!Number.isInteger(len)||len<=0||i+len>data.length)throw Error('Invalid PAX');const item=data.subarray(space+1,i+len-1).toString(),eq=item.indexOf('=');pax[item.slice(0,eq)]=item.slice(eq+1);i+=len;}continue;}
  name=pax.path||longName||name;pax={};longName=null;
  if(type!=='0'&&type!=='\0')continue;
  name=name.replace(/^(\.\/)+/,'').replace(/^\//,'');if(name.split('/').some(x=>x==='..'||x==='.')||name.includes('\\'))throw Error('Invalid backup path');
  files.push({path:'/'+name,data:data.toString('base64')});
 }
 return files;
}
module.exports={readBackup};
