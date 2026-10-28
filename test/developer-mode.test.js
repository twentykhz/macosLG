'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),net=require('node:net');
const dev=require('../lib/developer-mode');
const key=Buffer.from('-----BEGIN RSA PRIVATE KEY-----\nfixture-private-bytes\n-----END RSA PRIVATE KEY-----');
const ready=()=>({devMode:{available:true,reason:'SSH banner'},keyServer:{available:true,reason:'key downloaded',key}});
const quiet=()=>{};
test('Developer Mode probe checks SSH banner rather than only an open port',async()=>{
 for(const banner of ['SSH-2.0-dropbear_2020\r\n','HTTP/1.1 200 OK\r\n']){
  const server=net.createServer(s=>s.end(banner));await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{const result=await dev.sshService('127.0.0.1',{port:server.address().port,timeout:300});assert.equal(result.available,banner.startsWith('SSH-'));}finally{await new Promise(r=>server.close(r));}
 }
});
test('Key Server probe requires a bounded key response and disallows redirects',async()=>{
 let options;const result=await dev.keyService('192.0.2.10',{fetcher:async(url,o)=>{assert.equal(url,'http://192.0.2.10:9991/webos_rsa');options=o;return new Response(key);}});
 assert(result.available);assert.deepEqual(result.key,key);assert.equal(options.redirect,'error');
 for(const response of [new Response('not a key'),new Response('missing',{status:404}),new Response(Buffer.alloc(65537,65))]){const r=await dev.keyService('192.0.2.10',{fetcher:async()=>response});assert.equal(r.available,false);assert(!r.key);}
});
test('service checks are independent and unreachable does not claim the UI switch is OFF',async()=>{
 const status=await dev.probe('tv',{sshProbe:async()=>{throw Error('offline');},keyProbe:async()=>ready().keyServer});assert(!status.devMode.available);assert(status.keyServer.available);
 let output='';const saved=console.log;console.log=(...parts)=>{output+=parts.join(' ')+'\n';};
 try{dev.print(status);}finally{console.log=saved;}
 assert.match(output,/NOT REACHABLE/);assert.match(output,/may be off/);assert(!output.includes('fixture-private-bytes'));
});
test('unavailable prerequisites stop noninteractive setup and never ask for a passphrase',async()=>{
 let asked=0;await assert.rejects(dev.ensure('tv',{interactive:false,probeFn:async()=>({devMode:{available:false},keyServer:{available:false}}),reporter:quiet,askFn:async()=>{asked++;return '';}}),e=>e.developerPrerequisite&&/Dev Mode Status and Key Server/.test(e.message));assert.equal(asked,0);
});
test('interactive setup reports, retries after switches are enabled, and never persists the private key',async()=>{
 let calls=0,asked=0;const records=[];
 const status=await dev.ensure('tv',{interactive:true,probeFn:async()=>++calls===1?{devMode:{available:true},keyServer:{available:false}}:ready(),askFn:async()=>{asked++;return '';},reporter:quiet,onStatus:r=>records.push(r)});
 assert.equal(calls,2);assert.equal(asked,1);assert(status.keyServer.available);assert.equal(records[0].keyServer.available,false);assert.equal(records[1].authenticated,false);assert(!JSON.stringify(records).includes('fixture-private-bytes'));assert(!JSON.stringify(records).includes('BEGIN RSA'));
});
test('cancelling prerequisite retry is explicit and stops the connection workflow',async()=>{
 await assert.rejects(dev.ensure('tv',{interactive:true,probeFn:async()=>({devMode:{available:false},keyServer:{available:false}}),askFn:async()=>'DUNG',reporter:quiet}),e=>e.cancelled===true);
});
test('a user-supplied Developer Mode key permits an unavailable Key Server but still needs SSH',async()=>{
 const status=await dev.ensure('tv',{localKey:true,interactive:false,probeFn:async()=>({devMode:{available:true},keyServer:{available:false}}),reporter:quiet});assert(status.devMode.available);assert(!status.keyServer.available);
});
