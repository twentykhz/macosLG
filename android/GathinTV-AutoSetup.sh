#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

usage() {
  cat <<'HELP'
GathinTV AutoSetup 3.4.2 - Android / Termux / Linux / macOS (Node >=20)
Usage: ./GathinTV-AutoSetup.sh --mode MODE --host TV_IP [options]
       ./GathinTV-AutoSetup.sh Doctor TV_IP [options]
Modes: Setup Restore Doctor Backup Apps Sync Disable Rollback
Options:
  --already-rooted --dry-run --trust-new-host --no-reboot --remove-extra-apps
  --key PATH --developer-key PATH --backup-file PATH --output-dir PATH
  --session PATH --yes  (Rollback: snapshot file/folder; --yes confirms without prompt)
  --expected-model MODEL --expected-firmware 00.00.00 --language en|vi
State: GATHIN_STATE_DIRECTORY, default ~/.gathintv/state (private).
Unknown hosts are rejected unless --trust-new-host is explicitly supplied.
--remove-extra-apps retains the core's existing snapshot safety restriction.
HELP
}
die() { printf '%s\n' "$*" >&2; exit 2; }
termux=false
if [[ ${PREFIX:-} == *com.termux* || -n ${TERMUX_VERSION:-} ]]; then termux=true; fi
prerequisites() {
  if $termux; then
    printf '%s\n' 'Termux prerequisites: pkg update; pkg install nodejs git curl' 'Optional shared downloads: termux-setup-storage' 'OpenSSH is optional; core uses the Node ssh2 package.' >&2
  else
    printf '%s\n' 'Install Bash and Node.js >=20 using your system package manager or nodejs.org. Git is only needed to clone source; curl is only needed for the one-line bootstrap.' >&2
  fi
}
mode='' host='' output='' model='' firmware='' root_key='' already=false dry=false interactive_menu=false
pass=()
while (($#)); do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --mode|--host|--key|--developer-key|--backup-file|--session|--output-dir|--expected-model|--expected-firmware|--language)
      (($# >= 2)) && [[ -n $2 && $2 != --* ]] || die "Missing value: $1"
      case "$1" in
        --mode) [[ -z $mode ]] || die 'Mode specified twice'; mode=$2 ;;
        --host) [[ -z $host ]] || die 'Host specified twice'; host=$2 ;;
        --output-dir) output=$2 ;;
        --key) root_key=$2; pass+=("$1" "$2") ;;
        --expected-model) model=$2 ;;
        --expected-firmware) firmware=$2 ;;
        --language) [[ $2 == en || $2 == vi ]] || die 'Language must be en or vi'; export GATHIN_LANGUAGE=$2 ;;
        *) pass+=("$1" "$2") ;;
      esac
      shift 2 ;;
    --already-rooted) already=true; pass+=("$1"); shift ;;
    --dry-run) dry=true; pass+=("$1"); shift ;;
    --trust-new-host|--no-reboot|--remove-extra-apps|--yes) pass+=("$1"); shift ;;
    --*) die "Unknown argument: $1" ;;
    *) if [[ -z $mode ]]; then mode=$1; elif [[ -z $host ]]; then host=$1; else die "Unexpected argument: $1"; fi; shift ;;
  esac
done
if ! command -v node >/dev/null 2>&1; then prerequisites; die 'Missing Node.js. Termux: pkg install nodejs'; fi
script_dir=$(cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
if [[ ! -f "$script_dir/scripts/run.js" ]]; then
  script_dir=$(cd -P -- "$script_dir/.." && pwd)
fi
source "$script_dir/scripts/shell-prompts.sh"
if [[ -z $mode ]]; then
  [[ -t 0 ]] || { usage >&2; die 'Non-interactive use requires --mode and --host'; }
  interactive_menu=true
  shell_language
  shell_menu
  [[ $mode != Exit ]] || exit 0
fi
case "$mode" in
  Setup|setup) mode=Setup;;Restore|restore) mode=Restore;;Doctor|doctor) mode=Doctor;;Backup|backup) mode=Backup;;Apps|apps) mode=Apps;;Sync|sync) mode=Sync;;Disable|disable) mode=Disable;;Rollback|rollback) mode=Rollback;;*) die "Unknown mode: $mode";;
esac
if [[ -z $host && -t 0 ]]; then shell_read host "$(shell_text 'TV IP: ' 'Dia chi IP cua TV: ')"; fi
[[ ${#host} -le 253 && $host =~ ^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$ ]] || die 'Missing/invalid --host: enter only TV IP or hostname, without scheme, port or spaces'
if ! command -v node >/dev/null 2>&1; then prerequisites; die 'Missing Node.js. Termux: pkg install nodejs'; fi
version=$(node --version) || die 'Cannot run node --version'
[[ $version =~ ^v([0-9]+)\. ]] || die "Invalid Node version: $version"
((10#${BASH_REMATCH[1]} >= 20)) || { prerequisites; die 'Node.js >=20 is required'; }
if ! node -e 'require(process.argv[1]+"/node_modules/ssh2");require(process.argv[1]+"/node_modules/ws")' "$script_dir" >/dev/null 2>&1; then
  die "Missing JS dependencies. In $script_dir run: npm ci --omit=dev --omit=optional --ignore-scripts"
fi
export GATHIN_STATE_DIRECTORY
GATHIN_STATE_DIRECTORY=$(node "$script_dir/scripts/host-paths.js" state)
mkdir -p -- "$GATHIN_STATE_DIRECTORY/logs" "$GATHIN_STATE_DIRECTORY/sessions"
session_id=$(node -p 'require("node:crypto").randomUUID()')
export GATHIN_SESSION_LOG="$GATHIN_STATE_DIRECTORY/logs/setup-$session_id.runtime.log"
export GATHIN_RECOVERY_SESSION="$GATHIN_STATE_DIRECTORY/sessions/$session_id.json"
printf 'State: %s\nLog: %s\n' "$GATHIN_STATE_DIRECTORY" "$GATHIN_SESSION_LOG"
if $interactive_menu && [[ $mode != Rollback ]]; then
  shell_read answer "$(shell_text "Check TV IP $host. Trust this TV's new SSH host key? (YES/CO, otherwise keep existing pins): " "Kiem tra IP TV $host. Tin khoa SSH moi cua TV nay? (YES/CO; khac de giu khoa cu): ")"
  case "$answer" in [Yy][Ee][Ss]|[Cc][Oo]) pass+=(--trust-new-host);;esac
fi
node "$script_dir/scripts/verify.js"
if [[ $mode == Setup ]] && ! $already; then
  if ! shell_valid_model "$model" && [[ -t 0 ]]; then shell_model; fi
  if ! shell_valid_firmware "$firmware" && [[ -t 0 ]]; then shell_firmware; fi
  shell_valid_model "$model" && shell_valid_firmware "$firmware" || die 'Fresh Setup requires the full LG TV model (e.g. OLED65C2PSA, not the Developer Mode passphrase) and firmware 00.00.00 (--expected-model / --expected-firmware)'
  node "$script_dir/scripts/check-root.js" --model "$model" --firmware "$firmware" --language "${GATHIN_LANGUAGE:-en}"
  pass+=(--expected-model "$model" --expected-firmware "$firmware")
fi
if [[ $mode == Backup ]] && ! $dry; then
  output=$(node "$script_dir/scripts/host-paths.js" backup "$output")
  printf 'Backup destination: %s\n' "$output"
fi
# Quoted array expansion with an empty-array guard for macOS Bash + nounset.
args=("$script_dir/scripts/run.js" "$mode" --host "$host" ${pass[@]+"${pass[@]}"})
if [[ -n $output ]]; then args+=(--output-dir "$output"); fi
status=0
node "${args[@]}" || status=$?
if ((status != 0)) && [[ $mode == Setup || $mode == Restore ]] && ! $dry; then
  recovery=("$script_dir/scripts/recover-session.js" --session "$GATHIN_RECOVERY_SESSION" --host "$host")
  if [[ -n $root_key ]]; then recovery+=(--key "$root_key"); fi
  if [[ -t 0 && -f $GATHIN_RECOVERY_SESSION ]] && node "${recovery[@]}" --check; then
    read -r -p 'Restore the initial TV snapshot from this run? / Khoi phuc backup dau phien? (YES/CO): ' answer
    case "$answer" in
      [Yy][Ee][Ss]|[Cc][Oo]) node "${recovery[@]}" || printf '%s\n' 'Recovery failed; keep the backup and log.' >&2 ;;
    esac
  elif [[ -f $GATHIN_RECOVERY_SESSION ]]; then
    printf 'No interactive recovery performed. Session: %s\nUse node scripts/recover-session.js --session SESSION --host TV_IP to check/recover this session.\n' "$GATHIN_RECOVERY_SESSION" >&2
  fi
fi
exit "$status"
