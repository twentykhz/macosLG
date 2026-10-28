'use strict';
const path=require('node:path'),fs=require('node:fs'),host=require('../lib/host-platform');
const root=path.resolve(__dirname,'..');
try{
 if(process.argv[2]==='state'){
  const directory=host.outsideRepository(host.stateDirectory(root,{platform:'linux',home:process.env.HOME}),root);fs.mkdirSync(directory,{recursive:true,mode:0o700});fs.chmodSync(directory,0o700);process.stdout.write(directory.split(path.sep).join('/'));
 }else if(process.argv[2]==='backup')process.stdout.write(host.backupDirectory(root,process.argv[3],{home:process.env.HOME,platform:/com\.termux/.test(process.env.PREFIX||'')||process.env.TERMUX_VERSION?'android':'linux'}).split(path.sep).join('/'));
 else throw Error('Expected state or backup');
}catch(e){console.error(e.message);process.exitCode=1;}
