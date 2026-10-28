'use strict';
const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
// Follow required edges, not lockfile dev flags (bundled CLI subpackages lack those flags).
function productionPackages(root){
 const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'))),result=new Set();
 function visit(parent,name){
  const requireFrom=createRequire(path.join(parent,'package.json'));let file;
  try{file=requireFrom.resolve(name+'/package.json');}catch{
   let directory=path.dirname(requireFrom.resolve(name));
   while(true){const candidate=path.join(directory,'package.json');if(fs.existsSync(candidate)&&JSON.parse(fs.readFileSync(candidate)).name===name){file=candidate;break;}const next=path.dirname(directory);if(next===directory)throw Error('Cannot locate dependency '+name);directory=next;}
  }
  const directory=path.dirname(file),relative=path.relative(root,directory).split(path.sep).join('/'),meta=JSON.parse(fs.readFileSync(file));
  if(!relative.startsWith('node_modules/')||meta.version!==lock.packages[relative]?.version)throw Error('Dependency differs from lockfile: '+name);
  if(result.has(directory))return;result.add(directory);
  for(const dependency of Object.keys(meta.dependencies||{}))if(!Object.hasOwn(meta.optionalDependencies||{},dependency))visit(directory,dependency);
 }
 for(const name of Object.keys(JSON.parse(fs.readFileSync(path.join(root,'package.json'))).dependencies||{}))visit(root,name);
 return [...result].sort();
}
module.exports={productionPackages};
