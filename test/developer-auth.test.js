'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dev=require('../lib/developer-mode'),ssh=require('../lib/ssh'),{AutorootSteps}=require('../lib/autoroot');
test('Developer Mode authentication confirms readiness and records only public status',async()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'gathin-dev-auth-')),saved={ensure:dev.ensure,connect:ssh.connect,secret:ssh.secret};let connections=0,prompts=0;
 const privateKey=crypto.generateKeyPairSync('rsa',{modulusLength:1024,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs1',format:'pem',cipher:'aes-256-cbc',passphrase:'A1B2C3'}}).privateKey;
 const status={devMode:{available:true,reason:'SSH banner'},keyServer:{available:true,reason:'key downloaded',key:Buffer.from(privateKey)}};
 const s=new AutorootSteps({host:'192.0.2.98',trustNewHost:false});s.folder=folder;
 try{
  dev.ensure=async(host,o)=>{o.onStatus(dev.publicStatus(status));return status;};
  ssh.secret=async()=>{prompts++;return 'A1B2C3';};ssh.connect=async o=>{connections++;assert.equal(o.username,'prisoner');assert.equal(o.port,9922);return {end(){}};};
  await s.connectDeveloper();assert.equal(connections,1);assert.equal(prompts,1);
  const text=fs.readFileSync(path.join(folder,'developer-mode-check.json'),'utf8'),record=JSON.parse(text);assert(record.authenticated);assert(record.devMode.available&&record.keyServer.available);assert(!text.includes('PRIVATE KEY'));assert(!text.includes('A1B2C3'));
  dev.ensure=async()=>{throw Object.assign(Error('Prerequisites missing'),{developerPrerequisite:true});};
  await assert.rejects(s.connectDeveloper(),/Prerequisites missing/);assert.equal(prompts,1);assert.equal(connections,1);
 }finally{s.close();dev.ensure=saved.ensure;ssh.connect=saved.connect;ssh.secret=saved.secret;fs.rmSync(folder,{recursive:true,force:true});}
});
