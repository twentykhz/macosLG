'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
test('dependency preflight detects absent core tools and ABI rejects before promotion',async()=>{
 const ssh=require('../lib/ssh'),recovery=require('../lib/recovery'),saved={exec:ssh.exec,upload:ssh.upload,mark:recovery.markMutation},calls=[];
 const caps=require('../lib/tv-capabilities').parse(require('./helpers/tv-profiles').transcript());
 ssh.exec=async(c,command)=>{calls.push(command);if(command.includes('GATHIN_DEPENDENCIES_V1'))return require('../lib/dependencies').TOOLS.filter(t=>t!=='ls-monitor').map(t=>t+'\t/bin/'+t).join('\n');if(command.endsWith('--abi'))return '{"protocol":1,"pointerBits":64,"eventSize":24}';return '';};
 ssh.upload=async()=>calls.push('upload');recovery.markMutation=()=>({createdAt:'fixture'});
 try{
  const client={__gathinCapabilities:Promise.resolve(caps)},r=await require('../lib/dependencies').inspect(client);assert(r.unresolved.some(x=>x.includes('ls-monitor')));
  await assert.rejects(require('../lib/dependencies').prepare(client,{},r),/ls-monitor/);assert(!calls.includes('upload'));
  await assert.rejects(require('../lib/native-runtime').install(client,{},caps),/ABI/);assert(calls.includes('upload'));assert(!calls.some(c=>c.includes(' && mv ')));
 }finally{ssh.exec=saved.exec;ssh.upload=saved.upload;recovery.markMutation=saved.mark;}
});
