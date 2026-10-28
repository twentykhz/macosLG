'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const id='youtube.leanback.v4';
async function run(existing,{badUpload=false,failRemoval=false}={}){
 const calls=[];let apps=[{id:'org.webosbrew.hbchannel'},{id:'ooo.lew.lifesgoodwithoutspying'},...(existing?[{id,...existing}]:[])];
 const ssh=require('../lib/ssh'),recovery=require('../lib/recovery'),saved={...ssh},mark=recovery.markMutation;
 Object.assign(ssh,{
  async luna(){return {apps};},async exec(){},
  async upload(){calls.push('upload');if(badUpload)throw Error('upload failed');},
  async removePackage(c,app){assert.equal(app,id);calls.push('remove');if(failRemoval)throw Error('remove failed');apps=apps.filter(a=>a.id!==id);},
  async installPackage(){calls.push('install');apps.push({id,version:'0.5.3',title:'YouTube AdFree'});}
 });
 recovery.markMutation=()=>calls.push('snapshot-guard');
 delete require.cache[require.resolve('../lib/post-install')];
 try{return {calls,result:await require('../lib/post-install').ensureApps({},{})};}
 finally{Object.assign(ssh,saved);recovery.markMutation=mark;delete require.cache[require.resolve('../lib/post-install')];}
}
test('official YouTube is removed after upload and snapshot guard, then AdFree is installed',async()=>{
 const {calls,result}=await run({version:'1.1.0',title:'YouTube'});
 assert.deepEqual(calls,['upload','snapshot-guard','remove','install']);assert.equal(result.report.find(r=>r.feature===id).status,'installed');
});
test('matching AdFree is retained; absent YouTube is installed without removal',async()=>{
 assert.deepEqual((await run({version:'0.5.3',title:'YouTube AdFree'})).calls,[]);
 assert.deepEqual((await run()).calls,['upload','snapshot-guard','install']);
});
test('matching version with official title is still replaced',async()=>{
 assert((await run({version:'0.5.3',title:'YouTube'})).calls.includes('remove'));
});
test('failed upload preserves original; failed removal prevents installation',async()=>{
 assert.deepEqual((await run({version:'1.1.0'},{badUpload:true})).calls,['upload']);
 const {calls,result}=await run({version:'1.1.0'},{failRemoval:true});
 assert.deepEqual(calls,['upload','snapshot-guard','remove']);assert.equal(result.report.find(r=>r.feature===id).status,'needs-attention');
});
