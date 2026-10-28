'use strict';
const fs=require('node:fs'),path=require('node:path');
const {state}=require('./local'),recovery=require('./recovery'),{text}=require('./setup-language');
function discover(host,directory=state){
 const records=new Map(),files=[];
 const sessions=path.join(directory,'sessions'),backups=path.join(directory,'backups');
 if(fs.existsSync(backups))for(const entry of fs.readdirSync(backups,{withFileTypes:true}))if(entry.isDirectory())files.push(path.join(backups,entry.name,'snapshot.json'));
 if(fs.existsSync(sessions))for(const entry of fs.readdirSync(sessions,{withFileTypes:true}))if(entry.isFile()&&entry.name.endsWith('.json'))files.push(path.join(sessions,entry.name));
 for(const file of files)try{if(!fs.lstatSync(file).isFile())continue;const record=JSON.parse(fs.readFileSync(file,'utf8'));if(record.format!==1||record.host!==host||!record.saved?.file||!fs.existsSync(record.saved.file)||!record.device)continue;records.set(path.resolve(record.folder||path.dirname(record.saved.file)),{file,record});}catch{}
 return [...records.values()].sort((a,b)=>String(b.record.createdAt).localeCompare(String(a.record.createdAt)));
}
async function run(options,io={}){
 const interactive=io.interactive??!!process.stdin.isTTY,print=io.print||console.log;let reader;
 const ask=io.ask||(async prompt=>{reader||=require('node:readline/promises').createInterface({input:process.stdin,output:process.stdout});return reader.question(prompt);});
 try{
  let file=options.recoverySession;
  if(!file){
   const items=discover(options.host);if(!items.length)throw Error(text('No initial snapshot found for this TV. Keep the original state/backups directory.','Khong tim thay backup dau phien cho TV nay. Can giu thu muc state/backups goc.'));
   if(!interactive)throw Error('Rollback requires --session PATH in non-interactive use');
   print(text('Initial TV snapshots (0 = cancel):','Backup trang thai truoc khi chay tool (0 = huy):'));
   items.forEach(({record},i)=>print('['+(i+1)+'] '+record.createdAt+' | '+record.device.modelName+' | '+record.host+' | '+record.folder));
   const choice=(await ask(text('Choose snapshot: ','Chon backup: '))).trim();if(choice==='0')return {cancelled:true};
   if(!/^[1-9]\d*$/.test(choice)||Number(choice)>items.length)throw Error('Invalid snapshot selection');file=items[Number(choice)-1].file;
  }
  file=path.resolve(file);if(fs.statSync(file).isDirectory())file=path.join(file,'snapshot.json');
  const o={...options,recoverySession:file,key:options.rootKey||options.key,manualRollback:true},record=recovery.loadSession(o);recovery.validateSnapshot(record);
  if(record.host!==options.host)throw Error('Recovery session belongs to another TV');
  if(!record.hostFingerprint)throw Error(text('Snapshot has no SSH host fingerprint; manual rollback cannot safely identify this TV.','Backup thieu fingerprint SSH; khong the xac minh an toan TV de khoi phuc thu cong.'));
  print(text('Restore snapshot: ','Khoi phuc backup: ')+record.createdAt+' | '+record.device.modelName+' | '+record.host+' | '+record.folder);
  print(text('Restores backed-up project files/settings. This is not a factory reset, firmware restore or unroot. Later project changes will be replaced.','Khoi phuc file/cau hinh cua du an trong backup. Khong phai reset goc, khoi phuc firmware hay huy root. Thay doi cua du an sau backup se bi thay the.'));
  if(!options.dryRun&&!options.confirmRollback){
   if(!interactive)throw Error('Rollback requires --yes for explicit non-interactive confirmation');
   const answer=(await ask(text('Return to this initial snapshot? (YES/CO): ','Quay ve trang thai ban dau cua backup nay? (CO/YES): '))).trim();
   if(!/^(yes|co)$/i.test(answer)){print(text('Rollback cancelled.','Da huy khoi phuc.'));return {cancelled:true};}
  }
  return await recovery.rollback(o);
 }finally{reader?.close();}
}
module.exports={discover,run};
