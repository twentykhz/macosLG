'use strict';
const fs=require('node:fs'),path=require('node:path');
function installOutputLog(){
 const target=process.env.GATHIN_SESSION_LOG;if(!target||process.__macTvOutputLog)return;
 const file=path.resolve(target);fs.mkdirSync(path.dirname(file),{recursive:true});const fd=fs.openSync(file,'a',0o600);process.__macTvOutputLog=true;
 // Keep the actual console streams/TTY intact for hidden password input.
 // Record output only, never stdin or authentication objects.
 for(const stream of [process.stdout,process.stderr]){const original=stream.write;stream.write=function(chunk,encoding,callback){fs.writeSync(fd,Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk,typeof encoding==='string'?encoding:'utf8'));return original.apply(this,arguments);};}
 process.once('exit',()=>fs.closeSync(fd));
}
module.exports={installOutputLog};
