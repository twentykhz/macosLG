'use strict';
const fs=require('node:fs'),path=require('node:path');
const {text,ask}=require('./setup-language');
const {downloadPinned}=require('./assets');
const {root}=require('./local');
async function runSequence(methods,{attempt,verify,record}){
 let last;
 for(const method of [...methods].sort((a,b)=>(b.key==='faultmanager')-(a.key==='faultmanager'))){
  if(method.status!=='rootable'||method.kind==='hardware'){await record({method:method.key,status:'skipped',reason:method.status});continue;}
  let error;
  try{
   const result=await attempt(method);
   if(result?.skipped){
    await record({method:method.key,status:'skipped',reason:'User chose next method'});
    try{await verify(method,{attemptError:Error('Method skipped')});await record({method:method.key,status:'root-verified'});return method.key;}catch{}
    continue;
   }
  }
  catch(e){if(e.cancelled||e.uncertain){await record({method:method.key,status:e.cancelled?'cancelled':'in-progress',error:e.message});throw e;}error=e;}
  try{
   await verify(method,{attemptError:error});
   await record({method:method.key,status:'root-verified',warning:error?.message});
   return method.key;
  }catch(e){last=error||e;await record({method:method.key,status:'failed',error:last.message,verificationError:error?e.message:undefined});}
 }
 throw Error(text('No method produced verified root access. Read the attempt log and method instructions.','Chua co phuong phap nao xac minh duoc quyen root. Xem log va huong dan tung phuong phap.')+(last?' '+last.message:''));
}
async function guided(method,folder){
 console.log('\n'+text('Manual step required: ','Can thao tac tren TV/USB: ')+method.name+'\n'+method.url);
 if(method.key==='dejavuln'){
  try{const config=JSON.parse(fs.readFileSync(path.join(root,'config/root-methods.json')));const zip=await downloadPinned(config.dejavuln);console.log(text('Verified USB archive: ','Goi USB da kiem tra SHA-256: ')+zip);}
  catch(e){console.log(text('USB archive unavailable: ','Khong tai duoc goi USB: ')+e.message);}
  console.log(text('Extract the release ZIP to the root of one FAT32/NTFS USB drive. Connect it to the TV, open Music/Media Player and play the specially named MP3 as described in the official guide. An unsupported-media error is expected. Do not reboot with Developer Mode installed after rooting.','Giai nen ZIP vao thu muc goc cua mot USB FAT32/NTFS. Cam USB vao TV, mo Music/Media Player va mo tep MP3 ten dac biet theo huong dan goc. Loi khong ho tro dinh dang la binh thuong. Sau khi root, khong reboot khi Developer Mode con duoc cai.'));
 }else if(method.key==='wta'){
  console.log(text('Follow the WTA USB instructions and their Homebrew Channel section. This requires preparing a USB drive and a physical TV reboot; the PC cannot perform those actions. Verify Homebrew root status before continuing.','Lam theo huong dan USB WTA va muc Homebrew Channel. Can chuan bi USB va reboot TV bang thao tac thuc te; PC khong the tu lam cac buoc nay. Kiem tra trang thai root trong Homebrew truoc khi tiep tuc.'));
 }else if(method.key==='crashd'){
  console.log(text('The legacy crashd guide is end-of-life; current Developer Mode can block its prerequisite. Do not downgrade or patch the jail blindly. Continue only if the official guide applies to your installed Developer Mode and firmware.','Huong dan crashd cu da ngung bao tri; Developer Mode moi co the chan dieu kien can thiet. Khong tu y ha cap hoac sua jail. Chi lam neu huong dan goc ap dung cho Developer Mode va firmware dang cai.'));
 }else console.log(text('Follow the linked official procedure on the TV. Complete its Homebrew Channel/root steps, then return here. Software setup cannot replace required TV, browser or USB interaction.','Lam theo quy trinh goc tai lien ket tren TV. Hoan tat buoc Homebrew Channel/root roi quay lai day. Setup khong the thay the thao tac can tren TV, trinh duyet hoac USB.'));
 console.log(text('After rooting, enable SSH in Homebrew Channel settings if it is not enabled. Keep the TV on and return here for verification. Do not reboot a rooted TV while LG Developer Mode is still installed.','Sau khi root, bat SSH trong cai dat Homebrew Channel neu chua bat. Giu TV dang bat va quay lai day de xac minh. Khong reboot TV da root khi LG Developer Mode van con duoc cai.'));
 fs.appendFileSync(path.join(folder,'manual-methods.txt'),method.name+'\n'+method.url+'\n');
 let answer;
 while(true){answer=(await ask('Enter DONE after completing it, NEXT to skip, or STOP to stop: ','Nhap XONG sau khi lam xong, TIEP de bo qua, hoac DUNG de dung: ')).toUpperCase();if(['DONE','XONG','NEXT','TIEP','STOP','DUNG'].includes(answer))break;}
 if(['STOP','DUNG'].includes(answer)){const e=Error(text('Setup stopped by user.','Nguoi dung da dung setup.'));e.cancelled=true;throw e;}
 return {skipped:['NEXT','TIEP'].includes(answer)};
}
module.exports={runSequence,guided};
