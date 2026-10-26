from pathlib import Path
root=Path('lg-tv-autosetup')
p=root/'scripts/tv.js';s=p.read_text(encoding='utf-8');s=s.replace("'--privacy':'privacy'","'--privacy':'privacy','--advanced':'advanced','--remove-extra-apps':'removeExtraApps'");s=s.replace("'--key':'key'","'--key':'key','--backup-file':'backupFile'")
s=s.replace("const code='import os,json;", "candidates.push(...require('../lib/advanced').entries().map(entry=>entry.remote));\n  const code='import os,json;",1)
s=s.replace('    complete=true;','    if(options.advanced)await require(\'../lib/advanced\').installAdvanced(client,options);\n    complete=true;',1)
p.write_text(s,encoding='utf-8')
p=root/'lib/autoroot.js';s=p.read_text(encoding='utf-8');s=s.replace('privacy:!this.options.noExtraApps','privacy:!this.options.noExtraApps,advanced:!this.options.noExtraApps');p.write_text(s,encoding='utf-8')
p=root/'scripts/bootstrap.js';s=p.read_text(encoding='utf-8');s=s.replace("'--root-key':'rootKey'","'--root-key':'rootKey','--backup-file':'backupFile'");s=s.replace("'--prepare-only':'prepareOnly'","'--prepare-only':'prepareOnly','--remove-extra-apps':'removeExtraApps'");p.write_text(s,encoding='utf-8')
p=root/'lib/assets.js';s=p.read_text(encoding='utf-8');needle="  const directory=path.join(state,'assets');";s=s.replace(needle,"  const bundled=path.join(root,'upstream',asset.name);\n  if(fs.existsSync(bundled)&&sha256(fs.readFileSync(bundled))===asset.sha256)return bundled;\n"+needle);p.write_text(s,encoding='utf-8')
# Commands printed during an install match the new release.
p=root/'lib/autoroot.js';s=p.read_text(encoding='utf-8').replace('privacy app and App Update Blocker','privacy app').replace('restore Gathin interface and HOME relay','restore Gathin, Home/Back, Action Center, voice commands, privacy and optional-service tuning');p.write_text(s,encoding='utf-8')
# Capture-to-share normalization: labels are read from captured UTF-8 app source.
p=root/'config/weather.json';import re,json
html=(root/'payload/app/index.html').read_text(encoding='utf-8');name=re.search(r'id="weatherLocation">([^<]+)',html).group(1)
p.write_text(json.dumps({'name':name,'latitude':20.34,'longitude':105.46},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
