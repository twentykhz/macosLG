#!/usr/bin/python
from __future__ import print_function
import json,os,subprocess,select,time,shutil
STATE='/var/lib/webos-debloat/gathin-final'
LOCKED=['com.webos.app.remoteservice','com.webos.app.customersupport','com.webos.app.photovideo','com.webos.app.scheduler','com.webos.app.recordings','com.webos.app.music','com.webos.app.igallery','com.webos.app.tips','com.webos.app.tvuserguide','com.webos.app.brandshop','com.webos.app.cheeringtv','com.webos.app.favshows','com.webos.app.mystarter','com.webos.app.store-demo','com.webos.app.tvsimpleviewer','com.webos.app.facebooklogin','com.webos.app.iot-thirdparty-login','com.webos.app.dangbei-card','com.webos.app.dangbei-overlay','com.webos.app.adapp','com.webos.app.acrcomponent','com.webos.app.acroverlay','com.webos.app.acrhdmi1','com.webos.app.acrhdmi2','com.webos.app.acrhdmi3','com.webos.app.acrhdmi4','com.webos.app.livezoom-inphotovideo','com.webos.app.livezoom-inrecordings','com.webos.app.multiview','com.webos.app.magicnum']
LOCKED += ["com.webos.app.connectionwizard","com.webos.app.btspeakerapp","com.webos.app.miracast","com.webos.app.miracast-overlay","com.webos.app.livemenu","com.webos.app.accessibility","com.webos.app.notificationcenter"]
LOCKED += ['com.webos.app.discovery']
def call(endpoint,params):
 p=subprocess.Popen(['/usr/bin/luna-send','-w','5000','-n','1','luna://'+endpoint,json.dumps(params)],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 try:
  r=json.loads(p.stdout.read());p.wait();return r
 finally:
  if p.poll() is None:p.terminate()
  p.stdin.close()
def apply():
 results=[]
 apps=call('com.webos.applicationManager/listApps',{}).get('apps',[])
 installed=set(a['id'] for a in apps)
 for app in LOCKED:
  if app not in installed:continue
  r=call('com.webos.applicationManager/lockApp',{'id':app,'lock':True})
  results.append({'id':app,'locked':r.get('locked'),'returnValue':r.get('returnValue')})
  call('com.webos.applicationManager/closeByAppId',{'id':app})
 # Stop the dedicated app preloader, preserving launch-on-demand and all TV services.
 conf='/etc/init/webos-preload-manager.conf';disabled=STATE+'/preload.manual.conf'
 if not os.path.exists(disabled):
  original=open(conf).read()
  open(STATE+'/preload.before.conf','w').write(original)
  lines=[('manual' if line.startswith('start on ') else line) for line in original.splitlines()]
  open(disabled,'w').write('\n'.join(lines)+'\n')
 if not any(line.split()[1]==conf for line in open('/proc/mounts')):
  subprocess.check_call(['/bin/mount','--bind',disabled,conf])
 subprocess.call(['initctl','reload-configuration'])
 subprocess.call(['initctl','stop','webos-preload-manager'])
 foreground=call('com.webos.applicationManager/getForegroundAppInfo',{}).get('appId')
 for a in ('com.webos.app.browser','com.webos.app.container','netflix','airplay'):
  if a==foreground:continue
  # Only close processes that SAM marked as preload, preserving user sessions.
  preload=False
  for pid in os.listdir('/proc'):
   if not pid.isdigit():continue
   try:
    cmd=open('/proc/'+pid+'/cmdline').read()
    if '"appId":"'+a+'"' in cmd and '"reason":"preload"' in cmd:preload=True
   except IOError:pass
  if preload:call('com.webos.applicationManager/closeByAppId',{'id':a})
 with open(STATE+'/locks.applied.json','w') as f:json.dump(results,f)
 print('Locked optional firmware apps:',sum(1 for r in results if r['returnValue']))
def remove(app):
 p=subprocess.Popen(['/usr/bin/luna-send','-i','luna://com.webos.appInstallService/remove',json.dumps({'id':app,'subscribe':True})],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,bufsize=0)
 events=[];deadline=time.time()+65
 try:
  while time.time()<deadline:
   if not select.select([p.stdout],[],[],.25)[0]:continue
   line=p.stdout.readline()
   if not line:break
   r=json.loads(line);events.append(r);d=r.get('details') or {};state=str(d.get('state','')).lower()
   if r.get('returnValue') is False or d.get('errorCode') or 'fail' in state or r.get('statusValue')==25:break
   if 'removed' in state or r.get('statusValue')==31:break
 finally:
  if p.poll() is None:p.terminate()
  p.stdin.close();p.wait()
 ids=set(a['id'] for a in call('com.webos.applicationManager/listApps',{}).get('apps',[]))
 result={'id':app,'absent':app not in ids,'events':events}
 print(json.dumps(result));return result
if __name__=='__main__':
 import sys
 if not os.path.isdir(STATE):os.makedirs(STATE,0o700)
 if len(sys.argv)>1 and sys.argv[1]=='apply':apply()
 elif len(sys.argv)>1 and sys.argv[1]=='remove':
  results=[remove(a) for a in ['com.mytvb2c.app','com.vtvgotv.app','com.apple.appletv','webos.day']]
  json.dump(results,open(STATE+'/removed.json','w'))
 elif len(sys.argv)>1 and sys.argv[1]=='cache':
  results=[]
  # Disposable Chromium caches only; retain cookies, IndexedDB, logins and browser data.
  for path in ['/var/lib/wam/Default/Cache','/var/lib/wam/Default/CodeCache']:
   actual=os.path.realpath(path)
   if actual!=path or not actual.startswith('/var/lib/wam/Default/'):raise RuntimeError('Unexpected cache target')
   if os.path.isdir(path):
    subprocess.call(['du','-sk',path]);shutil.rmtree(path);os.makedirs(path,0o700);results.append(path)
  print('Cleared disposable caches:',','.join(results))
