#!/usr/bin/python
"""Learn this TV's preferred HDMI from observed active viewing, not source-TV data."""
from __future__ import print_function
import json, os, subprocess, time, signal, math

ROOT = '/var/lib/webosbrew/gathin-hdmi'
STATE = ROOT + '/usage.json'
CHOICE = '/media/developer/apps/usr/palm/applications/com.gathin.tvhome/hdmi-choice.json'
PORTS = ['com.webos.app.hdmi' + str(n) for n in range(1, 5)]
running = True

def call(endpoint):
    p = subprocess.Popen(['/usr/bin/luna-send', '-w', '2000', '-n', '1', 'luna://' + endpoint, '{}'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = p.communicate()
    try:
        result = json.loads(out)
        return result if result.get('returnValue') is not False else {}
    except ValueError:
        return {}

def atomic(path, value):
    with open(path + '.new', 'w') as stream:
        json.dump(value, stream)
    os.rename(path + '.new', path)

def load():
    try:
        data = json.load(open(STATE))
        if not isinstance(data, dict):
            raise ValueError('Invalid HDMI state')
        seconds = data.get('seconds', {})
        if not isinstance(seconds, dict):
            raise ValueError('Invalid HDMI durations')
        if any(math.isnan(float(seconds.get(p, 0))) or math.isinf(float(seconds.get(p, 0))) for p in PORTS):
            raise ValueError('Invalid HDMI duration')
        return {'seconds': dict((p, max(0, float(seconds.get(p, 0)))) for p in PORTS), 'appId': data.get('appId') if data.get('appId') in PORTS else None}
    except (IOError, ValueError, TypeError):
        return {'seconds': dict((p, 0) for p in PORTS), 'appId': None}

def record(data, previous, current, elapsed, active):
    # Two consecutive samples must agree. Never count standby, suspend gaps or failed queries.
    if active and previous == current and current in PORTS and 0 < elapsed <= 25:
        data['seconds'][current] += elapsed
    best = max(data['seconds'].values())
    if best > 0:
        winners = [p for p in PORTS if data['seconds'][p] == best]
        data['appId'] = data['appId'] if data['appId'] in winners else winners[0]
    return data

def stop(signum, frame):
    global running
    running = False

def clock():
    return float(open('/proc/uptime').read().split()[0])

def main():
    if not os.path.isdir(ROOT):
        os.makedirs(ROOT)
    data = load()
    atomic(CHOICE, {'appId': data['appId']})
    previous, before, dirty, saved = None, clock(), False, clock()
    while running:
        power = call('com.webos.service.tvpower/power/getPowerState')
        active = power.get('state') == 'Active'
        current = call('com.webos.applicationManager/getForegroundAppInfo').get('appId') if active else None
        now = clock()
        old = data['appId']
        record(data, previous, current, now - before, active)
        dirty = dirty or (active and previous == current and current in PORTS)
        if data['appId'] != old:
            atomic(CHOICE, {'appId': data['appId']})
        if dirty and (now - saved >= 60 or data['appId'] != old or current not in PORTS):
            atomic(STATE, data)
            dirty, saved = False, now
        previous, before = current, now
        for unused in range(15):
            if not running:
                break
            time.sleep(1)
    if dirty:
        atomic(STATE, data)

if __name__ == '__main__':
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    main()
