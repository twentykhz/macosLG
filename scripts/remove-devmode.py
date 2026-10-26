#!/usr/bin/python
"""Root-only removal through the installer, restricted to LG Developer Mode.

No raw app directory deletion. Any failure prevents the orchestrator reboot.
"""
from __future__ import print_function
import json
import os
import select
import subprocess
import time

APP = 'com.palmdts.devmode'
LUNA = '/usr/bin/luna-send'
if os.getuid() != 0:
    raise RuntimeError('Root required')


def apps():
    proc = subprocess.Popen([LUNA, '-w', '10000', '-n', '1', 'luna://com.webos.applicationManager/listApps', '{}'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, bufsize=0)
    try:
        # Keep stdin open: early EOF makes luna-send discard a large reply.
        data = proc.stdout.read()
        proc.wait()
        result = json.loads(data)
        if proc.returncode != 0 or not result.get('returnValue') or 'apps' not in result:
            raise RuntimeError('Cannot verify installed apps')
        return result['apps']
    finally:
        if proc.poll() is None:
            proc.terminate()
        proc.stdin.close()


if any(app.get('id') == APP for app in apps()):
    proc = subprocess.Popen([LUNA, '-i', 'luna://com.webos.appInstallService/remove', json.dumps({'id': APP, 'subscribe': True})], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, bufsize=0)
    completed = False
    deadline = time.time() + 60
    try:
        while time.time() < deadline:
            if not select.select([proc.stdout], [], [], 0.25)[0]:
                continue
            line = proc.stdout.readline()
            if not line:
                break
            result = json.loads(line)
            detail = result.get('details') or {}
            state = str(detail.get('state', '')).lower()
            if result.get('returnValue') is False or detail.get('errorCode') or 'fail' in state or result.get('statusValue') == 25:
                raise RuntimeError('Developer Mode uninstall failed: ' + json.dumps(result))
            if 'removed' in state or result.get('statusValue') == 31:
                completed = True
                break
        if not completed:
            raise RuntimeError('Developer Mode uninstall did not report completion; refusing reboot')
    finally:
        if proc.poll() is None:
            proc.terminate()
        proc.stdin.close()
        proc.wait()

for attempt in range(10):
    if not any(app.get('id') == APP for app in apps()):
        print('Developer Mode absent; safe to proceed to reboot')
        break
    time.sleep(0.5)
else:
    raise RuntimeError('Developer Mode still registered; refusing reboot')
