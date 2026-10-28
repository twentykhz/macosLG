#!/usr/bin/python
"""Restore only the verified, explicitly scoped first snapshot of this session."""
from __future__ import print_function
import os,sys,json,hashlib,tarfile,shutil,subprocess,signal,time,select

def luna_once(endpoint,data):
 p=subprocess.Popen(['/usr/bin/luna-send','-w','10000','-n','1','luna://'+endpoint,json.dumps(data)],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 try:
  result=json.loads(p.stdout.read());p.wait()
  assert p.returncode==0 and result.get('returnValue') is not False,'Recovery API failed: '+endpoint
  return result
 finally:
  if p.poll() is None:p.terminate()
  p.stdin.close()

def luna_apps():
 result=luna_once('com.webos.applicationManager/listApps',{})
 assert isinstance(result.get('apps'),list)
 return result['apps']

def remove_added_apps(record):
 original=set(a['id'] for a in record['apps'])
 owned=set(['com.gathin.tvhome','youtube.leanback.v4','ooo.lew.lifesgoodwithoutspying'])
 for app in luna_apps():
  name=app['id']
  if name in original or name not in owned:continue
  p=subprocess.Popen(['/usr/bin/luna-send','-i','luna://com.webos.appInstallService/remove',json.dumps({'id':name,'subscribe':True})],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,bufsize=0)
  try:
   deadline=time.time()+60;complete=False
   while time.time()<deadline:
    if not select.select([p.stdout],[],[],.25)[0]:continue
    line=p.stdout.readline()
    if not line:break
    result=json.loads(line);detail=result.get('details') or {};state=str(detail.get('state','')).lower()
    if result.get('returnValue') is False or detail.get('errorCode') or 'fail' in state:raise RuntimeError('Added app removal failed: '+name)
    if 'removed' in state or result.get('statusValue')==31:complete=True;break
   assert complete,'Added app removal timed out: '+name
  finally:
   if p.poll() is None:p.terminate()
   p.stdin.close();p.wait()
  assert not any(a['id']==name for a in luna_apps()),'Added app still registered'

def restore(stage):
 assert os.geteuid()==0
 assert stage.startswith('/tmp/mac-tv-rollback-') and os.path.realpath(stage)==stage
 record=json.load(open(stage+'/snapshot.json'))
 roots=record['roots']; entries=record['entries']
 assert hashlib.sha256(open(stage+'/snapshot.tar.gz','rb').read()).hexdigest()==record['saved']['sha256']
 extract=stage+'/extracted';os.mkdir(extract)
 # PC validated canonical paths, scope, types and symlink ancestry. Repeat here.
 with tarfile.open(stage+'/snapshot.tar.gz','r:gz') as archive:
  for member in archive.getmembers():
   name='/'+member.name.lstrip('/') .rstrip('/')
   assert os.path.normpath(name)==name and any(name==r or name.startswith(r+'/') for r in roots)
   assert member.isfile() or member.isdir() or member.issym()
   assert not any(name.startswith(e['path']+'/') for e in entries if e['type']=='symlink')
  archive.extractall(extract)
 for item in entries:
  name=extract+item['path']
  if item['type']=='file':
   assert not os.path.islink(name)
   assert hashlib.sha256(open(name,'rb').read()).hexdigest()==item['sha256']
   if name.endswith('.py'):compile(open(name,'rb').read(),name,'exec')
   if name.endswith('.sh') or '/init.d/' in name:subprocess.check_call(['/bin/sh','-n',name])
  elif item['type']=='symlink':assert os.readlink(name)==item['target']
 # Validate destination ancestors before touching a running TV.
 for root in roots:
  assert os.path.realpath(os.path.dirname(root))==record['parents'][root],root
 displaced={}
 for index,root in enumerate(roots):
  base='/media/developer/temp' if root.startswith('/media/developer/') else '/home/root' if root.startswith('/home/root/') else '/var/lib'
  work=base+'/.mac-tv-recovery-'+os.path.basename(stage)
  if not os.path.isdir(work):os.makedirs(work,0o700)
  parent=os.path.dirname(root)
  while not os.path.exists(parent):parent=os.path.dirname(parent)
  assert os.stat(parent).st_dev==os.stat(work).st_dev,'Recovery staging filesystem mismatch: '+root
  displaced[root]=work+'/entry-'+str(index)
 targets=set(record['active']) | set(['/home/root/gathin-home-keyhook.py','/home/root/gathin-youtube-voice-router.py','/var/lib/webosbrew/gathin-controls/bridge.py','/var/lib/webosbrew/gathin-controls/bridge.js','/var/lib/webosbrew/gathin-hdmi/track.py','/var/lib/webosbrew/gathin-hdmi/track.js','/var/lib/webosbrew/gathin-wallpaper/wallpaper-service.js','/var/lib/webosbrew/gathin-remote/server.js'])
 open('/home/root/DISABLE-GATHIN-HOME','a').close()
 found=[]
 for pid in os.listdir('/proc'):
  if not pid.isdigit():continue
  try:
   args=open('/proc/'+pid+'/cmdline').read().split(chr(0))
   if len(args)>1 and args[1] in targets:found.append(int(pid))
  except IOError:pass
 for pid in found:
  try:os.kill(pid,signal.SIGTERM)
  except OSError:pass
 for unused in range(100):
  if not any(os.path.exists('/proc/'+str(p)) for p in found):break
  time.sleep(.1)
 else:raise RuntimeError('Previous runtime did not stop; no snapshot files replaced')
 subprocess.call(['luna-send','-w','3000','-n','1','luna://com.webos.applicationManager/closeByAppId','{"id":"com.gathin.tvhome"}'])
 remove_added_apps(record)
 # Retain displaced data outside app registries and init.d, on the same filesystem.
 journal=[]
 try:
  for root in roots:
   old=displaced[root]
   assert not os.path.lexists(old)
   source=extract+root
   if os.path.lexists(source):
    parent=os.path.dirname(root)
    if not os.path.isdir(parent):os.makedirs(parent)
    new=old+'.new'
    if os.path.islink(source):os.symlink(os.readlink(source),new)
    elif os.path.isdir(source):shutil.copytree(source,new,symlinks=True)
    else:shutil.copy2(source,new)
   else:new=None
   existed=os.path.lexists(root)
   if existed:os.rename(root,old)
   journal.append((root,old,existed))
   if new:os.rename(new,root)
  for item in entries:
   if item['type']=='file':assert hashlib.sha256(open(item['path'],'rb').read()).hexdigest()==item['sha256']
 except Exception:
  for root,old,existed in reversed(journal):
   if os.path.lexists(root):os.rename(root,old+'.failed')
   if existed:os.rename(old,root)
  raise
 # PID files are observations, never identities. Hooks must start restored processes.
 for root in roots:
  if root.startswith('/var/lib/webosbrew/gathin-') and os.path.isdir(root):
   for name in os.listdir(root):
    if name.endswith('.pid') and os.path.isfile(root+'/'+name):os.unlink(root+'/'+name)
 if os.path.isfile('/tmp/gathin-home-keyhook.pid'):os.unlink('/tmp/gathin-home-keyhook.pid')
 subprocess.call(['/usr/sbin/ls-control','scan-services'])
 subprocess.call(['/usr/sbin/ls-control','scan-volatile-dirs'])
 pairs=[('track.py','37-gathin-hdmi'),('track.js','37-gathin-hdmi'),('bridge.py','38-gathin-controls'),('bridge.js','38-gathin-controls'),('wallpaper-service.js','39-gathin-wallpaper'),('gathin-youtube-voice-router.py','42-gathin-youtube-voice'),('server.js','45-gathin-remote'),('gathin-home-keyhook.py','41-gathin-home-keyhook')]
 for script,hook in pairs:
  if any(p.endswith('/'+script) for p in record['active']):
   subprocess.check_call(['/bin/sh','/var/lib/webosbrew/init.d/'+hook])
 for unused in range(50):
  running=[]
  for pid in os.listdir('/proc'):
   if not pid.isdigit():continue
   try:
    args=open('/proc/'+pid+'/cmdline').read().split(chr(0))
    if len(args)>1:running.append(args[1])
   except IOError:pass
  if all(running.count(p)==1 for p in set(record['active'])):break
  time.sleep(.1)
 else:raise RuntimeError('Snapshot files restored but original runtime did not restart; keep recovery log')
 if record.get('foreground'):luna_once('com.webos.applicationManager/launch',{'id':record['foreground']})
 print('Snapshot files, private service state and original active services restored.')
 print('Displaced files retained in hidden recovery directories outside app registries and boot hooks.')

if __name__=='__main__':restore(sys.argv[1])
