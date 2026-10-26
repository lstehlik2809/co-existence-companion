"""Assemble a public-only static artifact. Never serve the preparation root."""
from pathlib import Path
import hashlib
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_FILES = ('index.html', 'sw.js', 'favicon.svg', 'manifest.webmanifest')
CONTENT_FILES = ('big-picture.json', 'concepts.json', 'practices.json',
                 'scenarios.json', 'decision-questions.json', 'prompt-templates.json',
                 'task-starters.json', 'book-links.json', 'site-copy.json',
                 'approved-quotes.json')


def prepare():
    destination = ROOT / 'dist'
    # Both paths are literal children of the verified project root.
    assert destination.resolve().parent == ROOT.resolve()
    if destination.exists():
        shutil.rmtree(destination)
    destination.mkdir()
    for name in PUBLIC_FILES:
        shutil.copy2(ROOT / name, destination / name)
    for folder, suffix in (('css', '.css'), ('js', '.js')):
        for path in (ROOT / folder).rglob('*' + suffix):
            target = destination / path.relative_to(ROOT)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, target)
    (destination / 'content').mkdir()
    for name in CONTENT_FILES:
        shutil.copy2(ROOT / 'content' / name, destination / 'content' / name)
    # Any edit to a public file produces a new service-worker installation.
    digest = hashlib.sha256()
    for path in sorted(p for p in destination.rglob('*') if p.is_file() and p.name != 'sw.js'):
        digest.update(path.relative_to(destination).as_posix().encode())
        digest.update(path.read_bytes())
    worker = destination / 'sw.js'
    text = worker.read_text(encoding='utf-8-sig')
    text, replacements = re.subn(r"const CACHE = '[^']+';", f"const CACHE = 'coexistence-atlas-{digest.hexdigest()[:16]}';", text, count=1)
    assert replacements == 1, 'Service-worker cache declaration changed; update packaging.'
    worker.write_text(text, encoding='utf-8')
    (destination / '.nojekyll').touch()
    forbidden = {'book', 'source', 'review', '.git', 'node_modules'}
    files = list(destination.rglob('*'))
    assert not any(forbidden.intersection(p.relative_to(destination).parts) for p in files)
    print(f'PASS: public-only artifact assembled in dist/ ({sum(p.is_file() for p in files)} files).')
    return destination


if __name__ == '__main__':
    prepare()
