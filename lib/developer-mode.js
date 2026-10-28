'use strict';
const net=require('node:net');
const {text,ask}=require('./setup-language');
function sshService(host,{port=9922,timeout=4000}={}){
 return new Promise(resolve=>{
  let done=false,data='';const socket=net.createConnection({host,port});
  const finish=(available,reason)=>{if(done)return;done=true;socket.destroy();resolve({available,reason});};
  socket.setTimeout(timeout,()=>finish(false,'timeout'));
  socket.once('error',e=>finish(false,e.code||'connection failed'));
  socket.once('end',()=>finish(false,'no SSH banner'));
  socket.once('close',()=>finish(false,'connection closed'));
  socket.on('data',chunk=>{data+=chunk.toString('ascii');if(/(?:^|\n)SSH-(2\.0|1\.99)-[^\r\n]+/.test(data))finish(true,'SSH banner received');else if(data.length>4096)finish(false,'not an SSH service');});
 });
}
async function keyService(host,{fetcher=fetch,timeout=4000}={}){
 try{
  const response=await fetcher('http://'+host+':9991/webos_rsa',{signal:AbortSignal.timeout(timeout),redirect:'error'});
  if(!response.ok){await response.body?.cancel?.();return {available:false,reason:'HTTP '+response.status};}
  let size=0;const chunks=[];
  for await(const chunk of response.body){size+=chunk.length;if(size>65536)throw Error('key response exceeds limit');chunks.push(Buffer.from(chunk));}
  const key=Buffer.concat(chunks);
  if(!/-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/.test(key.toString('ascii')))return {available:false,reason:'invalid key response'};
  return {available:true,reason:'key downloaded',key};
 }catch(e){return {available:false,reason:e.name==='TimeoutError'?'timeout':e.code||'unreachable'};}
}
async function probe(host,{sshProbe=sshService,keyProbe=keyService}={}){
 const results=await Promise.allSettled([sshProbe(host),keyProbe(host)]);
 const value=i=>results[i].status==='fulfilled'?results[i].value:{available:false,reason:'probe failed'};
 return {devMode:value(0),keyServer:value(1)};
}
function publicStatus(status){return {devMode:{available:!!status.devMode.available,reason:status.devMode.reason},keyServer:{available:!!status.keyServer.available,reason:status.keyServer.reason},authenticated:false};}
function print(status,{localKey=false}={}){
 console.log(text('Dev Mode Status / SSH 9922: ','Dev Mode Status / SSH 9922: ')+(status.devMode.available?text('REACHABLE; authentication pending','CO PHAN HOI; cho xac thuc'):text('NOT REACHABLE (may be off, expired session or network issue)','CHUA TRUY CAP DUOC (co the chua bat, het phien hoac loi mang)')));
 console.log('Key Server / 9991: '+(status.keyServer.available?text('READY (valid key received)','SAN SANG (da nhan khoa hop le)'):localKey?text('NOT REACHABLE; using your supplied key','CHUA TRUY CAP DUOC; dung khoa ban chi dinh'):text('NOT READY (may be off or blocked by the network)','CHUA SAN SANG (co the chua bat hoac bi mang chan)')));
}
async function ensure(host,{localKey=false,interactive=process.stdin.isTTY,probeFn=probe,askFn=ask,reporter=print,onStatus=()=>{}}={}){
 console.log(text('On the TV: open Developer Mode, enable Dev Mode Status and allow its reboot. Reopen Developer Mode and enable Key Server. Keep TV and installer on the same LAN.','Tren TV: mo Developer Mode, bat Dev Mode Status va cho TV reboot. Mo lai Developer Mode, bat Key Server. Giu TV va thiet bi cai cung mang LAN.'));
 while(true){
  const status=await probeFn(host);reporter(status,{localKey});onStatus(publicStatus(status));
  if(status.devMode.available&&(status.keyServer.available||localKey))return status;
  console.log(text('Cannot read the UI switches directly without authentication. Check both switches, remaining session time, TV IP and guest-Wi-Fi isolation. DangBro browser alternative: https://azoffshowy.github.io/dangbro/ (follow its DVB/firmware checks, then choose already rooted in setup).','Chua xac thuc nen khong the doc truc tiep cong tac giao dien. Kiem tra hai cong tac, thoi gian phien, IP TV va Wi-Fi khach. Cach trinh duyet DangBro: https://azoffshowy.github.io/dangbro/ (lam theo kiem tra DVB/firmware cua tool, sau do chon TV da root trong setup).'));
  if(!interactive)throw Object.assign(Error(text('Developer Mode is not ready: enable Dev Mode Status and Key Server, check the TV IP/network, then retry. No exploit was run.','Developer Mode chua san sang: bat Dev Mode Status va Key Server, kiem tra IP/mang, roi thu lai. Chua chay exploit.')),{developerPrerequisite:true});
  const answer=(await askFn('After enabling both, press Enter to CHECK AGAIN, or type STOP: ','Sau khi bat ca hai, nhan Enter de KIEM TRA LAI, hoac nhap DUNG: ')).trim().toUpperCase();
  if(['STOP','DUNG','0'].includes(answer))throw Object.assign(Error(text('Developer Mode check cancelled. No exploit was run.','Da dung kiem tra Developer Mode. Chua chay exploit.')),{cancelled:true});
 }
}
module.exports={sshService,keyService,probe,publicStatus,print,ensure};
