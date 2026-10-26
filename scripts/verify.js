'use strict';
try { const entries=require('../lib/local').verify();console.log(`Verified ${entries.length} payload/package files.`); }
catch(error){console.error(error.message);process.exitCode=1;}
