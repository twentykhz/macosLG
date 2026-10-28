'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'gathin rollback menu '));process.env.GATHIN_STATE_DIRECTORY=directory;
const {tarGzip}=require('../lib/release-archive'),ROOTS=require('../config/recovery-roots.json'),recovery=require('../lib/recovery');let calls=[];
recovery.rollback=async o=>{calls.push(o);return {restored:true};};const manual=require('../lib/manual-rollback');
const folder=path.join(directory,'backups','initial'),sessions=path.join(directory,'sessions');fs.mkdirSync(folder,{recursive:true});fs.mkdirSync(sessions);
const bytes=tarGzip([{name:ROOTS[0].slice(1)+'/settings.js',data:Buffer.from('initial')}]),archive=path.join(folder,'before-restore.tar.gz');fs.writeFileSync(archive,bytes);
const record={format:1,host:'192.0.2.44',hostFingerprint:'SHA256:fixture',createdAt:'2026-10-28T10:00:00Z',device:{modelName:'OLED65C2PSA'},folder,roots:ROOTS,parents:{},present:[ROOTS[0]],active:[],mutationsStarted:false,saved:{file:archive,sha256:crypto.createHash('sha256').update(bytes).digest('hex')}};
const snapshot=path.join(folder,'snapshot.json'),session=path.join(sessions,'one.json');fs.writeFileSync(snapshot,JSON.stringify(record));fs.writeFileSync(session,JSON.stringify({...record,mutationsStarted:true}));
test.beforeEach(()=>{calls=[];});
test('snapshot discovery filters TV, ignores malformed files and prefers session journal over duplicate snapshot',()=>{
 fs.writeFileSync(path.join(sessions,'bad.json'),'{');fs.writeFileSync(path.join(sessions,'another-tv.json'),JSON.stringify({...record,host:'192.0.2.45',folder:folder+'other'}));
 const items=manual.discover(record.host,directory);assert.equal(items.length,1);assert.equal(items[0].file,session);assert(items[0].record.mutationsStarted);
});
test('interactive rollback selects the listed snapshot and accepts mixed-case CO',async()=>{
 const answers=['1','cO'];await manual.run({host:record.host},{interactive:true,ask:async()=>answers.shift(),print(){}});assert.equal(calls.length,1);assert.equal(calls[0].recoverySession,session);assert(calls[0].manualRollback);
});
test('negative confirmation and zero selection perform no rollback',async()=>{
 for(const answer of ['no','','0']){await manual.run({host:record.host,recoverySession:snapshot},{interactive:true,ask:async()=>answer,print(){}});assert.equal(calls.length,0);}
 assert((await manual.run({host:record.host},{interactive:true,ask:async()=> '0',print(){}})).cancelled);
});
test('non-interactive rollback requires explicit snapshot and confirmation; dry run does not confirm',async()=>{
 await assert.rejects(manual.run({host:record.host},{interactive:false,print(){}}),/--session/);await assert.rejects(manual.run({host:record.host,recoverySession:folder},{interactive:false,print(){}}),/--yes/);assert.equal(calls.length,0);
 await manual.run({host:record.host,recoverySession:folder,dryRun:true},{interactive:false,print(){}});assert(calls[0].dryRun);calls=[];
 await manual.run({host:record.host,recoverySession:folder,confirmRollback:true,rootKey:'key with spaces.pem'},{interactive:false,print(){}});assert.equal(calls[0].key,'key with spaces.pem');
});
test('wrong TV and bad snapshot checksum fail before any rollback',async()=>{
 await assert.rejects(manual.run({host:'wrong-tv',recoverySession:snapshot,confirmRollback:true},{interactive:false,print(){}}),/another TV/);
 const invalid=path.join(directory,'invalid.json');fs.writeFileSync(invalid,JSON.stringify({...record,saved:{...record.saved,sha256:'0'.repeat(64)}}));await assert.rejects(manual.run({host:record.host,recoverySession:invalid,confirmRollback:true},{interactive:false,print(){}}),/checksum mismatch/);assert.equal(calls.length,0);
});
test('shared CLI maps rollback session, dry-run and confirmation without changing Setup flags',()=>{
 const {parse}=require('../scripts/run');const {mode,o}=parse(['Rollback','--host',record.host,'--session',snapshot,'--dry-run','--yes']);assert.equal(mode,'Rollback');assert.equal(o.recoverySession,snapshot);assert(o.dryRun&&o.confirmRollback);assert.throws(()=>parse(['Setup','--host',record.host,'--yes']),/only available for Rollback/);
});
test('manual rollback refuses snapshots missing the original SSH fingerprint',async()=>{
 const file=path.join(directory,'unidentified.json');fs.writeFileSync(file,JSON.stringify({...record,hostFingerprint:null}));await assert.rejects(manual.run({host:record.host,recoverySession:file,confirmRollback:true},{interactive:false,print(){}}),/fingerprint/);assert.equal(calls.length,0);
});
test.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
