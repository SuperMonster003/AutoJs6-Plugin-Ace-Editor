"""Device check of the font downloader on the shared download kit (AutoJs6 plugin-center P13.1), with a local HTTP server
as its mirrors.

Usage: py -3.12 -I -u tools/device/font_download_check.py -s SERIAL --work DIR [--port 8768] COMMAND

  install [--apk A --test-apk T]
                  installs the debug plugin and its instrumentation APK (default: the newest x86_64 debug APK and the
                  newest androidTest APK under app/build/outputs/apk), install -r -t -d
  run             makes a font of --font-kib KiB with a WOFF2 header in WORK, serves it on 127.0.0.1:PORT through adb
                  reverse, runs FontDownloadKitDeviceTest (am instrument) and checks the request sequence of every
                  scenario in the server log:
                    font-resume: /cut1/ cuts the first request at 40 %; the retry asks for Range: bytes=N- with If-Range
                      and receives exactly the remaining bytes
                    font-mirror: /cutdead/ cuts the first request at 40 % and answers 503 afterwards; after the two
                      retries the second mirror /ok/ is asked for Range: bytes=N- without If-Range and sends exactly the
                      remaining bytes
                    font-hash: /other/ sends a file of the same size with one byte changed; one request, the whole file,
                      no retry, and the test asserts the integrity failure with nothing installed
                  Prints PASS / FAIL with the numbers; WORK/server.log (one JSON line per request), WORK/instrument.txt
                  and WORK/summary.json
  cleanup         removes the adb reverse rule and the test directory of the plugin (run-as)

Only for a temporary AVD or a test device; nothing on the device is tapped.
zh-CN: 共用下载库上的字体下载器的设备检查 (AutoJs6 plugin-center P13.1): run 在 WORK 里生成带 WOFF2 头的字体, 经 adb reverse 提供服务, 运行
FontDownloadKitDeviceTest, 按服务端日志核对每个场景的请求序列 (Range 与传输字节), 输出 PASS / FAIL 与关键数值. 只用于临时 AVD 或测试设备, 不点按设备.
"""
import argparse
import email.utils
import hashlib
import http.server
import json
import pathlib
import random
import re
import socketserver
import subprocess
import sys
import threading
import time

ROOT = pathlib.Path(__file__).resolve().parents[2]
PKG = 'io.github.supermonster003.autojs6.plugin.ace.editor'
RUNNER = PKG + '.test/androidx.test.runner.AndroidJUnitRunner'
TEST_CLASS = PKG + '.core.font.FontDownloadKitDeviceTest'
CUT_FRACTION = 0.4
DEVICE_TEST_DIR = 'cache/p13-device-test'
ROUTES = ('ok', 'cut1', 'cutdead', 'other')

SCENARIOS = {
    'font-resume': 'fontResumesACutTransfer',
    'font-mirror': 'fontNextMirrorContinuesTheBytes',
    'font-hash': 'fontWithAnotherHashIsRejected',
}


def adb(serial, *args, check=False, timeout=600):
    result = subprocess.run(['adb', '-s', serial, *args], capture_output=True, timeout=timeout)
    out = (result.stdout + result.stderr).decode('utf-8', 'replace').replace('\r', '')
    if check and result.returncode != 0:
        sys.exit('adb %s failed: %s' % (args[0], out.strip().splitlines()[-1:]))
    return out


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def report(ok, name, detail):
    print('%s %s: %s' % ('PASS' if ok else 'FAIL', name, detail), flush=True)
    return ok


def make_font(size):
    """A WOFF2 file as FontTestFixtures.validWoff2 builds it: the 16 header bytes the store checks, then random bytes."""
    rng = random.Random(1313)
    body = bytearray(rng.getrandbits(8) for _ in range(size))
    body[0:4] = b'wOF2'
    body[4:8] = bytes([0, 1, 0, 0])
    body[8:12] = size.to_bytes(4, 'big')
    body[12:16] = bytes([0, 1, 0, 0])
    return bytes(body)


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True


def make_handler(font, other, log_path):
    """Routes /ok/TAG/font.woff2, /cut1/..., /cutdead/... (the font) and /other/... (the changed file)."""
    lock = threading.Lock()
    seen = set()
    validators = {
        'font': ('"%s"' % sha256(font)[:16], email.utils.formatdate(time.time() - 3600, usegmt=True)),
        'other': ('"%s"' % sha256(other)[:16], email.utils.formatdate(time.time() - 3600, usegmt=True)),
    }

    class Handler(http.server.BaseHTTPRequestHandler):
        protocol_version = 'HTTP/1.1'

        def log_message(self, *a):
            pass

        def do_GET(self):
            parts = self.path.strip('/').split('/')
            if len(parts) != 3 or parts[0] not in ROUTES or parts[2] != 'font.woff2':
                self.send_error(404)
                return
            route, tag, name = parts
            kind = 'other' if route == 'other' else 'font'
            body = other if kind == 'other' else font
            etag, modified = validators[kind]
            total = len(body)
            requested = self.headers.get('Range')
            if_range = self.headers.get('If-Range')
            with lock:
                first_time = (route, tag) not in seen
                seen.add((route, tag))
            status, first = 200, 0
            if route == 'cutdead' and not first_time:
                status = 503
            else:
                match = re.fullmatch(r'bytes=(\d+)-', (requested or '').strip())
                if match and (not if_range or if_range in (etag, modified)):
                    first = int(match.group(1))
                    status = 416 if first >= total else 206
            span = 0 if status in (416, 503) else total - first
            cut = route in ('cut1', 'cutdead') and first_time and status == 200
            limit = int(span * CUT_FRACTION) if cut else span
            sent, aborted = 0, False
            try:
                self.send_response(status)
                self.send_header('Accept-Ranges', 'bytes')
                self.send_header('Content-Length', str(span))
                self.send_header('ETag', etag)
                self.send_header('Last-Modified', modified)
                if status == 206:
                    self.send_header('Content-Range', 'bytes %d-%d/%d' % (first, total - 1, total))
                if status == 416:
                    self.send_header('Content-Range', 'bytes */%d' % total)
                if cut:
                    self.send_header('Connection', 'close')
                self.end_headers()
                while sent < limit:
                    chunk = body[first + sent:first + min(sent + 65536, limit)]
                    self.wfile.write(chunk)
                    sent += len(chunk)
                self.wfile.flush()
            except OSError:
                aborted = True
            if cut:
                self.close_connection = True
                try:
                    self.connection.shutdown(2)
                except OSError:
                    pass
            entry = {'route': route, 'tag': tag, 'name': name, 'status': status, 'range': requested, 'if_range': if_range,
                     'sent': sent, 'span': span, 'total': total, 'cut': cut, 'aborted': aborted, 'time': round(time.time(), 3)}
            with lock, open(log_path, 'a', encoding='utf-8') as f:
                f.write(json.dumps(entry) + '\n')

    return Handler


def newest(pattern):
    found = sorted(ROOT.glob(pattern), key=lambda p: p.stat().st_mtime)
    return found[-1] if found else None


def cmd_install(args):
    apk = args.apk or newest('app/build/outputs/apk/debug/*x86_64*.apk')
    test_apk = args.test_apk or newest('app/build/outputs/apk/androidTest/debug/*.apk')
    if apk is None or test_apk is None:
        sys.exit('No plugin or test APK; build :app:assembleDebug :app:assembleDebugAndroidTest first')
    ok = True
    for label, path in (('plugin', apk), ('test', test_apk)):
        out = adb(args.serial, 'install', '-r', '-t', '-d', str(path))
        ok &= report('Success' in out, 'install %s' % label, '%s, md5 %s' % (path.name, hashlib.md5(path.read_bytes()).hexdigest()[:8]))
    return 0 if ok else 1


def outcomes(out):
    """{test: PASS / FAIL / ...} from `am instrument -r` output."""
    results, test = {}, None
    for line in out.splitlines():
        if line.startswith('INSTRUMENTATION_STATUS: test='):
            test = line.split('=', 1)[1].strip()
        elif line.startswith('INSTRUMENTATION_STATUS_CODE: ') and test:
            code = int(line.split(': ', 1)[1])
            if code != 1:
                results[test] = {0: 'PASS', -1: 'ERROR', -2: 'FAIL', -3: 'IGNORED', -4: 'SKIPPED'}.get(code, str(code))
    return results


def describe(gets):
    return ', '.join('%s %d%s%s sent %d' % (g['route'], g['status'], ' Range ' + g['range'] if g['range'] else '',
                                             ' If-Range ' + g['if_range'] if g['if_range'] else '', g['sent']) for g in gets)


def check_sequence(tag, gets, total):
    """Whether the GETs of a scenario are the expected sequence; returns (ok, numbers)."""
    shape = [(g['route'], g['status']) for g in gets]
    numbers = describe(gets)
    if tag == 'font-hash':
        ok = shape == [('other', 200)] and gets[0]['range'] is None and gets[0]['sent'] == total
        return ok, numbers + '; whole file %d of %d, no retry' % (gets[0]['sent'] if gets else 0, total)
    if tag == 'font-resume':
        expected = [('cut1', 200), ('cut1', 206)]
        resumed, cut = (gets[1], gets[0]) if len(gets) == 2 else (None, None)
        if_range_ok = resumed is not None and resumed['if_range'] is not None
    else:
        expected = [('cutdead', 200), ('cutdead', 503), ('cutdead', 503), ('ok', 206)]
        resumed, cut = (gets[3], gets[0]) if len(gets) == 4 else (None, None)
        if_range_ok = resumed is not None and resumed['if_range'] is None
    ok = shape == expected and cut['cut'] and if_range_ok and resumed['range'] == 'bytes=%d-' % cut['sent'] and \
        resumed['sent'] == total - cut['sent']
    if resumed is not None and cut is not None:
        numbers += '; remaining %d = sent %d' % (total - cut['sent'], resumed['sent'])
        numbers += '; %.1f s from the cut to the resumed request' % (resumed['time'] - cut['time'])
    return bool(ok), numbers


def cmd_run(args):
    work = args.work
    font = make_font(args.font_kib * 1024)
    other = bytearray(font)
    other[-1] ^= 1
    other = bytes(other)
    log_path = work / 'server.log'
    if log_path.exists():
        log_path.unlink()
    adb(args.serial, 'reverse', 'tcp:%d' % args.port, 'tcp:%d' % args.port, check=True)
    server = Server(('127.0.0.1', args.port), make_handler(font, other, log_path))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    print('serving on %d: font %d B (%s), changed copy (%s)' % (args.port, len(font), sha256(font)[:12], sha256(other)[:12]), flush=True)
    try:
        started = time.time()
        out = adb(args.serial, 'shell', 'am', 'instrument', '-w', '-r', '-e', 'class', TEST_CLASS, '-e', 'p13Port', str(args.port),
                  '-e', 'p13FontSha256', sha256(font), '-e', 'p13FontSize', str(len(font)), RUNNER, timeout=900)
        elapsed = time.time() - started
    finally:
        server.shutdown()
        adb(args.serial, 'reverse', '--remove', 'tcp:%d' % args.port)
    (work / 'instrument.txt').write_text(out, encoding='utf-8')
    results = outcomes(out)
    entries = [json.loads(line) for line in log_path.read_text(encoding='utf-8').splitlines()] if log_path.exists() else []
    summary, ok = {}, True
    for tag, test in SCENARIOS.items():
        gets = [e for e in entries if e['tag'] == tag]
        sequence_ok, numbers = check_sequence(tag, gets, len(font))
        outcome = results.get(test, 'MISSING')
        passed = outcome == 'PASS' and sequence_ok
        ok &= report(passed, tag, '%s (%s): %s' % (test, outcome, numbers))
        summary[tag] = {'test': test, 'outcome': outcome, 'sequence': sequence_ok, 'requests': gets}
    print('instrumentation %.1f s, %d requests' % (elapsed, len(entries)), flush=True)
    (work / 'summary.json').write_text(json.dumps(summary, indent=1), encoding='utf-8')
    return 0 if ok else 1


def cmd_cleanup(args):
    adb(args.serial, 'reverse', '--remove', 'tcp:%d' % args.port)
    adb(args.serial, 'shell', 'run-as', PKG, 'rm', '-rf', DEVICE_TEST_DIR)
    print('cleanup done')
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('-s', '--serial', required=True)
    parser.add_argument('--work', type=pathlib.Path, required=True)
    parser.add_argument('--port', type=int, default=8768)
    sub = parser.add_subparsers(dest='command', required=True)
    p = sub.add_parser('install')
    p.add_argument('--apk', type=pathlib.Path)
    p.add_argument('--test-apk', type=pathlib.Path)
    p = sub.add_parser('run')
    p.add_argument('--font-kib', type=int, default=600)
    sub.add_parser('cleanup')
    args = parser.parse_args()
    args.work.mkdir(parents=True, exist_ok=True)
    return globals()['cmd_' + args.command](args)


if __name__ == '__main__':
    sys.exit(main())
