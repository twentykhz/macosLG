'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {Client} = require('ssh2');
const {pipeline} = require('node:stream/promises');
const zlib = require('node:zlib');
const {state,quote,sha256,rootKeyFile} = require('./local');

async function secret(prompt='SSH password (hidden): ') {
  if(!process.stdin.isTTY) throw new Error('Use an interactive terminal for the hidden SSH password prompt, or --key <private-key-path>.');
  process.stderr.write(prompt);
  process.stdin.setRawMode(true); process.stdin.resume();
  return new Promise(resolve => {
    let bytes=[];
    const handler=chunk=>{for(const byte of chunk){
      if(byte===3){process.stdin.setRawMode(false);process.exit(130);}
      if(byte===10||byte===13){process.stdin.off('data',handler);process.stdin.setRawMode(false);process.stdin.pause();process.stderr.write('\n');const password=Buffer.from(bytes).toString();bytes.fill(0);resolve(password);return;}
      if(byte===8||byte===127)bytes.pop();else bytes.push(byte);
    }};
    process.stdin.on('data',handler);
  });
}

async function connect(options, readPassword=secret) {
  // Explicit keys/auth and Developer Mode keep their existing authentication path.
  if(options.key||options.auth||options.username!=='root'||Number(options.port)!==22)return connectOnce(options);
  console.log('Trying the default root SSH password.');
  try{return await connectOnce({...options,auth:{password:'alpine'}});}
  catch(error){
    if(error.level!=='client-authentication')throw error;
  }
  const password=await readPassword(require('./setup-language').text("Default password rejected. Enter this TV's root SSH password (hidden): ",'Mat khau mac dinh bi tu choi. Nhap mat khau SSH root rieng cua TV (an ky tu): '));
  return connectOnce({...options,auth:{password}});
}

async function connectOnce(options) {
  fs.mkdirSync(state,{recursive:true});
  const trustFile=path.join(state,'known-hosts.json');
  const trust=fs.existsSync(trustFile)?JSON.parse(fs.readFileSync(trustFile)):{};
  const keyName=options.host+':'+options.port;
  // Reuse non-hashed OpenSSH host entries when present; never copy private keys.
  let openssh=[];
  const known=path.join(os.homedir(),'.ssh/known_hosts');
  if(fs.existsSync(known))openssh=fs.readFileSync(known,'utf8').split(/\r?\n/).filter(line=>line.split(' ')[0]===options.host).map(line=>line.split(' ')[2]);
  const auth=options.auth||(options.key?{privateKey:fs.readFileSync(path.resolve(options.key))}:{password:await secret()});
  const client=new Client();
  let refusal;
  await new Promise((resolve,reject)=>{
    client.once('ready',resolve).once('error',error=>{client.end();reject(refusal||error);});
    client.connect({host:options.host,port:options.port,username:options.username,...auth,readyTimeout:options.readyTimeout||15000,keepaliveInterval:10000,hostVerifier:key=>{
      const fingerprint='SHA256:'+Buffer.from(sha256(key),'hex').toString('base64').replace(/=+$/,'');
      client.__macTvHostFingerprint=fingerprint;
      if(trust[keyName]===fingerprint || (!trust[keyName]&&openssh.includes(key.toString('base64')))){
        trust[keyName]=fingerprint;fs.writeFileSync(trustFile,JSON.stringify(trust,null,2));return true;
      }
      if(options.trustNewHost){
        console.log(`Trusting TV host ${keyName}: ${fingerprint}`);
        trust[keyName]=fingerprint;fs.writeFileSync(trustFile,JSON.stringify(trust,null,2));return true;
      }
      refusal=new Error(`Unknown/changed TV host key ${fingerprint}. Verify the TV address/key, then repeat with --trust-new-host (expected after a reset/re-root).`);
      return false;
    }});
  }).catch(error=>{
    if(error.level==='client-authentication'||/All configured authentication methods failed/.test(error.message)){
      error.message=`Root SSH authentication failed for ${options.username}@${options.host}:${options.port}. The TV rejected the supplied password/key. Use this TV's root SSH credentials, not its LG account password or Developer Mode passphrase. If the TV uses key-only SSH, choose private key login or supply -RootKeyPath.`;
    }
    throw error;
  });
  if(options.key&&options.username==='root'&&Number(options.port)===22){
    // Cache only a key that the target TV has just accepted, never ship it in source.
    const saved=rootKeyFile(options.host);
    if(!fs.existsSync(saved)){
      fs.mkdirSync(path.dirname(saved),{recursive:true});
      try{fs.copyFileSync(path.resolve(options.key),saved,fs.constants.COPYFILE_EXCL);fs.chmodSync(saved,0o600);}catch(e){console.log('SSH connected, but the private key could not be cached: '+e.message);}
    }
  }
  client.__macTvReconnect=options.username==='root'?()=>connectOnce({...options,trustNewHost:false}):null;
  const end=client.end.bind(client);
  client.end=function(){if(client.__macTvReplacement)client.__macTvReplacement.end();return end();};
  return client;
}

function channel(client,command) {
  return new Promise((resolve,reject)=>requestExec(client,command,(error,stream)=>error?reject(error):resolve(stream)));
}
function requestExec(client,command,callback){
 const active=client.__macTvReplacement||client;
 active.exec(command,(error,stream)=>{
  // CHANNEL_FAILURE means the command was rejected before execution. Never
  // retry a command which started and then lost its exit status.
  if(error&&/^Unable to exec$/.test(error.message)&&client.__macTvReconnect){
   client.__macTvReconnect().then(fresh=>{active.end();client.__macTvReplacement=fresh;fresh.exec(command,callback);},callback);
  }else callback(error,stream);
 });
}

async function exec(client, command, {input,timeout=30000,binary=false,onOutput,onErrorOutput}={}) {
  const stream=await channel(client,command);
  return new Promise((resolve,reject)=>{
    const output=[]; let errors=''; let length=0;
    const timer=setTimeout(()=>{stream.close();reject(new Error(`Remote command timed out (${timeout}ms)`));},timeout);
    stream.on('error',error=>{clearTimeout(timer);reject(error);});
    stream.on('data',chunk=>{length+=chunk.length;if(length>32*1024*1024){stream.close();clearTimeout(timer);reject(new Error('Remote response exceeds 32 MiB'));}else {output.push(chunk);if(onOutput)onOutput(chunk.toString());}});
    stream.stderr.on('data',chunk=>{errors+=chunk;if(onErrorOutput)onErrorOutput(chunk.toString());});
    stream.on('close',(code,signal)=>{clearTimeout(timer);if(code!==0){const error=new Error(`Remote command failed (${code||signal}): ${errors.trim()}`);if(code===undefined||code===null)error.remoteStateUnknown=true;reject(error);}else {const data=Buffer.concat(output);resolve(binary?data:data.toString('utf8'));}});
    // luna-send exits early on stdin EOF, even for -n 1. Keep it open while
    // waiting for large replies such as listApps; only uploads need an EOF.
    if(input!==undefined)stream.end(input);
  });
}

async function luna(client,url,params={}) {
  const text=await exec(client,'/usr/bin/luna-send -n 1 '+quote('luna://'+url)+' '+quote(JSON.stringify(params)));
  let result;
  try { result=JSON.parse(text); }
  catch { throw new Error(`${url}: invalid or empty JSON response (${text.slice(0,160)})`); }
  if(result.returnValue===false)throw new Error(`${url}: ${result.errorText||JSON.stringify(result)}`);
  return result;
}

async function upload(client,file,remote,mode='644') {
  if(!/^[0-7]{3,4}$/.test(mode))throw new Error('Invalid upload permissions');
  require('./deployment').destination(remote);
  const capabilities=require('./tv-capabilities'),caps=await capabilities.probe(client);
  // Establish a working checksum provider before uploading any bytes.
  const temporary=remote+'.new',command=capabilities.hashCommand(caps,temporary),data=fs.readFileSync(file);
  await exec(client,'umask 077; mkdir -p '+quote(path.posix.dirname(remote))+' && cat > '+quote(temporary),{input:data});
  const digest=(await exec(client,command)).trim().split(/\s+/)[0];
  if(digest!==sha256(data))throw Error('Upload checksum mismatch: '+remote);
  await exec(client,'chmod '+mode+' '+quote(temporary)+' && mv '+quote(temporary)+' '+quote(remote));
}

async function archive(client,files,destination) {
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  const caps=await require('./tv-capabilities').probe(client);if(!caps.tar)throw Error('No usable tar available for backup');
  const stream=await channel(client,caps.tar.map(quote).join(' ')+' -cf - '+files.map(quote).join(' '));
  let errors='';stream.stderr.on('data',chunk=>errors+=chunk);
  const status=new Promise((resolve,reject)=>stream.on('close',code=>code===0?resolve():reject(new Error('Backup tar failed: '+errors))));
  const temporary=destination+'.partial';
  await Promise.all([pipeline(stream,zlib.createGzip({level:1}),fs.createWriteStream(temporary,{mode:0o600})),status]);
  fs.renameSync(temporary,destination);
  // Decompress the whole stream to verify its gzip integrity, without extracting.
  await pipeline(fs.createReadStream(destination),zlib.createGunzip(),new (require('node:stream').Writable)({write(chunk,encoding,next){next();}}));
  return {file:destination,size:fs.statSync(destination).size,sha256:sha256(fs.readFileSync(destination))};
}

function installPackage(client,remote,{timeout=120000}={}) {
  const params={id:'com.ares.defaultName',ipkUrl:remote,subscribe:true};
  // Same service, parameters, states and EOF cancellation as LG CLI 3.2.6 lib/install.js.
  return new Promise((resolve,reject)=>{
    requestExec(client,'/usr/bin/luna-send-pub -i '+quote('luna://com.webos.appInstallService/dev/install')+' '+quote(JSON.stringify(params)),(error,stream)=>{
      if(error)return reject(error);
      let pending='',success=false,finished=false,errors='';
      const finish=(error)=>{if(finished)return;finished=true;clearTimeout(timer);stream.end();if(error)reject(error);else resolve();};
      const timer=setTimeout(()=>finish(new Error('App install timed out; inspect Application Manager before retrying')),timeout);
      stream.on('error',finish);stream.stderr.on('data',chunk=>errors+=chunk);
      stream.on('data',chunk=>{
        pending+=chunk.toString();
        const lines=pending.split(/\r?\n/);pending=lines.pop();
        for(const line of lines){
          if(!line.trim())continue;
          let response;try{response=JSON.parse(line);}catch{finish(new Error('Invalid install service response: '+line));return;}
          const status=response.details&&response.details.state||'';
          if(response.returnValue===false||/FAILED/i.test(status)||response.details?.errorCode||[22,23,24].includes(response.statusValue)){finish(new Error('App install failed: '+JSON.stringify(response)));return;}
          if(/installed|^SUCCESS/i.test(status)||response.statusValue===30){success=true;finish();return;}
        }
      });
      stream.on('close',()=>{if(!success)finish(new Error('Install service closed before success: '+errors));});
    });
  });
}
function removePackage(client,id,{timeout=120000}={}) {
  const params={id,subscribe:true};
  // Same service, parameters, states and EOF cancellation as LG CLI 3.2.6 lib/install.js.
  return new Promise((resolve,reject)=>{
    requestExec(client,'/usr/bin/luna-send -i '+quote('luna://com.webos.appInstallService/remove')+' '+quote(JSON.stringify(params)),(error,stream)=>{
      if(error)return reject(error);
      let pending='',success=false,finished=false,errors='';
      const finish=(error)=>{if(finished)return;finished=true;clearTimeout(timer);stream.end();if(error)reject(error);else resolve();};
      const timer=setTimeout(()=>finish(new Error('App removal timed out; inspect Application Manager before retrying')),timeout);
      stream.on('error',finish);stream.stderr.on('data',chunk=>errors+=chunk);
      stream.on('data',chunk=>{
        pending+=chunk.toString();
        const lines=pending.split(/\r?\n/);pending=lines.pop();
        for(const line of lines){
          if(!line.trim())continue;
          let response;try{response=JSON.parse(line);}catch{finish(new Error('Invalid removal service response: '+line));return;}
          const status=response.details&&response.details.state||'';
          if(response.returnValue===false||/FAILED/i.test(status)||response.details?.errorCode||[22,23,24,25].includes(response.statusValue)){finish(new Error('App removal failed: '+JSON.stringify(response)));return;}
          if(/removed|^SUCCESS/i.test(status)||response.statusValue===31){success=true;finish();return;}
        }
      });
      stream.on('close',()=>{if(!success)finish(new Error('Removal service closed before success: '+errors));});
    });
  });
}
module.exports={connect,exec,luna,upload,archive,installPackage,removePackage,secret};
