"""Validate the preparation package, its cross-links and local source locators."""
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / 'content'
BOOK = ROOT / 'book' / 'Co-Existence The Next Phase of AI.md'

def load(name):
    return json.loads((CONTENT / name).read_text(encoding='utf-8-sig'))

def count_words(text):
    return len(text.split())

def source_registry():
    lines = BOOK.read_text(encoding='utf-8-sig').splitlines()
    chapters = {}
    current = None
    expect_title = False
    for number, line in enumerate(lines, 1):
        if re.match(r'^# <a[^>]+></a> Notes$', line):
            if current:
                chapters[current]['lineEnd'] = number - 1
            break
        chapter = re.match(r'^## <a id="([^"]+)"></a> Chapter (\d+)$', line)
        intro = re.match(r'^# <a id="([^"]+)"></a> Introduction$', line)
        if chapter or intro:
            if current:
                chapters[current]['lineEnd'] = number - 1
            current = chapter.group(2) if chapter else 'Introduction'
            anchor = (chapter or intro).group(1)
            chapters[current] = {'anchor': anchor, 'lineStart': number, 'sections': {}}
            expect_title = bool(chapter)
            if intro:
                chapters[current]['sections']['Introduction'] = number
            continue
        if current is None:
            continue
        clean = re.sub(r'<[^>]*>', '', line).strip()
        if expect_title and clean and not clean.startswith('#'):
            chapters[current]['sections'][clean] = number
            expect_title = False
        if clean.startswith('###'):
            chapters[current]['sections'][clean.lstrip('#').strip()] = number
    return chapters

def main():
    errors = []
    def require(ok, message):
        if not ok:
            errors.append(message)

    documents = {}
    for path in sorted(CONTENT.glob('*.json')):
        try:
            documents[path.name] = json.loads(path.read_text(encoding='utf-8-sig'))
        except (ValueError, OSError) as exc:
            errors.append(f'{path.name}: {exc}')
    required_files = ['concepts.json', 'practices.json', 'scenarios.json', 'decision-questions.json',
                      'big-picture.json', 'approved-quotes.json', 'prompt-templates.json',
                      'task-starters.json', 'site-copy.json', 'book-links.json']
    for filename in required_files:
        require(filename in documents, f'Missing {filename}')
    if errors:
        print('\n'.join(errors))
        return 1

    concepts = documents['concepts.json']
    practices = documents['practices.json']
    scenarios = documents['scenarios.json']
    questions = documents['decision-questions.json']
    prompts = documents['prompt-templates.json']
    starters = documents['task-starters.json']
    big = documents['big-picture.json']
    registry = source_registry()
    all_ids = []
    for name, items in [('concepts', concepts), ('practices', practices), ('scenarios', scenarios),
                        ('questions', questions), ('prompts', prompts), ('starters', starters)]:
        require(isinstance(items, list), f'{name} must be an array')
        ids = [item['id'] for item in items]
        require(len(ids) == len(set(ids)), f'{name}: duplicate ID')
        all_ids.extend(ids)
    require(len(all_ids) == len(set(all_ids)), 'IDs collide across content types')
    concept_by_id = {item['id']: item for item in concepts}
    themes = {t['id'] for t in big['themes']}
    require(3 <= len(themes) <= 5, 'Need 3-5 themes')
    require(len(themes) == len(big['themes']), 'Duplicate theme IDs')
    require(15 <= len(practices) <= 30, 'Need 15-30 practices')
    require(12 <= len(scenarios) <= 20, 'Need 12-20 scenarios')
    require(count_words(big['summary']) <= 120, 'Big picture exceeds 120 words')

    source_count = 0
    def check_source(item, filename):
        nonlocal source_count
        require(item.get('origin') in {'book', 'site'}, f'{filename}/{item["id"]}: invalid origin')
        require(item.get('confidence') in {'high', 'medium', 'low'}, f'{filename}/{item["id"]}: invalid confidence')
        for ref in [item.get('source', {})] + item.get('additionalSources', []):
            chapter = registry.get(ref.get('chapter'))
            require(bool(chapter), f'{filename}/{item["id"]}: unknown chapter')
            if not chapter:
                continue
            require(ref.get('anchor') == chapter['anchor'], f'{filename}/{item["id"]}: wrong chapter anchor')
            require(ref.get('section') in chapter['sections'], f'{filename}/{item["id"]}: section not found: {ref.get("section")}')
            if 'lineStart' in ref or 'lineEnd' in ref:
                start, end = ref.get('lineStart'), ref.get('lineEnd')
                require(isinstance(start, int) and isinstance(end, int) and
                        chapter['lineStart'] <= start <= end <= chapter['lineEnd'],
                        f'{filename}/{item["id"]}: line range is outside the cited chapter')
            source_count += 1

    def check_concepts(item, filename):
        for id in item.get('conceptIds', []):
            require(id in concept_by_id, f'{filename}/{item["id"]}: unknown concept {id}')
        require(bool(item.get('conceptIds')), f'{filename}/{item["id"]}: no linked concept')

    check_source(big, 'big-picture')
    for c in concepts:
        check_source(c, 'concepts')
        require(c['theme'] in themes, f'{c["id"]}: missing theme')
        require(c['kind'] in {'practice', 'context'}, f'{c["id"]}: invalid kind')
        for key, limit in [('summary', 40), ('whyItMatters', 40), ('example', 50)]:
            require(count_words(c.get(key, '')) <= limit, f'{c["id"]}.{key}: over {limit} words')
        expected_practices = [p['id'] for p in practices if c['id'] in p['conceptIds']]
        expected_scenarios = [s['id'] for s in scenarios if c['id'] in s['conceptIds']]
        require(c['practiceIds'] == expected_practices, f'{c["id"]}: incorrect practice reverse links')
        require(c['scenarioIds'] == expected_scenarios, f'{c["id"]}: incorrect scenario reverse links')
        if c['kind'] == 'context':
            require(not expected_practices and not expected_scenarios, f'{c["id"]}: context concept drives action')
        else:
            require(bool(expected_practices or expected_scenarios), f'{c["id"]}: practice concept has no action')
    for p in practices:
        check_source(p, 'practices')
        check_concepts(p, 'practices')
        require(all(p.get(k) for k in ('when', 'do', 'insteadOf', 'why')), f'{p["id"]}: incomplete intention')
        require(count_words(p['why']) <= 40, f'{p["id"]}: why exceeds 40 words')
        require(p['lens'] in {'test', 'use', 'delegate', 'keep', 'verify', 'learn'}, f'{p["id"]}: invalid lens')
    for s in scenarios:
        check_source(s, 'scenarios')
        check_concepts(s, 'scenarios')
        require(s['origin'] == 'site', f'{s["id"]}: scenario must be a companion addition')
        require(count_words(s['setup']) <= 80, f'{s["id"]}: setup over 80 words')
        option_ids = [o['id'] for o in s['options']]
        require(len(option_ids) >= 2 and len(option_ids) == len(set(option_ids)), f'{s["id"]}: invalid options')
        require(set(s['recommendedOptionIds']) <= set(option_ids), f'{s["id"]}: missing recommended option')
        for option in s['options']:
            require(count_words(option['feedback']) <= 60, f'{s["id"]}/{option["id"]}: feedback over 60 words')
        verdict = s['verdict']
        require(verdict in {'one-best', 'several-defensible', 'depends'}, f'{s["id"]}: invalid verdict')
        if verdict == 'one-best':
            require(len(s['recommendedOptionIds']) == 1, f'{s["id"]}: one-best needs one recommendation')
        elif verdict == 'several-defensible':
            require(len(s['recommendedOptionIds']) >= 2, f'{s["id"]}: several-defensible needs alternatives')
        else:
            require(not s['recommendedOptionIds'], f'{s["id"]}: depends should not encode a single recommendation')
    allowed_routes = {'before-test', 'all-decisions', 'use-ai', 'delegate-agent', 'keep-deliberately', 'undecided'}
    for q in questions:
        check_source(q, 'questions')
        check_concepts(q, 'questions')
        require(set(q['appliesTo']) <= allowed_routes, f'{q["id"]}: unrecognized route')
        require(bool(q['recordFields']), f'{q["id"]}: missing answer fields')
    for p in prompts:
        check_source(p, 'prompts')
        check_concepts(p, 'prompts')
        variables = set(re.findall(r'\{\{(\w+)\}\}', p['text']))
        require(variables == set(p['variables']), f'{p["id"]}: placeholder mismatch')
        require(p['origin'] == 'site', f'{p["id"]}: prompt is companion-authored')
    for s in starters:
        check_source(s, 'task starters')
        require(s['origin'] == 'site' and len(s['tasks']) == 3, f'{s["id"]}: invalid task starter')
    links = documents['book-links.json']
    require(links['affiliateLinks'] is False, 'No affiliate links were authorized')
    require(all(x['url'].startswith('https://') for x in links['links']), 'Book links must use HTTPS')
    require(documents['approved-quotes.json'] == [], 'This package is intended to contain no direct quotations')
    copy = documents['site-copy.json']
    require(copy['curatorNote']['renderUntilWritten'] is False, 'Do not publish the placeholder curator note')

    report = {'sourceFile': BOOK.relative_to(ROOT).as_posix(), 'chapters': registry,
              'counts': {'concepts': len(concepts), 'practices': len(practices), 'scenarios': len(scenarios),
                         'questions': len(questions), 'prompts': len(prompts), 'roleStarters': len(starters)},
              'sourceReferencesChecked': source_count,
              'scenarioVerdicts': dict(Counter(s['verdict'] for s in scenarios)),
              'lowConfidenceItems': [i['id'] for group in [concepts, practices, scenarios, questions, prompts, starters]
                                     for i in group if i['confidence'] == 'low'],
              'siteOriginItems': {name: [i['id'] for i in group if i['origin'] == 'site']
                                  for name, group in [('practices', practices), ('scenarios', scenarios),
                                                      ('questions', questions), ('prompts', prompts), ('roleStarters', starters)]},
              'errors': errors}
    (ROOT / 'review' / 'content-validation.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    if errors:
        print('FAIL: ' + str(len(errors)) + ' content errors')
        print('\n'.join(errors))
        return 1
    print(f'PASS: {len(concepts)} concepts in {len(themes)} themes; {len(practices)} practices; '
          f'{len(scenarios)} scenarios; {len(questions)} questions; {len(prompts)} prompts; {len(starters)} role starters.')
    print(f'PASS: word limits, source locations ({source_count}), IDs, origins, scenario verdicts and all content cross-links.')
    print('PASS: zero low-confidence items; no approved quotations; curator note remains an unpublished placeholder.')
    return 0

if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        raise SystemExit(2)
