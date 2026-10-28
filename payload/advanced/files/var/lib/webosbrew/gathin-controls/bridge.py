#!/usr/bin/python
from __future__ import print_function
import json,os,subprocess,re
import socket,thread,select,signal,time,sys
ROOT=os.environ.get('GATHIN_CONTROL_DATA','/var/lib/webosbrew/gathin-controls')
TOKEN=open(ROOT+'/bridge.token').read().strip()
def luna(endpoint,data):
 p=subprocess.Popen(['/usr/bin/luna-send','-w','6000','-n','1','luna://'+endpoint,json.dumps(data)],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 try:
  result=json.loads(p.stdout.read());p.wait();return result
 finally:
  if p.poll() is None:p.terminate()
  p.stdin.close()
def optional_api(endpoint,data):
 try:
  result=luna(endpoint,data)
  if result.get('returnValue') is not False:return result
 except Exception:pass
 return {'returnValue':False,'supported':False,'errorText':'Feature unavailable on this TV'}

def run(action,data):
 if action=='health':return {'returnValue':True,'protocol':2}
 if action=='wifi_status':
  result=optional_api('com.webos.service.wifi/getstatus',{})
  if result.get('returnValue') is not False:return result
  result=optional_api('com.palm.connectionmanager/getStatus',{})
  wifi=result.get('wifi') or {}
  if result.get('returnValue') is not False and wifi:
   active=wifi.get('state') not in ('disabled','off')
   return {'returnValue':True,'status':'serviceEnabled' if active else 'serviceDisabled','networkInfo':{'ssid':wifi.get('ssid',''),'connectState':'connected' if wifi.get('state')=='connected' else 'disconnected'}}
  return {'returnValue':False,'supported':False,'errorText':'Wi-Fi status unavailable'}
 if action=='set_wifi':
  if data.get('state') not in ('enabled','disabled'):return {'returnValue':False}
  return optional_api('com.webos.service.wifi/setstate',{'state':data['state']})
 if action=='bluetooth_status':return optional_api('com.webos.service.bluetooth2/adapter/getStatus',{})
 if action=='set_bluetooth':
  if not isinstance(data.get('powered'),bool):return {'returnValue':False}
  return optional_api('com.webos.service.bluetooth2/adapter/setState',{'powered':data['powered'],'adapterAddress':data.get('adapterAddress')})
 if action=='volume':return optional_api('com.webos.audio/getVolume',{})
 if action=='set_volume':
  value=data.get('volume')
  if isinstance(value,bool) or not isinstance(value,int) or not 0<=value<=100:return {'returnValue':False}
  return optional_api('com.webos.audio/setVolume',{'volume':value})
 if action=='set_muted':
  if not isinstance(data.get('muted'),bool):return {'returnValue':False}
  return optional_api('com.webos.audio/setMuted',{'muted':data['muted']})
 if action in ('power_off','power_reboot'):
  if data.get('confirmed') is not True:return {'returnValue':False,'errorText':'Explicit power confirmation required'}
  if action=='power_off':return luna('com.webos.service.tvpower/power/powerOff',{'reason':'remoteKey'})
  def reboot_later():
   time.sleep(1)
   subprocess.Popen(['/sbin/reboot'],stdin=open('/dev/null','r'),stdout=open('/dev/null','w'),stderr=subprocess.STDOUT)
  thread.start_new_thread(reboot_later,())
  return {'returnValue':True}
 if action=='voice_search':
  luna('com.webos.applicationManager/closeByAppId',{'id':'com.webos.app.voice'})
  return luna('com.webos.service.sysuicompmgr/launch',{'appId':'com.webos.app.voiceagent','main':'file://usr/palm/applications/com.webos.app.voiceagent/Main.qml','params':{'activateType':'mrcu','launchMode':'voice','pressed':True,'walkietalkie':False}})
 if action=='settings_key':return luna('com.webos.service.networkinput/test/sendKeyCode',{'keyCode':139})
 if action=='input':return luna('com.webos.surfacemanager/showInputPicker',{})
 if action=='backlight':return optional_api('com.webos.service.settings/getSystemSettings',{'category':'picture','keys':['backlight']})
 if action=='set_backlight':
  value=data.get('value')
  if isinstance(value,bool) or not isinstance(value,int) or value<0 or value>100:return {'returnValue':False,'errorText':'Backlight must be an integer from 0 to 100'}
  return luna('com.webos.service.settings/setSystemSettings',{'category':'picture','settings':{'backlight':str(value)}})
 if action=='picture':return optional_api('com.webos.service.settings/getSystemSettings',{'category':'picture','keys':['pictureMode']})
 if action=='modes':return optional_api('com.webos.service.settings/getSystemSettingValues',{'category':'picture','key':'pictureMode'})
 if action=='set_picture':
  mode=data.get('mode');r=run('modes',{});rows=(r.get('values') or {}).get('arrayExt',[])
  if not any(x.get('value')==mode and x.get('active',True) and x.get('visible',True) for x in rows):return {'returnValue':False,'errorText':'Unavailable picture mode'}
  return luna('com.webos.service.settings/setSystemSettings',{'category':'picture','settings':{'pictureMode':mode}})
 if action=='bt_devices':return optional_api('com.webos.service.bluetooth2/device/getStatus',{})
 if action=='bt_connect':
  address=data.get('address','');devices=run('bt_devices',{}).get('devices',[])
  match=[d for d in devices if d.get('address')==address and d.get('paired') and 'hid' not in d.get('connectedProfiles',[]) and d.get('classOfDevice')!=7936]
  if not match:return {'returnValue':False,'errorText':'Select a paired audio device'}
  return luna('com.webos.service.bluetooth2/a2dp/connect',{'address':address})
 if action in ('wifi_settings','bt_settings'):
  return luna('com.webos.applicationManager/launch',{'id':'com.palm.app.settings','params':{'target':'network' if action=='wifi_settings' else 'sound'}})
 return {'returnValue':False,'errorText':'Unknown action'}
WATCH_PROCS=[]
STOPPING=False

def home_log(message):
 path=ROOT+'/home-guard.log'
 try:
  if os.path.exists(path) and os.path.getsize(path)>16384:os.rename(path,path+'.previous')
  with open(path,'a') as f:f.write(time.strftime('%Y-%m-%d %H:%M:%S')+' '+message+'\n')
 except IOError:pass

def shutdown(sig,frame):
 global STOPPING
 STOPPING=True
 for p in WATCH_PROCS:
  if p.poll() is None:p.terminate()
 sys.exit(0)

def watch_stock_home():
 while not STOPPING:
  if os.path.exists('/home/root/DISABLE-GATHIN-HOME'):
   time.sleep(.5);continue
  master,slave=os.openpty()
  p=subprocess.Popen(['/usr/bin/luna-send','-i','luna://com.webos.surfacemanager/getCurrentState','{"subscribe":true}'],stdin=subprocess.PIPE,stdout=slave,stderr=slave,close_fds=True)
  os.close(slave);WATCH_PROCS.append(p);buffer='';last=0
  try:
   while p.poll() is None and not STOPPING and not os.path.exists('/home/root/DISABLE-GATHIN-HOME'):
    if not select.select([master],[],[],1)[0]:continue
    chunk=os.read(master,8192)
    if not chunk:break
    buffer+=chunk
    if len(buffer)>65536:buffer=''
    while '\n' in buffer:
     line,buffer=buffer.split('\n',1)
     if '"currentState"' not in line:continue
     match=re.search(r'"currentState"\s*:\s*"([^" ]+)"',line)
     if not match:continue
     state=match.group(1)
     if state=='home' and time.time()-last>.35 and not os.path.exists('/home/root/DISABLE-GATHIN-HOME'):
      last=time.time()
      closed=luna('com.webos.surfacemanager.systemui/closeAllSystemUI',{})
      launched=luna('com.webos.applicationManager/launch',{'id':'com.gathin.tvhome'})
      home_log('stock home suppressed; MAC-WebOSTV accepted='+str(launched.get('returnValue') is True))
  except Exception as e:home_log('subscription retry '+type(e).__name__)
  finally:
   if p.poll() is None:p.terminate()
   p.stdin.close();p.wait();WATCH_PROCS.remove(p);os.close(master)
  if not STOPPING:time.sleep(1)

def serve():
 signal.signal(signal.SIGTERM,shutdown)
 signal.signal(signal.SIGINT,shutdown)
 thread.start_new_thread(watch_stock_home,())
 home_log('native home subscription started; normal in-app Back preserved')
 server=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
 server.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1)
 server.bind(('127.0.0.1',int(os.environ.get('GATHIN_CONTROL_PORT','18764'))));server.listen(4)
 while True:
  connection,address=server.accept();connection.settimeout(3)
  status=200;result={'returnValue':False}
  try:
   raw=''
   while '\r\n\r\n' not in raw:
    part=connection.recv(1024)
    if not part:raise ValueError()
    raw+=part
    if len(raw)>8192:raise ValueError()
   head,body=raw.split('\r\n\r\n',1)
   lines=head.split('\r\n');method=lines[0].split()[0]
   headers={}
   for line in lines[1:]:
    if ':' in line:
     key,value=line.split(':',1);headers[key.lower()]=value.strip()
   if method=='OPTIONS':status=204;result={}
   elif method!='POST':status=405
   elif headers.get('x-gathin-token')!=TOKEN:status=403
   else:
    size=int(headers.get('content-length','0'))
    if size<1 or size>2048:raise ValueError()
    while len(body)<size:
     part=connection.recv(size-len(body))
     if not part:raise ValueError()
     body+=part
    data=json.loads(body[:size]);result=run(data.get('action'),data)
  except Exception:
   status=400;result={'returnValue':False,'errorText':'Local control request failed'}
  try:
   body=json.dumps(result) if status!=204 else ''
   response='HTTP/1.1 %s OK\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Headers: Content-Type,X-Gathin-Token\r\nAccess-Control-Allow-Methods: POST,OPTIONS\r\nContent-Type: application/json\r\nCache-Control: no-store\r\nConnection: close\r\nContent-Length: %d\r\n\r\n' % (status,len(body))
   connection.sendall(response+body)
  except socket.error:pass
  finally:connection.close()
if __name__=='__main__':
 if '--probe' in sys.argv:print(json.dumps(dict((action,run(action,{})) for action in ['health','wifi_status','bluetooth_status','volume','backlight','picture'])))
 else:serve()
