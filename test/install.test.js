'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {PassThrough}=require('node:stream');
const {installPackage,exec}=require('../lib/ssh');
function connection(){
  const stream=new PassThrough();stream.stderr=new PassThrough();
  // Model remote stdin EOF independently from remote stdout.
  stream.end=function(){this.stdinEnded=true;};
  return {stream,client:{exec(command,next){this.command=command;queueMicrotask(()=>next(null,stream));}}};
}
test('installer waits for installed state and terminates subscription with EOF',async()=>{
  const {client,stream}=connection();
  const result=installPackage(client,'/media/developer/temp/recovery.ipk');
  await new Promise(resolve=>setImmediate(resolve));
  stream.write('{"returnValue":true,"details":{"state":"INSTALLING"}}\n');
  stream.write('{"returnValue":true,"details":{"state":"INST');
  stream.write('ALLED"}}\n');
  await result;assert.equal(stream.stdinEnded,true);assert.match(client.command,/dev\/install/);
});
test('installer refuses failed state even when returnValue is true',async()=>{
  const {client,stream}=connection();const result=installPackage(client,'/tmp/test.ipk');
  const rejection=assert.rejects(result,/App install failed/);
  await new Promise(resolve=>setImmediate(resolve));
  stream.write('{"returnValue":true,"details":{"state":"FAILED_INSTALL"}}\n');
  await rejection;
});
test('installer refuses premature stream closure',async()=>{
  const {client,stream}=connection();const result=installPackage(client,'/tmp/test.ipk');
  const rejection=assert.rejects(result,/before success/);
  await new Promise(resolve=>setImmediate(resolve));stream.emit('close',0);
  await rejection;
});
test('installer times out and stops its Luna subscription',async()=>{
  const {client,stream}=connection();await assert.rejects(installPackage(client,'/tmp/test.ipk',{timeout:15}),/timed out/);
  assert.equal(stream.stdinEnded,true);
});
test('read-only remote calls keep stdin open until their complete reply arrives',async()=>{
  const {client,stream}=connection();const result=exec(client,'luna-send -n 1 listApps');
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(stream.stdinEnded,undefined);
  const reply=JSON.stringify({apps:['x'.repeat(150000)]});
  stream.write(reply.slice(0,64000));stream.write(reply.slice(64000));stream.emit('close',0);
  assert.equal(await result,reply);
});
test('upload/input commands do send EOF after their input',async()=>{
  const {client,stream}=connection();const result=exec(client,'cat > /tmp/test',{input:Buffer.from('payload')});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(stream.stdinEnded,true);stream.emit('close',0);assert.equal(await result,'');
});
test('installer accepts numeric terminal success when firmware omits state',async()=>{
  const {client,stream}=connection();const result=installPackage(client,'/tmp/test.ipk');
  await new Promise(resolve=>setImmediate(resolve));
  stream.write('{"returnValue":true,"statusValue":30,"details":{"packageId":"com.test"}}\n');
  await result;assert.equal(stream.stdinEnded,true);
});
test('installer refuses structured error details even without FAILED state',async()=>{
  const {client,stream}=connection();const result=installPackage(client,'/tmp/test.ipk');
  const rejection=assert.rejects(result,/App install failed/);
  await new Promise(resolve=>setImmediate(resolve));
  stream.write('{"returnValue":true,"details":{"errorCode":-5,"reason":"verification failed"}}\n');
  await rejection;
});
