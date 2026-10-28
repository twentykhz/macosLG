'use strict';
const {quote}=require('./local');
const TOOLS=['sh','mount','umount','grep','sed','awk','sort','head','tail','cut','wc','ps','pgrep','pkill','realpath','readlink','ls-monitor'];
async function inspect(client){
 const ssh=require('./ssh'),caps=await require('./tv-capabilities').probe(client),native=require('./native-runtime').asset(caps);
 const output=await ssh.exec(client,'# GATHIN_DEPENDENCIES_V1\n'+TOOLS.map(t=>'printf '+quote(t+'\t%s\n')+' "$(command -v '+quote(t)+' 2>/dev/null || true)"').join('\n'));
 const tools={};for(const line of output.trim().split(/\r?\n/)){const [k,v]=line.split('\t');if(TOOLS.includes(k)&&v&&/^\/[\w./+-]+$/.test(v))tools[k]=v;}
 const unresolved=[];if(!caps.root)unresolved.push('root UID 0');if(!caps.nodeFiles)unresolved.push('Node >=0.12 with filesystem/child_process support');if(!caps.startup)unresolved.push('Homebrew startup hooks');if(!caps.tar||!caps.hash)unresolved.push('tar and verified SHA-256');if(!native)unresolved.push('verified input/PTY adapter for '+caps.arch);if(!tools['ls-monitor'])unresolved.push('ls-monitor (Homebrew/Luna runtime)');
 return {caps,tools,native:native?{arch:native.arch,eventSize:native.eventSize}:null,unresolved};
}
async function prepare(client,options={},report){
 report=report||await inspect(client);if(report.unresolved.length)throw Error('Missing required dependencies before setup: '+report.unresolved.join(', ')+'. Install/update a Homebrew/runtime build matching this TV ABI; no unverified system binary will be installed.');
 if(options.dryRun)return report;
 if(report.native)await require('./native-runtime').install(client,options,report.caps);
 const ssh=require('./ssh'),bin='/var/lib/webosbrew/gathin-controls/bin';
 if(report.caps.busybox){
  const missing=TOOLS.filter(t=>!report.tools[t]&&t!=='ls-monitor');
  for(const tool of missing){try{await ssh.exec(client,quote(report.caps.busybox)+' '+quote(tool)+' --help >/dev/null 2>&1');require('./recovery').markMutation(options,'private BusyBox tool fallback');const body='#!/bin/sh\nexec '+quote(report.caps.busybox)+' '+quote(tool)+' "$@"\n';await ssh.exec(client,'mkdir -p '+quote(bin)+' && cat > '+quote(bin+'/'+tool)+' && chmod 755 '+quote(bin+'/'+tool),{input:Buffer.from(body)});report.tools[tool]=bin+'/'+tool;}catch{}}
 }
 const required=['sh','mount','umount','grep','sed','awk','sort','head','tail','cut','wc','ps','readlink','realpath','ls-monitor'];const missing=required.filter(t=>!report.tools[t]);if(missing.length)throw Error('Missing runtime tools after private fallback: '+missing.join(', ')+'. Repair the matching Homebrew runtime before continuing.');
 return report;
}
module.exports={inspect,prepare,TOOLS};
