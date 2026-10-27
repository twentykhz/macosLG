#!/bin/sh
# Portable launch only. No unmounts, key-filter patches or firmware-specific changes.
[ -e /home/root/DISABLE-GATHIN-HOME ] && exit 0
attempt=0
while [ "$attempt" -lt 15 ]; do
    status="$(/usr/bin/luna-send -w 2000 -n 1 luna://com.webos.bootManager/getBootStatus '{}' 2>/dev/null)"
    echo "$status" | grep -q '"core-boot-done"[[:space:]]*:[[:space:]]*true' && break
    sleep 1
    attempt=$((attempt+1))
done
/home/root/gathin-home-launch.sh
