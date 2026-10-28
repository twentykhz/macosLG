'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {evaluate,parseMap,check}=require('../lib/rootability');
function fixture(){return {models:{SK8000PTA:{codename:'goldilocks',otaId:'exact-region',machine:'m16pp',broadcast:'dvb'}},exploits:{'exact-region':{goldilocks:{faultmanager:{latest:{version:'05.50.70'}},rootmytv:{latest:{version:'05.40.26'},patched:{version:'05.50.01'}}}}}};}
const info={modelName:'55SK8000PTA',firmwareVersion:'05.50.70'};
test('exact model/firmware selects faultmanager and rejects patched RootMy.TV',()=>{
 const r=evaluate(info,fixture());assert.equal(r.status,'rootable');assert.equal(r.codename,'goldilocks');assert.equal(r.methods[0].key,'faultmanager');assert.equal(r.methods[0].status,'rootable');assert.equal(r.methods.find(m=>m.key==='rootmytv').status,'patched');
});
test('newer firmware is unknown rather than silently rootable; patch boundary is inclusive',()=>{
 const data=fixture();assert.equal(evaluate({...info,firmwareVersion:'05.50.71'},data).status,'unknown');
 data.exploits['exact-region'].goldilocks.faultmanager.patched={version:'05.50.70'};assert.equal(evaluate(info,data).status,'not-rootable');
});
test('missing exact model or region never borrows a similar device result',()=>{
 assert.equal(evaluate({...info,modelName:'55SK8000PUA'},fixture()).status,'unknown');const data=fixture();data.models.SK8000PTA.otaId='other-region';assert.equal(evaluate(info,data).status,'unknown');
});
test('unknown firmware formats, missing latest data and non-DVB requirements do not pass',()=>{
 assert.equal(evaluate({...info,firmwareVersion:'latest'},fixture()).status,'unknown');const d=fixture();d.exploits['exact-region'].goldilocks.faultmanager={};assert.equal(evaluate(info,d).status,'unknown');
 d.models.SK8000PTA.broadcast='atsc';d.exploits['exact-region'].goldilocks.dangbro={latest:{version:'05.50.70'}};assert.equal(evaluate(info,d).methods.find(m=>m.key==='dangbro').status,'incompatible');
});
test('firmware upgrade selects the upgraded codename data',()=>{
 const d=fixture();d.models.SK8000PTA.variants=[{codename:'ombre',swMajor:'23'}];d.exploits['exact-region'].ombre={faultmanager:{latest:{version:'23.10.01'}}};const r=evaluate({...info,firmwareVersion:'23.10.01'},d);assert.equal(r.codename,'ombre');assert.equal(r.status,'rootable');
});
test('website source data is parsed as JSON, never evaluated as JavaScript',()=>{
 const d=fixture(),map={sources:['x/src/models.gen.js','x/src/exploits.gen.js'],sourcesContent:['export default '+JSON.stringify(d.models)+';','export default '+JSON.stringify(d.exploits)+';']};assert.deepEqual(parseMap(map),d);map.sourcesContent[0]='export default (()=>{throw Error("must never run")})()';assert.throws(()=>parseMap(map),SyntaxError);
});

test('an unfamiliar method added upstream prevents a false not-rootable result',()=>{
 const d=fixture();d.exploits['exact-region'].goldilocks={newMethod:{latest:{version:'05.50.70'}}};assert.equal(evaluate(info,d).status,'unknown');
});
test('live website format is supported without executing its bundle; network failures stay unknown',async()=>{
 const d=fixture();const map={sources:['x/src/models.gen.js','x/src/exploits.gen.js'],sourcesContent:['export default '+JSON.stringify(d.models),'export default '+JSON.stringify(d.exploits)]};const calls=[];
 const r=await check(info,{fetcher:async url=>{calls.push(url);return new Response(url.endsWith('.map')?JSON.stringify(map):url.endsWith('.js')?'//# sourceMappingURL=app.123.js.map':'<script src="js/app.123.js"></script>');}});assert.equal(r.status,'rootable');assert.equal(calls.length,3);fs.unlinkSync(r.reportFile);
 const failure=await check(info,{fetcher:async()=>{throw Error('offline');}});assert.equal(failure.status,'unknown');assert.match(failure.reason,/offline/);fs.unlinkSync(failure.reportFile);
});
