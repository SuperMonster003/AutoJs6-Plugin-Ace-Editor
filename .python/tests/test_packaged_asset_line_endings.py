"""Packaged text assets keep the repository's LF bytes on every checkout.

The APK carries the working copy's bytes. A Windows checkout with core.autocrlf=true once rewrote 227 assets to CRLF
for a 2.0.0 release build, and the bundled font catalog's SHA-256 is compared with the signed remote catalog. The
Markdown workflow runs these tests on Windows, where actions/checkout converts every text file without LF rules.
"""
from pathlib import Path
import shutil
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[2]
PACKAGED = ('app/src/main/assets', 'app/src/main/res/raw')
# LuaLS keeps its exact upstream bytes, including one CRLF script; luals/manifest.json pins every file.
PINNED_BYTES = 'app/src/main/assets/luals/'
# Control bytes that Git's text detection counts as non-printable (BS, HT, ESC and FF count as printable; CR and LF
# are line endings).
NON_PRINTABLE = bytes(c for c in range(32) if c not in (8, 9, 10, 12, 13, 27)) + b'\x7f'
RESTORE_HINT = ('In an existing checkout, Git keeps CRLF files it wrote before .gitattributes pinned LF. Delete the '
                'listed files and run "git checkout -- <path>..." from the repository root (this drops local edits).')


def is_binary(content):
    """Git's text=auto rule for line-ending conversion (convert.c, gather_stats and convert_is_binary)."""
    crlf = content.count(b'\r\n')
    if b'\0' in content or content.count(b'\r') > crlf:
        return True
    nonprintable = len(content) - len(content.translate(None, NON_PRINTABLE))
    if content.endswith(b'\x1a'):
        nonprintable -= 1
    printable = len(content) - nonprintable - content.count(b'\r') - content.count(b'\n')
    return (printable >> 7) < nonprintable


def git(*args, stdin=None):
    result = subprocess.run(['git', '-C', str(ROOT), *args], input=stdin, capture_output=True)
    if result.returncode != 0:
        raise AssertionError(f'git {" ".join(args)} failed: {result.stderr.decode(errors="replace").strip()}')
    return result.stdout


class PackagedAssetLineEndingsTest(unittest.TestCase):
    def test_every_packaged_file_checks_out_as_lf_or_keeps_pinned_bytes(self):
        if shutil.which('git') is None or not (ROOT / '.git').exists():
            self.skipTest('needs a Git checkout')
        # An unmerged path is listed once per stage.
        paths = list(dict.fromkeys(path for path in git('ls-files', '-z', '--', *PACKAGED).split(b'\0') if path))
        self.assertTrue(paths)
        fields = git('check-attr', '-z', '--stdin', 'text', 'eol', stdin=b'\0'.join(paths) + b'\0').split(b'\0')
        attributes = {}
        for index in range(0, len(fields) - 2, 3):
            attributes.setdefault(fields[index].decode(), {})[fields[index + 1].decode()] = fields[index + 2].decode()
        self.assertEqual(sorted(path.decode() for path in paths), sorted(attributes))
        unprotected = sorted(path for path, value in attributes.items() if value['text'] != 'unset' and
                             (value['text'] not in ('set', 'auto') or value['eol'] != 'lf'))
        if unprotected:
            self.fail(f'{len(unprotected)} packaged files need "text=auto eol=lf" or "-text" in .gitattributes:\n'
                      + '\n'.join(unprotected))

    def test_packaged_text_files_have_no_crlf(self):
        crlf = []
        for directory in PACKAGED:
            for file in sorted((ROOT / directory).rglob('*')):
                path = file.relative_to(ROOT).as_posix()
                if not file.is_file() or path.startswith(PINNED_BYTES):
                    continue
                content = file.read_bytes()
                if b'\r\n' in content and not is_binary(content):
                    crlf.append(path)
        if crlf:
            self.fail(f'{len(crlf)} packaged text files contain CRLF. {RESTORE_HINT}\n' + '\n'.join(crlf))

    def test_text_detection_follows_git(self):
        self.assertFalse(is_binary(b'first\r\nsecond\n\tthird\x1a'))
        self.assertTrue(is_binary(b'x' * 9000 + b'\r\n\0'))
        self.assertTrue(is_binary(b'first\r\nlone\rcarriage return\n'))
        self.assertTrue(is_binary(b'\x01\x02\x03' + b'x' * 300))
        self.assertFalse(is_binary(b'\x01' + b'x' * 300))


if __name__ == '__main__':
    unittest.main()
