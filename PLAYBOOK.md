# Playbook: how these articles are made and reviewed

This is the method behind both articles, written down so the next piece starts where this one ended. It joins three things:

- The **compound-engineering loop**: brainstorm, plan, work, simplify, review, compound.
- **Independent readers**: fresh reviewers, each reading as a real person in the audience would.
- **The papers playbook**: gates, a stop rule and a record of every decision.

It was worked out on "Renovate, don't repaint" between 15 and 17 November 2026. Its first real run took the article from a draft its author would not sign to one where twelve independent readers agreed on 7–8 out of 10. That run is recorded in arudaev/dotUni, `docs/papers/innovation/loop-draft-6.md`.

## The loop

```mermaid
flowchart TD
    A([His words<br/>saved verbatim]) --> B[Brainstorm<br/>requirements from every reader finding]
    B --> P[Plan<br/>each requirement → a file, a change, 'done when']
    P --> W[Work<br/>text, figures, engine;<br/>builders in parallel, one file set each]
    W --> V{Gates}
    V -- fails --> W
    V -- pass --> S[Simplify<br/>remove what the change made unnecessary]
    S --> C[Commit and push<br/>to the open PR branch]
    C --> R[Review<br/>12 fresh independent readers]
    R --> L[Round log<br/>scores, convergent findings,<br/>what was not taken and why]
    L --> D{Median ≥ 9?<br/>or 3 rounds done?}
    D -- "no, rounds left" --> B
    D -- "yes" --> K[Compound<br/>lessons, memory, handoff, PR bodies]
    D -- "3 rounds, under target" --> X[Limits<br/>he decides or the weak part is cut]
    X --> K
    K --> H([His read])
    classDef gate fill:#fdf0cf,stroke:#b7791f,color:#4a3405
    class V,D gate
```

## The steps, concretely

| Step | What it means here | Output |
| --- | --- | --- |
| **His words** | Save every message from Alexander verbatim before acting on it. The words decide; summaries drift | `dotUni/.docs/transcripts/YYYY-MM-DD-NNN-slug.txt` |
| **Brainstorm** | Read every reader report. Sort each finding: fact, analogy, argument, reading flow, visual, print, voice, web. Mark who raised it. Two readers, or the specialist for the point, make a finding *convergent*; one reader's taste is noted, not obeyed. A reader's misreading of a number is a legibility fault, not a fact error | A numbered requirements list, each with the readers who raised it |
| **Plan** | Each requirement becomes one change in a named file, with "done when". Decide what is *not* taken and why (his explicit instructions beat any critic) | The plan table in the loop log |
| **Work** | Text edits by hand. Figures by builders in parallel, each owning one file set and checking its own lab shots. Engine changes by hand, checked on both articles | Commits on the PR branch |
| **Gates** | Must pass before any reader sees the piece (below). A failed gate is fixed, never scored | Clean tool output |
| **Simplify** | Reread the diff: duplicated helpers move to `lib/`, unused imports go, padding sentences go | A smaller diff |
| **Review** | Twelve new readers per round (Opus, medium effort), blind to earlier rounds and to our opinion. Each writes its full report to a file and replies with scores only | `readers/rN-<persona>.md` |
| **Round log** | Scores table, convergent findings, the changes they led to, and what was not taken | `loop-draft-6.md` (or the next piece's log) |
| **Compound** | What the round taught, as rules: lessons log, memory, the handoff, the PR bodies | `lessons.md`, memory, `HANDOFF.md` |

## The readers

The panel is the audience the piece will really meet, plus three auditors. Name people by role only.

| Reader | Reads | Asks |
| --- | --- | --- |
| Curious non-specialist | phone, then paper | Does the idea get through to someone who pictures Jarvis? |
| LinkedIn professional | phone | Would I stop scrolling, finish, share, connect? |
| Student AI community member | laptop, then paper | Accurate, worth featuring, can others build on it? |
| Engineering lead, hiring | laptop, then paper | What does this say about the author as a colleague? |
| First boss, academic mentor | paper, then laptop | Rigour, judgement, growth |
| A civil engineer (the analogy's source) | paper, then laptop | Is the building right? A trade reviewer for every technical analogy |
| The course professor | paper, then laptop | The assignment, theory, remedies, pass or fail, questions for the talk |
| Head of IT, German Mittelstand | laptop, then paper | Practical truth; what is missing in operations |
| ML engineer | laptop, then paper | Technical accuracy for the field |
| Visual editor | laptop, phone, paper | Does each figure carry its point? Five-second read against the caption |
| **Fact checker** (web access) | paper and sources | Every number; order and cause words (*before*, *while*, *because*); what a percentage actually measures |
| **Voice and slop critic** | paper plus a tone sample | Does a person come through? Machine patterns, quoted, with rewrites |

For the web version, add device and craft auditors: a **web QA** reader who goes through every device and orientation, and a **performance and accessibility** auditor working from measured traces (see the web gates).

**Rubric.** Each reader scores four things from 1 to 10: visuals, argument, reading and overall. Each also names the three lines or figures that cost the most points, with a one-sentence fix. A score of 9 means "I'd recommend it without reservation"; 7 means "good, with clear flaws".

**Brief, every time.** Each brief gives the persona, the material and the reading order. It asks for the experience, not edits: first impression, reactions as they happen, each figure read before and after its caption, the idea in two sentences, feelings, the impression of the author, and how the devices differ. It names the output file. It never includes earlier scores, our opinion, or another reader's report.

## Gates

Checked before every round, with the tools in `tools/`:

- **Facts.** Every claim has a source in `sources.json` that was opened. The build fails on an unknown id.
- **Render.**
  - `node tools/read.mjs <slug>` reports no problems: passages and the pinned figure stay in step, with no empty stretches.
  - `node tools/shots.mjs <slug> --matrix` is clean at 17 sizes: no overflow, no text below the size floor.
  - The lab audit (`.shots/lab/shoot.mjs`) is clean for every changed figure, in wide, tall and print.
- **Print.**
  - No page more than a quarter empty except the last.
  - Figures appear in order.
  - Every font is embedded as TrueType (`pdffonts` shows no Type 3).
  - Readers get pages rendered with `pdftocairo`. MiKTeX's `pdftoppm` cuts slits into small dots, and readers took them for broken glyphs.
- **Web.**
  - `node tools/perf.mjs <slug>` reports no long task over 50 ms while scrolling, a layout shift score below 0.05, and frames within budget at phone, tablet and laptop sizes in both orientations.
  - Social cards render, and the metadata validates.
- **Text.** No em dashes (en dashes only), no invisible characters, and dotUni's text gate passes for the records.

## Stop rule

The aim is every reader at 8 or more and a median near 9. Seven is acceptable when the objection is a matter of taste. The playbook allows **three fix rounds**. If a weakness survives two rounds, the plan for that part is wrong, not the draft: redesign it rather than patching it. After three rounds under target, the part goes to **Limits**: he decides, or it is cut. Its code stays in the repo.

## What the first run taught

- **The median is the honest number.** Twelve fresh readers give a stable median, ±1 per reader between rounds. Fixes move the convergent complaints; the median moves only when the case or the structure changes.
- **The fact checker earns its place every round.** It found errors in the thesis sentence itself in all three rounds that no other panel caught: the order of T-Mobile's rewiring, which programme the severance belonged to, contacts against calls, and recommendations shown against recommendations used.
- **A technical analogy needs a trade reviewer.** Lay readers never see the errors: a cable route against DIN 18015-3, a lethal double plug, a building permit rule. The one expert who does see them stops trusting the rest.
- **An analogy for one point stays a sentence.** Where the real facts can be drawn (the law: checks after launch against before), draw the facts.
- **Cut what fails three times.** The renovation-order figure failed as icons, as a Gantt chart and as a ladder. The numbered list with measures did the job.
- **Readers write their own files.** Twelve reports per round fit into one working session only if each reader saves its report and returns only the scores.

- **Render the reading material in one step, right before readers start.** In the second web round the paper pages predated that round's text fixes, and the fact checker checked stale wording. Device sheets, paper pages and the built site come from the same build.
- **A layout rule touches every block type.** Centring the text column when there's no margin rail made the column jump sideways between body, scenes and stills. Check left edges of every text block on every device after any layout change.
- **A web fix creates the next complaint.** Readers judge the experience as it is, so each fix needs a fresh look on all six devices, not only the one where the complaint came from.

## Tools

```
node lib/build.mjs                         # build dist/
node tools/sources.mjs <slug>              # rebuild sources.json after adding a source
node tools/read.mjs <slug>                 # scene timing and passage checks
node tools/shots.mjs <slug> [--quick|--matrix]   # screenshots, device matrix, print PDF
node tools/filmstrip.mjs <slug> <w> <h> <per>    # read-through sheets for readers
node tools/devices.mjs <slug>              # read-through sheets for every device and orientation
node tools/perf.mjs <slug>                 # scroll trace: long tasks, layout shift, frames
node tools/cards.mjs                       # social preview images
node .shots/lab/shoot.mjs name="fig=<id>&layout=wide&step=2&t=1"   # one figure state
pdftocairo -r 110 -png .shots/<slug>/print.pdf <out>/page          # paper pages for readers
```
