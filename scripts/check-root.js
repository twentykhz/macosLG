'use strict';
const rootability=require('../lib/rootability');
async function main(args=process.argv.slice(2)){
 require('../lib/setup-output').installOutputLog();
 const values={};for(let i=0;i<args.length;i++){if(!['--model','--firmware','--language'].includes(args[i])||!args[i+1])throw Error('Use --model MODEL --firmware 00.00.00 [--language en|vi]');values[args[i]]=args[++i];}
 if(!values['--model']||!values['--firmware'])throw Error('Model and firmware are required');
 console.log(values['--language']==='vi'?'Dang kiem tra du lieu truc tiep tu cani.rootmy.tv...':'Checking live data from cani.rootmy.tv...');
 const report=await rootability.check({modelName:values['--model'],firmwareVersion:values['--firmware']});rootability.print(report,values['--language']);return report.status==='rootable'?0:report.status==='not-rootable'?2:3;
}
module.exports={main};if(require.main===module)main().then(code=>{process.exitCode=code;}).catch(e=>{console.error(e.message);process.exitCode=3;});
