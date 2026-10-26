'use strict';
const fs=require('node:fs');
const path=require('node:path');
const git=require('isomorphic-git');
const {root,walk}=require('../lib/local');
(async()=>{
  if(fs.existsSync(path.join(root,'.git')))throw new Error('Repository already exists; refusing to rewrite history.');
  await git.init({fs,dir:root,defaultBranch:'main'});
  // Add only known project paths, never .local snapshots, credentials, or modules.
  const top=['README.md','LICENSE','THIRD-PARTY.md','.gitignore','.gitattributes','package.json','package-lock.json','checksums.json','Restore-TV.ps1','Setup-TV.ps1'];
  const files=top.map(name=>path.join(root,name)).concat(['config','lib','scripts','test','docs','payload','packages'].flatMap(name=>walk(path.join(root,name))));
  for(const file of files){
    const relative=path.relative(root,file).split(path.sep).join('/');
    if(relative==='config/device.json'||relative.endsWith('.pyc'))continue;
    await git.add({fs,dir:root,filepath:relative});
  }
  const commit=await git.commit({fs,dir:root,author:{name:'TV Recovery',email:'recovery@localhost.invalid'},message:'Add verified SK8000 launcher and recovery scripts'});
  console.log(`Local Git repository created on main: ${commit}`);
})().catch(error=>{console.error(error.message);process.exitCode=1;});
