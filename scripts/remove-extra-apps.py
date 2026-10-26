#!/usr/bin/python
from __future__ import print_function
import imp
policy=imp.load_source('trim','/var/lib/webos-debloat/gathin-final/debloat.py')
keep=set(['com.gathin.tvhome','youtube.leanback.v4','com.webos.app.browser','com.fpt.fptplay','com.viettel.media.tv360','netflix','airplay','org.webosbrew.hbchannel','ooo.lew.lifesgoodwithoutspying'])
apps=policy.call('com.webos.applicationManager/listApps',{}).get('apps',[])
for app in apps:
 if app.get('removable') and app['id'] not in keep:policy.remove(app['id'])
