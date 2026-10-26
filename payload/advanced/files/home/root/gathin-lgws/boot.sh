#!/bin/sh
PATH=/usr/sbin:/usr/bin:/sbin:/bin
export PATH
base=/home/root/gathin-lgws
log=/var/lib/webosbrew/gathin-lgws-boot.log
[ -f /home/root/DISABLE-GATHIN-LGWS ] && exit 0
if [ "${1:-}" != worker ]; then
    "$0" worker >> "$log" 2>&1 < /dev/null &
    exit 0
fi
[ -f /tmp/gathin-lgws-applied ] && exit 0
mkdir /tmp/gathin-lgws-worker.lock 2>/dev/null || exit 0
trap 'rmdir /tmp/gathin-lgws-worker.lock 2>/dev/null || true' EXIT
[ ! -f "$log" ] || [ "$(wc -c < "$log")" -lt 65536 ] || : > "$log"
echo "LGWS apply $(date)"
if ! /media/developer/apps/usr/palm/applications/ooo.lew.lifesgoodwithoutspying/init/nospy-apply.sh; then
    echo 'LGWS failed; success notification suppressed'
    exit 1
fi
# Wait for the app's own clock-sync/SDP grace period; announce after it completes.
count=0
while [ -f /var/lib/webosbrew/lifesgoodwithoutspying.hosts-pending ] && [ "$count" -lt 75 ]; do
    sleep 1
    count=$((count + 1))
done
[ ! -f /var/lib/webosbrew/lifesgoodwithoutspying.hosts-pending ] || exit 1
touch /tmp/gathin-lgws-applied
/usr/bin/python "$base/notify.py"
echo "LGWS enabled $(date)"
