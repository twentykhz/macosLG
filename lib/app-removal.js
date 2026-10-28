'use strict';
async function remove(client,id){
 if(!['com.palmdts.devmode','com.gathin.tvhome','youtube.leanback.v4','ooo.lew.lifesgoodwithoutspying'].includes(id))throw Error('App removal outside provisioning/recovery scope');
 const ssh=require('./ssh');let {apps=[]}=await ssh.luna(client,'com.webos.applicationManager/listApps');if(!apps.some(a=>a.id===id))return;
 await ssh.removePackage(client,id);
 for(let n=0;n<10;n++){({apps=[]}=await ssh.luna(client,'com.webos.applicationManager/listApps'));if(!apps.some(a=>a.id===id))return;await new Promise(r=>setTimeout(r,500));}
 throw Error('App removal not confirmed; refusing subsequent provisioning: '+id);
}
module.exports={remove};
