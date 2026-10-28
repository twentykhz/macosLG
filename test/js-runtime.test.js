'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http'),net=require('node:net');
const state=fs.mkdtempSync(path.join(os.tmpdir(),'gathin-pure-js-'));process.env.GATHIN_STATE_DIRECTORY=state;
const {Server,utils}=require('ssh2'),{WebSocketServer}=require('ws');
// Node 20 has no default global WebSocket. Exercise the explicit pure-JS fallback.
globalThis.WebSocket=undefined;
const ssh=require('../lib/ssh'),{addHomebrewRepository}=require('../lib/post-install');
test('pure JS key decryption, SSH and Node-20 WebSocket inspector flow work without external ssh',{timeout:15000},async()=>{
 const encrypted=utils.generateKeyPairSync('ed25519',{passphrase:'test-fixture',cipher:'aes256-ctr',rounds:4});assert(!(utils.parseKey(encrypted.private,'test-fixture') instanceof Error));assert(utils.parseKey(encrypted.private,'wrong') instanceof Error);
 const inspector=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify([{id:'fixture',url:'file:///org.webosbrew.hbchannel/index.html'}]));});
 const wss=new WebSocketServer({server:inspector});let evaluated=false;
 wss.on('connection',socket=>socket.on('message',data=>{const msg=JSON.parse(data);assert.equal(msg.method,'Runtime.evaluate');assert(msg.params.expression.includes('lifesgoodwithoutspying'));evaluated=true;socket.send(JSON.stringify({id:msg.id,result:{result:{value:true}}}));}));
 await new Promise(r=>inspector.listen(0,'127.0.0.1',r));
 const server=new Server({hostKeys:[utils.generateKeyPairSync('ed25519').private]},client=>{
  client.on('authentication',ctx=>ctx.username==='root'&&ctx.password==='fixture-password'?ctx.accept():ctx.reject());
  client.on('ready',()=>client.on('session',accept=>{const session=accept();session.on('exec',(accept,reject,info)=>{const stream=accept();stream.write(info.command==='id -u'?'0\n':'{"returnValue":true}');stream.exit(0);stream.end();});}));
  client.on('tcpip',(accept,reject)=>{const socket=net.connect(inspector.address().port,'127.0.0.1',()=>{const stream=accept();socket.pipe(stream).pipe(socket);});socket.on('error',reject);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let client;
 try{client=await ssh.connect({host:'127.0.0.1',port:server.address().port,username:'root',auth:{password:'fixture-password'},trustNewHost:true});assert.equal((await ssh.exec(client,'id -u')).trim(),'0');await addHomebrewRepository(client);assert(evaluated);}
 finally{if(client)client.end();for(const socket of wss.clients)socket.terminate();inspector.closeAllConnections();await Promise.all([new Promise(r=>server.close(r)),new Promise(r=>inspector.close(r))]);}
});
test.after(()=>fs.rmSync(state,{recursive:true,force:true}));
