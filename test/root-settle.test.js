'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{settle}=require('../lib/root-settle'),{runSequence}=require('../lib/root-methods');
test('reported faultmanager success plus refused SSH never falls through to another exploit',async()=>{
 const attempts=[],records=[];await assert.rejects(runSequence([{key:'faultmanager',status:'rootable'},{key:'dejavuln',status:'rootable'}],{attempt:async m=>{attempts.push(m.key);return {rootReported:true};},verify:async()=>{throw Error('connect ECONNREFUSED :22');},record:async r=>records.push(r)}),e=>e.rootPending===true);
 assert.deepEqual(attempts,['faultmanager']);assert.equal(records[0].status,'root-pending');
});
test('root settling retries verification after enabling SSH without invoking any exploit',async()=>{
 let attempts=0,asked=0;await settle({verifyBridge:async()=>{throw Error('service not ready');},verifySSH:async()=>{if(++attempts<3)throw Error('SSH refused');},attempts:2,interactive:true,wait:async()=>{},askFn:async()=>{asked++;return '';}});assert.equal(attempts,3);assert.equal(asked,1);
});
test('pending root verification stops noninteractive or cancelled setup',async()=>{
 for(const interactive of [false,true])await assert.rejects(settle({verifyBridge:async()=>{throw Error('unavailable');},verifySSH:async()=>{throw Error('SSH refused');},attempts:1,interactive,askFn:async()=>'DUNG'}),e=>e.rootPending===true);
});
test('verified root bridge proceeds directly, while changed SSH host keys stop immediately',async()=>{
 let calls=0;await settle({verifyBridge:async()=>{},verifySSH:async()=>{calls++;},interactive:false});assert.equal(calls,0);
 await assert.rejects(settle({verifyBridge:async()=>{throw Error('unavailable');},verifySSH:async()=>{throw Error('Unknown/changed TV host key');},interactive:false}),e=>e.rootPending&&/host key/.test(e.message));
});
