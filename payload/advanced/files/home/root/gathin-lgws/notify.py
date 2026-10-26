#!/usr/bin/python
import json,subprocess
params={'appId':'com.gathin.lgws.osd','main':'file:///home/root/gathin-lgws/LGWS.qml','params':{}}
p=subprocess.Popen(['/usr/bin/luna-send','-w','5000','-n','1','luna://com.webos.service.sysuicompmgr/launch',json.dumps(params)],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
try:
 print(p.stdout.read());p.wait()
finally:
 if p.poll() is None:p.terminate()
 p.stdin.close()
