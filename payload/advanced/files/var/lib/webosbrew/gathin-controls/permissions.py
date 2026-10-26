#!/usr/bin/python
from __future__ import print_function
import json,os,subprocess
root='/var/lib/webosbrew/gathin-controls'
if not os.path.isdir(root):os.makedirs(root,0o700)
methods=['com.webos.surfacemanager/showInputPicker','com.webos.service.wifi/getstatus','com.webos.service.wifi/setstate','com.webos.service.bluetooth2/adapter/getStatus','com.webos.service.bluetooth2/adapter/setState','com.webos.audio/getVolume','com.webos.audio/setVolume','com.webos.audio/setMuted','com.webos.service.settings/getSystemSettings','com.webos.service.settings/getSystemSettingValues','com.webos.service.settings/setSystemSettings']
api=root+'/controls.api.json'
json.dump({'gathin.controls':methods},open(api,'w'))
manifest='/var/luna-service2/manifests.d/com.gathin.controls.permissions.json'
json.dump({'id':'com.gathin.controls.permissions','version':'1.0.0','apiPermissionFiles':[api]},open(manifest,'w'))
client='/var/luna-service2-dev/client-permissions.d/com.gathin.tvhome.app.json'
if not os.path.isfile(client):raise RuntimeError('Launcher permissions not registered yet')
data=json.load(open(client))
if not os.path.isfile(root+'/client.before.json'):json.dump(data,open(root+'/client.before.json','w'))
for name,groups in data.items():
 if name.startswith('com.gathin.tvhome') and 'gathin.controls' not in groups:groups.append('gathin.controls')
json.dump(data,open(client,'w'))
subprocess.check_call(['/usr/sbin/ls-control','scan-services'])
subprocess.check_call(['/usr/sbin/ls-control','scan-volatile-dirs'])
print('Launcher: public + 11 specific control methods; no global API grants')
