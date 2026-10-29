'use strict';
const fs=require('node:fs'),path=require('node:path'),archive=require('../lib/release-archive');
const {root,sha256,walk,manifest}=require('../lib/local');
const dist=path.resolve(root,'../MAC-WebOSTV-Release');fs.mkdirSync(dist,{recursive:true});
const stage=path.resolve(root,'.local/release-stage');
if(!stage.startsWith(path.resolve(root,'.local')+path.sep))throw Error('Unexpected staging path');
if(fs.existsSync(stage))fs.rmSync(stage,{recursive:true});fs.mkdirSync(stage,{recursive:true});
const selected=['payload','packages','config','lib','scripts','test','docs','upstream','windows','android'];
const omit=new Set(['.local','.git','__pycache__','test','tests','fixtures','examples','bench','benchmark','.github']);
function copy(dir,target,dependency=false){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  if(entry.isSymbolicLink())throw Error('Symlinks excluded from share build');
  if(dependency&&(omit.has(entry.name)||entry.name==='build'||entry.name==='node_modules'||entry.name.endsWith('.node')))continue;
  if(entry.name==='control-token.js'||entry.name==='device.json'||entry.name==='access-key'||entry.name==='desktop-pin'||entry.name==='slideshow.json'||/\.(pid|log)$/.test(entry.name)||/\.(pem|key|pyc|sqlite|db)$/.test(entry.name))continue;
  if(dir===path.join(root,'android')&&entry.name==='install-android.sh')continue;
  const src=path.join(dir,entry.name),dst=path.join(target,entry.name);
  if(entry.isDirectory()){fs.mkdirSync(dst,{recursive:true});copy(src,dst,dependency);}else fs.copyFileSync(src,dst);
 }
}
for(const name of selected){const target=path.join(stage,name);fs.mkdirSync(target,{recursive:true});copy(path.join(root,name),target,name==='node_modules');}
// Bundle only production dependencies; build tools are restored by npm ci for source users.
for(const directory of require('../lib/production-dependencies').productionPackages(root)){
 const target=path.join(stage,path.relative(root,directory));fs.mkdirSync(target,{recursive:true});copy(directory,target,true);
}
for(const name of ['.gitattributes','README.md','README.en.md','LICENSE','THIRD-PARTY.md','package.json','package-lock.json','checksums.json','.gitignore'])if(fs.existsSync(path.join(root,name)))fs.copyFileSync(path.join(root,name),path.join(stage,name));
// Retain the installed shell entry path used by existing phone launchers.
fs.copyFileSync(path.join(root,'android/MAC-WebOSTV-AutoSetup.sh'),path.join(stage,'MAC-WebOSTV-AutoSetup.sh'));
const files=walk(stage);const privateNames=files.filter(f=>path.relative(stage,f).split(path.sep).includes('.local')||f.endsWith('control-token.js')||/\.(pem|key|sqlite|db)$/.test(f));
if(privateNames.length)throw Error('Private data leaked into share staging');
const version=require('../package.json').version;
const readFiles=list=>list.map(file=>({name:path.relative(stage,file).split(path.sep).join('/'),data:fs.readFileSync(file)})).sort((a,b)=>a.name.localeCompare(b.name,'en'));
// Keep text guides on phones; omit developer tests and screenshot media.
const runtimeFiles=readFiles(files).filter(f=>!f.name.startsWith('test/')&&!f.name.startsWith('windows/')&&!/\.(ps1|cmd)$/i.test(f.name)&&(!f.name.startsWith('docs/')||f.name.endsWith('.md')));
const runtimeManifest=Buffer.from(JSON.stringify({version,files:runtimeFiles.map(f=>({path:f.name,sha256:sha256(f.data)}))},null,2));
fs.writeFileSync(path.join(stage,'runtime-manifest.json'),runtimeManifest);
const runtime=archive.tarGzip([...runtimeFiles,{name:'runtime-manifest.json',data:runtimeManifest}]);
const runtimeHash=sha256(runtime),runtimeName='MAC-WebOSTV-Termux-'+version+'-'+runtimeHash.slice(0,12)+'.tar.gz';
fs.writeFileSync(path.join(dist,runtimeName),runtime);fs.writeFileSync(path.join(dist,runtimeName+'.sha256'),runtimeHash+'  '+runtimeName+'\n');
const pin={version,url:'https://github.com/twentykhz/macosLG/releases/download/v'+version+'/'+runtimeName,sha256:runtimeHash,size:runtime.length,manifestSha256:sha256(runtimeManifest)};
const bootstrapJS=fs.readFileSync(path.join(root,'scripts/bootstrap-android.js'),'utf8').replace('__RELEASE_PIN__',()=>JSON.stringify(pin)).replace('__ARCHIVE_READER__',()=>fs.readFileSync(path.join(root,'lib/release-archive.js'),'utf8'));
const bootstrap=fs.readFileSync(path.join(root,'scripts/install-android.template.sh'),'utf8').replace('__BOOTSTRAP_JS__',()=>bootstrapJS).replace(/\r\n/g,'\n');
for(const target of [path.join(root,'android/install-android.sh'),path.join(stage,'android/install-android.sh'),path.join(dist,'install-android.sh')]){fs.writeFileSync(target,bootstrap);fs.chmodSync(target,0o755);}
fs.writeFileSync(path.join(dist,'MAC-WebOSTV-Termux-manifest.json'),JSON.stringify({...pin,bootstrapSha256:sha256(Buffer.from(bootstrap))},null,2)+'\n');
const share=walk(stage);fs.writeFileSync(path.join(stage,'release-manifest.json'),JSON.stringify({version,builtAt:new Date().toISOString(),files:share.map(f=>({path:path.relative(stage,f).split(path.sep).join('/'),sha256:sha256(fs.readFileSync(f))}))},null,2));
const zip=path.join(dist,'MAC-WebOSTV-Source.zip');fs.writeFileSync(zip,archive.zip(readFiles(walk(stage))));
const bytes=fs.readFileSync(zip),digest=sha256(bytes);const encoded=bytes.toString('base64').match(/.{1,120}/g).join('\r\n');
const template=fs.readFileSync(path.join(root,'scripts/AutoSetup.template.ps1'),'utf8').replace(/^\uFEFF/,'');
const text=template.replace('__PAYLOAD_BASE64__',()=>encoded).replace('__PAYLOAD_SHA256__',digest);
const ps=path.join(dist,'MAC-WebOSTV-AutoSetup.ps1');fs.writeFileSync(ps,'\uFEFF'+text.replace(/\r?\n/g,'\r\n'));
for(const name of ['Start-Setup.cmd','Wake-TV.ps1'])fs.copyFileSync(path.join(root,'windows',name),path.join(dist,name));
fs.copyFileSync(path.join(root,'README.md'),path.join(dist,'HUONG-DAN.md'));
fs.copyFileSync(path.join(root,'README.en.md'),path.join(dist,'HUONG-DAN.en.md'));
// Share the Vietnamese documentation with a separate English companion archive.
for(const [language,names] of Object.entries({vi:['README.md','docs/CHANGELOG-v3.4.1.md','docs/PYTHON-COMPATIBILITY.md','docs/VALIDATION.md','docs/ROLLBACK.vi.md','docs/CHANGELOG-v3.6.0.md','docs/INSTALL.vi.md','docs/ANDROID.vi.md'],en:['README.en.md','docs/CHANGELOG-v3.4.1.en.md','docs/PYTHON-COMPATIBILITY.en.md','docs/VALIDATION.en.md','docs/ROLLBACK.en.md','docs/CHANGELOG-v3.6.0.en.md','docs/INSTALL.en.md','docs/ANDROID.en.md']})){
 names.push('windows/README'+(language==='en'?'.en':'')+'.md','android/README'+(language==='en'?'.en':'')+'.md','docs/README'+(language==='en'?'.en':'')+'.md','docs/DEVELOPMENT.'+language+'.md','docs/FEATURES.'+language+'.md','docs/ROOTING-METHODS.md','docs/HOME-ROOT-RECOVERY.md','docs/KEEP-NINE.md','docs/NANO753PR.'+language+'.md');
 const name='MAC-WebOSTV-Docs-'+version+'-'+language+'.zip',bytes=archive.zip(names.map(name=>({name,data:fs.readFileSync(path.join(root,name))})));
 fs.writeFileSync(path.join(dist,name),bytes);fs.writeFileSync(path.join(dist,name+'.sha256'),sha256(bytes)+'  '+name+'\n');
}
for(const f of [ps,zip])fs.writeFileSync(f+'.sha256',sha256(fs.readFileSync(f))+'  '+path.basename(f)+'\n');
const windowsName='MAC-WebOSTV-Windows-'+version+'.zip';
const windowsZip=archive.zip(['MAC-WebOSTV-AutoSetup.ps1','MAC-WebOSTV-AutoSetup.ps1.sha256','Start-Setup.cmd','Wake-TV.ps1'].map(name=>({name,data:fs.readFileSync(path.join(dist,name))})).concat([
 ...['README.md','README.en.md'].map(name=>({name,data:Buffer.from(fs.readFileSync(path.join(root,'windows',name),'utf8').replace(/\]\(\.\.\//g,'](https://github.com/twentykhz/macosLG/blob/main/'))}))
]));
fs.writeFileSync(path.join(dist,windowsName),windowsZip);
fs.writeFileSync(path.join(dist,windowsName+'.sha256'),sha256(windowsZip)+'  '+windowsName+'\n');
fs.copyFileSync(ps,path.join(root,'MAC-WebOSTV-AutoSetup.ps1'));
fs.copyFileSync(ps+'.sha256',path.join(root,'MAC-WebOSTV-AutoSetup.ps1.sha256'));
fs.copyFileSync(path.join(stage,'release-manifest.json'),path.join(root,'release-manifest.json'));
console.log(JSON.stringify({singleFile:ps,bytes:fs.statSync(ps).size,sourceZip:zip,shareFiles:files.length,privateFiles:0,termux:path.join(dist,runtimeName)},null,2));
