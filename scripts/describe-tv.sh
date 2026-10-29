#!/bin/sh
# Read-only metadata, serialized as records; host Node creates JSON.
set -eu
describe_root() {
 p=$1
 if [ -e "$p" ] || [ -L "$p" ]; then printf 'present\t%s\n' "$p"; fi
 parent=${p%/*}; suffix=''
 while [ ! -e "$parent" ]; do suffix="/${parent##*/}$suffix"; parent=${parent%/*}; [ -n "$parent" ] || parent=/; done
 resolved=$(readlink -f "$parent")
 resolved=$resolved$suffix
 case "$resolved" in //*) resolved=${resolved#/};; esac
 printf 'parent\t%s\t%s\n' "$p" "$resolved"
 case "$p" in /media/developer/*) base=/media/developer/temp;; /home/root/*) base=/home/root;; *) base=/var/lib;; esac
 while [ ! -e "$base" ]; do base=${base%/*}; [ -n "$base" ] || base=/; done
 [ "$(stat -c %d "$parent")" = "$(stat -c %d "$base")" ] || { printf 'Recovery staging filesystem unavailable: %s\n' "$p" >&2; exit 1; }
}
for p do describe_root "$p"; done
for file in /proc/[0-9]*/cmdline; do
 [ -r "$file" ] || continue
 first=$(tr '\000' '\n' < "$file" 2>/dev/null | sed -n '1p')
 if [ "$first" = /var/lib/webosbrew/gathin-controls/input-helper ]; then second=$(tr '\000' '\n' < "$file" 2>/dev/null | sed -n '2p'); if [ "$second" = --home ]; then printf 'active\t%s\n' "$first"; fi; continue; fi
 script=$(tr '\000' '\n' < "$file" 2>/dev/null | sed -n '2p')
 case "$script" in
 /var/lib/webosbrew/gathin-youtube-voice/voice.js|/home/root/gathin-home-replacement/observe-home.py|/home/root/gathin-home-keyhook.py|/home/root/gathin-youtube-voice-router.py|/var/lib/webosbrew/gathin-controls/bridge.py|/var/lib/webosbrew/gathin-controls/bridge.js|/var/lib/webosbrew/gathin-hdmi/track.py|/var/lib/webosbrew/gathin-hdmi/track.js|/var/lib/webosbrew/gathin-wallpaper/wallpaper-service.js|/var/lib/webosbrew/gathin-remote/server.js) printf 'active\t%s\n' "$script";;
 esac
done
printf 'end\tGATHIN_SNAPSHOT_V1\n'
