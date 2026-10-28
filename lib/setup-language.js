'use strict';
const readline=require('node:readline');
const vi=()=>process.env.GATHIN_LANGUAGE==='vi';
const text=(en,plainVietnamese)=>vi()?plainVietnamese:en;
const phrases={
 'Verify recovery payload and pinned upstream assets':'Kiem tra bo cai va cac tep nguon da ghim',
 'Connect, verify authentication and detect TV compatibility':'Ket noi, xac thuc va kiem tra tuong thich TV',
 'Verify Homebrew root bridge':'Xac minh quyen root qua Homebrew',
 'Enable persistent root SSH and create a local recovery key':'Bat SSH root va tao khoa khoi phuc tren PC',
 'Connect directly to root SSH before removing Developer Mode':'Ket noi SSH root truoc khi go Developer Mode',
 'Verify recovery key authentication for unattended reconnect':'Kiem tra khoa khoi phuc de tu dong ket noi lai',
 'Remove LG Developer Mode through the installer service':'Go LG Developer Mode qua dich vu cai dat',
 'Restore MAC-WebOSTV interface and no-flash HOME relay':'Cai giao dien MAC-WebOSTV va dieu huong HOME',
 'Verify final launcher and HOME process':'Kiem tra launcher va tien trinh HOME sau cai',
 'Run faultmanager-autoroot, keeping upstream version checks enabled':'Chay faultmanager-autoroot, giu kiem tra phien ban cua upstream',
 'Install pinned homebrew apps if absent':'Cai cac app Homebrew da ghim neu chua co',
 'Reboot and reconnect (':'Khoi dong lai va ket noi lai (',
 'Stopped: ':'Da dung: ',
 'Trying the default root SSH password.':'Dang tu thu mat khau SSH root mac dinh.',
 'Capability-based installation; reference-only tuning will be skipped.':'Cai theo kha nang thuc te; bo qua tinh chinh rieng cua TV mau.',
 'Root key saved locally: ':'Khoa root da luu rieng tren PC: ',
 'Root SSH authentication failed':'Xac thuc SSH root that bai',
 'Compatible rooted-TV installation complete.':'Da cai xong cho TV da root tuong thich.',
 'MANUAL-CHECK-REQUIRED':'CAN-THU-TREN-TV',
 'No method produced verified root access.':'Chua co phuong phap nao xac minh duoc quyen root.'
};
function installConsole(){if(!vi()||console.__macTvLocalized)return;console.__macTvLocalized=true;for(const method of ['log','error','warn']){const original=console[method].bind(console);console[method]=(...args)=>original(...args.map(value=>{if(typeof value!=='string')return value;for(const [en,translated]of Object.entries(phrases))value=value.split(en).join(translated);return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D');}));}}
function ask(en,plainVietnamese){if(!process.stdin.isTTY)throw Error(text('An interactive setup window is required for this manual step.','Buoc nay can cua so setup tuong tac.'));const r=readline.createInterface({input:process.stdin,output:process.stdout});return new Promise(resolve=>r.question(text(en,plainVietnamese),answer=>{r.close();resolve(answer.trim());}));}
module.exports={text,ask,installConsole};
