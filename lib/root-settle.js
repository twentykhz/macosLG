'use strict';
const language=require('./setup-language');
function instructions(){return language.text(
 'Root was reported; do NOT run another exploit. Open Homebrew Channel > Settings, confirm Root OK and enable SSH Server. Do not reboot while LG Developer Mode is installed. Setup removes and verifies Developer Mode after root SSH is established. If Homebrew only appears after reboot, uninstall the Developer Mode APP on the TV before that reboot (do not toggle Dev Mode Status off or use Clear Cache), then enable SSH in Homebrew.',
 'Tool da bao root; KHONG chay exploit khac. Mo Homebrew Channel > Settings, xac nhan Root OK va BAT SSH Server. KHONG reboot khi ung dung LG Developer Mode con duoc cai. Setup se go va xac minh Developer Mode sau khi ket noi SSH root. Neu can reboot de Homebrew hien ra, go UNG DUNG Developer Mode tren TV TRUOC lan reboot do (khong tat Dev Mode Status hay dung Clear Cache), roi bat SSH trong Homebrew.');}
async function settle({verifyBridge,verifySSH,interactive=process.stdin.isTTY,askFn=language.ask,wait=ms=>new Promise(r=>setTimeout(r,ms)),attempts=2}){
 let last;console.log(instructions());
 while(true){
  for(let i=0;i<attempts;i++){
   for(const verify of [verifyBridge,verifySSH])try{await verify();return;}catch(e){if(/host key/i.test(e.message)){e.rootPending=true;throw e;}last=e;}
   if(i+1<attempts)await wait(1000);
  }
  console.log(language.text('Still waiting for root access: ','Van dang cho truy cap root: ')+(last?.message||''));
  if(!interactive)throw Object.assign(Error(instructions()),{rootPending:true});
  const answer=(await askFn('After enabling SSH / removing Developer Mode as instructed, press Enter to RETRY verification, or STOP: ','Sau khi bat SSH / go Developer Mode theo huong dan, nhan Enter de KIEM TRA LAI, hoac DUNG: ')).trim().toUpperCase();
  if(['STOP','DUNG','0'].includes(answer))throw Object.assign(Error(language.text('Root reported, verification paused by user. No other exploit was attempted.','Da bao root, nguoi dung dung xac minh. Khong thu exploit khac.')),{rootPending:true,cancelled:true});
 }
}
module.exports={settle,instructions};
