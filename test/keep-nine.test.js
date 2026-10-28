'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
test('rooted app profile keeps the sample nine, disables arbitrary other apps and restores prior states',async()=>{
 const policy={...require('../config/setup-policy.json'),debloatMode:'keep-nine'},P='/var/lib/webos-debloat/gathin-final',files=new Map(),calls=[],module={exports:{}};
 const source=fs.readFileSync('scripts/remove-extra-apps.py','utf8').match(/keep=set\(\[([^\]]+)\]/)[1],sample=[...source.matchAll(/'([^']+)'/g)].map(m=>m[1]);assert.deepEqual([...policy.primaryApps].sort(),sample.sort());
 const apps=policy.primaryApps.map((id,i)=>({id,locked:i===0})).concat([{id:'new.thirdparty.app',locked:false},{id:'unknown.lock.app'},{id:'already.blocked',locked:true},{id:'refused.lock.app',locked:false},{id:'com.webos.app.music',locked:false},{id:'com.webos.app.discovery',locked:false},...policy.requiredSystemApps.map(id=>({id,locked:false})),...[1,2,3,4].map(n=>({id:'com.webos.app.hdmi'+n,locked:false}))]);
 files.set(P+'/policy.json',JSON.stringify(policy));files.set(P+'/journal.json',JSON.stringify({session:'2026-10-29T00:00:00Z',apps:[]}));files.set('/proc/self/mountinfo','');
 const io={readFileSync:p=>files.get(p),writeFileSync:(p,v)=>files.set(p,String(v))};
 const child={execFile(file,args,options,done){calls.push({file,args});if(file!=='/usr/bin/luna-send')return done(null,'');const api=args[4],data=JSON.parse(args[5]);if(api.endsWith('/listApps'))return done(null,JSON.stringify({returnValue:true,apps}));if(api.endsWith('/getAppInfo'))return done(null,'{"returnValue":true,"appInfo":{}}');if(api.endsWith('/lockApp')){if(data.id==='refused.lock.app'&&data.lock)return done(null,'{"returnValue":false,"errorText":"not supported"}');const app=apps.find(a=>a.id===data.id);app.locked=data.lock;return done(null,JSON.stringify({returnValue:true,locked:data.lock}));}return done(null,'{"returnValue":true}');}};
 vm.runInNewContext(fs.readFileSync('payload/portable/maintenance.js','utf8'),{module,console:{log(){}},process:{argv:[]},require:n=>n==='fs'?io:child});
 const report=await module.exports.main('debloat');assert.equal(report.kept.length,9);assert.equal(report.failed.length,1);assert.equal(report.failed[0].id,'refused.lock.app');assert.equal(report.missing.length,0);
 for(const id of ['new.thirdparty.app','unknown.lock.app','com.webos.app.music','com.webos.app.discovery'])assert(apps.find(a=>a.id===id).locked,id);
 for(const id of policy.primaryApps)assert.equal(apps.find(a=>a.id===id).locked,false,id);
 assert(!calls.some(c=>c.args[4]&&/lockApp|closeByAppId/.test(c.args[4])&&module.exports.appRole(policy,JSON.parse(c.args[5]).id)==='system'));
 const journal=JSON.parse(files.get(P+'/journal.json'));assert.equal(journal.apps.find(a=>a.id==='unknown.lock.app').restoreLock,false);
 await module.exports.main('undo');assert.equal(apps[0].locked,true);assert.equal(apps.find(a=>a.id==='unknown.lock.app').locked,false);assert.equal(apps.find(a=>a.id==='already.blocked').locked,true);assert.equal(apps.find(a=>a.id==='new.thirdparty.app').locked,false);
 files.set(P+'/policy.json',JSON.stringify({...policy,primaryApps:Array(9).fill('same.app')}));const count=calls.length;await assert.rejects(module.exports.main('debloat'),/nine unique/);assert.equal(calls.length,count);
});
