#!/usr/bin/env bash
# Shared interactive prompts; also exercised without contacting a TV.
shell_text() {
  if [[ ${GATHIN_LANGUAGE:-en} == vi ]]; then printf '%s' "$2"; else printf '%s' "$1"; fi
}
shell_read() {
  read -r -p "$2" "$1" || { printf '\n%s\n' 'Input closed / Da dong nhap lieu.' >&2; return 2; }
}
shell_language() {
  case ${GATHIN_LANGUAGE:-} in en|vi) return;; esac
  printf '%s\n' '[1] English' '[2] Tieng Viet'
  local selection
  while true; do
    shell_read selection 'Language / Ngon ngu (1/2): ' || return
    case "$selection" in 1|en|EN) export GATHIN_LANGUAGE=en;return;;2|vi|VI) export GATHIN_LANGUAGE=vi;return;;esac
    printf '%s\n' 'Enter 1 or 2 / Nhap so 1 hoac 2.' >&2
  done
}
shell_menu() {
  printf '%s\n' '==================================' '        GathinTV AutoSetup' '          Android / Linux' '=================================='
  shell_text $'[1] Set up a TV that is NOT rooted\n[2] Install / update on an ALREADY ROOTED TV\n[3] Doctor - check TV\n[4] Backup\n[5] Apps\n[6] Sync\n[7] Disable\n[8] Rollback\n[0] Exit\n' $'[1] Cai dat TV CHUA ROOT\n[2] Cai / cap nhat TV DA ROOT\n[3] Kiem tra TV (Doctor)\n[4] Sao luu (Backup)\n[5] Ung dung (Apps)\n[6] Dong bo (Sync)\n[7] Tat dich vu (Disable)\n[8] Khoi phuc backup (Rollback)\n[0] Thoat\n'
  local selection
  while true; do
    shell_read selection "$(shell_text 'Enter a number (0-8): ' 'Nhap so (0-8), vi du 1 cho TV chua root: ')" || return
    case "$selection" in
      1|Setup|setup|'TV chua root'|'tv chua root'|'TV chưa root'|'tv chưa root') mode=Setup;return;;
      2|Restore|restore|'TV da root'|'tv da root'|'TV đã root'|'tv đã root') mode=Restore;return;;
      3) mode=Doctor;return;;4) mode=Backup;return;;5) mode=Apps;return;;6) mode=Sync;return;;7) mode=Disable;return;;8) mode=Rollback;return;;0) mode=Exit;return;;
    esac
    printf '%s\n' "$(shell_text 'Invalid choice. Enter a number from 0 to 8; try again.' 'Lua chon chua dung. Nhap so tu 0 den 8; thu lai.')" >&2
  done
}
shell_valid_model() {
  [[ $1 =~ ^([Oo][Ll][Ee][Dd])?[0-9]{2,3}[a-zA-Z][a-zA-Z0-9]{3,}([.-][a-zA-Z0-9]+)*$ ]]
}
shell_valid_firmware() {
  [[ $1 =~ ^[0-9]{1,2}\.[0-9]{2}\.[0-9]{2}$ ]]
}
shell_model() {
  printf '%s\n' "$(shell_text 'On the TV open Settings > Support > TV Information (or About This TV).' 'Tren TV: Cai dat > Ho tro > Thong tin TV (hoac Gioi thieu ve TV).')"
  printf '%s\n' "$(shell_text 'Enter the full LG model, e.g. OLED65C2PSA or 55SK8000PTA. Do NOT enter the 6-character Developer Mode passphrase or serial number.' 'Nhap model LG day du, vi du OLED65C2PSA hoac 55SK8000PTA. KHONG nhap passphrase Developer Mode 6 ky tu hay so serial.')"
  while true; do
    shell_read model "$(shell_text 'Full TV model: ' 'Model TV day du: ')" || return
    shell_valid_model "$model" && return
    printf '%s\n' "$(shell_text 'That is not a full LG TV model. Check TV Information and try again.' 'Day khong phai model TV LG day du. Kiem tra Thong tin TV va nhap lai.')" >&2
  done
}
shell_firmware() {
  printf '%s\n' "$(shell_text 'Enter Software Version from TV Information, e.g. 05.50.70. This is NOT the webOS version (4.4.0) or the Developer Mode passphrase.' 'Nhap Phien ban phan mem trong Thong tin TV, vi du 05.50.70. KHONG nhap phien ban webOS (4.4.0) hay passphrase Developer Mode.')"
  while true; do
    shell_read firmware "$(shell_text 'Installed firmware (00.00.00): ' 'Firmware hien tai (00.00.00): ')" || return
    shell_valid_firmware "$firmware" && return
    printf '%s\n' "$(shell_text 'Use the software version format 00.00.00; check the TV and try again.' 'Nhap dung phien ban phan mem dang 00.00.00; xem tren TV va nhap lai.')" >&2
  done
}
