'use strict';
// Maintainer command: pin reviewed upstream sources, never a moving main at run time.
const fs=require('node:fs');const path=require('node:path');
const {root,state,sha256}=require('../lib/local');
const commit='a972c95f4f4dbacdb72215409ea0c9eff39dabc1';
const entries=[
 {name:'faultmanager-autoroot.sh',url:`https://raw.githubusercontent.com/throwaway96/faultmanager-autoroot/${commit}/autoroot.sh`},
 {name:'faultmanager-COPYING',url:`https://raw.githubusercontent.com/throwaway96/faultmanager-autoroot/${commit}/COPYING`},
 {name:'hbchannel.ipk',id:'org.webosbrew.hbchannel',version:'0.7.3',url:'https://github.com/webosbrew/webos-homebrew-channel/releases/download/v0.7.3/org.webosbrew.hbchannel_0.7.3_all.ipk',sha256:'d10bf3c753551d7c72fb7a92b20fcd2317e502a220ac668ba8e76f6ea78b363c'},
 {name:'youtube.ipk',id:'youtube.leanback.v4',version:'0.5.3',url:'https://github.com/webosbrew/youtube-webos/releases/download/v0.5.3/youtube.leanback.v4_0.5.3_all.ipk'},
 {name:'privacy.ipk',id:'ooo.lew.lifesgoodwithoutspying',version:'0.7.0',url:'https://github.com/lewisdoesstuff/lifesgoodwithoutspying/releases/download/v0.7.0/ooo.lew.lifesgoodwithoutspying.ipk',sha256:'5725be152fa55696c203a26aabd1dada52ae41a69b5f6f84f8991413190ad10c'},
 {name:'appupdateblocker.ipk',id:'org.webosbrew.appupdateblocker',version:'1.0.0',url:'https://github.com/dr0dr1dr2dr3/lgappupdateblocker/releases/download/1.0.0/org.webosbrew.appupdateblocker_1.0.0_all.ipk'}
];
(async()=>{
 const directory=path.join(state,'assets');fs.mkdirSync(directory,{recursive:true});
 for(const asset of entries){
  const response=await fetch(asset.url,{signal:AbortSignal.timeout(60000)});if(!response.ok)throw new Error(response.status+' '+asset.url);
  const data=Buffer.from(await response.arrayBuffer());const hash=sha256(data);
  if(asset.sha256&&asset.sha256!==hash)throw new Error('Official digest mismatch');
  asset.sha256=hash;asset.size=data.length;fs.writeFileSync(path.join(directory,asset.name),data);
 }
 const config={upstream:'https://github.com/throwaway96/faultmanager-autoroot',commit,reviewedAt:'2026-10-26',autoroot:entries[0],license:entries[1],homebrew:entries[2],apps:entries.slice(3)};
 fs.writeFileSync(path.join(root,'config/bootstrap.json'),JSON.stringify(config,null,2)+'\n');
 console.log('Pinned and verified '+entries.length+' official assets.');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
