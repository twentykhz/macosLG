#!/usr/bin/python
"""Observe stock Home through a PTY. Never consumes a remote key or closes overlays."""
from __future__ import print_function
import errno,fcntl,json,os,select,signal,subprocess,time
ROOT='/home/root/gathin-home-replacement'
PID='/tmp/gathin-home-observer.pid'
READY='/tmp/gathin-home-observer.ready'
APP='com.gathin.tvhome'
running=True
def stop(sig,frame):
 global running
 running=False
def log(message):
 try:
  file='/tmp/gathin-home-observer.log'
  if os.path.exists(file) and os.path.getsize(file)>32768:os.rename(file,file+'.previous')
  with open(file,'a') as f:f.write(time.strftime('%Y-%m-%d %H:%M:%S')+' '+message+'\n')
 except IOError:pass
def finish(p):
 if p.poll() is None:p.terminate()
 until=time.time()+.5
 while p.poll() is None and time.time()<until:time.sleep(.02)
 if p.poll() is None:p.kill()
 p.wait()
 for f in (p.stdin,p.stdout,p.stderr):
  if f:f.close()
def call(api,data=None):
 with open('/dev/null','r+') as null:
  p=subprocess.Popen(['/usr/bin/luna-send','-w','700','-n','1','luna://'+api,json.dumps(data or {})],stdin=null,stdout=subprocess.PIPE,stderr=null,close_fds=True)
  try:
   buffer=b'';until=time.time()+1.2
   while running and time.time()<until:
    if select.select([p.stdout],[],[],.1)[0]:
     b=os.read(p.stdout.fileno(),16384)
     if not b:break
     buffer+=b
     if len(buffer)>65536:break
     try:return json.loads(buffer.decode('utf-8'))
     except ValueError:pass
   return {'returnValue':False}
  finally:finish(p)
def blocked(app,state,strict=False):
 return (app=='com.webos.app.home' and state in ('home','launcher')) or (strict and app=='com.webos.app.livetv')
def disabled():
 return os.path.exists(ROOT+'/disabled') or os.path.exists('/home/root/DISABLE-GATHIN-HOME')

def strict_mode():
 try:return json.load(open('/var/lib/webos-debloat/gathin-final/policy.json')).get('debloatMode')=='keep-nine'
 except (IOError,ValueError):return False
def redirect(state):
 foreground=call('com.webos.applicationManager/getForegroundAppInfo')
 if foreground.get('returnValue') is not True or not blocked(foreground.get('appId'),state,strict_mode()):return
 time.sleep(.25)
 if not running or disabled():return
 fresh=call('com.webos.applicationManager/getForegroundAppInfo')
 surface=call('com.webos.surfacemanager/getCurrentState')
 if fresh.get('returnValue') is not True or surface.get('returnValue') is not True or fresh.get('appId')!=foreground.get('appId'):return
 if not blocked(fresh.get('appId'),surface.get('currentState'),strict_mode()):return
 result=call('com.webos.applicationManager/launch',{'id':APP})
 log('stock foreground redirect accepted='+str(result.get('returnValue') is True))
def main():
 owner=open('/tmp/gathin-home-observer.owner','a')
 try:fcntl.flock(owner,fcntl.LOCK_EX|fcntl.LOCK_NB)
 except IOError:owner.close();return
 try:
  if disabled():return
  info=call('com.webos.applicationManager/getAppInfo',{'id':APP})
  if info.get('returnValue') is not True:raise RuntimeError('Launcher not registered')
  with open(PID,'w') as f:f.write(str(os.getpid()))
  retry=0
  while running and not disabled() and retry<6:
   master,slave=os.openpty()
   p=subprocess.Popen(['/usr/bin/luna-send','-i','luna://com.webos.surfacemanager/getCurrentState','{"subscribe":true}'],stdin=subprocess.PIPE,stdout=slave,stderr=slave,close_fds=True)
   os.close(slave);buffer=b'';last=0
   try:
    while running and p.poll() is None and not disabled():
     if not select.select([master],[],[],.25)[0]:continue
     chunk=os.read(master,8192)
     if not chunk:break
     buffer+=chunk
     if len(buffer)>65536:raise RuntimeError('Subscription buffer exceeded')
     while b'\n' in buffer:
      line,buffer=buffer.split(b'\n',1)
      try:r=json.loads(line.decode('utf-8','replace').strip())
      except ValueError:continue
      if r.get('returnValue') is False:raise RuntimeError('Home subscription rejected')
      if 'currentState' not in r:continue
      with open(READY,'w') as f:f.write(str(os.getpid()))
      if time.time()-last>.5:last=time.time();redirect(r['currentState'])
   except (IOError,OSError,ValueError,RuntimeError) as e:log('subscription ended: '+type(e).__name__)
   finally:finish(p);os.close(master)
   retry+=1
   if running:time.sleep(1)
 finally:
  for file in (PID,READY):
   try:
    if open(file).read().strip()==str(os.getpid()):os.unlink(file)
   except IOError:pass
  owner.close()
if __name__=='__main__':
 signal.signal(signal.SIGTERM,stop);signal.signal(signal.SIGINT,stop)
 try:main()
 except Exception as e:log('observer failed: '+type(e).__name__);raise
