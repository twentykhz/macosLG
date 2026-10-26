#!/usr/bin/python
# -*- coding: utf-8 -*-
"""Passive LG NLP result router. No microphone, input device or injection."""
from __future__ import print_function
import base64
import socket
import struct
import imp
import errno
import json
import os
import re
import select
import signal
import subprocess
import time
import unicodedata
try:
    from urllib import quote, unquote, urlencode
except ImportError:
    from urllib.parse import quote, unquote, urlencode

try:
    from urllib2 import urlopen
except ImportError:
    from urllib.request import urlopen

APP = 'youtube.leanback.v4'
MARKER = '/home/root/DISABLE-GATHIN-YOUTUBE-VOICE'
STATE = '/var/lib/webosbrew/gathin-youtube-voice'
LOG = STATE + '/router.log'
TRACE = STATE + '/trace-enabled'
NLP = 'com.webos.service.nlp'
CONTROL = imp.load_source('gathin_device_voice', STATE + '/commands.py')
SYSTEM = set(['tv_control', 'volume', 'power', 'settings', 'input', 'hdmi', 'channel', 'network', 'wifi', 'tvcontrol'])
running = True


def text(value):
    try:
        unicode_type = unicode
    except NameError:
        unicode_type = str
    if isinstance(value, unicode_type):
        return value
    if isinstance(value, bytes):
        return value.decode('utf-8', 'replace')
    return u''


def normalized(value):
    source = text(value).strip()
    chars, positions = [], []
    for index, char in enumerate(source):
        char = char.lower().replace(u'đ', u'd')
        for part in unicodedata.normalize('NFD', char):
            if unicodedata.category(part) != 'Mn':
                chars.append(part)
                positions.append(index)
    return source, u''.join(chars), positions


def query_from_text(value, search_context=False):
    original, norm, positions = normalized(value)
    if not norm or len(original) > 500:
        return None
    # Conservative exclusion precedes every textual YouTube/video rule.
    system = (r'^(?:(?:hay|vui long|lam on)\s+)?(?:'
              r'(?:tat|tang|giam|dieu chinh|dung|tam dung|tiep tuc)\b|'
              r'(?:mo|vao|chuyen|doi|chon|bat)\b.*\b(?:hdmi|input|nguon|kenh|cai dat|settings|wifi|wi-fi|mang|network|am luong|tv|tivi)\b|'
              r'(?:turn (?:up|down|off|on)|volume|mute|unmute|pause|stop|resume)\b|'
              r'(?:increase|decrease|lower|raise|adjust)\b.*\b(?:volume|brightness|tv)\b|'
              r'(?:open|switch|change|set)\b.*\b(?:settings|network|wifi|wi-fi|input|hdmi|channel|volume|tv)\b)')
    compound = r'\b(?:roi|va|sau do|then|and)\s+(?:tat|tang|giam|dieu chinh|dung|tam dung|chuyen|doi|turn|switch|change|pause|stop)\b'
    if re.search(system, norm) or re.search(compound, norm):
        return None
    youtube = bool(re.search(r'\byou\s*tube\b', norm))
    video = bool(re.search(r'\b(?:video|videos)\b', norm))
    action = bool(re.search(r'\b(?:tim|kiem|search|find|xem|watch|phat|play|mo|open)\b', norm))
    if not search_context and not youtube and not (video and (action or re.match(r'^videos?\b', norm))):
        return None
    if search_context and re.match(r'^(?:thoi tiet|weather|may gio|what time|wifi|wi-fi|network|settings|cai dat|hdmi|kenh|am luong|volume)\b', norm):
        return None
    # Strip grammar by offsets, retaining the exact accented keyword.
    prefix = re.compile(r'^(?:(?:hay|vui long|lam on|tim kiem|tim|search for|search|find|xem|watch|phat|play|mo|open|you\s*tube|videos?|bai hat|ca si|nghe si)\b[\s,:-]*)+', re.I)
    match = prefix.match(norm)
    start = match.end() if match else 0
    suffix = re.search(r'(?:\s+(?:tren|on|in|bang))?\s+you\s*tube\b[\s.!?]*$', norm)
    end = suffix.start() if suffix and suffix.start() >= start else len(norm)
    keyword = original[positions[start] if start < len(positions) else len(original):positions[end] if end < len(positions) else len(original)].strip(' \t,.:;!?-')
    return {'keyword': keyword, 'source': 'lg-voice-search' if search_context else 'stt-explicit-video', 'intent': 'SearchContent'}


def system_structured(payload):
    result = payload.get('result') or payload
    if not isinstance(result, dict):
        return False
    rows = result.get('ResponseData') or [result]
    for row in rows if isinstance(rows, list) else []:
        if not isinstance(row, dict):
            continue
        for field in ('ServiceType', 'serviceType', 'domain', 'intent', 'ActionType'):
            value = normalized(row.get(field, ''))[1].replace('_', '')
            if value in SYSTEM or value in ('setvolume', 'volumeup', 'volumedown', 'poweroff', 'switchinput', 'changeinput', 'changechannel', 'opensettings', 'pause', 'stop', 'resume'):
                return True
    return False


def structured(payload):
    if system_structured(payload):
        return None
    result = payload.get('result') or payload
    if not isinstance(result, dict):
        return None
    rows = result.get('ResponseData') or [result]
    for row in rows if isinstance(rows, list) else []:
        if not isinstance(row, dict):
            continue
        action = normalized(row.get('ActionType', row.get('intent', '')))[1]
        data = row.get('ActionData') or row
        if not isinstance(data, dict):
            continue
        labels = ' '.join(text(data.get(k, '')) for k in ('domain', 'provider', 'contentType', 'mediaType', 'category', 'appId', 'contents_set_id'))
        is_video = bool(re.search(r'youtube|\bvideo\b', labels.lower())) or action in ('search_youtube', 'youtube_search', 'search_video', 'play_video')
        if is_video and any(word in action for word in ('search', 'play', 'find')):
            for key in ('query', 'keyword', 'searchKeyword', 'intentParam', 'title'):
                value = text(data.get(key, '')).strip()
                if value and len(value) <= 500:
                    return {'keyword': value, 'intent': row.get('intent', 'PlayContent' if action.startswith('play') else 'SearchContent'), 'source': 'structured'}
        for launch in data.get('launch_data', []):
            params = launch.get('params') or {}
            if params.get('id') != APP:
                continue
            target = (params.get('params') or {}).get('target')
            if isinstance(target, dict):
                value = text(target.get('intentParam', '')).strip()
                if value:
                    return {'keyword': value, 'intent': target.get('intent', 'SearchContent'), 'source': 'structured-launch'}
            elif text(target).startswith('q='):
                value = text(unquote(text(target)[2:].replace('+', ' ').encode('utf-8')))
                return {'keyword': value, 'intent': 'SearchContent', 'source': 'structured-launch'}
    return None


def control_or_search(value):
    command = CONTROL.parse(value)
    return command if command else query_from_text(value, search_context=True)


def inspect_message(message):
    if message.get('transport') != 'TX':
        return None, False
    payload = message.get('payload') or {}
    if not isinstance(payload, dict):
        return None, False
    if message.get('type') == 'return' and message.get('sender') == NLP:
        if payload.get('returnValue') is False:
            return None, False
        if system_structured(payload):
            return None, True
        route = structured(payload)
        if route:
            return route, False
        if payload.get('event') == 'sttResult' and payload.get('sttResult') and not any(payload.get('sttSymbol') or []):
            return control_or_search(payload['sttResult'][0]), False
    if message.get('type') == 'call' and message.get('destination') == NLP and message.get('method') == 'startSearch':
        return control_or_search(payload.get('query', '')), False
    return None, False


def log(message):
    try:
        if os.path.exists(LOG) and os.path.getsize(LOG) > 32768:
            os.rename(LOG, LOG + '.previous')
        with open(LOG, 'a') as stream:
            stream.write('[%s] %s\n' % (time.strftime('%Y-%m-%d %H:%M:%S'), message))
    except IOError:
        pass


def close_voice_ui():
    # Match VoiceAgent's normal BACK path. Direct sysuicompmgr/close leaves
    # its NLP search session running on this firmware and blocks later presses.
    calls = [
        ('com.webos.applicationManager/closeByAppId', {'id': 'com.webos.app.voiceview'}),
        ('com.webos.service.nlp/cancel', {}),
        ('com.webos.service.sysuicompmgr/launch', {
            'appId': 'com.webos.app.voiceagent',
            'main': 'file://usr/palm/applications/com.webos.app.voiceagent/Main.qml',
            'params': {'activateType': 'keyhandler', 'launchMode': 'BACK', 'pressed': True}
        })
    ]
    for endpoint, params in calls:
        proc = subprocess.Popen(['/usr/bin/luna-send', '-w', '3000', '-n', '1', 'luna://' + endpoint, json.dumps(params)], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        try:
            response = json.loads(proc.stdout.read())
            proc.wait()
            log('session_finish step=%s accepted=%s' % (endpoint, response.get('returnValue') is True))
        finally:
            if proc.poll() is None:
                proc.terminate()
            proc.stdin.close()



def luna_result(endpoint, params):
    proc = subprocess.Popen(['/usr/bin/luna-send', '-w', '3000', '-n', '1', 'luna://' + endpoint, json.dumps(params)], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        result = json.loads(proc.stdout.read())
        proc.wait()
        return result
    finally:
        if proc.poll() is None:
            proc.terminate()
        proc.stdin.close()


def search_running_page(keyword):
    # The TV app uses hash routes; change only its search route, preserving the
    # document, player code and app instance. DevTools is loopback-only here.
    pages = json.loads(urlopen('http://127.0.0.1:9998/json', timeout=3).read())
    pages = [p for p in pages if p.get('url', '').startswith('https://www.youtube.com/tv')]
    if len(pages) != 1:
        raise RuntimeError('YouTube page unavailable or ambiguous')
    expression = "(function(){var h='/search?mode=search&q='+encodeURIComponent(%s);if(location.hash.slice(1)!==h){location.hash=h;}else{window.dispatchEvent(new HashChangeEvent('hashchange'));}return true;}())" % json.dumps(keyword)
    request = json.dumps({'id': 1, 'method': 'Runtime.evaluate', 'params': {'expression': expression, 'returnByValue': True}}).encode('utf-8')
    sock = socket.create_connection(('127.0.0.1', 9998), 3)
    sock.settimeout(4)
    def receive(count):
        data = b''
        while len(data) < count:
            part = sock.recv(count - len(data))
            if not part:
                raise IOError('DevTools disconnected')
            data += part
        return data
    try:
        key = base64.b64encode(os.urandom(16)).decode('ascii')
        sock.sendall(('GET /devtools/page/%s HTTP/1.1\r\nHost: 127.0.0.1:9998\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n\r\n' % (pages[0]['id'], key)).encode('ascii'))
        header = b''
        while not header.endswith(b'\r\n\r\n'):
            header += receive(1)
            if len(header) > 8192:
                raise IOError('Invalid DevTools upgrade')
        if b' 101 ' not in header.split(b'\r\n')[0]:
            raise IOError('DevTools upgrade rejected')
        mask = os.urandom(4)
        size = len(request)
        prefix = struct.pack('!BB', 129, 128 | size) if size < 126 else struct.pack('!BBH', 129, 254, size)
        masked = bytearray(request)
        mask_bytes = bytearray(mask)
        for i in range(size):
            masked[i] ^= mask_bytes[i % 4]
        sock.sendall(prefix + mask + bytes(masked))
        deadline = time.time() + 5
        while time.time() < deadline:
            first, second = struct.unpack('!BB', receive(2))
            size = second & 127
            if size == 126:
                size = struct.unpack('!H', receive(2))[0]
            elif size == 127:
                size = struct.unpack('!Q', receive(8))[0]
            if size > 1048576 or second & 128:
                raise IOError('Unsupported DevTools frame')
            payload = receive(size)
            if first & 15 == 8:
                raise IOError('DevTools closed')
            if first & 15 != 1:
                continue
            result = json.loads(payload)
            if result.get('id') == 1:
                evaluated = result.get('result', {})
                if result.get('error') or evaluated.get('wasThrown') or evaluated.get('exceptionDetails') or evaluated.get('result', {}).get('value') is not True:
                    raise RuntimeError('In-app search rejected')
                return
        raise IOError('DevTools response timeout')
    finally:
        sock.close()


def launch(route):
    if route.get('kind') == 'control':
        close_voice_ui()
        response = CONTROL.execute(route['command'], luna_result)
        log('control action=%s accepted=%s' % (route['command']['action'], response.get('returnValue') is True))
        return
    close_voice_ui()
    keyword = route['keyword']
    foreground = luna_result('com.webos.applicationManager/getForegroundAppInfo', {})
    if foreground.get('appId') == APP and keyword:
        search_running_page(keyword)
        log('route in_app=true keyword_length=%d accepted=true' % len(keyword))
        return
    params = {'id': APP, 'params': {'target': 'q=' + quote(keyword.encode('utf-8'), safe='')}} if keyword else {'id': APP}
    if keyword and route['source'].startswith('structured') and route.get('intent') in ('SearchContent', 'PlayContent'):
        params['params']['target'] = {'intent': route['intent'], 'intentParam': keyword, 'languageCode': 'vi-VN'}
    # Application Manager reuses this app ID; its upstream webOSRelaunch handler
    # consumes target on an already-running YouTube page too.
    proc = subprocess.Popen(['/usr/bin/luna-send', '-w', '10000', '-n', '1', 'luna://com.webos.applicationManager/launch', json.dumps(params)], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        response = json.loads(proc.stdout.read())
        proc.wait()
        log('route source=%s keyword_length=%d target=%s accepted=%s' % (route['source'], len(keyword), APP, response.get('returnValue') is True))
    finally:
        if proc.poll() is None:
            proc.terminate()
        proc.stdin.close()


def stop(signum, frame):
    global running
    running = False


def main():
    if not os.path.isdir(STATE):
        os.makedirs(STATE, 0o700)
    failures = 0
    while running and not os.path.exists(MARKER):
        master, slave = os.openpty()
        monitor = subprocess.Popen(['/usr/sbin/ls-monitor', '-j', '-f', NLP], stdin=open('/dev/null', 'r'), stdout=slave, stderr=slave, close_fds=True)
        os.close(slave)
        pending, deadline, buffer = None, 0, b''
        trace_events = []
        last_key, last_at = None, 0
        began = time.time()
        log('monitor started pid=%d; passive recognized-results only' % monitor.pid)
        try:
            while running and not os.path.exists(MARKER) and monitor.poll() is None:
                try:
                    ready = select.select([master], [], [], 0.2)[0]
                except select.error as error:
                    if error.args[0] == errno.EINTR:
                        continue
                    raise
                if ready:
                    try:
                        chunk = os.read(master, 65536)
                    except OSError as error:
                        if error.errno == errno.EIO:
                            break
                        raise
                    if not chunk:
                        break
                    buffer += chunk
                    if len(buffer) > 1048576:
                        buffer = b''
                    while b'\n' in buffer:
                        line, buffer = buffer.split(b'\n', 1)
                        try:
                            message = json.loads(line.decode('utf-8', 'replace').strip())
                        except ValueError:
                            continue
                        if os.path.exists(TRACE) and message.get('transport') == 'TX' and (message.get('sender') == NLP or message.get('destination') == NLP):
                            observed = message.get('payload') or {}
                            if isinstance(observed, dict) and observed.get('event') not in ('energyLevel', 'micEnergyLevel'):
                                log('trace event=%s keys=%s' % (observed.get('event', 'status'), ','.join(sorted(observed.keys()))))
                                if observed.get('event') in ('sttResult', 'nlpResult', 'searchResult', 'sessionEnd', 'error') or message.get('method') in ('startSearch', 'startNlpText'):
                                    trace_events.append(message)
                                    trace_events = trace_events[-16:]
                                    with open(STATE + '/last-events.json', 'w') as capture:
                                        capture.write(json.dumps(trace_events))
                        # A newer microphone session supersedes an older query;
                        # never cancel it when an earlier route timer expires.
                        if message.get('sender') == NLP and message.get('transport') == 'TX' and (message.get('payload') or {}).get('event') in ('sttStart', 'micStart'):
                            pending = None
                            last_key = None
                        route, system = inspect_message(message)
                        if system:
                            pending = None
                        elif route:
                            # Let the LG session finish and structured intents
                            # override the conservative STT fallback.
                            if not pending or route['source'].startswith('structured') or not pending['source'].startswith('structured'):
                                pending, deadline = route, time.time() + 0.35
                if pending and time.time() >= deadline:
                    key = pending['keyword']
                    if key != last_key or time.time() - last_at > 3:
                        try:
                            launch(pending)
                            last_key, last_at = key, time.time()
                        except Exception as error:
                            log('launch failed type=' + type(error).__name__)
                    pending = None
        finally:
            if monitor.poll() is None:
                monitor.terminate()
            monitor.wait()
            os.close(master)
        if not running or os.path.exists(MARKER):
            break
        failures = failures + 1 if time.time() - began < 15 else 1
        log('monitor exited; retry=%d' % failures)
        if failures >= 5:
            break
        for unused in range(25):
            if not running or os.path.exists(MARKER):
                break
            time.sleep(0.2)
    log('router stopped; LG voice remains enabled')


if __name__ == '__main__':
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    main()
