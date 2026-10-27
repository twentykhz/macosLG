'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const {root}=require('../lib/local');
test('fresh TV publishes a syntactically valid QR configuration using its own IP and generated token',()=>{
 const writes=new Map(),source=fs.readFileSync(path.join(root,'payload/advanced/files/var/lib/webosbrew/gathin-remote/server.js'),'utf8');
 const fakeFs={readFileSync(){throw Error('ENOENT');},writeFileSync(p,data){writes.set(p,data);},renameSync(a,b){writes.set(b,writes.get(a));writes.delete(a);}};
 const sandbox={Buffer,console,setTimeout,require(name){if(name==='fs')return fakeFs;if(name==='crypto')return {randomBytes:n=>Buffer.alloc(n,17)};if(name==='os')return {networkInterfaces:()=>({wlan0:[{family:'IPv4',internal:false,address:'192.0.2.50'}]})};if(name==='http')return {createServer:()=>({listen(){}})};if(name==='url')return require('url');return {};}};
 vm.runInNewContext(source,sandbox);
 const config=writes.get('/media/developer/apps/usr/palm/applications/com.gathin.tvhome/remote-access.js');assert(config);const browser={window:{}};vm.runInNewContext(config,browser);assert.equal(browser.window.TV_REMOTE_URL,'http://192.0.2.50:8091/?k='+'11'.repeat(24));assert.equal(writes.get('/var/lib/webosbrew/gathin-remote/access-key'),'11'.repeat(24));
});
test('portable payload includes both TV web services and configurable family defaults without a captured owner token',()=>{
 const map=JSON.parse(fs.readFileSync(path.join(root,'payload/advanced/map.json')));for(const tail of ['/39-gathin-wallpaper','/45-gathin-remote','/gathin-remote/server.js','/gathin-wallpaper/defaults.json'])assert(map.some(x=>x.remote.endsWith(tail)));
 const html=fs.readFileSync(path.join(root,'payload/app/index.html'),'utf8');assert(html.includes('family-config.js'));assert(!fs.readFileSync(path.join(root,'payload/app/remote-access.js'),'utf8').includes('?k='));
});
