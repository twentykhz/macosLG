'use strict';
const {spawnSync}=require('node:child_process');
const python=['python3','python'].find(command=>{const r=spawnSync(command,['--version'],{encoding:'utf8'});return r.status===0&&/^Python 3\./.test(r.stdout||r.stderr);});
module.exports={python};
