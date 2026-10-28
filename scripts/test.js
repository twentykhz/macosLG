'use strict';
// Explicit file expansion also works on Node 20 + Windows cmd (no shell globbing).
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const directory=path.resolve(__dirname,'../test'),files=fs.readdirSync(directory).filter(f=>f.endsWith('.test.js')).sort().map(f=>path.join(directory,f));
const result=spawnSync(process.execPath,['--test',...files],{stdio:'inherit'});if(result.error)console.error(result.error.message);process.exitCode=result.status??1;
