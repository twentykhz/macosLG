#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
if ! command -v node >/dev/null 2>&1; then
  printf '%s\n' 'Node.js >=20 is required.' 'Termux: pkg update; pkg install nodejs git curl' 'Shared downloads (optional): termux-setup-storage' 'Linux/macOS: install Node.js >=20 using your system package manager or nodejs.org.' >&2
  exit 2
fi
version=$(node --version)
[[ $version =~ ^v([0-9]+)\. ]] && ((10#${BASH_REMATCH[1]} >= 20)) || { printf '%s\n' 'Node.js >=20 is required. Termux: pkg install nodejs' >&2; exit 2; }
install_dir=$(node <<'GATHIN_BOOTSTRAP_NODE'
__BOOTSTRAP_JS__
GATHIN_BOOTSTRAP_NODE
)
if ( : </dev/tty ) 2>/dev/null; then
  exec bash "$install_dir/GathinTV-AutoSetup.sh" "$@" </dev/tty
else
  exec bash "$install_dir/GathinTV-AutoSetup.sh" "$@"
fi
