from __future__ import print_function
import os,sys,json,hashlib,tarfile,shutil
stage=sys.argv[1]
app='/media/developer/apps/usr/palm/applications/com.gathin.tvhome'
assert stage.startswith('/tmp/gathin-app-upgrade-') and os.path.realpath(stage)==stage
manifest=json.load(open(stage+'/manifest.json'))
new='/media/developer/temp/gathin-app-upgrade-new';old='/media/developer/temp/gathin-app-upgrade-previous'
if not os.path.isdir(os.path.dirname(new)):os.makedirs(os.path.dirname(new))
assert os.stat(app).st_dev==os.stat(os.path.dirname(new)).st_dev,'App staging must use the same filesystem'
assert not os.path.lexists(new) and not os.path.lexists(old),'Previous app upgrade needs recovery first'
expected=dict((e['path'],e['sha256']) for e in manifest)
with tarfile.open(stage+'/app.tar.gz','r:gz') as archive:
 members=archive.getmembers()
 assert len(members)==len(expected)
 for member in members:
  assert member.name in expected and member.isfile() and os.path.normpath(member.name)==member.name and not member.name.startswith('/') and '..' not in member.name.split('/')
 os.mkdir(new)
 archive.extractall(new)
for name,digest in expected.items():assert hashlib.sha256(open(new+'/'+name,'rb').read()).hexdigest()==digest
assert json.load(open(new+'/appinfo.json'))['id']=='com.gathin.tvhome'
# Preserve private generated configuration and user images, never replace code from backup.
preserve=['control-token.js','remote-access.js','wall.js','family-config.js','apps.js','wallpaper.jpg']
for name in os.listdir(app):
 if name in preserve or (name.startswith('wall-') and name.endswith(('.jpg','.png','.webp'))):
  assert os.path.isfile(app+'/'+name) and not os.path.islink(app+'/'+name)
  shutil.copy2(app+'/'+name,new+'/'+name)
os.rename(app,old)
try:os.rename(new,app)
except Exception:
 os.rename(old,app)
 raise
print('Registered same-version app upgraded atomically; private configuration retained')
