'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'gathin-minimal-backup-'));process.env.GATHIN_STATE_DIRECTORY=directory;
const {parse}=require('../lib/tv-capabilities'),{transcript,info}=require('./helpers/tv-profiles');let writes=0;
require('../lib/ssh');require.cache[require.resolve('../lib/ssh')].exports={async exec(c,command){assert(command.includes('if [ -e '));return '';},async luna(){return {};},async upload(){writes++;throw Error('Unexpected upload');}};
test('minimal no-Node/no-Python TV can export an archive but cannot start mutations',async()=>{
 const recovery=require('../lib/recovery'),client={__gathinCapabilities:Promise.resolve(parse(transcript({node:false,python:false,stat:false})))},options={host:'192.0.2.45',recoverySession:path.join(directory,'session.json')};
 const record=await recovery.capture(client,{...options,backupOnly:true},{info,apps:[]});assert(fs.existsSync(record.saved.file));assert.equal(record.recoveryEngine,null);assert.throws(()=>recovery.markMutation(options),/No verified rollback engine/);await assert.rejects(recovery.capture(client,options,{info,apps:[]}),/No verified rollback path/);assert.equal(writes,0);
});
test.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
