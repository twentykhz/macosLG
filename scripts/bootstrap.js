'use strict';
const {provision}=require('../lib/provision');
const {AutorootSteps}=require('../lib/autoroot');
const {prepareAssets}=require('../lib/assets');
function parse(args){
  const options={host:'192.168.1.11',port:22,username:'root'};
  const flags={'--host':'host','--developer-key':'developerKey','--root-key':'rootKey','--backup-file':'backupFile','--expected-model':'expectedModel','--expected-firmware':'expectedFirmware'};
  const switches={'--dry-run':'dryRun','--already-rooted':'alreadyRooted','--trust-new-host':'trustNewHost','--no-extra-apps':'noExtraApps','--no-final-reboot':'noFinalReboot','--prepare-only':'prepareOnly','--remove-extra-apps':'removeExtraApps'};
  for(let n=0;n<args.length;n++){
    if(flags[args[n]]){if(!args[n+1]||args[n+1].startsWith('--'))throw new Error('Missing value: '+args[n]);options[flags[args[n]]]=args[++n];}
    else if(switches[args[n]])options[switches[args[n]]]=true;
    else throw new Error('Unknown option: '+args[n]);
  }
  if(!/^[a-zA-Z0-9.-]+$/.test(options.host))throw new Error('Enter an IPv4 address or hostname');
  if(options.expectedFirmware&&require('../lib/rootability').version(options.expectedFirmware)===null)throw Error('Firmware must use the format 00.00.00');
  return options;
}
async function main(args=process.argv.slice(2)){
  require('../lib/setup-output').installOutputLog();
  require('../lib/setup-language').installConsole();
  const options=parse(args);
  if(options.prepareOnly){await prepareAssets(options.noExtraApps);console.log('Pinned official assets downloaded and verified on PC; no TV connection made.');return;}
  const steps=new AutorootSteps(options);
  try{await provision(steps,options);}
  finally{steps.close();}
}
module.exports={parse,main};
if(require.main===module)main().catch(error=>{console.error('\nStopped: '+error.message+'\nRoot checks and attempt logs: '+require('../lib/local').state);process.exitCode=1;});
