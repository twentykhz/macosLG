'use strict';
const {quote,profile}=require('./local');
const EMPTY_SHA='e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
function probeCommand(){return `# GATHIN_CAPABILITIES_V1 - read-only, no runtime is assumed
printf 'uid\\t%s\\n' "$(id -u)"
printf 'arch\\t%s\\n' "$(uname -m)"
for tool in node nodejs python python2 python3 sha256sum busybox tar stat readlink tr sed cp mv chmod chown systemctl; do
 value=$(command -v "$tool" 2>/dev/null || true)
 printf '%s\\t%s\\n' "$tool" "$value"
done
node=$(command -v node 2>/dev/null || command -v nodejs 2>/dev/null || true)
if [ -n "$node" ]; then
 printf 'nodeVersion\\t%s\\n' "$("$node" --version 2>/dev/null || true)"
 "$node" -e 'var fs=require("fs"),c=require("crypto"),p=require("child_process");console.log("nodeFiles\\t"+(typeof p.execFileSync==="function"&&typeof fs.realpathSync==="function"?"yes":"no"));console.log("nodeHash\\t"+c.createHash("sha256").update("").digest("hex"));' 2>/dev/null || true
fi
for tool in python python2 python3; do
 py=$(command -v "$tool" 2>/dev/null || true)
 if [ -n "$py" ]; then printf '%sVersion\\t%s\\n' "$tool" "$("$py" -B -c 'import sys,struct; print(str(sys.version_info[0])+":"+str(struct.calcsize("llHHi")))' 2>/dev/null || true)"; fi
 if [ -n "$py" ]; then printf '%sRecovery\\t%s\\n' "$tool" "$("$py" -B -c 'import os,sys,json,hashlib,tarfile,shutil,subprocess,signal,time,select; print("yes")' 2>/dev/null || true)"; fi
 if [ -n "$py" ]; then printf '%sInput\\t%s\\n' "$tool" "$("$py" -B -c 'import fcntl,select,struct,hashlib,json; print("yes")' 2>/dev/null || true)"; fi
 if [ -n "$py" ]; then printf '%s\\t%s\\n' "\${tool}Hash" "$("$py" -B -c 'import hashlib; print(hashlib.sha256(b"").hexdigest())' 2>/dev/null || true)"; fi
done
if command -v sha256sum >/dev/null 2>&1; then printf 'shaTest\\t%s\\n' "$(sha256sum /dev/null 2>/dev/null || true)"; fi
if command -v busybox >/dev/null 2>&1; then
 printf 'busyHash\\t%s\\n' "$(busybox sha256sum /dev/null 2>/dev/null || true)"
 if busybox tar --help >/dev/null 2>&1; then printf 'busyTar\\ttar\\n'; fi
fi
if [ -x /var/lib/webosbrew/startup.sh ] && [ -d /var/lib/webosbrew/init.d ]; then printf 'startup\\tyes\\n'; fi
if [ -f /usr/palm/applications/com.webos.app.voiceagent/Main.qml ]; then printf 'voiceAgent\\tyes\\n'; fi
printf 'statTest\\t%s\\n' "$(stat -c %d / 2>/dev/null || true)"
printf 'readlinkTest\\t%s\\n' "$(readlink -f / 2>/dev/null || true)"
printf 'inputChannels\\t%s\\n' "$(cat /proc/bus/input/devices 2>/dev/null | grep -c 'LGE M-RCU - Builtin' || true)"
printf 'end\\tGATHIN_CAPABILITIES_V1\\n'`;}
function parse(text){
 const kv=Object.fromEntries(text.trim().split(/\r?\n/).map(line=>{const i=line.indexOf('\t');return [line.slice(0,i),line.slice(i+1)];}));
 if(kv.end!=='GATHIN_CAPABILITIES_V1'||!/^\d+$/.test(kv.uid))throw Error('TV capability probe returned incomplete output; no installation attempted');
 const tool=name=>/^\/[a-zA-Z0-9_./+-]+$/.test(kv[name]||'')?kv[name]:null;
 const p2=['python','python2','python3'].find(p=>tool(p)&&kv[p+'Version']?.startsWith('2:')),p3=['python','python2','python3'].find(p=>tool(p)&&kv[p+'Version']?.startsWith('3:'));
 const nodePath=tool('node')||tool('nodejs'),nodeVersion=kv.nodeVersion||'',nodeSupported=!!nodePath&&/^v(?:0\.(?:1[2-9]|[2-9]\d)|[1-9]\d*)\./.test(nodeVersion);
 let hash=null;if(tool('sha256sum')&&(kv.shaTest||'').startsWith(EMPTY_SHA))hash={kind:'sha256sum',command:[tool('sha256sum')]};
 else if(tool('busybox')&&(kv.busyHash||'').startsWith(EMPTY_SHA))hash={kind:'busybox',command:[tool('busybox'),'sha256sum']};
 else if(nodeSupported&&kv.nodeHash===EMPTY_SHA)hash={kind:'node',command:[nodePath]};
 else {const py=[p2,p3].find(p=>p&&kv[p+'Hash']===EMPTY_SHA);if(py)hash={kind:'python',command:[tool(py)]};}
 const tar=tool('tar')?[tool('tar')]:tool('busybox')&&kv.busyTar==='tar'?[tool('busybox'),'tar']:null;
 return {format:1,root:kv.uid==='0',arch:kv.arch||'unknown',node:nodeSupported?nodePath:null,nodeVersion,nodeFiles:nodeSupported&&kv.nodeFiles==='yes',python:tool('python'),python2:p2?tool(p2):null,python3:p3?tool(p3):null,pythonRecovery:!!p2&&kv[p2+'Recovery']==='yes',inputModules:!!p2&&kv[p2+'Input']==='yes',eventSize:p2?Number(kv[p2+'Version'].split(':')[1]):null,hash,sha256sum:!!hash&&hash.kind==='sha256sum',tar,busybox:tool('busybox'),stat:!!tool('tr')&&!!tool('sed')&&!!tool('stat')&&/^\d+$/.test(kv.statTest||''),readlink:!!tool('readlink')&&kv.readlinkTest==='/',startup:kv.startup==='yes',voiceAgent:kv.voiceAgent==='yes',homeChannels:Number(kv.inputChannels)>=2,systemctl:!!tool('systemctl'),tools:{cp:tool('cp'),mv:tool('mv'),chmod:tool('chmod'),chown:tool('chown')}};
}
async function probe(client){
 if(!client.__gathinCapabilities)client.__gathinCapabilities=require('./ssh').exec(client,probeCommand(),{timeout:30000}).then(parse).catch(e=>{delete client.__gathinCapabilities;throw e;});
 return client.__gathinCapabilities;
}
function legacyHome(caps,info){return !!caps.python2&&caps.inputModules&&caps.homeChannels&&caps.python===caps.python2&&caps.eventSize===16&&/^armv7(?:l)?$/.test(caps.arch)&&info.modelName===profile.modelName&&info.boardType===profile.boardType&&info.firmwareVersion===profile.firmwareVersion;}
function hashCommand(caps,file){
 if(!caps.hash)throw Error('No usable SHA-256 provider (sha256sum, busybox, Node or Python); refusing unchecked upload');
 const prefix=caps.hash.command.map(quote).join(' ');
 if(caps.hash.kind==='node')return prefix+' -e '+quote('var fs=require("fs"),c=require("crypto");console.log(c.createHash("sha256").update(fs.readFileSync(process.argv[1])).digest("hex"));')+' '+quote(file);
 if(caps.hash.kind==='python')return prefix+' -c '+quote('import hashlib; print(hashlib.sha256(open('+JSON.stringify(file)+',"rb").read()).hexdigest())');
 return prefix+' '+quote(file);
}
module.exports={probeCommand,parse,probe,legacyHome,hashCommand};
