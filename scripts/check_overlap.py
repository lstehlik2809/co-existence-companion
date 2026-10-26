"""Conservative 10-word overlap screen. Requires the private book locally.

This detects text overlap; it is not a copyright assessment. It never prints
book passages. Public candidates are scanned even before a Git repo exists.
"""
import argparse
import html
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BOOK = ROOT / 'book' / 'Co-Existence The Next Phase of AI.md'
EXTENSIONS = {'.html', '.htm', '.js', '.mjs', '.json', '.md'}
PRIVATE_DIRS = {'book', 'source', 'review', '.git', 'node_modules', '__pycache__'}
PRIVATE_FILES = {'content/extraction-report.md'}

def words(text):
    text = re.sub(r'<[^>]*>', ' ', text)
    text = re.sub(r'!?\[([^\]]*)\]\([^)]*\)', r' \1 ', text)
    text = html.unescape(unicodedata.normalize('NFKC', text)).lower().replace('’', "'")
    return re.findall(r"[^\W_]+(?:'[^\W_]+)*", text, flags=re.UNICODE)

def windows(tokens, size=10):
    return (tuple(tokens[i:i + size]) for i in range(len(tokens) - size + 1))

def json_strings(value, path='$'):
    if isinstance(value, str):
        yield path, value
    elif isinstance(value, list):
        for i, child in enumerate(value):
            yield from json_strings(child, f'{path}[{i}]')
    elif isinstance(value, dict):
        for key, child in value.items():
            yield from json_strings(child, f'{path}.{key}')

def candidates(root, source_path, include_review=False):
    for path in sorted(root.rglob('*')):
        if not path.is_file() or path.suffix.lower() not in EXTENSIONS:
            continue
        rel = path.relative_to(root)
        skip_dirs = PRIVATE_DIRS - {'review'} if include_review else PRIVATE_DIRS
        if any(part in skip_dirs for part in rel.parts[:-1]):
            continue
        if not include_review and rel.as_posix() in PRIVATE_FILES:
            continue
        if path.resolve() == source_path.resolve():
            continue
        yield path

def approved_windows(root):
    path = root / 'content' / 'approved-quotes.json'
    quotes = json.loads(path.read_text(encoding='utf-8-sig'))
    if not isinstance(quotes, list):
        raise ValueError('approved-quotes.json must contain an array')
    seen = set()
    allowed = set()
    for quote in quotes:
        if not isinstance(quote, dict) or not all(quote.get(k) for k in ('id', 'text', 'chapter')):
            raise ValueError('Each approved quote needs id, text and chapter')
        chapter = str(quote['chapter'])
        if chapter in seen:
            raise ValueError('Only one approved quote per chapter is allowed')
        seen.add(chapter)
        if not 1 <= len(words(quote['text'])) < 15:
            raise ValueError('An approved quote must contain fewer than 15 words')
        allowed.update(windows(words(quote['text'])))
    return allowed, len(quotes)

def run(root, book, include_review=False):
    book_tokens = words(book.read_text(encoding='utf-8-sig'))
    book_windows = set(windows(book_tokens))
    allowed, quote_count = approved_windows(root)
    hits = []
    count = 0
    for path in candidates(root, book, include_review):
        count += 1
        raw = path.read_text(encoding='utf-8-sig')
        units = [('$file', raw)]
        if path.suffix.lower() == '.json':
            units.extend(json_strings(json.loads(raw)))
        seen = set()
        for locator, text in units:
            matches = set(windows(words(text))) & book_windows - allowed
            unseen = matches - seen
            if unseen:
                hits.append({'file': path.relative_to(root).as_posix(), 'location': locator,
                             'matchingWindows': len(unseen)})
                seen.update(unseen)
    return {'status': 'FAIL' if hits else 'PASS', 'filesScanned': count,
            'minimumConsecutiveWords': 10, 'approvedQuotes': quote_count,
            'sourceWords': len(book_tokens), 'includePrivateReview': include_review,
            'overlaps': hits,
            'exclusions': sorted(PRIVATE_DIRS | PRIVATE_FILES) if not include_review
                          else sorted(PRIVATE_DIRS - {'review'})}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--book', type=Path, default=DEFAULT_BOOK)
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--include-review', action='store_true', help='Also scan private authoring and review documents')
    parser.add_argument('--report', type=Path, help='Save JSON result, normally inside ignored review/')
    args = parser.parse_args()
    try:
        result = run(args.root.resolve(), args.book.resolve(), args.include_review)
        if args.report:
            args.report.parent.mkdir(parents=True, exist_ok=True)
            args.report.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
        print(f"{result['status']}: scanned {result['filesScanned']} candidate files; "
              f"{len(result['overlaps'])} unapproved overlap locations of 10+ consecutive words; "
              f"{result['approvedQuotes']} approved quotes.")
        for item in result['overlaps'][:30]:
            print(f"  {item['file']} {item['location']}: {item['matchingWindows']} matching windows")
        print('Private book/source folders are excluded. No source passages are printed.')
        return 1 if result['overlaps'] else 0
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        return 2

if __name__ == '__main__':
    raise SystemExit(main())
