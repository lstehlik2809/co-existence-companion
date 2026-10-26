# Content handoff

This package stops at the first content checkpoint in the brief. It contains data and supporting copy for review. It does not approve a visual design, implement a user flow or create a site.

## Files and identity

The concept, practice, scenario, question, prompt and role-starter files are JSON arrays. The big picture, site copy and book links are objects. The quote file is an empty array. Use each item’s stable `id` for references; display titles are editable. Theme IDs are defined in `big-picture.json`.

The numbered questions, role suggestions, site wording and prompt templates are companion authoring. They do not reproduce the book’s organization. The concept library uses five themes created for this companion.

## Provenance

- `origin: "book"` means the underlying idea or advice is supported by the supplied book. The wording and implementation-intention format are newly written. It does not mean that the author wrote this text or endorsed the companion.
- `origin: "site"` means the item or exercise was created for this companion. Its `source` identifies inspiration, rather than claiming that the author prescribed that exercise or its exact answer.
- `additionalSources` supplies further support when an entry combines related ideas.
- `source.chapter` is a string number, or `Introduction`. `section` is an actual heading or chapter title in the supplied Markdown. `anchor` is the source chapter’s EPUB anchor, for local verification only. Do not turn it into a public link to a book file.
- Two long section names are represented by the chapter title plus `lineStart` and `lineEnd` in the supplied Markdown. This retains precise references without placing a ten-word verbatim heading in the public text. The user-facing pointer remains the chapter number.
- `confidence` measures confidence in the attribution or the exercise’s grounding. It does not certify the empirical claims in the cited research or the reliability of an AI model. The package does not independently replicate or audit those studies.

In the later interface, show a chapter pointer on sourced content and a visible **Companion addition** label for site-origin material. Use the special Introduction pointer where needed. `book-links.json` and `site-copy.json` are companion metadata and inherit `origin: "site"` from their top-level objects.

No direct quotations are used. Do not add one without a chapter attribution and an approved-quotes entry; the brief limits each quotation to fewer than 15 words and one per chapter. The overlap script checks that list’s length rules.

## Links and actions

Every practice and scenario points to its related concepts. Concepts contain the matching reverse links. Question and prompt `conceptIds` support a later explanation link. The validator checks these references.

A concept with `kind: "context"` has no attached practices or scenarios. Its card should end with its reading pointer. A `practice` concept has at least one linked action. Do not add artificial habits to make a context idea look actionable.

Practice `when`, `do` and `insteadOf` fields form a readable implementation intention. `lens` is a filtering aid, not a claim that the book uses these six categories.

## Scenarios

Every scenario is an original companion addition. `recommendedOptionIds` makes the editorial feedback usable without putting quiz logic in the text:

- `one-best`: one option best fits the stated situation; it is not a universal rule.
- `several-defensible`: the listed options are reasonable under the stated constraints.
- `depends`: no preferred option is encoded; the feedback identifies what would change the judgment.

Show feedback for the chosen option and allow readers to inspect the alternatives. These fields must not generate a percentage, leaderboard or score. Attribution confidence is separate from certainty about an answer.

## Decision questions

`appliesTo` uses these values: `before-test`, `all-decisions`, `use-ai`, `delegate-agent`, `keep-deliberately`, `undecided`. `before-test` questions appear before inputs leave the browser; `all-decisions` questions inform every decision.

`recordFields` names information the later implementation needs to retain. It is a proposed content contract, not an implemented storage schema. Several fields and the concept reading marker are absent from the brief’s version-1 storage example; resolve that gap before building storage.

`routingGuidance` is human-readable guidance for the builder, not an automatic decision rule. The person chooses the arrangement. A strong output does not automatically authorize agent delegation; high stakes do not automatically imply that human-only work is safer. See the review report’s discussion of keeping a task deliberately before running an AI test.

The “Use AI” choice retains two working modes: separate handoffs and close collaboration. The agent choice corresponds to delegated execution. Checkpoints should fit the consequences of the task; continuous human involvement is not the definition of agent delegation.

## Prompts and task suggestions

Prompt placeholders use `{{variableName}}`; every variable is declared in the item. Fill them from explicit reader input or keep a visibly editable placeholder. Never invent a task’s goal, audience or success criteria. Readers review the prompt and paste it into their own tool. The site must not send it anywhere.

Role suggestions are optional examples, not a prefilled personal map or claims about whole occupations. The reader chooses and edits tasks that reflect their own work. The prompt templates do not ask the AI to grade itself as an independent verifier.

## Credits, privacy and placeholders

Use the unofficial-companion title and non-endorsement text in `site-copy.json`. Keep the book link visible on the start and About screens and in the footer. The verified outbound links live in `book-links.json`; they are plain links with no affiliate parameters. No remote image, font, embed, prefetch or tracking request is needed.

The curator note is user-owned. Its placeholder is deliberately unpublished. Do not display it or invent a first-person endorsement.

Browser-only privacy copy describes the intended site. It is not evidence that storage, deletion, exports or offline use have already been implemented. The later build must substantiate those statements.

## Content quality gates

Run the two Python checks from the README after edits. Review the meaning of source references as well as whether a heading exists. The validator checks structural consistency and source locations, not semantic truth.

Before a public commit, check the actual staged files and tracked history for source leakage. Before deployment, perform the functional, accessibility, performance, responsive-layout and offline checks required in the brief. None of those site checks can be claimed from this preparation package.
