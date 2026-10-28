'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'gathin-doctor-'));process.env.GATHIN_STATE_DIRECTORY=folder;const commands=[];
require('../lib/ssh');require.cache[require.resolve('../lib/ssh')].exports={
 async exec(client,command){commands.push(command);if(command.includes('GATHIN_CAPABILITIES_V1')){assert(!/executeOneShot|\brm\s|\breboot\b|\btouch\s|\bkill\s/.test(command));return require('./helpers/tv-profiles').transcript({python:false,arch:'aarch64'});}assert(!/executeOneShot|\brm\s|\breboot\b|\btouch\s|\bchmod\s|\bkill\s/.test(command),'Doctor wrote to TV: '+command);return command==='id -u'?'0':command.includes('networkInterfaces')?'[]':'';},
 async luna(client,method){commands.push(method);assert(/\/(?:get|list)/.test(method));return {returnValue:true,apps:[{id:'com.gathin.tvhome'}]};}
};
test('Doctor does not create capture files, launch apps or change TV settings',async()=>{
 const report=await require('../lib/post-install').checkFeatures({}, {host:'192.0.2.44',readOnly:true});assert(commands.length>5);assert.equal(report.results.find(r=>r.feature==='stream-capture').status,'manual-check-required');assert.equal(report.capabilities.probes.python,null);assert.equal(report.capabilities.features.rollback,true);assert.equal(report.capabilities.features.homeRelay,false);
});
test.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
