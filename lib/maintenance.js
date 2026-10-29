'use strict';
const fs=require('fs'),path=require('path'),{root,state,quote}=require('./local'),ssh=require('./ssh');
const DIR='/var/lib/webos-debloat/gathin-final',APP='/media/developer/apps/usr/palm/applications/ooo.lew.lifesgoodwithoutspying';
async function install(client,options={},device){
 if(options.dryRun)return {feature:'debloat-privacy',status:'manual-check-required',detail:'Read-only plan'};
 const caps=await require('./tv-capabilities').probe(client);if(!caps.nodeFiles)throw Error('Maintenance requires verified Node runtime');
 const privacyApp=device?.apps?.find(a=>a.id==='ooo.lew.lifesgoodwithoutspying');
 if(privacyApp?.version!=='0.7.0')throw Error('Privacy activation requires audited LGWS 0.7.0. Install the pinned package before applying this profile; existing unknown versions are preserved.');
 const record=require('./recovery').markMutation(options,'reversible debloat and privacy');
 const policy={...require('../config/setup-policy.json'),debloatMode:options.strictApps?'keep-nine':'optional'};
 const temp=fs.mkdtempSync(path.join(state,'maintenance-'));
 async function put(name,body,target,mode='644'){const file=path.join(temp,name);fs.writeFileSync(file,body);await ssh.upload(client,file,target,mode);}
 try{
  await ssh.exec(client,'mkdir -p '+quote(DIR+'/privacy-lists'));
  await ssh.upload(client,path.join(root,'payload/portable/maintenance.js'),DIR+'/maintenance.js');
  await put('policy.json',JSON.stringify(policy),DIR+'/policy.json');
  const priorPrivacyActive=(await ssh.exec(client,'. '+quote(APP+'/init/nospy-lib.sh')+'; if hosts_ours_active; then echo ACTIVE; fi')).trim()==='ACTIVE';
  await put('journal.json',JSON.stringify({session:record.createdAt,apps:[],priorPrivacyActive}),DIR+'/journal.json','600');
  await put('privacy.conf',Object.entries(policy.privacy).map(([k,v])=>k+'='+v).join('\n')+'\n','/var/lib/webosbrew/lifesgoodwithoutspying.conf','600');
  for(const [hook,mode,marker]of [['35-gathin-debloat','debloat','DEBLOAT'],['50-lifesgoodwithoutspying','privacy','LGWS']]){
   const body='#!/bin/sh\n[ -e /home/root/DISABLE-GATHIN-'+marker+' ] && exit 0\nPATH=/var/lib/webosbrew/gathin-controls/bin:$PATH\nexport PATH\n'+'PATH=/var/lib/webosbrew/gathin-controls/bin:$PATH '+quote(caps.node)+' '+quote(DIR+'/maintenance.js')+' '+mode+' >> '+quote(DIR+'/'+mode+'.log')+' 2>&1 </dev/null &\n';
   await put(hook,body,'/var/lib/webosbrew/init.d/'+hook,'755');
  }
  await ssh.exec(client,'rm -f /home/root/DISABLE-GATHIN-DEBLOAT /home/root/DISABLE-GATHIN-LGWS');
  console.log(await ssh.exec(client,'PATH=/var/lib/webosbrew/gathin-controls/bin:$PATH '+quote(caps.node)+' '+quote(DIR+'/maintenance.js')+' debloat',{timeout:180000}));
  const appReport=options.strictApps?JSON.parse(await ssh.exec(client,'cat '+quote(DIR+'/debloat-report.json'))):null;
  await ssh.exec(client,'PATH=/var/lib/webosbrew/gathin-controls/bin:$PATH '+quote(caps.node)+' '+quote(DIR+'/maintenance.js')+' privacy',{timeout:180000});
  await ssh.exec(client,'PATH=/var/lib/webosbrew/gathin-controls/bin:$PATH; export PATH; . '+quote(APP+'/init/nospy-lib.sh')+'; hosts_ours_active || { echo "LGWS hosts protection not active" >&2; exit 1; }');
  return {feature:'debloat-privacy',status:appReport?.failed.length?'needs-attention':'verified',appReport,detail:appReport?'Keep-nine app locks applied; required system components/HDMI retained. See disabled, failed and missing lists. Rollback restores known lock states; locks applied with unknown original state are released.':'Optional apps processed; ACR/ads/telemetry blocking applied. Voice, ThinQ, casting, SDP and Content Store preserved by policy.'};
 }finally{
  try{const journal=JSON.parse(await ssh.exec(client,'cat '+quote(DIR+'/journal.json')+' 2>/dev/null || true'));if(journal.session===record.createdAt)require('./app-lock-history').save(record,journal);}catch(e){console.log('App lock history backup: '+e.message+'; current TV journal remains available for recovery.');}
  fs.rmSync(temp,{recursive:true,force:true});
 }
}
async function beforeRollback(client,record){
 const caps=await require('./tv-capabilities').probe(client);if(!caps.nodeFiles)return;
 const data=await ssh.exec(client,'cat '+quote(DIR+'/journal.json')+' 2>/dev/null || true');
 const journal=data.trim()?JSON.parse(data):null,matches=journal?.session===record.createdAt;
 const items=require('./manual-rollback').discover(record.host);if(!items.some(x=>x.record.createdAt===record.createdAt))items.push({record});
 const history=require('./app-lock-history'),journals=history.collect(record,journal,items);
 if(!journal&&!journals.length)return;
 const target=journals.find(j=>j.session===record.createdAt);
 const active=target?target.priorPrivacyActive:matches?journal.priorPrivacyActive:journal?(await ssh.exec(client,'. '+quote(APP+'/init/nospy-lib.sh')+'; if hosts_ours_active; then echo ACTIVE; fi')).trim()==='ACTIVE':false;
 if(journal)await ssh.exec(client,'PATH=/var/lib/webosbrew/gathin-controls/bin:$PATH '+quote(caps.node)+' '+quote(DIR+'/maintenance.js')+' cleanup',{timeout:180000});
 await history.restore(client,journals);
 return {priorPrivacyActive:active};
}
module.exports={install,beforeRollback};
