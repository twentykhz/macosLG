'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {state,root,sha256}=require('./local');
async function downloadPinned(asset){
  if(!/^[a-zA-Z0-9_.-]+$/.test(asset.name)||!/^[a-f0-9]{64}$/.test(asset.sha256))throw new Error('Invalid pinned asset');
  const url=new URL(asset.url);
  if(url.protocol!=='https:'||!['github.com','raw.githubusercontent.com'].includes(url.hostname))throw new Error('Unexpected download origin');
  const bundled=path.join(root,'upstream',asset.name);
  if(fs.existsSync(bundled)&&sha256(fs.readFileSync(bundled))===asset.sha256)return bundled;
  const directory=path.join(state,'assets');fs.mkdirSync(directory,{recursive:true});
  const file=path.join(directory,asset.name);
  if(fs.existsSync(file)&&sha256(fs.readFileSync(file))===asset.sha256)return file;
  const response=await fetch(asset.url,{signal:AbortSignal.timeout(60000),headers:{'User-Agent':'lg-sk8000-recovery'}});
  if(!response.ok)throw new Error(`Download failed ${response.status}: ${asset.name}`);
  const declared=Number(response.headers.get('content-length')||0);
  if(declared>32*1024*1024)throw new Error('Asset exceeds limit');
  const chunks=[];let bytes=0;
  for await(const chunk of response.body){bytes+=chunk.length;if(bytes>32*1024*1024)throw new Error('Asset exceeds limit');chunks.push(chunk);}
  const data=Buffer.concat(chunks);
  if(sha256(data)!==asset.sha256)throw new Error(`SHA-256 mismatch: ${asset.name}; no code executed`);
  if(asset.size&&data.length!==asset.size)throw new Error('Pinned asset size mismatch');
  fs.writeFileSync(file+'.partial',data);fs.renameSync(file+'.partial',file);
  return file;
}
function configuration(){return JSON.parse(fs.readFileSync(path.join(root,'config/bootstrap.json')));}
async function prepareAssets(noExtraApps=false){
  const config=configuration();const files={};
  for(const asset of [config.autoroot,config.license,config.homebrew,...(noExtraApps?[]:config.apps)]){
    files[asset.name]=await downloadPinned(asset);
  }
  return {config,files};
}
module.exports={downloadPinned,configuration,prepareAssets};
