#!/usr/bin/python
from __future__ import print_function
import imp,os
if not os.path.exists('/home/root/DISABLE-GATHIN-YOUTUBE-VOICE'):
 router=imp.load_source('gathin_voice_guard','/home/root/gathin-youtube-voice-router.py')
 for endpoint,params in [('com.webos.applicationManager/lockApp',{'id':'com.webos.app.voiceview','lock':True}),('com.webos.applicationManager/closeByAppId',{'id':'com.webos.app.voiceview'})]:
  result=router.luna_result(endpoint,params)
  print(endpoint,result.get('returnValue'))
