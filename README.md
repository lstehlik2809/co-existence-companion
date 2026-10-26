# Co-Existence practice companion — unofficial companion

A private, browser-only field guide for applying ideas from Ethan Mollick’s *Co-Existence*. Add recurring tasks, test a representative example in your own AI tool, make a considered decision, and commit to one small experiment. The ideas library sits alongside the practice flow.

Not affiliated with or endorsed by Ethan Mollick or the publisher. [Get the book](https://co-existence.ai/).

## Run locally

Python 3.10+ is sufficient. There are no application dependencies, framework or JavaScript build step.

```powershell
python scripts/prepare_site.py
python -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:8000`. Always serve `dist`, which contains only the public artifact. The preparation folder contains private reference material and must never be served directly. Re-run the preparation script after changing application files or content.

A service worker caches the application and prepared content after the first complete load. Offline support requires HTTPS or localhost and an activated service worker. The application works at a GitHub Pages repository subpath, including bookmarked hash routes.

## What is included

- An original interactive frontier demo and a personal SVG task map with an equivalent table.
- Task editing, optional role suggestions, prompt preparation and retained test history.
- Reader-chosen AI, agent, deliberate-personal-work and undecided arrangements, with evidence and decision notes.
- A library of 25 concepts in five themes, 30 practices and 16 unscored judgment scenarios.
- One active experiment, calendar reminder, due check-ins and retained reflections.
- JSON and readable Markdown exports, validated imports, anonymous counts and confirmed deletion.
- Light, dark and system themes, keyboard-accessible controls and responsive layouts.

The map records individual attempts, not a general benchmark or proof of capability between points. A deliberate choice to do work yourself does not imply that AI failed. The ten-day check-in and ninety-day retest intervals are companion defaults.

## Privacy and storage

Entries stay in a single namespaced localStorage key in this browser on this device. There are no accounts, analytics, remote fonts, backend, client API keys or AI connections. Ordinary book links are opened only when a reader chooses them. Copying a prompt and pasting it into another tool is the reader’s action, under that tool’s data practices.

Browser data may be cleared by the browser or device. Export JSON for a complete backup. Storage errors are surfaced; unavailable storage cannot provide persistence. Imports are validated before replacing current data. The data screen provides recovery when stored data is corrupt.

The version-1 schema extends the brief’s example with saved question answers, supporting trial identities, concept reading state and structured experiment history. Adjusting an experiment retains the earlier commitment and observation while continuing one active experiment. The migration entry point is in `js/store.js`.

## Edit prepared content

Edit `content/*.json`; keep IDs stable and preserve chapter references, origin fields and concept/action cross-links. See `content/content-contract.md` for conventions. Mark original exercises and recommendations `origin: "site"`; the interface labels them as companion additions.

The book-grounded material is paraphrased. No direct quotations or book images are used. The supplied preparation package has no low-confidence items. Companion additions include all scenarios, five prompt templates, eight role starters, the interface and theme groupings; practices `write-my-own-starting-view` and `confirm-beyond-the-recording`; and questions `permission-and-data` and `agent-checkpoints`.

The curator note is a user-owned placeholder and is excluded from publication. Do not add an endorsement in the curator’s voice. The private preparation helper must not be rerun after manual content edits without preserving those edits.

## Verification

```powershell
python scripts/validate_content.py
python scripts/check_overlap.py --report review/overlap-check-build.json
node scripts/test_store.mjs
python scripts/prepare_site.py
python scripts/check_publication.py
```

The content validator and overlap checker require the private Markdown book at `book/Co-Existence The Next Phase of AI.md`. The overlap checker also accepts `--book` for another local path. It fails on unapproved sequences of ten or more consecutive source words without printing source passages. It screens literal overlap; it is not a copyright assessment.

`check_publication.py` inspects actual tracked/staged paths and the artifact for private material. Before every commit, also inspect `git status`, `git diff --cached --name-only` and `git ls-files`.

Behavioral checks cover evidence dates, unsupported decisions, experiment adjustment, import validation, lossless round trips and storage recovery. Browser verification and measured audit results are recorded in the private `review/` folder. Do not infer accessibility conformance from an automated score alone.

## Publish to GitHub Pages

The included `.github/workflows/pages.yml` assembles the public allowlist into `dist`, uploads that artifact and deploys it to Pages. Configure the repository’s Pages source as **GitHub Actions**. Push to `main` or run the workflow manually. No reference source is needed in CI.

The tracked application lives at the repository root as requested; the deployed artifact is restricted to app HTML/CSS/JavaScript, the original favicon, manifest and public JSON. `.gitignore` excludes `book/`, `source/`, EPUBs, review material, the private extraction report, preparation brief, curator placeholder and local artifact/tooling output. Never force-add these files.

Visual and product decisions are recorded in `design-plan.md`.
