'use strict';
const fs=require('node:fs'),path=require('node:path'),test=require('node:test'),assert=require('node:assert/strict'),EventEmitter=require('node:events');
fs.mkdirSync(path.join(__dirname,'../.local'),{recursive:true});
const folder=fs.mkdtempSync(path.join(__dirname,'../.local/auth-test-'));process.env.GATHIN_STATE_DIRECTORY=folder;
let rejectLogin=false,failures=[],attempts=[];
class FakeClient extends EventEmitter{connect(options){attempts.push(options);queueMicrotask(()=>{const planned=failures.shift();if(planned){this.emit('error',planned);}else if(rejectLogin){const e=Error('All configured authentication methods failed');e.level='client-authentication';this.emit('error',e);}else this.emit('ready');});}end(){}}
require('ssh2');require.cache[require.resolve('ssh2')].exports={Client:FakeClient};
const {connect}=require('../lib/ssh'),{rootKeyFile}=require('../lib/local');
test('private key is cached only after target authentication succeeds',async()=>{
 const key=path.join(folder,'fixture.pem');fs.writeFileSync(key,'fixture only, not a real SSH private key');
 rejectLogin=true;await assert.rejects(connect({host:'192.0.2.30',port:22,username:'root',key}),/root SSH credentials/);assert(!fs.existsSync(rootKeyFile('192.0.2.30')));
 rejectLogin=false;await connect({host:'192.0.2.30',port:22,username:'root',key});assert.equal(fs.readFileSync(rootKeyFile('192.0.2.30'),'utf8'),fs.readFileSync(key,'utf8'));
 fs.writeFileSync(key,'different fixture');await connect({host:'192.0.2.30',port:22,username:'root',key});assert.notEqual(fs.readFileSync(rootKeyFile('192.0.2.30'),'utf8'),'different fixture');
});

function authenticationError(){const e=Error('All configured authentication methods failed');e.level='client-authentication';return e;}
test('root password login automatically accepts alpine without prompting',async()=>{
 attempts=[];failures=[];let prompted=false;
 await connect({host:'192.0.2.31',port:22,username:'root'},async()=>{prompted=true;throw Error('Must not prompt');});
 assert.equal(prompted,false);assert.equal(attempts.length,1);assert.equal(attempts[0].password,'alpine');
});
test('only a rejected default password requests a hidden custom password',async()=>{
 attempts=[];failures=[authenticationError()];let prompts=0;
 await connect({host:'192.0.2.32',port:22,username:'root'},async label=>{prompts++;assert.match(label,/hidden/);return 'private-fixture-password';});
 assert.equal(prompts,1);assert.deepEqual(attempts.map(a=>a.password),['alpine','private-fixture-password']);
 assert(!fs.readdirSync(folder).some(name=>name.includes('password')));
});
test('network and host verification failures never request a password or retry',async()=>{
 for(const failure of [Object.assign(Error('Connection timed out'),{level:'client-timeout'}),Error('Unknown/changed TV host key')]){
  attempts=[];failures=[failure];
  await assert.rejects(connect({host:'192.0.2.33',port:22,username:'root'},async()=>{throw Error('Unexpected password prompt');}),e=>e===failure);
  assert.equal(attempts.length,1);
 }
});
test('a rejected custom password stops after one default and one custom attempt',async()=>{
 attempts=[];failures=[authenticationError(),authenticationError()];let prompts=0;
 await assert.rejects(connect({host:'192.0.2.34',port:22,username:'root'},async()=>{prompts++;return 'wrong-fixture-password';}),/Root SSH authentication failed/);
 assert.equal(prompts,1);assert.equal(attempts.length,2);
});
test('Developer Mode and explicit authentication never try the root default',async()=>{
 attempts=[];failures=[];
 await connect({host:'192.0.2.35',port:9922,username:'prisoner',auth:{privateKey:'developer-fixture'}});
 await connect({host:'192.0.2.35',port:22,username:'root',auth:{password:'explicit-fixture'}});
 assert.equal(attempts[0].privateKey,'developer-fixture');assert.equal(attempts[0].password,undefined);
 assert.equal(attempts[1].password,'explicit-fixture');
});
