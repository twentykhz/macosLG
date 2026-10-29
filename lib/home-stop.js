'use strict';
const {quote}=require('./local');
async function stop(client){
 const caps=await require('./tv-capabilities').probe(client);
 if(!caps.node)throw Error('HOME stop requires the managed Node runtime; use the saved rollback if it is unavailable');
 const source=`var fs=require('fs'),targets=['/home/root/gathin-home-replacement/observe-home.py','/home/root/gathin-home-keyhook.py'];fs.readdirSync('/proc').forEach(function(p){if(!/^\\d+$/.test(p))return;try{var a=fs.readFileSync('/proc/'+p+'/cmdline','utf8').split('\\0');if(targets.indexOf(a[1])>=0||(a[0]==='/var/lib/webosbrew/gathin-controls/input-helper'&&a[1]==='--home'))process.kill(Number(p),'SIGTERM');}catch(e){}});`;
 await require('./ssh').exec(client,quote(caps.node)+' -e '+quote(source));
}
module.exports={stop};
