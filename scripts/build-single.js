'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {root,sha256,walk,manifest}=require('../lib/local');
const dist=path.resolve(root,'../GathinTV-Release');fs.mkdirSync(dist,{recursive:true});
const stage=path.resolve(root,'.local/release-stage');
if(!stage.startsWith(path.resolve(root,'.local')+path.sep))throw Error('Unexpected staging path');
if(fs.existsSync(stage))fs.rmSync(stage,{recursive:true});fs.mkdirSync(stage,{recursive:true});
const selected=['payload','packages','config','lib','scripts','test','docs','upstream'];
const omit=new Set(['.local','.git','__pycache__','test','tests','fixtures','examples','bench','benchmark','.github']);
function copy(dir,target,dependency=false){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  if(entry.isSymbolicLink())throw Error('Symlinks excluded from share build');
  if(dependency&&omit.has(entry.name))continue;
  if(entry.name==='control-token.js'||entry.name==='device.json'||entry.name==='access-key'||entry.name==='desktop-pin'||entry.name==='slideshow.json'||/\.(pid|log)$/.test(entry.name)||/\.(pem|key|pyc|sqlite|db)$/.test(entry.name))continue;
  const src=path.join(dir,entry.name),dst=path.join(target,entry.name);
  if(entry.isDirectory()){fs.mkdirSync(dst,{recursive:true});copy(src,dst,dependency);}else fs.copyFileSync(src,dst);
 }
}
for(const name of selected){const target=path.join(stage,name);fs.mkdirSync(target,{recursive:true});copy(path.join(root,name),target,name==='node_modules');}
// Bundle only production dependencies; build tools are restored by npm ci for source users.
const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json')));
for(const [relative,meta] of Object.entries(lock.packages||{})){
 if(!relative.startsWith('node_modules/')||meta.dev||!fs.existsSync(path.join(root,relative)))continue;
 const target=path.join(stage,relative);fs.mkdirSync(target,{recursive:true});copy(path.join(root,relative),target,true);
}
for(const name of ['README.md','README.en.md','Start-Setup.cmd','preview.png','LICENSE','THIRD-PARTY.md','Setup-TV.ps1','Restore-TV.ps1','Wake-TV.ps1','package.json','package-lock.json','checksums.json','.gitignore'])if(fs.existsSync(path.join(root,name)))fs.copyFileSync(path.join(root,name),path.join(stage,name));
const files=walk(stage);const privateNames=files.filter(f=>path.relative(stage,f).split(path.sep).includes('.local')||f.endsWith('control-token.js')||/\.(pem|key|sqlite|db)$/.test(f));
if(privateNames.length)throw Error('Private data leaked into share staging');
fs.writeFileSync(path.join(stage,'release-manifest.json'),JSON.stringify({version:'3.1.1',builtAt:new Date().toISOString(),files:files.map(f=>({path:path.relative(stage,f).split(path.sep).join('/'),sha256:sha256(fs.readFileSync(f))}))},null,2));
const zip=path.join(dist,'GathinTV-Source.zip');
const made=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(root,'scripts/zip.ps1'),'-Source',stage,'-Destination',zip],{stdio:'inherit'});if(made.status!==0)throw Error('ZIP packaging failed');
const bytes=fs.readFileSync(zip),digest=sha256(bytes);const encoded=bytes.toString('base64').match(/.{1,120}/g).join('\r\n');
const template=fs.readFileSync(path.join(root,'scripts/AutoSetup.template.ps1'),'utf8').replace(/^\uFEFF/,'');
const text=template.replace('__PAYLOAD_BASE64__',()=>encoded).replace('__PAYLOAD_SHA256__',digest);
const ps=path.join(dist,'GathinTV-AutoSetup.ps1');fs.writeFileSync(ps,'\uFEFF'+text.replace(/\r?\n/g,'\r\n'));
for(const name of ['Start-Setup.cmd','Wake-TV.ps1'])fs.copyFileSync(path.join(root,name),path.join(dist,name));
fs.copyFileSync(path.join(root,'README.md'),path.join(dist,'HUONG-DAN.md'));
for(const f of [ps,zip])fs.writeFileSync(f+'.sha256',sha256(fs.readFileSync(f))+'  '+path.basename(f)+'\n');
fs.copyFileSync(ps,path.join(root,'GathinTV-AutoSetup.ps1'));
fs.copyFileSync(ps+'.sha256',path.join(root,'GathinTV-AutoSetup.ps1.sha256'));
fs.copyFileSync(path.join(stage,'release-manifest.json'),path.join(root,'release-manifest.json'));
console.log(JSON.stringify({singleFile:ps,bytes:fs.statSync(ps).size,sourceZip:zip,shareFiles:files.length,privateFiles:0},null,2));
