'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
function platform({platform=process.platform,env=process.env}={}){
 return platform==='win32'?'windows':platform==='android'||/com\.termux/.test(env.PREFIX||'')||env.TERMUX_VERSION?'termux':platform==='darwin'?'macos':'linux';
}
function stateDirectory(root,options={}){
 const env=options.env||process.env,home=options.home||os.homedir();
 return path.resolve(env.GATHIN_STATE_DIRECTORY||(platform(options)==='windows'?path.join(root,'.local'):path.join(home,'.gathintv','state')));
}
function outsideRepository(directory,root){
 const resolved=path.resolve(directory),relative=path.relative(root,resolved);
 if(!relative||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative)))throw Error('Keep private state and backups outside the repository: '+resolved);
 // Existing symlink parents must not redirect sensitive data back into source.
 let parent=resolved;while(!fs.existsSync(parent))parent=path.dirname(parent);
 const real=fs.realpathSync(parent),rel=path.relative(fs.realpathSync(root),real);
 if(!rel||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel)))throw Error('Private directory resolves inside the repository');
 return resolved;
}
function backupDirectory(root,explicit,options={}){
 const home=options.home||os.homedir(),io=options.fs||fs;
 const fallback=path.join(home,'GathinTV-Backups');
 const candidates=explicit?[explicit]:platform(options)==='termux'?[path.join(home,'storage','downloads','GathinTV-Backups'),fallback]:[fallback];
 for(const directory of candidates){
  try{
   if(!explicit&&directory!==fallback&&!io.existsSync(path.dirname(directory)))continue;
   const resolved=outsideRepository(directory,root);io.mkdirSync(resolved,{recursive:true,mode:0o700});io.accessSync(resolved,fs.constants.W_OK);
   const probe=path.join(resolved,'.gathin-write-check-'+require('node:crypto').randomUUID());
   const fd=io.openSync(probe,'wx',0o600);try{io.closeSync(fd);}finally{io.unlinkSync(probe);}
   return resolved;
  }catch(e){if(explicit||directory===fallback)throw e;}
 }
 throw Error('No writable backup directory');
}
module.exports={platform,stateDirectory,outsideRepository,backupDirectory};
