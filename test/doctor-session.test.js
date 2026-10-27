'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
let closed=false,fail=false;
require('../lib/ssh');require.cache[require.resolve('../lib/ssh')].exports={async connect(){closed=false;return {end(){closed=true;}};}};
require('../lib/post-install');require.cache[require.resolve('../lib/post-install')].exports={async checkFeatures(){await new Promise(r=>setTimeout(r,10));assert.equal(closed,false,'Doctor must keep SSH alive until checks finish');if(fail)throw Error('Probe failed');return {complete:true};}};
const {main}=require('../scripts/run');
test('Doctor waits for asynchronous checks before ending SSH, including the failure path',async()=>{
 assert.deepEqual(await main(['Doctor','--host','192.0.2.91']),{complete:true});assert.equal(closed,true);
 fail=true;await assert.rejects(main(['Doctor','--host','192.0.2.91']),/Probe failed/);assert.equal(closed,true);
});
