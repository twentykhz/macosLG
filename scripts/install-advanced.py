#!/usr/bin/python
"""Install verified static runtime files only; never flash or copy machine credentials."""
from __future__ import print_function
import os,sys,json,shutil,hashlib,base64,signal,time,re,subprocess
STAGE=sys.argv[1]
APP='/media/developer/apps/usr/palm/applications/com.gathin.tvhome'
entries=json.load(open(STAGE+'/manifest.json'))
allowed=set(e['remote'] for e in entries) | set(['/home/root/gathin-home-keyhook.py','/home/root/gathin-home-launch.sh','/home/root/gathin-home-replacement/boot.sh','/var/lib/webosbrew/init.d/41-gathin-home-keyhook'])
def allowed_target(path):
 return path in allowed or (path.startswith(APP+'/') and '..' not in path.split('/') and not path.endswith(('/control-token.js','/remote-access.js','/wall.js','/family-config.js')))
def atomic(path,data,mode=0o644):
 parent=os.path.dirname(path)
 if not os.path.isdir(parent):os.makedirs(parent)
 tmp=path+'.gathin-new'
 with open(tmp,'wb') as stream:stream.write(data)
 os.chmod(tmp,mode);os.rename(tmp,path)
def stop_runtimes():
 targets=set(['/home/root/gathin-home-keyhook.py','/home/root/gathin-youtube-voice-router.py','/var/lib/webosbrew/gathin-controls/bridge.py','/var/lib/webosbrew/gathin-hdmi/track.py','/var/lib/webosbrew/gathin-wallpaper/wallpaper-service.js','/var/lib/webosbrew/gathin-remote/server.js'])
 found=[]
 for name in os.listdir('/proc'):
  if not name.isdigit():continue
  try:
   args=open('/proc/'+name+'/cmdline').read().split(chr(0))
   if len(args)>1 and args[1] in targets:found.append(int(name))
  except IOError:pass
 for pid in found:
  try:os.kill(pid,signal.SIGTERM)
  except OSError:pass
 for n in range(60):
  if not any(os.path.exists('/proc/'+str(pid)) for pid in found):return
  time.sleep(.1)
 raise RuntimeError('Previous runtime has not stopped; refusing duplicate input grab')
# Verify every staged hash and Python/shell syntax before pausing any running feature.
for entry in entries:
 path=entry['remote'];relative=entry['stage']
 if os.path.normpath(path)!=path:raise RuntimeError('Noncanonical target')
 if not path.startswith(('/home/root/gathin','/var/lib/webosbrew/','/var/lib/webos-debloat/','/media/developer/apps/usr/palm/applications/youtube.leanback.v4/')):raise RuntimeError('Unexpected target')
 data=open(STAGE+'/'+relative,'rb').read()
 if hashlib.sha256(data).hexdigest()!=entry['sha256']:raise RuntimeError('Staged file hash mismatch')
 if path.endswith('.py'):compile(data,path,'exec')
 if path.endswith('.sh') or '/init.d/' in path:subprocess.check_call(['/bin/sh','-n',STAGE+'/'+relative])
# Check the lightweight web runtime before changing any running service.
subprocess.check_call(['/usr/bin/node','-e','var http=require("http"),crypto=require("crypto");'])
# Optional owner backup: copy only approved static paths, never extract a tar blindly.
owner_updates=[]
snapshot=STAGE+'/owner-backup.json'
if os.path.isfile(snapshot):
 total=0
 for member in json.load(open(snapshot)):
   path=member['path']
   if not allowed_target(path):continue
   if os.path.normpath(path)!=path:raise RuntimeError('Invalid owner backup path')
   data=base64.b64decode(member['data'])
   if len(data)>32*1024*1024:raise RuntimeError('Invalid owner backup member')
   total+=len(data)
   if total>96*1024*1024:raise RuntimeError('Owner backup exceeds static payload limit')
   if path==APP+'/appinfo.json':
    meta=json.loads(data)
    current=json.load(open(APP+'/appinfo.json'))
    if meta.get('id')!=current.get('id') or meta.get('version')!=current.get('version'):raise RuntimeError('Owner backup launcher version differs')
   if path.endswith('.py'):compile(data,path,'exec')
   mode=0o755 if path.endswith(('.py','.sh')) or '/init.d/' in path else 0o644
   if path.endswith('.sh') or '/init.d/' in path:
    check=STAGE+'/owner-check-'+str(len(owner_updates));open(check,'wb').write(data);subprocess.check_call(['/bin/sh','-n',check])
   owner_updates.append((path,data,mode))
markers=['/home/root/DISABLE-GATHIN-HDMI','/home/root/DISABLE-GATHIN-HOME','/home/root/DISABLE-GATHIN-YOUTUBE-VOICE','/home/root/DISABLE-GATHIN-CONTROLS','/home/root/DISABLE-GATHIN-TRIM','/home/root/DISABLE-GATHIN-LGWS','/home/root/DISABLE-GATHIN-REMOTE','/home/root/DISABLE-GATHIN-WALLPAPER']
for path in markers:open(path,'a').close()
stop_runtimes()
for entry in entries:atomic(entry['remote'],open(STAGE+'/'+entry['stage'],'rb').read(),int(entry['mode'],8))
for path,data,mode in owner_updates:atomic(path,data,mode)
root='/var/lib/webosbrew/gathin-controls'
if not os.path.isdir(root):os.makedirs(root,0o700)
# Every TV gets its own loopback token. Neither owner token nor SSH identity is shared.
token=os.urandom(32).encode('hex')
atomic(root+'/bridge.token',token,0o600)
atomic(APP+'/control-token.js','window.GATHIN_CONTROL_TOKEN='+json.dumps(token)+';\n')
for path in markers:
 if path!='/home/root/DISABLE-GATHIN-HOME' and os.path.isfile(path):os.unlink(path)
print('Static features installed; per-TV control token generated; no raw partitions modified')
