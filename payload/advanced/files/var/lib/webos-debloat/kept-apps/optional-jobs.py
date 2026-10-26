#!/usr/bin/python
from __future__ import print_function
import os,re,subprocess
ROOT='/var/lib/webos-debloat/kept-apps'
JOBS=['remotelogger','iepg','iepg-integrity','db8-epgdb','broadcast-conf-downloader']
if not os.path.isdir(ROOT):os.makedirs(ROOT,0o700)
for job in JOBS:
 target='/etc/init/'+job+'.conf';saved=ROOT+'/'+job+'.before.conf';manual=ROOT+'/'+job+'.manual.conf'
 if not os.path.isfile(target):continue
 if not os.path.isfile(saved):open(saved,'w').write(open(target).read())
 source=open(saved).read()
 # Each inspected start condition occupies one line on this firmware.
 source=re.sub(r'^start on[^\n]*$', 'manual', source, flags=re.M)
 open(manual,'w').write(source)
 if not any(line.split()[1]==target for line in open('/proc/mounts')):subprocess.check_call(['/bin/mount','--bind',manual,target])
subprocess.check_call(['/sbin/initctl','reload-configuration'])
for job in JOBS:subprocess.call(['/sbin/initctl','stop',job])
print('Stopped optional remote diagnostics and broadcast-guide jobs; AirPlay untouched')
