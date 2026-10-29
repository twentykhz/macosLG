#!/usr/bin/python
"""Route primary Magic Remote through LG's existing secondary input channel.

Consume HOME before the compositor. Forward all other events unchanged.
Closing the process releases EVIOCGRAB, restoring the physical remote.
"""
from __future__ import print_function
import json
import errno
import fcntl
import glob
import os
import re
import select
import signal
import struct
import subprocess
import sys
import time

HOME = 773
BACK = 412
MARKER = '/home/root/DISABLE-GATHIN-HOME'
LOG = '/tmp/gathin-home-input-relay.log'
READY = '/tmp/gathin-home-keyhook.ready'
FMT = 'llHHi'
SIZE = struct.calcsize(FMT)
running = True


def log(message):
    with open(LOG, 'a') as stream:
        stream.write('[%s] %s\n' % (time.strftime('%Y-%m-%d %H:%M:%S'), message))


def stop(signum, frame):
    global running
    running = False


def read_ioctl(fd, number, count):
    return fcntl.ioctl(fd, (2 << 30) | (count << 16) | (ord('E') << 8) | number, b'\0' * count)


def device(name):
    for block in open('/proc/bus/input/devices').read().split('\n\n'):
        if 'Name="' + name + '"' in block:
            match = re.search(r'Handlers=.*?\bevent([0-9]+)\b', block)
            if match:
                return '/dev/input/event' + match.group(1)
    raise RuntimeError('device missing: ' + name)


def compositor_has_device(path):
    for proc in glob.glob('/proc/[0-9]*'):
        try:
            command = open(proc + '/cmdline', 'rb').read().split(b'\0')[0]
            if os.path.basename(command) not in (b'surface-manager-starfish', b'surface-manager'):
                continue
            for entry in glob.glob(proc + '/fd/*'):
                try:
                    if os.readlink(entry) == path:
                        return True
                except OSError:
                    pass
        except IOError:
            pass
    return False


def write_event(fd, data):
    count = os.write(fd, data)
    if count != len(data):
        raise RuntimeError('incomplete input event write')



def main():
    source = target = None
    grabbed = False
    forwarded_down = set()
    children = []
    probe = '--probe' in sys.argv
    seconds = float(sys.argv[sys.argv.index('--seconds') + 1]) if '--seconds' in sys.argv else None
    try:
        if os.path.exists(MARKER) and not probe:
            raise RuntimeError('failsafe marker present')
        source_path = device('LGE M-RCU - Builtin [0]')
        target_path = device('LGE M-RCU - Builtin [1]')
        if source_path == target_path:
            raise RuntimeError('source and target must differ')
        source = os.open(source_path, os.O_RDONLY | os.O_NONBLOCK)
        target = os.open(target_path, os.O_RDWR | os.O_NONBLOCK)
        # Verify LG is already listening and all source capabilities match.
        if not compositor_has_device(target_path):
            raise RuntimeError('compositor is not listening to target')
        for number, count in [(0x20, 8), (0x21, 256), (0x22, 8), (0x23, 8), (9, 8)]:
            if read_ioctl(source, number, count) != read_ioctl(target, number, count):
                raise RuntimeError('input capability mismatch at %d' % number)
        for axis in (0, 1):
            if read_ioctl(source, 0x40 + axis, 24)[4:] != read_ioctl(target, 0x40 + axis, 24)[4:]:
                raise RuntimeError('absolute axis range mismatch')
        wait_until = time.time() + 10
        while any(bytearray(read_ioctl(source, 0x18, 256))) or any(bytearray(read_ioctl(target, 0x18, 256))):
            if not running or (os.path.exists(MARKER) and not probe) or time.time() >= wait_until:
                raise RuntimeError('physical key still held; refusing takeover')
            time.sleep(0.1)
        # Ignore input accumulated during preflight; it already reached LG.
        while True:
            try:
                if not os.read(source, SIZE * 64):
                    raise RuntimeError('source closed during preflight')
            except OSError as error:
                if error.errno == errno.EAGAIN:
                    break
                raise
        # A harmless SYN_REPORT checks the existing evdev injection channel.
        write_event(target, struct.pack(FMT, 0, 0, 0, 0, 0))
        log('preflight passed source=%s target=%s compositor-listening=true' % (source_path, target_path))
        if probe:
            return
        fcntl.ioctl(source, 0x40044590, 1)
        grabbed = True
        with open(READY, 'w') as stream:
            stream.write(str(os.getpid()))
        log('ACTIVE HOME blocked before LG; seconds=%s' % seconds)
        deadline = time.time() + seconds if seconds else None
        home_down = False
        pointer_events = 0
        while running and not os.path.exists(MARKER) and (deadline is None or time.time() < deadline):
            children = [child for child in children if child.poll() is None]
            try:
                ready, unused_w, unused_x = select.select([source], [], [], 0.25)
            except select.error as error:
                if error.args[0] == errno.EINTR:
                    continue
                raise
            if not ready:
                continue
            data = os.read(source, SIZE * 64)
            if not data or len(data) % SIZE:
                raise RuntimeError('source stream closed or incomplete')
            for offset in range(0, len(data), SIZE):
                raw = data[offset:offset + SIZE]
                sec, usec, typ, code, value = struct.unpack(FMT, raw)
                if typ == 0 and code == 3:
                    raise RuntimeError('SYN_DROPPED; releasing remote')
                if typ == 1 and code == HOME:
                    if value == 1 and not home_down:
                        home_down = True
                        with open('/dev/null', 'r') as null, open(LOG, 'a') as output:
                            child = subprocess.Popen(['/usr/bin/luna-send', '-n', '1', 'luna://com.webos.applicationManager/launch', '{"id":"com.gathin.tvhome"}'], stdin=null, stdout=output, stderr=output, close_fds=True)
                        children.append(child)
                        log('HOME consumed; MAC-WebOSTV launch pid=%d' % child.pid)
                    elif value == 0:
                        home_down = False
                    continue
                if typ == 1:
                    if value == 1:
                        forwarded_down.add(code)
                    elif value == 0:
                        forwarded_down.discard(code)
                elif typ in (2, 3):
                    pointer_events += 1
                    if pointer_events == 1:
                        log('pointer forwarding started')
                write_event(target, raw)
        log('loop ended; pointer events forwarded=%d' % pointer_events)
    finally:
        if target is not None:
            for code in forwarded_down:
                try:
                    write_event(target, struct.pack(FMT, 0, 0, 1, code, 0))
                except OSError:
                    pass
            try:
                write_event(target, struct.pack(FMT, 0, 0, 0, 0, 0))
            except OSError:
                pass
            os.close(target)
        if source is not None:
            if grabbed:
                try:
                    fcntl.ioctl(source, 0x40044590, 0)
                except OSError:
                    pass
            os.close(source)
        if grabbed:
            try:
                if open(READY).read().strip() == str(os.getpid()):
                    os.unlink(READY)
            except IOError:
                pass
        log('STOPPED physical remote released')


signal.signal(signal.SIGTERM, stop)
signal.signal(signal.SIGINT, stop)
try:
    main()
except Exception as error:
    log('ERROR: ' + str(error))
    raise
