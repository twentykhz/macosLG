#!/bin/sh
set -u
TARGET=/usr/lib/qt5/qml/KeyFilters/systemUi.js
MARKER=/home/root/DISABLE-GATHIN-HOME
LOG=/tmp/gathin-home.log
log() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >> "$LOG"; }
if grep -F " $TARGET " /proc/self/mountinfo >/dev/null 2>&1; then
    umount "$TARGET" || { log 'ERROR: could not unmount old SystemUI patch'; exit 1; }
    log 'old SystemUI Home patch unmounted'
fi
if [ -e "$MARKER" ]; then log 'failsafe active; boot launcher skipped'; exit 0; fi
n=0
while [ "$n" -lt 15 ]; do
    boot="$(luna-send -f -n 1 luna://com.webos.bootManager/getBootStatus '{}' 2>/dev/null)"
    echo "$boot" | grep -q '"core-boot-done"[[:space:]]*:[[:space:]]*true' && break
    sleep 1
    n=$((n+1))
done
attempt=1
while [ "$attempt" -le 3 ]; do
    fg="$(luna-send -f -n 1 luna://com.webos.applicationManager/getForegroundAppInfo '{}' 2>/dev/null)"
    if echo "$fg" | grep -q '"appId"[[:space:]]*:[[:space:]]*"com.gathin.tvhome"'; then
        log 'launcher already foreground; boot launch skipped'; exit 0
    fi
    /home/root/gathin-home-launch.sh
    sleep 2
    fg="$(luna-send -f -n 1 luna://com.webos.applicationManager/getForegroundAppInfo '{}' 2>/dev/null)"
    if echo "$fg" | grep -q '"appId"[[:space:]]*:[[:space:]]*"com.gathin.tvhome"'; then
        log 'boot launcher foreground confirmed'; exit 0
    fi
    attempt=$((attempt+1))
done
log 'boot launcher not confirmed after three attempts'
exit 1
