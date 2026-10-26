'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {parse}=require('../scripts/tv');
const {assertProfile,profile,quote,root,verify}=require('../lib/local');
test('restore defaults to the recorded TV, with explicit dry run and no password storage',()=>{
  const result=parse(['restore','--host','192.168.1.50','--dry-run']);
  assert.equal(result.command,'restore');assert.equal(result.options.host,'192.168.1.50');assert.equal(result.options.dryRun,true);
  assert.equal('password' in result.options,false);
});
test('unknown operations and malformed flags fail before SSH',()=>{
  assert.throws(()=>parse(['factory-reset']),/Unknown command/);
  assert.throws(()=>parse(['restore','--host']),/Missing value/);
  assert.throws(()=>parse(['restore','--password','secret']),/Unknown option/);
  assert.throws(()=>parse(['reboot','--dry-run']),/only supported/);
});
test('wrong hardware is refused even with firmware override',()=>{
  assert.throws(()=>assertProfile({...profile,modelName:'OLED55C4'},{allowFirmwareMismatch:true}),/Wrong TV/);
  assert.throws(()=>assertProfile({...profile,boardType:'other'},{allowFirmwareMismatch:true}),/Wrong TV/);
});
test('untested firmware requires explicit override',()=>{
  assert.throws(()=>assertProfile({...profile,firmwareVersion:'99.99.99'}),/untested/);
  assert.doesNotThrow(()=>assertProfile({...profile,firmwareVersion:'99.99.99'},{allowFirmwareMismatch:true}));
});
test('shell quoting treats substitutions and apostrophes as literal data',()=>{
  assert.equal(quote("file'$(touch secret)"),"'file'\\''$(touch secret)'");
});
test('verified payload includes app, active relay and boot hooks',()=>{
  const entries=verify();
  for(const name of ['payload/app/appinfo.json','payload/home/home-keyhook.py','payload/home/boot.sh','payload/home/41-gathin-home-keyhook'])assert(entries.some(entry=>entry.path===name));
  const app=JSON.parse(fs.readFileSync(path.join(root,'payload/app/appinfo.json')));
  assert.equal(app.id,profile.appId);assert.equal(app.version,profile.appVersion);
});
test('app/package checksum verification detects tampering before installation',()=>{
  const parent=path.join(root,'.local/test-fixtures');fs.mkdirSync(parent,{recursive:true});
  const temporary=fs.mkdtempSync(path.join(parent,'tamper-'));
  try{
    for(const name of ['payload','packages','checksums.json'])fs.cpSync(path.join(root,name),path.join(temporary,name),{recursive:true});
    assert.doesNotThrow(()=>verify(temporary));
    fs.appendFileSync(path.join(temporary,'payload/app/config.js'),'\n// test mutation\n');
    assert.throws(()=>verify(temporary),/checksum mismatch/);
  }finally{
    assert.equal(path.dirname(path.resolve(temporary)),path.resolve(parent));
    fs.rmSync(temporary,{recursive:true});
  }
});
