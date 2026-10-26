'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {root,state,quote}=require('../lib/local');
const {connect,exec}=require('../lib/ssh');
const {parse,doctor,backup,restore}=require('./tv');
(async()=>{
  const {options}=parse(['doctor',...process.argv.slice(2)]);
  const client=await connect(options);
  try{
    const status=await doctor(client,options);
    await restore(client,{...options,dryRun:true});
    await exec(client,'python -c '+quote("import sys; compile(sys.stdin.read(),'home-keyhook.py','exec'); print('TV Python compile OK')"),{input:fs.readFileSync(path.join(root,'payload/home/home-keyhook.py'))});
    await exec(client,'python -c '+quote("import sys; compile(sys.stdin.read(),'remove-devmode.py','exec'); print('TV Python root-remover compile OK; not executed')"),{input:fs.readFileSync(path.join(root,'scripts/remove-devmode.py'))});
    for(const name of ['boot.sh','launch.sh','41-gathin-home-keyhook','disable-home.sh']){
      await exec(client,'sh -n',{input:fs.readFileSync(path.join(root,'payload/home',name))});
    }
    const saved=await backup(client,options);
    const report={testedAt:new Date().toISOString(),status,dryRun:true,tvPythonCompile:true,shellSyntax:true,backup:saved};
    fs.mkdirSync(state,{recursive:true});fs.writeFileSync(path.join(state,'live-check.json'),JSON.stringify(report,null,2));
    console.log('Live checks passed; no TV packages, hooks, settings or foreground app changed.');
  }finally{client.end();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
