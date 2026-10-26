# A field guide to your own frontier

Implementation plan for the unofficial Co-Existence practice companion. The current request to implement the prepared materials supersedes the preparation package's deferred build status.

## Visual direction

A working atlas: quiet blue-gray paper, dark ink, fine rules, generous space and an original radial evidence map. The map is the visual anchor rather than a decorative AI illustration. No book cover, extracted image, remote asset or reproduced figure is used.

| Color | Light | Dark | Purpose |
| --- | --- | --- | --- |
| Paper | `#f4f6f8` | `#111c26` | Main surface |
| Sheet | `#ffffff` | `#192833` | Forms and map surface |
| Ink | `#172f42` | `#edf3f8` | Text and primary actions |
| Tide | `#176b5b` | `#83d9bc` | Excellent results |
| Iris | `#6656a6` | `#c2b3f2` | Usable with fixes |
| Ochre | `#944a26` | `#f3b48e` | Failed results and retest notes |

Marker shapes accompany colors. Untested tasks use open circles; deliberate personal work gets an outer diamond. Subtle rules and flat surfaces separate sections without repeated floating cards.

## Typography

System fonts only: Georgia for large editorial headings; Segoe UI/system-ui for interface text; Consolas/ui-monospace for map annotations and step numbers. Type scale: 12, 14, 16, 20, 28, 40 and 64 pixels, with fluid headline sizing. Body text is at least 16 pixels and line length stays around 65 characters.

## Layout

Desktop uses a persistent left navigation and a large, flexible workspace. Mobile stacks the brand, horizontal step navigation and main content. Every view has a clear next action. Forms use visible labels and the map always has an equivalent task table.

```text
Start, desktop
+------------------+--------------------------------------------------+
| Co-Existence     | Unofficial practice companion        Theme       |
| Field guide      +-------------------------+------------------------+
|                  | Find where AI helps     | Interactive frontier   |
| 01 Map your work | in your work            |                        |
| 02 Run a test    |                         | Generic demo tasks     |
| 03 Decide       | [Start your map]         | Pick a result to see   |
| 04 Judgment      | [Understand the ideas]  | the map change         |
| 05 Experiment    +-------------------------+------------------------+
|                  | Book note + Get the book                        |
| Ideas library    +--------------------------------------------------+
| About / My data  | Privacy + non-endorsement                        |
+------------------+--------------------------------------------------+

Map, desktop
+------------------+--------------------------------------------------+
| Navigation       | Your frontier                  [Add a task]      |
|                  +---------------------------+----------------------+
|                  | Radial map                | Task editor          |
|                  | Now / 90 days ago         | Name, frequency,     |
|                  |                           | minutes, difficulty  |
|                  +---------------------------+----------------------+
|                  | Accessible task table with edit / test / decide  |
+------------------+--------------------------------------------------+

Task workflow
+------------------+--------------------------------------------------+
| Navigation       | Task selector + stage introduction               |
|                  | Prior evidence / relevant concept links          |
|                  | Prompt fields OR decision questions              |
|                  | Record result OR save decision                   |
|                  | Task history OR relevant practices               |
+------------------+--------------------------------------------------+

Mobile
+-----------------------------+
| Brand             Theme     |
| 01 Map  02 Test  03 Decide   |
| Ideas  About  My data        |
+-----------------------------+
| Page title                  |
| Map / main explanation      |
| Form / next action          |
| Text alternative / history  |
| Credits                     |
+-----------------------------+
```

## The evidence map

Task difficulty controls radius. A task's stable position in the task list controls angle. Shape and color encode its latest recorded outcome. The dashed outline joins only neighboring tasks that both have excellent or fixable results; a failed or untested task breaks it, so the outline never encloses or crosses a result it does not represent, and it does not claim that the intervening territory has been tested. Ring labels sit on the bisector between the first and last task, clear of every task's spoke. A historical view uses tests recorded on or before the comparison date. The comparison view keeps current markers, draws the outline from 90 days ago as a muted band beneath the current one and rings tasks whose result changed. Deliberately kept tasks remain separate from capability outcomes.

## Content and state decisions

The prepared JSON supplies the library, questions, practices, prompts and role suggestions. Context concepts end with their reading pointer. Companion additions are labeled. The curator's placeholder remains unpublished.

The version-1 store extends the brief's example with decision answers and supporting test identity, concept reading state, and structured check-in reflections. A migration function provides the future version boundary. An adjusted experiment retains its observations and continues as the sole active experiment with a new check-in. A not-tried entry never refreshes the date of real evidence. A keep-deliberately choice is possible before testing, as recommended in the prepared review; using AI or an agent requires recorded evidence.

## Delivery and verification

The public artifact is assembled using an explicit file allowlist, including only app files and publishable JSON. The private book, review folder, preparation brief and author-only reports cannot enter the served directory. GitHub Actions deploys this same artifact to GitHub Pages.

Verify the complete flow, JSON round trip, malformed import, storage failure handling, single-active experiment and adjustments, history, calendar output, due check-ins and retest boundaries. Run the supplied content and overlap checks, inspect tracked files, review light/dark layouts at 360 and 1280 pixels, and measure accessibility/performance. Report any check that cannot be completed.

## Decision and chart contract

Applied skills: Design Decision Dashboards and Create Good Charts. This is an analytical personal workspace for a reader reviewing recurring work after individual trials and at check-ins. The primary question is: which task should I test, reconsider or try differently next? The Map page answers it directly in a short "What to do next" list (overdue retests first, then tested tasks without a current choice, then untested tasks), and its closing action follows the first item. The reading journey is orientation, observed result, evidence detail, then a reader-chosen next step. It does not estimate organization-wide productivity or an occupation's replaceability.

| Display | Definition and scope | Comparison / missingness | Next step |
| --- | --- | --- | --- |
| Difficulty | Reader's integer rating, 1–5, per task; radius increases linearly | Same domain in current and historical views; not an objective benchmark | Edit task or inspect evidence |
| Result marker | Categorical outcome of a particular trial, with tool and date in detail | No result is untested, never zero or failed; explicit not-tried status keeps earlier real evidence in history | Test or retest the task |
| Historical result | Latest actual trial on or before the displayed cutoff | No prior evidence remains unknown; today's result cannot stand in for a past one | Compare attempts, then retest if useful |
| Personal-work marker | Reader's deliberate decision, separate from trial outcome | Neither AI failure nor evidence of permanent human exclusivity | Review the reason or revise the arrangement |
| Change since 90 days ago | Latest result on or before the cutoff differs from the current result, including untested to tested | A ring and a table note; not a trend or rate | Compare attempts in the task's history |
| Retest flag | At least 90 calendar days since the last actual attempt | A companion default, independent of the latest not-tried status | Run another representative test |
| Task / trial counts | Counts of distinct tasks and actual attempt records, respectively | Attempts are events, tasks are entities; no success percentage is inferred | Inspect the records |

The radial map is required by the brief and helps readers recognize their own uneven set of tasks. An aligned dot plot would support more precise comparisons of difficulty; the adjacent table is better for exact lookup, outcome, tool, date and decision. Therefore the map remains an orientation device, with a fixed 1–5 scale and equivalent table. Angular position is task order, not a measured variable. The connecting outline is schematic: its area is not a quantity, success rate or validated territory. It must not obscure failures or unknowns.

Controls have local scope: the evidence selector (now, now vs 90 days ago, 90 days ago) changes the map's evidence cutoff and the table's evidence column, while task selection changes the task being tested or decided on. Full JSON/Markdown exports retain all records, rather than silently exporting only the visible task. The anonymous export contains counts/categories only. Demo observations are clearly labeled examples and never populate the reader's map.

Visual verification includes all ten dashboard failure checks: clear journey, deliberate hierarchy, useful map space, curated table, local scale labels, visible results, purposeful repetition, semantic colors, legible typography and consistent spacing/scales. Agent inspection is preliminary usability review, not representative-user testing.

## Revisions after the design audit (2026-10-26)

- The frontier outline joins neighboring successes only; ring labels moved off task 01's spoke.
- The Map page leads with "What to do next"; on narrow screens the task notes stack per task instead of scrolling sideways, and the step navigation wraps.
- Small text follows the type scale (12, 14 and 16 pixels); the map key is at least 12 pixels.
- Practice and experiment commitments read "rather than", which is grammatical with the bare-verb habits used in the content and by readers. This adapts the brief's "instead of" template.
- Decisions open with the brief's core questions; the other applicable questions sit under "Think it through further" and are still saved with the decision.
- Concept cards link practices by their behavior and scenarios by role; internal links no longer carry the outbound arrow.
