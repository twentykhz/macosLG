'use strict';
function parse(response){
 if(!response||response.returnValue!==true)return null;var list=response.devices||response.inputs;if(!Array.isArray(list))return null;
 var rows=[],seen={};list.forEach(function(row){if(!row||typeof row!=='object')return;var appId=row.appId,m;if(!/^com\.webos\.app\.hdmi[1-4]$/.test(appId||'')){m=String(row.id||row.inputId||'').match(/^HDMI[_ -]?([1-4])$/i);appId=m?'com.webos.app.hdmi'+m[1]:null;}if(!appId||seen[appId])return;seen[appId]=true;rows.push({appId:appId,id:typeof row.id==='string'?row.id:'HDMI_'+appId.slice(-1),label:typeof row.label==='string'&&row.label.trim()?row.label.slice(0,120):'HDMI '+appId.slice(-1),connected:typeof row.connected==='boolean'?row.connected:null});});return rows;
}
module.exports={parse:parse};
