'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const state = process.env.GATHIN_STATE_DIRECTORY ? path.resolve(process.env.GATHIN_STATE_DIRECTORY) : path.join(root, '.local');
const profile = JSON.parse(fs.readFileSync(path.join(root, 'config/profile.json')));
const quote = value => "'" + String(value).replace(/'/g, "'\\''") + "'";
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');
const rootKeyFile = host => path.join(state,'keys','root-'+sha256(Buffer.from(host)).slice(0,16)+'.pem');
function walk(directory) {
  return fs.readdirSync(directory, {withFileTypes:true}).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Unexpected local symlink: ${file}`);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
function manifest(directory=root) {
  return ['payload', 'packages'].flatMap(name => walk(path.join(directory,name))).sort().map(file => ({
    path: path.relative(directory,file).split(path.sep).join('/'),
    size: fs.statSync(file).size,
    sha256: sha256(fs.readFileSync(file))
  }));
}
function verify(directory=root) {
  const expected = JSON.parse(fs.readFileSync(path.join(directory,'checksums.json')));
  const actual = manifest(directory);
  if (JSON.stringify(expected)!==JSON.stringify(actual)) throw new Error('Payload checksum mismatch; restore aborted. Use npm run build after intentional edits.');
  return actual;
}
function assertProfile(info, options={}) {
  if(info.modelName!==profile.modelName || info.boardType!==profile.boardType) throw new Error(`Wrong TV: ${info.modelName}/${info.boardType}; expected ${profile.modelName}/${profile.boardType}`);
  if(info.firmwareVersion!==profile.firmwareVersion && !options.allowFirmwareMismatch) throw new Error(`Firmware ${info.firmwareVersion} is untested; expected ${profile.firmwareVersion}. Review compatibility before --allow-firmware-mismatch.`);
}
module.exports = {root,state,profile,quote,sha256,stamp,rootKeyFile,walk,manifest,verify,assertProfile};
