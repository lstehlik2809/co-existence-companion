"""Check actual tracked/staged paths and the assembled public artifact."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
PRIVATE_PARTS = {'book', 'source', 'review', 'node_modules', '__pycache__'}
PRIVATE_FILES = {'content/extraction-report.md', 'content/curator-note.md', 'BRIEF.md'}


def forbidden(name):
    path = Path(name)
    return bool(PRIVATE_PARTS.intersection(path.parts) or
                path.suffix.lower() == '.epub' or path.as_posix() in PRIVATE_FILES)


def main():
    tracked = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0')
    staged = subprocess.check_output(['git', 'diff', '--cached', '--name-only', '-z'], cwd=ROOT).decode().split('\0')
    invalid = [name for name in tracked + staged if name and forbidden(name)]
    artifact = ROOT / 'dist'
    if not artifact.is_dir():
        print('FAIL: build the public artifact first with python scripts/prepare_site.py')
        return 1
    published = [p.relative_to(artifact).as_posix() for p in artifact.rglob('*') if p.is_file()]
    invalid.extend(name for name in published if forbidden(name))
    # A book asset can have an innocuous filename; the artifact allows no raster images.
    invalid.extend(name for name in published if Path(name).suffix.lower() in {'.epub', '.jpg', '.jpeg', '.png', '.pdf'})
    if invalid:
        print('FAIL: private material in tracked, staged or published files:', ', '.join(sorted(set(invalid))))
        return 1
    print(f'PASS: {len([n for n in tracked if n])} tracked paths and {len(published)} public files; no private book, assets or reviewer material.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
