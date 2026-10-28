'use strict';
const fs=require('fs'),path=require('path');
const NAME='app-locks-before.json';
function valid(journal){return journal&&Number.isFinite(Date.parse(journal.session))&&Array.isArray(journal.apps)&&journal.apps.length<=1000&&journal.apps.every(a=>a&&typeof a.id==='string'&&a.id.length<=200&&/^[a-zA-Z0-9._+-]+$/.test(a.id)&&(a.locked===null||typeof a.locked==='boolean')&&(a.restoreLock===undefined||typeof a.restoreLock==='boolean'));}
function save(record,journal){if(journal.session!==record.createdAt||!valid(journal))throw Error('App lock journal does not match recovery snapshot');fs.writeFileSync(path.join(record.folder,NAME),JSON.stringify({...journal,host:record.host,hostFingerprint:record.hostFingerprint},null,2),{mode:0o600});}
function collect(record,current,items){
 if(!Number.isFinite(Date.parse(record.createdAt)))throw Error('Backup date is required to order app lock recovery');
 const journals=new Map();
 for(const {record:r}of items){if(r.host!==record.host||r.hostFingerprint!==record.hostFingerprint||Date.parse(r.createdAt)<Date.parse(record.createdAt))continue;const file=path.join(r.folder,NAME);if(!fs.existsSync(file))continue;const journal=JSON.parse(fs.readFileSync(file));if(!valid(journal)||journal.host!==record.host||journal.hostFingerprint!==record.hostFingerprint||journal.session!==r.createdAt)throw Error('Invalid saved app lock journal');journals.set(journal.session,journal);}
 if(valid(current)&&Date.parse(current.session)>=Date.parse(record.createdAt))journals.set(current.session,current);
 return [...journals.values()].sort((a,b)=>Date.parse(b.session)-Date.parse(a.session));
}
async function restore(client,journals){
 if(!journals.some(j=>j.apps.length))return;
 const ssh=require('./ssh'),inventory=await ssh.luna(client,'com.webos.applicationManager/listApps',{});if(!Array.isArray(inventory.apps))throw Error('App inventory required to restore lock states');const installed=new Set(inventory.apps.map(a=>a.id));
 for(const journal of journals)for(const a of journal.apps){const locked=typeof a.locked==='boolean'?a.locked:a.applied===true?a.restoreLock:undefined;if(typeof locked==='boolean'&&installed.has(a.id))await ssh.luna(client,'com.webos.applicationManager/lockApp',{id:a.id,lock:locked});}
}
module.exports={save,collect,restore,valid};
