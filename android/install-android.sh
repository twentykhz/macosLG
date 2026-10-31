#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
if ! command -v node >/dev/null 2>&1; then
  printf '%s\n' 'Node.js >=20 is required.' 'Termux: pkg update; pkg install nodejs git curl' 'Shared downloads (optional): termux-setup-storage' 'Linux/macOS: install Node.js >=20 using your system package manager or nodejs.org.' >&2
  exit 2
fi
version=$(node --version)
[[ $version =~ ^v([0-9]+)\. ]] && ((10#${BASH_REMATCH[1]} >= 20)) || { printf '%s\n' 'Node.js >=20 is required. Termux: pkg install nodejs' >&2; exit 2; }
install_dir=$(node <<'GATHIN_BOOTSTRAP_NODE'
'use strict';
// Inlined into the published shell bootstrap, together with the archive reader.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const pin={"version":"3.6.36","url":"https://github.com/twentykhz/macosLG/releases/download/v3.6.36/MAC-WebOSTV-Termux-3.6.36-0497ef5c1d1b.tar.gz","sha256":"0497ef5c1d1b73b558585df7f7012072e25b796895bf607c9c5aa4669dcb3c41","size":22084354,"manifestSha256":"2a0018d1ebac91e00a788fa2970dd0ab74d94cf1283416e2e8f3d05eec587aba"};
const archive=(()=>{const module={exports:{}};'use strict';
// Built-in modules only: portable packages never require a native ZIP/tar tool.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
function safeName(name){
 if(!name||name.includes('\\')||name.includes(':')||name.startsWith('/')||name.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Unsafe archive path: '+name);
 return name;
}
function fileMode(name){return name.endsWith('.sh')?0o755:0o644;}
function tarGzip(files){
 const chunks=[];
 for(const {name,data} of files){
  safeName(name);let short=name,prefix='';
  if(Buffer.byteLength(short)>100){const split=name.lastIndexOf('/');prefix=name.slice(0,split);short=name.slice(split+1);}
  if(Buffer.byteLength(short)>100||Buffer.byteLength(prefix)>155)throw Error('Tar path too long');
  const h=Buffer.alloc(512),oct=(n,at,len)=>h.write(n.toString(8).padStart(len-1,'0')+'\0',at,len);
  h.write(short);h.write(prefix,345);oct(fileMode(name),100,8);oct(0,108,8);oct(0,116,8);oct(data.length,124,12);oct(0,136,12);h.fill(32,148,156);h[156]=48;h.write('ustar\0',257);h.write('00',263);h.write(h.reduce((a,b)=>a+b,0).toString(8).padStart(6,'0')+'\0 ',148);
  chunks.push(h,data,Buffer.alloc((512-data.length%512)%512));
 }
 return zlib.gzipSync(Buffer.concat([...chunks,Buffer.alloc(1024)]),{level:9});
}
function extractTarGzip(bytes,destination){
 const tar=zlib.gunzipSync(bytes,{maxOutputLength:256*1024*1024}),seen=new Set();let ended=false;
 const str=b=>b.toString('utf8').replace(/\0.*$/s,'');
 for(let p=0;p+512<=tar.length;){
  const h=tar.subarray(p,p+512);if(h.every(b=>b===0)){ended=true;break;}
  const num=b=>{const s=str(b).trim();if(!/^[0-7]+$/.test(s))throw Error('Invalid tar number');return parseInt(s,8);};
  let sum=0;for(let i=0;i<512;i++)sum+=i>=148&&i<156?32:h[i];if(sum!==num(h.subarray(148,156)))throw Error('Tar checksum mismatch');
  if(h[156]!==48&&h[156]!==0)throw Error('Only regular files allowed in runtime archive');
  const prefix=str(h.subarray(345,500)),name=safeName((prefix?prefix+'/':'')+str(h.subarray(0,100))),size=num(h.subarray(124,136));
  if(size>64*1024*1024||p+512+size>tar.length||seen.has(name))throw Error('Invalid archive member');seen.add(name);
  const parts=name.split('/');let parent=destination;
  for(const part of parts.slice(0,-1)){parent=path.join(parent,part);if(!fs.existsSync(parent))fs.mkdirSync(parent,{mode:0o700});const st=fs.lstatSync(parent);if(st.isSymbolicLink()||!st.isDirectory())throw Error('Unsafe extraction parent');}
  fs.writeFileSync(path.join(destination,...parts),tar.subarray(p+512,p+512+size),{flag:'wx',mode:fileMode(name)});p+=512+Math.ceil(size/512)*512;
 }
 if(!ended)throw Error('Truncated tar archive');
 return [...seen];
}
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(b){let n=0xffffffff;for(const v of b)n=crcTable[(n^v)&255]^(n>>>8);return (n^0xffffffff)>>>0;}
function zip(files){
 const chunks=[],central=[];let offset=0;
 for(const {name,data} of files){
  safeName(name);const filename=Buffer.from(name),compressed=zlib.deflateRawSync(data,{level:9}),crc=crc32(data),h=Buffer.alloc(30),c=Buffer.alloc(46);
  h.writeUInt32LE(0x04034b50);h.writeUInt16LE(20,4);h.writeUInt16LE(0x800,6);h.writeUInt16LE(8,8);h.writeUInt16LE(0x21,12);h.writeUInt32LE(crc,14);h.writeUInt32LE(compressed.length,18);h.writeUInt32LE(data.length,22);h.writeUInt16LE(filename.length,26);
  c.writeUInt32LE(0x02014b50);c.writeUInt16LE(0x314,4);c.writeUInt16LE(20,6);c.writeUInt16LE(0x800,8);c.writeUInt16LE(8,10);c.writeUInt16LE(0x21,14);c.writeUInt32LE(crc,16);c.writeUInt32LE(compressed.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(filename.length,28);c.writeUInt32LE(((0o100000|fileMode(name))<<16)>>>0,38);c.writeUInt32LE(offset,42);
  chunks.push(h,filename,compressed);central.push(c,filename);offset+=h.length+filename.length+compressed.length;
 }
 const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([...chunks,directory,end]);
}
module.exports={safeName,tarGzip,extractTarGzip,zip};
;return module.exports;})();
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function launcher(base,target){
 const quote=s=>"'"+s.replace(/'/g,"'\"'\"'")+"'";
 const file=path.join(base,'MAC-WebOSTV-AutoSetup.sh'),temp=file+'.new-'+crypto.randomUUID();
 fs.writeFileSync(temp,'#!/usr/bin/env bash\nset -Eeuo pipefail\nexec bash '+quote(path.join(target,'MAC-WebOSTV-AutoSetup.sh'))+' "$@"\n',{mode:0o700});fs.renameSync(temp,file);
}
function verify(directory){
 const file=path.join(directory,'runtime-manifest.json');if(hash(fs.readFileSync(file))!==pin.manifestSha256)throw Error('Runtime manifest checksum mismatch');
 const manifest=JSON.parse(fs.readFileSync(file));if(manifest.version!==pin.version)throw Error('Runtime version mismatch');
 const expected=new Set(['runtime-manifest.json',...manifest.files.map(e=>archive.safeName(e.path))]);
 function walk(folder,prefix=''){for(const item of fs.readdirSync(folder,{withFileTypes:true})){const name=prefix+item.name;if(item.isSymbolicLink())throw Error('Symlink in cached runtime');if(item.isDirectory())walk(path.join(folder,item.name),name+'/');else if(!item.isFile()||!expected.has(name))throw Error('Unexpected cached runtime file: '+name);}}
 walk(directory);
 for(const entry of manifest.files){const name=archive.safeName(entry.path);let p=directory;for(const part of name.split('/')){p=path.join(p,part);if(fs.lstatSync(p).isSymbolicLink())throw Error('Symlink in installed runtime');}if(hash(fs.readFileSync(p))!==entry.sha256)throw Error('Runtime file checksum mismatch: '+name);}
}
async function main(){
 const base=path.join(os.homedir(),'.mac-webostv'),releases=path.join(base,'releases'),target=path.join(releases,pin.version+'-'+pin.sha256.slice(0,12));
 for(const folder of [base,releases]){fs.mkdirSync(folder,{recursive:true,mode:0o700});if(fs.lstatSync(folder).isSymbolicLink())throw Error('Unsafe installation directory');fs.chmodSync(folder,0o700);}
 if(fs.existsSync(target)){
  if(fs.lstatSync(target).isSymbolicLink())throw Error('Unsafe release directory');
  let valid=false;try{verify(target);valid=true;}catch{console.error('Cached release failed verification; downloading a clean copy.');}
  if(valid){launcher(base,target);process.stdout.write(target);return;}
 }
 console.error('Downloading pinned MAC-WebOSTV '+pin.version+' (SHA-256 verified before extraction).');
 const response=await fetch(pin.url,{signal:AbortSignal.timeout(600000)});if(!response.ok)throw Error('Release download HTTP '+response.status);
 const chunks=[];let length=0;for await(const chunk of response.body){length+=chunk.length;if(length>pin.size)throw Error('Download exceeds pinned size');chunks.push(chunk);}const bytes=Buffer.concat(chunks);
 if(length!==pin.size||hash(bytes)!==pin.sha256)throw Error('Release checksum mismatch; nothing executed');
 const incoming=fs.mkdtempSync(path.join(releases,'.incoming-'));let promoted=false;
 try{
  archive.extractTarGzip(bytes,incoming);verify(incoming);
  if(fs.existsSync(target))fs.renameSync(target,target+'.invalid-'+crypto.randomUUID());
  fs.renameSync(incoming,target);promoted=true;launcher(base,target);process.stdout.write(target);
 }finally{if(!promoted)fs.rmSync(incoming,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});

GATHIN_BOOTSTRAP_NODE
)
if ( : </dev/tty ) 2>/dev/null; then
  exec bash "$install_dir/MAC-WebOSTV-AutoSetup.sh" "$@" </dev/tty
else
  exec bash "$install_dir/MAC-WebOSTV-AutoSetup.sh" "$@"
fi
