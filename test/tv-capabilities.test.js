'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const cap=require('../lib/tv-capabilities'),{summarize}=require('../lib/rooted-compat'),{profile}=require('../lib/local'),{transcript,info}=require('./helpers/tv-profiles');
test('A: reference ARM32 Python2 retains validated HOME capability',()=>{
 const c=cap.parse(transcript());assert(cap.legacyHome(c,profile));const r=summarize({...c,info:profile,homeProbe:true,voiceAgent:true,youtubeVersion:'0.5.3'});assert(r.homeRelay&&r.voice&&r.rollback&&r.nodeServices);
 for(const changed of [{arch:'aarch64'},{eventSize:24},{python2:null}])assert(!cap.legacyHome({...c,...changed},profile));
 assert(!cap.legacyHome(c,info));
});
test('B: C2 has complete portable recovery and core without any Python',()=>{
 const c=cap.parse(transcript({python:false,arch:'aarch64'})),r=summarize({...c,info});assert.equal(c.python,null);assert.equal(c.python2,null);assert.equal(c.python3,null);assert(r.backup&&r.rollback&&r.launcher&&r.controls&&r.hdmi);assert(!r.homeRelay&&!r.voice&&!r.referenceTuning);
});
test('C: shell/tar-only TV permits backup, refuses managed installation and optional services',()=>{
 const c=cap.parse(transcript({python:false,node:false})),r=summarize({...c,info});assert(r.backup&&r.launcher);assert(!r.rollback&&!r.controls&&!r.nodeServices&&!r.homeRelay);
});
test('D: checksum chain falls back only to verified providers and fails closed',()=>{
 const base=transcript({python:false,node:false,checksum:false});assert.throws(()=>cap.hashCommand(cap.parse(base),'/tmp/payload'),/refusing unchecked upload/);
 const empty=require('node:crypto').createHash('sha256').update('').digest('hex');
 const busy=cap.parse(base+'\nbusybox\t/bin/busybox\nbusyHash\t'+empty+'  /dev/null\nbusyTar\ttar');assert.equal(busy.hash.kind,'busybox');assert.deepEqual(busy.tar,['/bin/tar']);
 assert.equal(cap.parse(transcript({python:false,checksum:false})).hash.kind,'node');
 assert.equal(cap.parse(transcript({node:false,checksum:false})).hash.kind,'python');
 assert.equal(cap.parse(transcript({node:false,checksum:false}).replace('pythonHash\t'+empty,'pythonHash\tbroken')).hash,null);
 assert.throws(()=>cap.parse('uid\t0'),/incomplete/);
});
test('capability probe is valid POSIX shell and memoized per SSH connection',async()=>{
 const shell=process.platform==='win32'?'C:/Program Files/Git/bin/bash.exe':'sh';const result=spawnSync(shell,['-n'],{input:cap.probeCommand(),encoding:'utf8'});assert.equal(result.status,0,result.stderr);
 const c={__gathinCapabilities:Promise.resolve(cap.parse(transcript({python:false})))};assert.equal(await cap.probe(c),await cap.probe(c));
 assert(!/\b(?:touch|mkdir|reboot|kill)\s/.test(cap.probeCommand()));
});
test('actual shell probe tolerates absent Python commands without invoking them',()=>{
 const shell=process.platform==='win32'?'C:/Program Files/Git/bin/bash.exe':'bash';
 const prefix='command() { case "$2" in python|python2|python3) return 1;; esac; builtin command "$@"; }\n';
 const result=spawnSync(shell,['-s'],{input:prefix+cap.probeCommand(),encoding:'utf8',timeout:15000});
 assert.equal(result.status,0,result.stderr);const c=cap.parse(result.stdout);assert.equal(c.python,null);assert.equal(c.python2,null);assert.equal(c.python3,null);assert(!/python.*not found/i.test(result.stderr));
});
