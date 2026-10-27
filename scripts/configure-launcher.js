'use strict';
const fs=require('fs'),path=require('path');const {root}=require('../lib/local');
const settings=JSON.parse(fs.readFileSync(path.join(root,'config/launcher.json'),'utf8'));
if(!Array.isArray(settings.weatherLocations)||settings.weatherLocations.length!==2)throw Error('Configure exactly two weather locations');
for(const p of settings.weatherLocations)if(typeof p.name!=='string'||!p.name.trim()||!Number.isFinite(p.latitude)||Math.abs(p.latitude)>90||!Number.isFinite(p.longitude)||Math.abs(p.longitude)>180)throw Error('Invalid weather location');
if(!Array.isArray(settings.family)||!settings.family.length||settings.family.length>6)throw Error('Configure 1 to 6 family members');
for(const p of settings.family){const d=new Date(Date.UTC(p.year,p.month-1,p.day));if(typeof p.name!=='string'||!p.name.trim()||p.name.length>30||!Number.isInteger(p.year)||d.getUTCFullYear()!==p.year||d.getUTCMonth()!==p.month-1||d.getUTCDate()!==p.day)throw Error('Invalid family name or birth date');}
if(!settings.slideshow||!Number.isInteger(settings.slideshow.interval)||settings.slideshow.interval<5||settings.slideshow.interval>60||typeof settings.slideshow.enabled!=='boolean')throw Error('Slideshow interval must be 5 to 60 seconds');
fs.writeFileSync(path.join(root,'payload/app/family-config.js'),'window.GATHIN_FAMILY='+JSON.stringify(settings.family)+';\n');
fs.writeFileSync(path.join(root,'payload/advanced/files/var/lib/webosbrew/gathin-wallpaper/defaults.json'),JSON.stringify(settings,null,2)+'\n');
fs.writeFileSync(path.join(root,'payload/app/wall.js'),'window.WEATHER_LOCATIONS='+JSON.stringify(settings.weatherLocations)+';window.WALL_STATE={selected:["wallpaper.jpg"],enabled:false,interval:'+settings.slideshow.interval+',revision:0,crops:{}};\n');
console.log('Launcher defaults generated from config/launcher.json.');
