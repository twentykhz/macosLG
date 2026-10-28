"""Release project input and stop its services before replacing their files."""
from __future__ import print_function
import os,signal,time
assert os.geteuid()==0
targets=set(['/home/root/gathin-home-keyhook.py','/home/root/gathin-youtube-voice-router.py','/var/lib/webosbrew/gathin-controls/bridge.py','/var/lib/webosbrew/gathin-controls/bridge.js','/var/lib/webosbrew/gathin-hdmi/track.py','/var/lib/webosbrew/gathin-hdmi/track.js','/var/lib/webosbrew/gathin-wallpaper/wallpaper-service.js','/var/lib/webosbrew/gathin-remote/server.js'])
for name in ['HOME','CONTROLS','HDMI','YOUTUBE-VOICE','REMOTE','WALLPAPER']:open('/home/root/DISABLE-GATHIN-'+name,'a').close()
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
for unused in range(100):
 if not any(os.path.exists('/proc/'+str(pid)) for pid in found):break
 time.sleep(.1)
else:raise RuntimeError('Previous runtime has not stopped; refusing to replace its files')
print('Previous project runtimes stopped; native HOME input released')
