'use strict';
const EMPTY='e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
function transcript({arch='armv7l',python=true,node=true,checksum=true,stat=true,root=true}={}){
 return Object.entries({uid:root?'0':'1000',arch,node:node?'/usr/bin/node':'',nodeVersion:node?'v16.20.2':'',nodeFiles:node?'yes':'no',nodeHash:node?EMPTY:'',python:python?'/usr/bin/python':'',pythonVersion:python?'2:16':'',pythonInput:python?'yes':'',pythonRecovery:python?'yes':'',pythonHash:python?EMPTY:'',sha256sum:checksum?'/usr/bin/sha256sum':'',shaTest:checksum?EMPTY+'  /dev/null':'',tar:'/bin/tar',tr:'/usr/bin/tr',sed:'/usr/bin/sed',stat:stat?'/usr/bin/stat':'',readlink:stat?'/usr/bin/readlink':'',statTest:stat?'1':'',readlinkTest:stat?'/':'',startup:'yes',inputChannels:'2',voiceAgent:'yes',cp:'/bin/cp',mv:'/bin/mv',chmod:'/bin/chmod',chown:'/bin/chown',end:'GATHIN_CAPABILITIES_V1'}).map(([k,v])=>k+'\t'+v).join('\n');
}
const info={modelName:'OLED65C2PSA',boardType:'O22_DVB_AJ',firmwareVersion:'33.31.68',sdkVersion:'10.3.1',returnValue:true};
module.exports={transcript,info};
