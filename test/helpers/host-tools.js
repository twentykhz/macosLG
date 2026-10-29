'use strict';
const {spawnSync}=require('node:child_process');
const python=['python3','python'].find(command=>{const r=spawnSync(command,['--version'],{encoding:'utf8'});return r.status===0&&/^Python 3\./.test(r.stdout||r.stderr);});
const bash=[process.env.MAC_WEBOSTV_TEST_BASH,'bash',...(process.platform==='win32'?['C:/Program Files/Git/bin/bash.exe','C:/Program Files (x86)/Git/bin/bash.exe']:[])].filter(Boolean).find(command=>spawnSync(command,['--version'],{encoding:'utf8'}).status===0);
function requireBash(){if(!bash)throw Error('Test environment lacks Bash. Install Git for Windows/Bash or set MAC_WEBOSTV_TEST_BASH to a working executable; shell checks were not run.');return bash;}
module.exports={python,bash,requireBash};
