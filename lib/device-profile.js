'use strict';
const nano=require('../config/compatibility/55NANO753PR.json');
function resolve(info={},caps={}){
 const evidence=[nano].find(p=>['modelName','boardType','firmwareVersion'].every(k=>p[k]===info[k]));
 const voiceFramework=caps.voiceFramework==='voiceconductor'||evidence?.voiceFramework==='voiceconductor'?'voiceconductor':'legacy-nlp-candidate';
 const node8=/^v8\./.test(caps.nodeVersion||'');
 return {voiceFramework,voiceRouter:voiceFramework!=='voiceconductor'&&!node8,voiceReason:voiceFramework==='voiceconductor'?'Native Voice retained; recognized-result adapter for voiceconductor is not verified':node8?'Long-lived Node 8 monitor is not validated; native microphone remains available':'Legacy NLP adapter candidate; physical recognition still requires testing',homeObserver:caps.python2||caps.python3||null,evidence:evidence?{verification:evidence.verification,source:evidence.evidence}:null};
}
module.exports={resolve};
