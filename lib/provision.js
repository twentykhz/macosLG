'use strict';
// The state machine has no implicit retry of a privilege exploit or reboot.
// Resume re-verifies actual root access; a saved status is not proof of root.
async function provision(steps,options={}){
  await steps.prepare();
  await steps.connectAndCheck();
  if(options.dryRun){await steps.plan();return {dryRun:true};}
  if(!steps.isRooted()){
    await steps.runAutoroot();
    await steps.verifyRootBridge();
    await steps.provisionRootSSH();
    await steps.connectRoot();
  }
  await steps.prepareRootReconnect();
  await steps.removeDeveloperMode();
  await steps.assertDeveloperModeAbsent();
  await steps.rebootAndReconnect('root');
  await steps.assertDeveloperModeAbsent();
  await steps.installApps();
  await steps.restoreInterface();
  if(!options.noFinalReboot)await steps.rebootAndReconnect('interface');
  await steps.verifyInstallation();
  return {complete:true};
}
module.exports={provision};
