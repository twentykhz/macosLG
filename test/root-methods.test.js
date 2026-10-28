'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {runSequence}=require('../lib/root-methods');
test('DangBro guide uses the upstream browser flow and refuses known non-DVB/old SDK targets',()=>{
 const {dangbroInstructions}=require('../lib/root-methods');
 const guide=dangbroInstructions({host:'192.0.2.11',info:{boardType:'O22_DVB_AJ',sdkVersion:'7.6.0'}});assert(guide.supported);
 const text=guide.lines.join('\n');assert.match(text,/https:\/\/azoffshowy.github.io\/dangbro\//);assert.match(text,/https:\/\/192.0.2.11:3001\//);assert.match(text,/pairing prompt/);assert.match(text,/UID 0/);assert(!text.includes('--disable-web-security'));assert(!text.includes('--ignore-certificate-errors'));
 assert(!dangbroInstructions({info:{boardType:'O22_ATSC_KR',sdkVersion:'7.6.0'}}).supported);
 assert(!dangbroInstructions({info:{boardType:'M16PP_DVB_EU',sdkVersion:'4.4.0'}}).supported);
});
const method=(key,other={})=>({key,status:'rootable',kind:'manual',...other});
test('faultmanager runs first and a verified fallback stops the sequence',async()=>{
 const attempted=[],records=[];
 const winner=await runSequence([method('dejavuln'),method('faultmanager'),method('crashd')],{attempt:async m=>{attempted.push(m.key);if(m.key==='faultmanager')throw Error('faultmanager failed');},verify:async m=>{if(m.key==='faultmanager')throw Error('UID not root');},record:async r=>records.push(r)});
 assert.equal(winner,'dejavuln');assert.deepEqual(attempted,['faultmanager','dejavuln']);assert.equal(records[0].status,'failed');assert.match(records[0].error,/faultmanager failed/);assert.equal(records[1].status,'root-verified');
});
test('partial success is verified after an error and prevents another exploit',async()=>{
 const attempts=[],records=[];await runSequence([method('faultmanager'),method('dejavuln')],{attempt:async m=>{attempts.push(m.key);throw Error('installer returned an error');},verify:async()=>{},record:async r=>records.push(r)});assert.deepEqual(attempts,['faultmanager']);assert.equal(records[0].status,'root-verified');assert.match(records[0].warning,/installer/);
});
test('patched, unknown, hardware and user-skipped methods never execute',async()=>{
 const attempts=[],records=[];await assert.rejects(runSequence([method('patched',{status:'patched'}),method('unknown',{status:'unknown'}),method('nvm',{kind:'hardware'}),method('dejavuln')],{attempt:async m=>{attempts.push(m.key);return {skipped:true};},verify:async()=>{throw Error('must not verify skipped method');},record:async r=>records.push(r)}),/No method/);assert.deepEqual(attempts,['dejavuln']);assert(records.every(r=>r.status==='skipped'));
});
test('uncertain in-flight exploit or cancellation is logged and never starts another method',async()=>{
 for(const flag of ['uncertain','cancelled']){let count=0;const records=[];await assert.rejects(runSequence([method('faultmanager'),method('dejavuln')],{attempt:async()=>{count++;throw Object.assign(Error('stop'),{[flag]:true});},verify:async()=>{throw Error('must not proceed');},record:async r=>records.push(r)}),/stop/);assert.equal(count,1);assert.equal(records[0].status,flag==='uncertain'?'in-progress':'cancelled');}
});
test('failed root verification tries every remaining eligible method once',async()=>{
 const attempts=[],records=[];await assert.rejects(runSequence(['faultmanager','dejavuln','wta','crashd','rootmytv','getmenow','asm','mvpd','slopbro','dangbro'].map(k=>method(k)),{attempt:async m=>attempts.push(m.key),verify:async()=>{throw Error('UID not 0');},record:async r=>records.push(r)}),/No method/);assert.equal(new Set(attempts).size,10);assert.equal(records.filter(r=>r.status==='failed').length,10);
});

test('root found after a skipped manual step prevents a second method',async()=>{
 const attempted=[],records=[];const key=await runSequence([method('dejavuln'),method('wta')],{attempt:async m=>{attempted.push(m.key);return {skipped:true};},verify:async()=>{},record:async r=>records.push(r)});assert.equal(key,'dejavuln');assert.deepEqual(attempted,['dejavuln']);assert.equal(records.at(-1).status,'root-verified');
});
