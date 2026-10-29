'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{PassThrough,Duplex}=require('node:stream'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const ssh=require('../lib/ssh'),cap=require('../lib/tv-capabilities'),{transcript}=require('./helpers/tv-profiles');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'gathin-upload-')),file=path.join(directory,'space payload.bin'),bytes=Buffer.from('checked payload');fs.writeFileSync(file,bytes);
function connection(caps,wrong=false){const calls=[];return {calls,__gathinCapabilities:Promise.resolve(caps),exec(command,done){calls.push(command);const stream=new Duplex({emitClose:false,read(){},write(chunk,encoding,next){next();}});stream.stderr=new PassThrough();done(null,stream);if(command.includes('cat >'))stream.on('finish',()=>{setImmediate(()=>stream.emit('close',0));});else setImmediate(()=>{if(command.includes('sha256')||command.includes('hashlib')||command.includes('createHash'))stream.push((wrong?'0'.repeat(64):crypto.createHash('sha256').update(bytes).digest('hex'))+'\n');stream.emit('close',0);});}};}
test('upload checks host SHA against remote temporary file before activation for every provider',async()=>{
 const reference=cap.parse(transcript());for(const hash of [{kind:'sha256sum',command:['/usr/bin/sha256sum']},{kind:'busybox',command:['/bin/busybox','sha256sum']},{kind:'node',command:['/usr/bin/node']},{kind:'python',command:['/usr/bin/python3']}]){const client=connection({...reference,hash});await ssh.upload(client,file,'/tmp/space payload.bin');assert.equal(client.calls.length,3);assert(client.calls[0].includes('umask 077'));assert(client.calls[1].includes('/tmp/space payload.bin.new'));assert(client.calls[2].includes('&& mv '));}
});
test('missing checksum sends no bytes and mismatch never activates payload',async()=>{
 const missing=connection(cap.parse(transcript({node:false,python:false,checksum:false})));await assert.rejects(ssh.upload(missing,file,'/tmp/test'),/refusing unchecked upload/);assert.equal(missing.calls.length,0);
 const wrong=connection(cap.parse(transcript({python:false})),true);await assert.rejects(ssh.upload(wrong,file,'/tmp/test'),/checksum mismatch/);assert.equal(wrong.calls.length,2);assert(!wrong.calls.some(c=>c.includes('&& mv ')));
});
test('app removal requires subscribed completion and rejects reported failure',async()=>{
 function client(response){return {exec(command,done){assert(command.includes('com.webos.appInstallService/remove'));const s=new PassThrough();s.stderr=new PassThrough();done(null,s);setImmediate(()=>s.write(JSON.stringify(response)+'\n'));}};}
 await ssh.removePackage(client({statusValue:31}),'com.gathin.tvhome');await assert.rejects(ssh.removePackage(client({returnValue:false,errorText:'refused'}),'com.gathin.tvhome'),/removal failed/);
});
test.after(()=>fs.rmSync(directory,{recursive:true,force:true}));

// The real transport validator must accept managed hooks, not just a mocked upload method.
test('real upload transport accepts recovery-managed hooks and rejects unknown hooks before sending bytes',async()=>{
 const client=connection(cap.parse(transcript()));await ssh.upload(client,file,'/var/lib/webosbrew/init.d/40-gathin-home','755');assert.equal(client.calls.length,3);assert(client.calls[2].includes('chmod 755'));
 const denied=connection(cap.parse(transcript()));for(const p of ['/var/lib/webosbrew/init.d/99-owner','/etc/test','/var/lib/webosbrew/gathin-controls/../unknown'])await assert.rejects(ssh.upload(denied,file,p));assert.equal(denied.calls.length,0);
});
