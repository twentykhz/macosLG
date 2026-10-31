"""Keep approved per-TV files across an installer-required version change."""
from __future__ import print_function
import os,sys,json,hashlib,shutil,re
stage=sys.argv[1];mode=sys.argv[2]
app='/media/developer/apps/usr/palm/applications/com.gathin.tvhome'
assert stage.startswith('/tmp/gathin-app-upgrade-') and os.path.realpath(stage)==stage
data=stage+'/user-files';manifest=stage+'/user-files.json'
def allowed(name):
 return name in ['dock-config.js','control-token.js','remote-access.js','wall.js','family-config.js','apps.js','wallpaper.jpg'] or re.match(r'^wall-[a-f0-9]+\.(jpg|png|webp)$',name)
if mode=='save':
 os.mkdir(data,0o700);entries=[]
 for name in os.listdir(app) if os.path.isdir(app) else []:
  if not allowed(name):continue
  source=app+'/'+name
  assert os.path.isfile(source) and not os.path.islink(source)
  shutil.copy2(source,data+'/'+name)
  entries.append({'name':name,'sha256':hashlib.sha256(open(data+'/'+name,'rb').read()).hexdigest()})
 with open(manifest,'w') as f:json.dump(entries,f)
 os.chmod(manifest,0o600)
elif mode=='restore':
 entries=json.load(open(manifest))
 for entry in entries:
  name=entry['name'];assert allowed(name) and '/' not in name
  assert hashlib.sha256(open(data+'/'+name,'rb').read()).hexdigest()==entry['sha256']
 for entry in entries:
  name=entry['name'];temp=app+'/'+name+'.upgrade-preserve'
  assert not os.path.islink(temp) and not os.path.islink(app+'/'+name)
  shutil.copy2(data+'/'+name,temp);os.rename(temp,app+'/'+name)
else:raise RuntimeError('Unknown preservation phase')
print('Per-TV files '+mode+' verified')
