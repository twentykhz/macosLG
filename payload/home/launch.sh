#!/bin/sh
APP=com.gathin.tvhome
LOG=/tmp/gathin-home.log
fg="$(luna-send -f -n 1 luna://com.webos.applicationManager/getForegroundAppInfo '{}' 2>/dev/null)"
if echo "$fg" | grep -q '"appId"[[:space:]]*:[[:space:]]*"com.gathin.tvhome"'; then
    exit 0
fi
res="$(luna-send -f -n 1 luna://com.webos.applicationManager/launch "{\"id\":\"$APP\"}" 2>&1)"
if echo "$res" | grep -q '"returnValue"[[:space:]]*:[[:space:]]*true'; then
    printf '[%s] launcher launch accepted\n' "$(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG"
    exit 0
fi
printf '[%s] launcher launch failed: %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$res" >> "$LOG"
exit 1