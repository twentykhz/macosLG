'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{spawnSync}=require('node:child_process');
test('production rollback restores real snapshot files in an isolated filesystem',()=>{
 const r=spawnSync('python',[path.join(__dirname,'rollback-sandbox.py'),path.join(__dirname,'../scripts/rollback-snapshot.py'),path.join(__dirname,'../config/recovery-roots.json')],{encoding:'utf8'});
 assert.equal(r.status,0,r.stdout+'\n'+r.stderr);assert.match(r.stdout,/exact original files, tokens, wallpaper settings/);
});
test('a file replacement failure compensates earlier roots instead of leaving a mixed snapshot',()=>{
 const r=spawnSync('python',[path.join(__dirname,'rollback-sandbox.py'),path.join(__dirname,'../scripts/rollback-snapshot.py'),path.join(__dirname,'../config/recovery-roots.json'),'--fail-during-restore'],{encoding:'utf8'});
 assert.equal(r.status,0,r.stdout+'\n'+r.stderr);assert.match(r.stdout,/compensates prior file replacements/);
});
for(const [file,flag] of [['promote-app.py','--promote'],['preserve-app.py','--preserve']])test(file+' retains per-TV state while replacing application code',()=>{
 const r=spawnSync('python',[path.join(__dirname,'rollback-sandbox.py'),path.join(__dirname,'../scripts/'+file),path.join(__dirname,'../config/recovery-roots.json'),flag],{encoding:'utf8'});
 assert.equal(r.status,0,r.stdout+'\n'+r.stderr);assert.match(r.stdout,/new application code with original per-TV token and wallpaper/);
});
