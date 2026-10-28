#!/usr/bin/python
# -*- coding: utf-8 -*-
"""Typed Vietnamese voice commands; no shell strings, raw audio or arbitrary IDs."""
from __future__ import print_function
import json,re,unicodedata
try:
    string_type=unicode
except NameError:
    string_type=str
ALIASES={
 'youtube':'youtube.leanback.v4','you tube':'youtube.leanback.v4','du tube':'youtube.leanback.v4',
 'fpt play':'com.fpt.fptplay','fptplay':'com.fpt.fptplay','fpt':'com.fpt.fptplay','fpt plei':'com.fpt.fptplay',
 'tv360':'com.viettel.media.tv360','tv 360':'com.viettel.media.tv360','tv 3 60':'com.viettel.media.tv360','viettel tv':'com.viettel.media.tv360',
 'netflix':'netflix','net flix':'netflix','net flit':'netflix',
 'trinh duyet':'com.webos.app.browser','trinh duyet web':'com.webos.app.browser','browser':'com.webos.app.browser','safari':'com.webos.app.browser',
 'homebrew':'org.webosbrew.hbchannel','home brew':'org.webosbrew.hbchannel',
 'lgws':'ooo.lew.lifesgoodwithoutspying','lg ws':'ooo.lew.lifesgoodwithoutspying','lg without spying':'ooo.lew.lifesgoodwithoutspying',
 'airplay':'airplay','air play':'airplay',
 'trang chu':'com.gathin.tvhome','launcher':'com.gathin.tvhome','home':'com.gathin.tvhome',
 'cai dat':'com.palm.app.settings','settings':'com.palm.app.settings'
}
DIGITS={'khong':0,'mot':1,'hai':2,'ba':3,'bon':4,'tu':4,'nam':5,'lam':5,'sau':6,'bay':7,'tam':8,'chin':9}
def normalize(value):
 if not isinstance(value,string_type):value=value.decode('utf-8','replace')
 value=value.lower().replace(u'đ','d')
 value=''.join(c for c in unicodedata.normalize('NFD',value) if unicodedata.category(c)!='Mn')
 return re.sub(r'\s+',' ',re.sub(r'[^a-z0-9%\s]',' ',value)).strip()
def number(value):
 value=re.sub(r'\s*(?:phan tram|percent|%)\s*$','',value).strip()
 if re.match(r'^\d+$',value):return int(value)
 parts=value.split()
 if parts in (['mot','tram'],['mot','tram','khong'],['tram']):return 100
 if len(parts)==1:return 10 if parts[0]=='muoi' else DIGITS.get(parts[0])
 if len(parts)==2 and parts[0]=='muoi' and parts[1] in DIGITS:return 10+DIGITS[parts[1]]
 if len(parts) in (2,3) and parts[0] in DIGITS and parts[1] in ('muoi','chuc'):
  if len(parts)==2:return DIGITS[parts[0]]*10
  if parts[2] in DIGITS:return DIGITS[parts[0]]*10+DIGITS[parts[2]]
 return None
def app_id(name):
 name=re.sub(r'^(?:ung dung|app)\s+','',name).strip()
 return ALIASES.get(name)
def route(command):
 return {'kind':'control','command':command,'keyword':'control:'+json.dumps(command,sort_keys=True),'source':'voice-control','intent':'DeviceControl'}
def parse(value):
 s=normalize(value)
 if not s or len(s)>200:return None
 # Explicit search content wins over words that happen to name power commands.
 if re.match(r'^(?:tim|tim kiem|search|find|xem|phat|video|bai hat)\b',s):return None
 s=re.sub(r'^(?:(?:hay|vui long|lam on)\s+)+','',s)
 s=re.sub(r'\s+(?:giup toi|giup minh|nhe|di)$','',s)
 tv=r'(?:tv|tivi|ti vi|tieu vi|television)'
 if re.match(r'^(?:mo|bat|vao|open)\s+(?:tv|tivi|ti vi)$',s):return route({'action':'open_tv'})
 if re.match(r'^(?:tat|turn off|power off)\s+'+tv+'$',s):return route({'action':'power_off'})
 if re.match(r'^(?:khoi dong lai|reboot|restart)\s+'+tv+'$',s):return route({'action':'reboot'})
 hdmi=re.match(r'^(?:(?:mo|bat|chuyen|chon|vao|open|switch to)\s+)?(?:sang\s+)?(?:cong\s+|nguon\s+)?hdmi\s*([1-4]|mot|hai|ba|bon)$',s)
 if hdmi:return route({'action':'open','app':'com.webos.app.hdmi'+str(number(hdmi.group(1)))})
 opened=re.match(r'^(?:mo|bat|vao|open|launch)\s+(.+)$',s)
 if opened:
  target=app_id(opened.group(1))
  if target:return route({'action':'open','app':target})
 closed=re.match(r'^(?:dong|tat|thoat|close|exit)\s+(.+)$',s)
 if closed:
  name=closed.group(1)
  if name in ('ung dung','app','ung dung hien tai','ung dung dang mo','app hien tai','app dang mo'):
   return route({'action':'close_current'})
  target=app_id(name)
  if target:return route({'action':'close','app':target})
 if s in ('tat tieng','im lang','mute'):return route({'action':'mute','muted':True})
 if s in ('bat tieng','mo tieng','unmute'):return route({'action':'mute','muted':False})
 match=re.match(r'^(?:(tang|giam|dat|chinh|dieu chinh|cho|set|increase|decrease|lower|raise)\s+)?(am luong|volume|do sang man hinh|do sang|den nen|brightness)(?:\s+(.*))?$',s)
 if match:
  verb,label,tail=match.groups();tail=(tail or '').strip();kind='volume' if label in ('am luong','volume') else 'backlight'
  relative=bool(re.search(r'\b(?:them|bot|di|by)\b',tail))
  cleaned=re.sub(r'^(?:(?:den|ve|len|xuong|la|muc|o muc|bang|to|them|bot|di|by)\s+)+','',tail)
  value=number(cleaned) if cleaned else None
  down=verb in ('giam','decrease','lower')
  if not tail and verb in ('tang','giam','increase','decrease','lower','raise'):
   return route({'action':kind,'relative':True,'value':-5 if down else 5})
  if value is not None:
   if not 0<=value<=100:return route({'action':'invalid','reason':'value_out_of_range'})
   return route({'action':kind,'relative':relative,'value':-value if down and relative else value})
 return None

def execute(command,call):
 action=command['action']
 if action=='open_tv':
  try:
   target=json.load(open('/var/lib/webosbrew/gathin-hdmi/usage.json')).get('appId')
  except (IOError,ValueError,TypeError):target=None
  if target not in ['com.webos.app.hdmi'+str(n) for n in range(1,5)]:target='com.webos.app.inputmgr'
  return call('com.webos.applicationManager/launch',{'id':target})
 if action=='open':return call('com.webos.applicationManager/launch',{'id':command['app']})
 if action in ('close','close_current'):
  target=command.get('app')
  if not target:
   fg=call('com.webos.applicationManager/getForegroundAppInfo',{})
   if fg.get('returnValue') is not True:return fg
   target=fg.get('appId')
  allowed=set(ALIASES.values())
  if target=='com.gathin.tvhome' or (target or '').startswith('com.webos.app.hdmi'):
   return call('com.webos.applicationManager/launch',{'id':'com.gathin.tvhome'})
  if target not in allowed:return {'returnValue':False,'errorText':'App outside voice allowlist'}
  # Put MAC-WebOSTV in front before closing an app, so stock Home never becomes the fallback.
  shown=call('com.webos.applicationManager/launch',{'id':'com.gathin.tvhome'})
  if shown.get('returnValue') is not True:return shown
  return call('com.webos.applicationManager/closeByAppId',{'id':target})
 if action=='mute':return call('com.webos.audio/setMuted',{'muted':command['muted']})
 if action in ('volume','backlight'):
  value=command['value']
  if command.get('relative'):
   if action=='volume':
    result=call('com.webos.audio/getVolume',{});data=result.get('volumeStatus') or result;current=data.get('volume')
   else:
    result=call('com.webos.service.settings/getSystemSettings',{'category':'picture','keys':['backlight']});current=(result.get('settings') or {}).get('backlight')
   if result.get('returnValue') is not True or current is None:return {'returnValue':False,'errorText':'Current level unavailable'}
   value=max(0,min(100,int(current)+value))
  if action=='volume':return call('com.webos.audio/setVolume',{'volume':value})
  return call('com.webos.service.settings/setSystemSettings',{'category':'picture','settings':{'backlight':str(value)}})
 if action=='power_off':return call('com.webos.service.tvpower/power/powerOff',{'reason':'remoteKey'})
 if action=='reboot':return call('com.webos.service.sleep/shutdown/machineReboot',{'reason':'remoteKey'})
 return {'returnValue':False,'errorText':'Unsupported command'}
