#!/bin/sh
# Reversible recovery. Leaves installed apps and all firmware files intact.
set -eu
touch /home/root/DISABLE-GATHIN-HOME
if [ -f /tmp/gathin-home-keyhook.pid ]; then
    p=$(cat /tmp/gathin-home-keyhook.pid)
    case "$p" in ''|*[!0-9]*) echo 'Invalid PID file' >&2; exit 1;; esac
    if [ -r "/proc/$p/cmdline" ] && tr '\000' ' ' < "/proc/$p/cmdline" | grep -F '/home/root/gathin-home-keyhook.py' >/dev/null; then
        kill -TERM "$p"
    fi
fi
echo 'Gathin HOME interception disabled; LG receives the physical remote again.'
