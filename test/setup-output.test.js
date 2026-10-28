'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
test('runtime log captures native stdout and stderr without recording password input',()=>{
 const file=path.resolve(__dirname,'../.local/output-fixture-'+process.pid+'.log');
 const code="require('./lib/setup-output').installOutputLog();console.log('visible result');process.stderr.write('visible error\\n');process.stdin.resume();process.stdin.on('data',()=>console.log('input received without echo'));";
 try{const child=spawnSync(process.execPath,['-e',code],{cwd:path.resolve(__dirname,'..'),env:{...process.env,GATHIN_SESSION_LOG:file},input:'private-fixture-password\n',encoding:'utf8'});assert.equal(child.status,0,child.stderr);const log=fs.readFileSync(file,'utf8');assert.match(log,/visible result/);assert.match(log,/visible error/);assert.match(log,/input received/);assert(!log.includes('private-fixture-password'));}finally{if(fs.existsSync(file))fs.unlinkSync(file);}
});
