'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {destination,plan}=require('../lib/deployment');
test('deployment plan validates generated and static targets against known recovery roots',()=>{
 const p=plan({arch:'armv7l',python2:'/usr/bin/python'});assert(p.entries.length>100);for(const e of p.entries){assert(destination(e.remote));assert(/^[a-f0-9]{64}$/.test(e.generated?e.generatorSha256:e.sha256));}assert(p.entries.some(e=>e.remote.endsWith('/observe-home.py')&&e.mode==='755'));assert(p.entries.some(e=>e.remote.endsWith('/bridge.token')&&e.mode==='600'));
 for(const p of ['/etc/passwd','/var/lib/webosbrew/init.d/99-unmanaged','/tmp/../etc/passwd','/home/root/gathin-home-keyhook.py/child','/tmp/line\n','/tmp/./x','/tmp/a\\b'])assert.throws(()=>destination(p));
});
