'use strict';
var fs=require('fs'),path=require('path');
function id(value){return ['__proto__','constructor','prototype'].indexOf(value)<0&&typeof value==='string'&&/^[a-zA-Z0-9._+-]{1,160}$/.test(value);}
function icon(app){var value=app.icon||app.miniIcon||'',base=app.folderPath||app.basePath||'/usr/palm/applications/'+app.id;if(typeof value!=='string'||typeof base!=='string')return 'icons/macos-app.svg';if(value.charAt(0)==='/'){base='';}var file=base?(base+'/'+value):value;if(!/^\/(usr\/palm|media\/developer\/apps\/usr\/palm)\/applications\/[a-zA-Z0-9._+-]+\/[a-zA-Z0-9_./+-]+\.(png|jpe?g|svg|webp)$/i.test(file)||file.split('/').indexOf('..')>=0)return 'icons/macos-app.svg';return 'file://'+file;}
function catalog(apps){return apps.filter(function(a){return a&&id(a.id)&&a.id!=='com.gathin.tvhome'&&!/^com\.webos\.app\.hdmi[1-4]$/.test(a.id)&&a.visible!==false&&a.hidden!==true&&a.noDisplay!==true;}).map(function(a){return {id:a.id,title:String(a.title||a.id).slice(0,120),icon:icon(a),locked:a.locked===true||a.lock===true||a.isLocked===true};});}
function create(directory,appDirectory,io){io=io||fs;var file=directory+'/dock.json',published=appDirectory+'/dock-config.js';
 function valid(value){return value&&Array.isArray(value.ids)&&value.ids.length>0&&value.ids.length<=40&&value.ids.every(function(v,i){return id(v)&&value.ids.indexOf(v)===i;})&&Array.isArray(value.apps);}
 function read(){try{var value=JSON.parse(io.readFileSync(file,'utf8'));if(!valid(value))throw Error('Invalid saved dock');return value;}catch(e){if(e.code==='ENOENT')return null;throw e;}}
 function atomic(target,bytes,mode){io.writeFileSync(target+'.new',bytes,{mode:mode});io.chmodSync(target+'.new',mode);io.renameSync(target+'.new',target);}
 function publish(value){atomic(published,'window.MAC_DOCK='+JSON.stringify(value)+';\n',420);}
 function save(ids,apps){if(!Array.isArray(ids)||!ids.length||ids.length>40||ids.some(function(v,i){return !id(v)||ids.indexOf(v)!==i;}))throw Error('Chọn từ 1 đến 40 ứng dụng, không trùng nhau');var all=catalog(apps);all.push({id:'com.webos.app.hdmi3',title:'TV · HDMI',icon:'icons/macos-tv-hdmi3.svg',locked:false});var selected=ids.map(function(v){var a=all.filter(function(a){return a.id===v;})[0];if(!a)throw Error('Ứng dụng không còn được cài: '+v);if(a.locked)throw Error('Ứng dụng đang bị khóa bởi cấu hình tối ưu: '+a.title);return a;});var value={version:1,ids:ids.slice(),apps:selected,updatedAt:new Date().toISOString()},old=read();try{publish(value);atomic(file,JSON.stringify(value),384);}catch(e){try{publish(old);}catch(ignore){}throw e;}return value;}
 return {read:read,publish:publish,save:save};
}
module.exports={id:id,catalog:catalog,create:create};
