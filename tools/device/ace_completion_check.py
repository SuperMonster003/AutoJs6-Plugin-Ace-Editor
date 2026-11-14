"""Device check of the AutoJs6 completion in the host editor (Ace engine) with screenshots.

Usage:
  py -3.12 -I tools/device/ace_completion_check.py SERIAL --apk APP.apk --out DIR [--case NAME ...]

Each case writes a probe script into the host's private files, opens it in the host editor through
EditIntentActivity with the Ace engine, places the cursor at the end, types the trigger text with
`input text` and saves a screenshot as DIR/<case>.png. The suggestion list is judged from the
screenshots. Prints one line per step (PASS / FAIL) and nothing of the editor content.

State is restored afterwards: the editor engine preferences and a Plugin Center switch stored off
(switched on for the run) are put back, the probe file and the editor drafts the run created are removed, the host is force-stopped instead of leaving the editor (no save dialog), and
the Ace Editor plugin is uninstalled when it was not installed before, or reinstalled from the APK
pulled before the run. Needs a debuggable AutoJs6 host (run-as) and an unlocked screen; no dialog
is confirmed by this script.
zh-CN: 在宿主编辑器 (Ace 引擎) 里输入触发文本并截图, 测后还原引擎偏好, 探针文件, 草稿与插件安装状态.
"""
import argparse
import re
import subprocess
import sys
import time
from pathlib import Path

PKG = 'org.autojs.autojs6'
ACE_PKG = 'io.github.supermonster003.autojs6.plugin.ace.editor'
RUN_INTENT = f'{PKG}/org.autojs.autojs.external.open.RunIntentActivity'
EDIT_INTENT = f'{PKG}/org.autojs.autojs.external.open.EditIntentActivity'
EDIT_ACTIVITY = f'{PKG}/org.autojs.autojs.ui.edit.EditActivity'
PREFS = f'shared_prefs/{PKG}_preferences.xml'
ENGINE_KEY = 'key_$_editor_engine'
SELECTION_KEY = 'key_$_editor_engine_selection_mode'
ENGINE_SCRIPT = 'files/ace-completion-engine.js'
PROBE_SCRIPT = 'files/ace-completion-probe.js'
DRAFT_DIRS = ('cache/editor-drafts', 'files/drafts')
ENABLE_PREFS = 'shared_prefs/plugin_center_enable_state.xml'
ENABLE_KEY = f'key_$_enabled_plugin_$_{ACE_PKG}'
MARKER = 'AJ6ACECOMPLETION'

# name: (probe content, letters typed at its end). Only letters are typed: a Chinese IME turns a typed
# "." into a full-width one, so the member access is part of the probe; with such an IME the letters are
# committed by Enter (see composing_ime).
CASES = {
    'video-members': ('video.', 't'),
    'audio-members': ('audio.', 'm'),
    'video-trim-options': ("video.trim('/sdcard/a.mp4', {", 'st'),
    'video-record-options': ('video.record({', 'fr'),
    'audio-mix-options': ("audio.mix(['/sdcard/a.m4a', '/sdcard/b.m4a'], {", 'fo'),
    'video-subtitles-members': ('video.subtitles.', 'pa'),
    'pdf-members': ('pdf.', 'r'),
    'pdf-alias-members': ('$pdf.', 'me'),
    'pdf-render-options': ("pdf.render('/sdcard/a.pdf', 0, {", 'd'),
    'xlsx-members': ('xlsx.', 'r'),
    'xlsx-alias-members': ('$xlsx.', 'wr'),
    'xlsx-write-options': ("xlsx.write('/sdcard/a.xlsx', [['a', 1]], {", 'fr'),
    'xlsx-sheet-members': ("let sh = xlsx.open('/sdcard/a.xlsx').sheet(0);\nsh.", 'set'),
    # No suggestion list: the highlighting of a few lines, the last call with an option value the declarations reject.
    'highlight': ("let r = video.record({frameRate: 30});\nlet m = audio.probe('/sdcard/a.m4a');\n"
                  "video.transform('/sdcard/a.mp4', {flip: 'diagonal'});\nlet n = ", '1'),
}


def adb(serial, *args, check=True, timeout=300, stdin=None):
    result = subprocess.run(['adb', '-s', serial, *args], capture_output=True, input=stdin, timeout=timeout)
    out = (result.stdout or b'').decode('utf-8', 'replace').replace('\r', '')
    if check and result.returncode != 0:
        err = (result.stderr or b'').decode('utf-8', 'replace')
        raise SystemExit(f"adb {' '.join(args[:3])} failed: {(out + err).strip()[-400:]}")
    return out


def shell(serial, command):
    return adb(serial, 'shell', command, check=False)


def wait_for(predicate, timeout, interval=0.25):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        value = predicate()
        if value:
            return value
        time.sleep(interval)
    return None


def run_as(serial, command, stdin=None):
    return adb(serial, 'shell', f'run-as {PKG} sh -c "{command}"', stdin=stdin, check=False)


def write_private(serial, path, text):
    run_as(serial, f'mkdir -p files && cat > {path}', stdin=text.encode())


def resumed(serial):
    out = shell(serial, 'dumpsys activity activities')
    match = re.search(r'[Rr]esumedActivity[:=] ?ActivityRecord\{\S+ \S+ ([^\s}]+)', out)
    return match.group(1) if match else None


def editor_view(serial):
    top = shell(serial, 'dumpsys activity top')
    if re.search(r'\.CodeEditText\{\w+ V', top):
        return 'CodeEditText'
    if re.search(r'\{\w+ V\S* \S+ \S+ #\w+ app:id/ace_input_method_enhance_content\}', top):
        return 'Ace'
    return None


def read_engine_prefs(serial):
    xml = run_as(serial, f'cat {PREFS}')
    values = {}
    for key in (ENGINE_KEY, SELECTION_KEY):
        match = re.search(r'<string name="' + re.escape(key) + r'">([^<]*)</string>', xml)
        values[key] = match.group(1) if match else None
    return values


def set_engine_prefs(serial, engine, selection, tag):
    def put(key, value):
        return f".remove('{key}')" if value is None else f".putString('{key}', '{value}')"
    script = (
        "let sp = android.preference.PreferenceManager.getDefaultSharedPreferences(context);\n"
        f"sp.edit(){put(ENGINE_KEY, engine)}{put(SELECTION_KEY, selection)}.commit();\n"
        f"console.log('{MARKER} {tag} ' + sp.getString('{ENGINE_KEY}', 'none'));\n"
    )
    write_private(serial, ENGINE_SCRIPT, script)
    adb(serial, 'logcat', '-c', check=False)
    shell(serial, f'am start -n {RUN_INTENT} -e path /data/user/0/{PKG}/{ENGINE_SCRIPT}')
    expected = f'{MARKER} {tag} {engine or "none"}'
    ok = bool(wait_for(lambda: expected in adb(serial, 'logcat', '-d', check=False), 20, 0.5))
    run_as(serial, f'rm -f {ENGINE_SCRIPT}')
    return ok


def stored_enable_state(serial):
    """The Plugin Center switch stored for the Ace Editor plugin: True, False or None (no record, on by default)."""
    xml = run_as(serial, f'cat {ENABLE_PREFS}')
    match = re.search(r'<boolean name="' + re.escape(ENABLE_KEY) + r'" value="(true|false)"', xml)
    return None if not match else match.group(1) == 'true'


def set_plugin_enabled(serial, enabled, tag):
    """The Plugin Center switch through the host's PluginEnableStore (the same write as the switch)."""
    store = 'Packages.org.autojs.autojs.core.plugin.center.PluginEnableStore.INSTANCE'
    script = (
        f"{store}.setEnabled(context, '{ACE_PKG}', {str(enabled).lower()});\n"
        f"console.log('{MARKER} {tag} ' + {store}.isEnabled(context, '{ACE_PKG}', true));\n"
    )
    write_private(serial, ENGINE_SCRIPT, script)
    adb(serial, 'logcat', '-c', check=False)
    shell(serial, f'am start -n {RUN_INTENT} -e path /data/user/0/{PKG}/{ENGINE_SCRIPT}')
    expected = f'{MARKER} {tag} {str(enabled).lower()}'
    ok = bool(wait_for(lambda: expected in adb(serial, 'logcat', '-d', check=False), 20, 0.5))
    run_as(serial, f'rm -f {ENGINE_SCRIPT}')
    return ok


def draft_files(serial):
    names = set()
    for directory in DRAFT_DIRS:
        for line in run_as(serial, f'ls {directory} 2>/dev/null').splitlines():
            if line.strip():
                names.add(f'{directory}/{line.strip()}')
    return names


def composing_ime(serial):
    """Whether the current keyboard composes typed letters (a zh / ja / ko subtype of the current IME)."""
    match = re.search(r'initializedInputMethodEntry = \S*?languageTag=([\w-]+)', shell(serial, 'dumpsys input_method'))
    return bool(match) and match.group(1).split('-')[0] in ('zh', 'ja', 'ko')


def screen_size(serial):
    sizes = re.findall(r'(\d+)x(\d+)', shell(serial, 'wm size'))
    return tuple(map(int, sizes[-1]))


def screenshot(serial, target):
    remote = '/data/local/tmp/ace-completion-shot.png'
    shell(serial, f'screencap -p {remote}')
    adb(serial, 'pull', remote, str(target), check=False)
    shell(serial, f'rm -f {remote}')
    return target.exists() and target.stat().st_size > 0


def installed_apk(serial, package):
    out = shell(serial, f'pm path {package}')
    paths = [line.split(':', 1)[1].strip() for line in out.splitlines() if line.startswith('package:')]
    return paths


def run_case(serial, name, content, typed, size, out_dir):
    write_private(serial, PROBE_SCRIPT, content)
    shell(serial, f'am force-stop {PKG}')
    shell(serial, f'am start -W -a android.intent.action.VIEW -t application/x-javascript '
                  f'-d file:///data/user/0/{PKG}/{PROBE_SCRIPT} -n {EDIT_INTENT}')
    if not wait_for(lambda: resumed(serial) == EDIT_ACTIVITY, 20):
        print(f'[{name}] open editor: FAIL (resumed {resumed(serial)})')
        return False
    view = wait_for(lambda: editor_view(serial), 20, 0.5)
    if view != 'Ace':
        print(f'[{name}] open editor: FAIL (the editor shows {view}; Ace Editor plugin missing or disabled)')
        return False
    time.sleep(4)
    # A tap below the last line puts the cursor at the end of the document.
    shell(serial, f'input tap {size[0] // 2} {int(size[1] * 0.42)}')
    time.sleep(1.5)
    shell(serial, f'input text {typed}')
    if composing_ime(serial):
        # A Chinese / Japanese / Korean IME keeps the letters as a composition; Enter commits them as typed.
        time.sleep(0.5)
        shell(serial, 'input keyevent KEYCODE_ENTER')
    time.sleep(3)
    shot = out_dir / f'{name}.png'
    ok = screenshot(serial, shot)
    print(f"[{name}] typed {typed!r} after {len(content)} chars, screenshot: {'PASS' if ok else 'FAIL'} ({shot.name})")
    shell(serial, f'am force-stop {PKG}')
    return ok


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('serial')
    parser.add_argument('--apk', required=True, type=Path, help='Ace Editor plugin APK to install')
    parser.add_argument('--out', required=True, type=Path, help='directory for the screenshots')
    parser.add_argument('--case', action='append', choices=sorted(CASES))
    args = parser.parse_args()
    serial = args.serial
    args.out.mkdir(parents=True, exist_ok=True)

    if 'DEBUGGABLE' not in shell(serial, f'dumpsys package {PKG}'):
        raise SystemExit('the AutoJs6 host is missing or not debuggable (run-as)')
    if re.search(r'mDreamingLockscreen=true|mShowingLockscreen=true|isStatusBarKeyguard=true', shell(serial, 'dumpsys window policy')):
        raise SystemExit('the screen is locked; unlock it first')
    shell(serial, 'input keyevent KEYCODE_WAKEUP')

    before = installed_apk(serial, ACE_PKG)
    backup = None
    if before:
        backup = args.out / '.ace-before.apk'
        adb(serial, 'pull', before[0], str(backup))
    install = adb(serial, 'install', '-r', '-t', str(args.apk), check=False)
    print(f"install Ace Editor plugin: {'PASS' if 'Success' in install else 'FAIL'} (installed before: {bool(before)})")
    if 'Success' not in install:
        return 1

    prefs = read_engine_prefs(serial)
    enable_before = stored_enable_state(serial)
    drafts_before = draft_files(serial)
    size = screen_size(serial)
    failures = 0
    try:
        if enable_before is False:
            # Switched off in Plugin Center before (an earlier run or the user): on for this run, off again afterwards.
            enabled = set_plugin_enabled(serial, True, 'enable')
            print(f"switch the Ace Editor plugin on in Plugin Center (stored off before): {'PASS' if enabled else 'FAIL'}")
            if not enabled:
                return 1
        engine_ok = set_engine_prefs(serial, 'ace', 'auto_ace', 'engine')
        print(f"set editor engine ace: {'PASS' if engine_ok else 'FAIL'}")
        if not engine_ok:
            return 1
        for name in args.case or list(CASES):
            content, typed = CASES[name]
            failures += 0 if run_case(serial, name, content, typed, size, args.out) else 1
    finally:
        shell(serial, f'am force-stop {PKG}')
        run_as(serial, f'rm -f {PROBE_SCRIPT}')
        created = sorted(draft_files(serial) - drafts_before)
        for path in created:
            run_as(serial, f'rm -f {path}')
        restored = set_engine_prefs(serial, prefs[ENGINE_KEY], prefs[SELECTION_KEY], 'restore')
        print(f"restore engine preferences {prefs}: {'PASS' if restored else 'FAIL'}; drafts removed: {len(created)}")
        if enable_before is False:
            off = set_plugin_enabled(serial, False, 'disable') and stored_enable_state(serial) is False
            print(f"switch the Ace Editor plugin off again in Plugin Center: {'PASS' if off else 'FAIL'}")
        shell(serial, f'am force-stop {PKG}')
        if backup:
            out = adb(serial, 'install', '-r', '-d', str(backup), check=False)
            print(f"reinstall the previous Ace Editor plugin: {'PASS' if 'Success' in out else 'FAIL'}")
            backup.unlink(missing_ok=True)
        else:
            out = adb(serial, 'uninstall', ACE_PKG, check=False)
            print(f"uninstall Ace Editor plugin (not installed before): {'PASS' if 'Success' in out else 'FAIL'}")
    print(f'summary: {len(args.case or CASES) - failures} / {len(args.case or CASES)} cases with screenshots')
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main())
