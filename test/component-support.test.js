'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),zlib=require('node:zlib');
const support=require('../config/component-support.json');
function executables(file){const ar=fs.readFileSync(file);assert.equal(ar.subarray(0,8).toString(),'!<arch>\n');let data;for(let p=8;p+60<=ar.length;){const name=ar.subarray(p,p+16).toString().trim().replace(/\/$/,''),size=Number(ar.subarray(p+48,p+58).toString());if(name==='data.tar.gz')data=zlib.gunzipSync(ar.subarray(p+60,p+60+size));p+=60+size+(size%2);}assert(data);const rows=[];for(let p=0;p+512<=data.length;){const h=data.subarray(p,p+512);if(h.every(b=>b===0))break;const name=h.subarray(0,100).toString().split('\0')[0],size=parseInt(h.subarray(124,136).toString().split('\0')[0].trim()||'0',8),bytes=data.subarray(p+512,p+512+size);if(bytes.subarray(0,4).equals(Buffer.from([127,69,76,70])))rows.push({name:name.split('/').pop(),elfClass:bytes[4],machine:bytes[5]===1?bytes.readUInt16LE(18):bytes.readUInt16BE(18)});p+=512+Math.ceil(size/512)*512;}return rows;}
test('pinned IPK native architecture inventory matches deployment guards',()=>{
 const native=executables('upstream/hbchannel.ipk'),metadata=support['org.webosbrew.hbchannel'];assert.deepEqual(native.map(n=>n.name).sort(),[...metadata.components].sort());for(const row of native){assert.equal(row.elfClass,metadata.elfClass);assert.equal(row.machine,metadata.elfMachine);}assert(!metadata.architectures.includes('aarch64'));
 for(const name of ['privacy','youtube'])assert.deepEqual(executables('upstream/'+name+'.ipk'),[]);assert.equal(support.portableServices.native,false);
});
test('C2 never receives reference advanced payload or pinned ARM32 Homebrew',async()=>{
 const {parse}=require('../lib/tv-capabilities'),{transcript,info}=require('./helpers/tv-profiles');let uploads=0;
 require('../lib/ssh');require.cache[require.resolve('../lib/ssh')].exports={async upload(){uploads++;throw Error('Unexpected native/reference upload');},async luna(c,method){if(method.endsWith('getSystemInfo'))return info;return {apps:[{id:'youtube.leanback.v4',version:'0.5.3',title:'YouTube AdFree'},{id:'ooo.lew.lifesgoodwithoutspying'}]};}};
 const client={__gathinCapabilities:Promise.resolve(parse(transcript({arch:'aarch64',python:false})))};
 const result=await require('../lib/post-install').ensureApps(client,{compatibilityMode:true});assert(result.report.some(r=>r.feature==='org.webosbrew.hbchannel'&&r.status==='skipped'));
 const advanced=await require('../lib/advanced').installAdvanced(client);assert(advanced.skipped);
 const {AutorootSteps}=require('../lib/autoroot');await assert.rejects(AutorootSteps.prototype.runFaultmanager.call({mark(){},rooted:false,devClient:client}),/ARM32 native binaries/);assert.equal(uploads,0);
});
