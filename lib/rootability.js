'use strict';
const fs=require('node:fs'),path=require('node:path');
const {state}=require('./local');
const SITE='https://cani.rootmy.tv/';
const METHODS=[
 {key:'faultmanager',name:'faultmanager',kind:'automatic',url:'https://github.com/throwaway96/faultmanager-autoroot'},
 {key:'dejavuln',name:'DejaVuln',kind:'usb',url:'https://github.com/throwaway96/dejavuln-autoroot'},
 {key:'wta',name:'WTA',kind:'usb',url:'https://gist.github.com/throwaway96/b171240ef59d7f5fd6fb48fc6dfd2941'},
 {key:'crashd',name:'crashd',kind:'manual',url:'https://gist.github.com/throwaway96/e811b0f7cc2a705a5a476a8dfa45e09f'},
 {key:'rootmytv',name:'RootMy.TV',kind:'browser',url:'https://rootmy.tv/'},
 {key:'getmenow',name:'GetMeNow',kind:'manual',url:'https://www.webosbrew.org/rooting/getmenow/'},
 {key:'nvm',name:'NVM',kind:'hardware',url:'https://gist.github.com/throwaway96/827ff726981cc2cbc46a22a2ad7337a1'},
 {key:'slopbro',name:'SlopBro',kind:'browser',url:'https://github.com/throwaway96/slopbro'},
 {key:'asm',name:'ASM',kind:'manual',url:'https://github.com/illixion/root-my-webos-tv'},
 {key:'mvpd',name:'MVPD',kind:'manual',url:'https://github.com/throwaway96/mvpd-autoroot/'}
];
function version(value){if(typeof value!=='string'||!/^\d{1,2}\.\d{2}\.\d{2}$/.test(value))return null;return value.split('.').map(Number).reduce((a,n)=>a*100+n,0);}
function normalizeModel(value){return String(value||'').trim().toUpperCase().replace(/^OLED\d{2,3}/,'OLED').replace(/^\d{2,3}(?=[A-Z])/,'').split(/[.-]/)[0];}
function evaluate(info,data){
 const firmware=info.firmwareVersion,number=version(firmware),name=normalizeModel(info.modelName);
 const result={source:SITE,checkedAt:new Date().toISOString(),model:info.modelName,firmware,status:'unknown',methods:[],reason:'Exact model/firmware data is unavailable.'};
 if(number===null){result.reason='Firmware must use the format 00.00.00.';return result;}
 const base=Object.hasOwn(data.models,name)?data.models[name]:null;
 if(!base)return result;
 let model=base;
 for(const v of base.variants||[])if(v.codename&&/^\d+$/.test(v.swMajor||'')&&Number(firmware.split('.')[0])>=Number(v.swMajor))model={...base,...v};
 result.codename=model.codename;result.machine=model.machine;result.otaId=model.otaId;
 const avail=data.exploits[model.otaId]?.[model.codename];
 if(!avail){result.reason='No exact OTAID/codename match; similar-region data is not treated as proof.';return result;}
 result.methods=METHODS.map(method=>{
  const item=Object.hasOwn(avail,method.key)?avail[method.key]:null;let status='unavailable';
  if(item){const patched=version(item.patched?.version),latest=version(item.latest?.version);status=patched!==null&&number>=patched?'patched':latest!==null&&number<=latest?'rootable':'unknown';}
  if(method.dvbOnly&&model.broadcast!=='dvb')status='incompatible';
  if(method.kind==='hardware')status='manual-hardware';
  return {...method,status,latest:item?.latest?.version,patched:item?.patched?.version};
 });
 const software=result.methods.filter(m=>m.kind!=='hardware'),unrecognized=Object.keys(avail).some(key=>!METHODS.some(m=>m.key===key));
 result.status=software.some(m=>m.status==='rootable')?'rootable':unrecognized||software.some(m=>m.status==='unknown')?'unknown':'not-rootable';
 result.reason=result.status==='rootable'?'Known compatible software methods are listed; success still requires a verified root UID.':result.status==='not-rootable'?'No known compatible software method is listed for this exact model/firmware.':'The firmware is newer than confirmed rootable data or method status is unknown.';
 return result;
}
async function fetchText(url,fetcher,max=12*1024*1024){
 const u=new URL(url);if(u.origin!==new URL(SITE).origin)throw Error('Unexpected rootability data origin');
 const r=await fetcher(u.href,{signal:AbortSignal.timeout(15000),redirect:'error'});if(!r.ok)throw Error('CanI.RootMy.TV HTTP '+r.status);
 let size=0;const chunks=[];for await(const b of r.body){size+=b.length;if(size>max)throw Error('Rootability response is too large');chunks.push(b);}return Buffer.concat(chunks).toString('utf8');
}
function parseMap(map){
 if(!Array.isArray(map.sources)||!Array.isArray(map.sourcesContent))throw Error('Missing rootability source data');
 const read=name=>{const i=map.sources.findIndex(s=>typeof s==='string'&&s.endsWith('/src/'+name+'.gen.js'));const text=map.sourcesContent[i];if(typeof text!=='string')throw Error('Missing '+name+' data');const marker='export default ';const start=text.indexOf(marker);if(start<0)throw Error('Invalid '+name+' format');const value=JSON.parse(text.slice(start+marker.length).trim().replace(/;$/,''));if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid '+name+' dataset');return value;};
 return {models:read('models'),exploits:read('exploits')};
}
async function check(info,{fetcher=fetch}={}){
 let report;
 try{
  const html=await fetchText(SITE,fetcher,128*1024),script=html.match(/src=["'](js\/app\.[a-zA-Z0-9]+\.js)["']/)?.[1];if(!script)throw Error('Rootability website format changed');
  const js=await fetchText(new URL(script,SITE),fetcher),mapName=js.match(/sourceMappingURL=(app\.[a-zA-Z0-9]+\.js\.map)/)?.[1];if(!mapName)throw Error('Rootability data map is unavailable');
  const sourceMap=await fetchText(new URL('js/'+mapName,SITE),fetcher);
  report=evaluate(info,parseMap(JSON.parse(sourceMap)));report.dataUrl=new URL('js/'+mapName,SITE).href;
 }catch(e){report={source:SITE,checkedAt:new Date().toISOString(),model:info.modelName,firmware:info.firmwareVersion,status:'unknown',methods:[],reason:e.message};}
 const dir=path.join(state,'rootability');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,'check-'+Date.now()+'.json');fs.writeFileSync(file,JSON.stringify(report,null,2));report.reportFile=file;
 return report;
}
function print(report,language=process.env.GATHIN_LANGUAGE||'en'){
 const vi=language==='vi',labels=vi?{rootable:'CO THE ROOT (theo du lieu da biet)','not-rootable':'KHONG CO CACH ROOT PHAN MEM DA BIET',unknown:'CHUA XAC DINH',patched:'DA VA',unavailable:'KHONG CO DU LIEU',incompatible:'KHONG TUONG THICH','manual-hardware':'CAN THAO TAC PHAN CUNG'}:{rootable:'ROOTABLE (known compatible methods)','not-rootable':'NO KNOWN SOFTWARE ROOT METHOD',unknown:'UNKNOWN',patched:'PATCHED',unavailable:'NO DATA',incompatible:'INCOMPATIBLE','manual-hardware':'HARDWARE PROCEDURE'};
 console.log('\n========== '+(vi?'KIEM TRA KHA NANG ROOT':'ROOTABILITY CHECK')+' ==========');
 console.log('Model: '+report.model+' | Firmware: '+report.firmware+' | Codename: '+(report.codename||'?')+' | OTAID: '+(report.otaId||'?'));
 console.log((vi?'KET QUA: ':'RESULT: ')+(labels[report.status]||report.status));
 for(const m of report.methods)console.log(' - '+m.name+': '+(labels[m.status]||m.status)+(m.latest?' | latest: '+m.latest:'')+(m.patched?' | patched: '+m.patched:''));
 console.log((vi?'Nguon: ':'Source: ')+SITE+'?q='+encodeURIComponent(report.model+' '+report.firmware));
 console.log((vi?'Bao cao: ':'Report: ')+report.reportFile);
 if(report.status==='unknown')console.log((vi?'Khong tu dong chay exploit khi chua xac dinh. Chi tiet: ':'No automatic exploit when status is unknown. Details: ')+report.reason);
}
module.exports={METHODS,version,normalizeModel,evaluate,parseMap,check,print};
