'use strict';
const fs=require('node:fs'),path=require('node:path'),test=require('node:test'),assert=require('node:assert/strict'),EventEmitter=require('node:events');
fs.mkdirSync(path.join(__dirname,'../.local'),{recursive:true});
const folder=fs.mkdtempSync(path.join(__dirname,'../.local/auth-test-'));process.env.GATHIN_STATE_DIRECTORY=folder;
let rejectLogin=false;
class FakeClient extends EventEmitter{connect(){queueMicrotask(()=>{if(rejectLogin){const e=Error('All configured authentication methods failed');e.level='client-authentication';this.emit('error',e);}else this.emit('ready');});}end(){}}
require('ssh2');require.cache[require.resolve('ssh2')].exports={Client:FakeClient};
const {connect}=require('../lib/ssh'),{rootKeyFile}=require('../lib/local');
test('private key is cached only after target authentication succeeds',async()=>{
 const key=path.join(folder,'fixture.pem');fs.writeFileSync(key,'fixture only, not a real SSH private key');
 rejectLogin=true;await assert.rejects(connect({host:'192.0.2.30',port:22,username:'root',key}),/root SSH credentials/);assert(!fs.existsSync(rootKeyFile('192.0.2.30')));
 rejectLogin=false;await connect({host:'192.0.2.30',port:22,username:'root',key});assert.equal(fs.readFileSync(rootKeyFile('192.0.2.30'),'utf8'),fs.readFileSync(key,'utf8'));
 fs.writeFileSync(key,'different fixture');await connect({host:'192.0.2.30',port:22,username:'root',key});assert.notEqual(fs.readFileSync(rootKeyFile('192.0.2.30'),'utf8'),'different fixture');
});
