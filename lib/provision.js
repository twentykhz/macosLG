'use strict';
// Each compatible method is tried at most once; root must be verified before proceeding.
// Resume re-verifies actual root access; a saved status is not proof of root.
async function provision(steps,options={}){
  await steps.prepare();
  await steps.connectAndCheck();
  if(options.dryRun){await steps.plan();return {dryRun:true};}
  if(steps.isRooted()&&steps.captureInitialState)await steps.captureInitialState();
  if(steps.isRooted()&&!steps.rootAcquiredDuringConnect&&steps.options&&steps.options.compatibilityMode){if(steps.prepareRootReconnect)await steps.prepareRootReconnect();await steps.restoreInterface();return {complete:true,compatibilityMode:true};}
  if(!steps.isRooted()||steps.rootAcquiredDuringConnect){
    if(!steps.rootAcquiredDuringConnect)await steps.runAutoroot();
    await steps.verifyRootBridge();
    await steps.provisionRootSSH();
    await steps.connectRoot();
  }
  if(steps.captureInitialState)await steps.captureInitialState();
  await steps.prepareRootReconnect();
  if(steps.options&&steps.captureInitialState)require('./recovery').markMutation(steps.options,'root setup');
  await steps.removeDeveloperMode();
  await steps.assertDeveloperModeAbsent();
  await steps.rebootAndReconnect('root');
  await steps.assertDeveloperModeAbsent();
  if(steps.options&&steps.options.compatibilityMode){await steps.restoreInterface();return {complete:true,compatibilityMode:true};}
  await steps.installApps();
  await steps.restoreInterface();
  if(!options.noFinalReboot)await steps.rebootAndReconnect('interface');
  await steps.verifyInstallation();
  return {complete:true};
}
module.exports={provision};
