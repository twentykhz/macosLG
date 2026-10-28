'use strict';
// Read-only capture of this project's app and hooks; no accounts or SSH keys.
const fs=require('node:fs');
const path=require('node:path');
const {root,profile,quote,sha256}=require('../lib/local');
const {connect,exec,luna}=require('../lib/ssh');
(async()=>{
  const client=await connect({host:process.argv[2]||'192.168.1.11',port:22,username:'root'});
  try{
    const info=await luna(client,'com.webos.service.tv.systemproperty/getSystemInfo',{keys:['modelName','firmwareVersion','sdkVersion','boardType']});
    require('../lib/local').assertProfile(info);
    const app='/media/developer/apps/usr/palm/applications/'+profile.appId;
    const caps=await require('../lib/tv-capabilities').probe(client);if(!caps.nodeFiles)throw Error('Reference source capture requires Node filesystem support');
    const code='var fs=require("fs"),files=[];function walk(p){fs.readdirSync(p).forEach(function(n){var f=p+"/"+n,s=fs.lstatSync(f);if(s.isDirectory())walk(f);else if(s.isFile())files.push(f);});}walk('+JSON.stringify(app)+');console.log(JSON.stringify(files));';
    const files=JSON.parse(await exec(client,quote(caps.node)+' -e '+quote(code)));
    const hashes=[];
    const mappings=files.map(remote=>[remote,'payload/app/'+remote.slice(app.length+1)]).concat([
      ['/home/root/gathin-home-keyhook.py','payload/home/home-keyhook.py'],
      ['/home/root/gathin-home-launch.sh','payload/home/launch.sh'],
      ['/home/root/gathin-home-replacement/boot.sh','payload/home/boot.sh'],
      ['/var/lib/webosbrew/init.d/41-gathin-home-keyhook','payload/home/41-gathin-home-keyhook'],
      ['/var/lib/webosbrew/lifesgoodwithoutspying.conf','payload/privacy/lifesgoodwithoutspying.conf']
    ]);
    for(const [remote,relative] of mappings){
      const destination=path.join(root,relative);
      const data=await exec(client,'cat '+quote(remote),{binary:true});
      fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,data);
      hashes.push({path:relative,sha256:sha256(data)});
    }
    fs.writeFileSync(path.join(root,'config/captured-baseline.json'),JSON.stringify({capturedAt:new Date().toISOString(),device:info,files:hashes},null,2)+'\n');
    console.log(`Captured ${mappings.length} app/runtime files without changing the TV.`);
  }finally{client.end();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
