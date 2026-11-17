# Figures for "Renovate, don't repaint"

Read `SPEC.md` first (figure contract, design system). Each figure below says what a reader must take from it in five seconds, its steps, and its data. Put the data in `data/<id>.json` with the source id on every entry; draw nothing that is not in the data. The article text is `text.md`; the step numbers below match its `@step` lines.

Honesty rules that override looks: where a value is not published, draw the absence (an empty slot with an italic note "not published"), never an estimate. Never connect two measured points with a line that suggests the path between them. Company-reported figures carry a small mono tag `company-reported`.

## Drafts 7 to 9 (17 November 2026): three reader rounds

Twelve readers per round; the log is in dotUni `docs/papers/innovation/loop-draft-6.md`.

- **`permits`**: cars removed. The figure now shows the real schedules: T-Mobile build → launch, checks afterwards; Telekom works council and privacy review → build → launch; the 2021 framework agreement as the shortcut; the conciliation board note. The cars remain one sentence in the text.
- **`roadmap`**: off the page since draft 9. It failed in all three rounds in three forms (icons, Gantt, ladder of equal steps). The numbered list with a measure per step carries section 9. The file stays for his decision.
- **`repaint`** (new, column, 2 steps): "The saving first, taken back later", Klarna (leavers not replaced → hiring again, 15 months) and Commonwealth Bank (45 jobs to go → "error", weeks).
- **`numbers`**: plates cross-fade, so the pinned figure is never blank; the 40/32 nesting note says the overlap isn't published; "−55%" mark.
- **`walls`**: timber cable dropped from above into one bay; brick runs in the upper zone; sockets visibly above the floor; headings "On the surface, painted over" / "Cut in and plastered".
- **`terms`**: one continuous cable between the junction boxes.
- **Print**: larger units in the dot charts; static TrueType fonts.

## Draft 6 (17 November 2026): the readers' fixes

Six independent readers read draft 5 (dotUni `docs/papers/innovation/readers-draft-5.md`); the requirements and the loop are in `docs/papers/innovation/loop-draft-6.md`. Analogies need not all be construction (transcript `2026-11-17-003`): use the real-world picture that is true and explains best.

- **`walls`**: the cable follows the DIN 18015-3 installation zones (along the upper zone, down beside a corner, to a socket near the floor) in all three walls; the brick walls read as plastered, with the brick visible only in the cut and in a broken-away patch.
- **`terms`**: the cable joins two junction boxes (a lead between two wall sockets is a lethal double plug); the agent "acts in a loop".
- **`permits`**: now cars, because buildings are inspected before occupancy in both countries. United States: the maker certifies itself, tests and recalls come afterwards (FR-2020-28107). Germany and the EU: type approval before any car is sold (EU-2018-858). The 2021 standing agreement is the type approval; a system outside it needs its own approval, the long way.
- **`roadmap`**: a renovation schedule of an occupied house in a true order: survey, plan and materials, approval, trades first, the main supply, room by room with the keys in steps, running it; people at home throughout; inspected at every step.
- **`obstacles`**: the accent is on missing knowledge, which the section is about; the law rows are marked quietly.
- **`exits`**, **`attitudes`**: labels enlarged for laptop screens.
- **`pairs`**: moved to an appendix; the text keeps a two-sentence summary.

## Draft 5 (16 November 2026, evening): the building analogy

Alexander's rule for this article (dotUni transcripts `2026-11-16-019`, `-020`): every hard idea is explained with an everyday analogy, and the main one is his father's, a civil engineer: American houses are timber frames, so new wiring is pulled through hollow walls; German houses are mostly masonry, so a new cable means a channel cut and plastered. **The analogy is drawn in its own world. No AI agents, robots, screens or office workers inside it.** The plan with the analogy dictionary and the storyboard is in arudaev/dotUni `docs/papers/innovation/plan-restart.md`.

Retired in draft 5: `path` (its point did not come across; replaced by `permits`) and the margin scene `house` (distracting). Their files stay for reference; the text no longer uses them. The five house directions of the same day (`house-a` to `house-e`, branch `feat/renovate-house-directions`) were all rejected.

New in draft 5:

- **`walls`** (figure, column, 3 steps, the hero): the same new cable added to a timber stud wall and to a brick wall. Five-second reading: "the same job is quick in one wall and building work in the other". Sources: NAHB-2026, DESTATIS-2021, BAUNETZ-DIN18015.
- **`terms`** (figure, column, 2 steps): four everyday pictures for the parts of an AI system: apprentice (language model), plans archive (retrieval), keys (an agent's permissions), wiring (connections). Five-second reading: "what people picture as AI is only the apprentice".
- **`permits`** (figure, column, 3 steps): one decision as two construction schedules on one time axis: Germany checks before the work, the US after; a pre-approved standard design (Telekom's 2021 framework agreement) keeps the German permit short. Facts and ids from `data/path.json`.
- **`roadmap`** (figure, wide, 5 steps): the renovation of an occupied building in order: survey, foundations, wiring with keys in steps, fit-out with the residents, inspection while building; "the residents stay" (no dismissals for business reasons until the end of 2028) under all phases.

## `numbers` (scene, 5 steps): what the 40% and the 55% are

Five-second reading, steps 0 to 2: "the announcement said 40 of 100 contacts; the company's own slide says 32, and those are contacts that start with the software, not ones it finished". Steps 3 and 4: "a customer account contacted care 7 times a year in 2021 and about 3 times in 2026; the software agents arrived late in that fall".

- Plate A (steps 0 to 2): 100 dots in a 10 by 10 grid, note "100 contacts from contract customers, Q2 2026".
  - Step 0: 40 dots carry a thin dashed outline, note "release: 40 handled by AI agents" (source R6-01). Nothing is filled, because this figure is not in T-Mobile's own material.
  - Step 1: 32 dots fill with the accent, note "T-Mobile's slide: 32 served by an AI agent" (R6-06). The other 8 keep the dashed outline with the note "not in T-Mobile's material".
  - Step 2: the 32 gain a bracket with the note "start with the software" and a second, empty bracket "finished by the software: not published" (R6-02).
- Plate B (steps 3 and 4): plate A shrinks to a corner; a time axis from Q4 2021 to Q2 2026 appears.
  - Step 3: two "year strips", one per measured point: a strip is one year for one account, with one tick per contact. 2021: 7.0 ticks, evenly spaced, note "7.0 contacts a year, about one every seven weeks". 2026: 3.1 ticks (three ticks and a tenth-length one), note "3.1 a year, about one every four months" (R6-06). The years between show empty strips with "not published".
  - Step 4: a vertical hairline at September 2024 with the note "agent platform announced" (R6-08), and two short notes on the left part of the axis: "problems removed before customers call" and "customers use the app" with "named by T-Mobile" (R6-14). No line joins the two measured points.
- Print composite: plate A at step 2 on the left, plate B at step 4 on the right.

## `pairs` (figure, wide): ten pairs that cannot be compared

Five-second reading: "each row sets an American figure against a German one, and in every row they count different things".

A designed table, not a chart. Ten rows. Columns: what is counted; United States; Germany; why they do not compare. The two values of a row sit on two short measuring strips that visibly do not share a scale or unit (different tick spacing, unit written at the end of each strip). The last column is one italic line. Row 6 is the only one marked "partly comparable". No red, no crosses.

| # | What | United States | Germany | Why not |
| --- | --- | --- | --- | --- |
| 1 | Fewer contacts | more than 55% fewer contacts per account, Q4 2021 to Q2 2026 (achieved) | 50 to 55% fewer calls and chats by 2030 against 2023 (target) | achieved against target; per account against absolute |
| 2 | Share handled by AI | about 32% of contract customers' contacts start with an AI agent, Q2 2026 | "every customer interaction … handled by AI or even assisted" | started by AI against touched by AI |
| 3 | Chatbot success | 78% of chats never reach a person, Q2 2026 (25% in Q2 2024) | more than a third of requests resolved immediately, 2024 | not reaching a person is not the same as resolved |
| 4 | Volume | no absolute number published | 2.6 million calls deflected by bots, first half of 2026 (Europe column of the slide; another slide gives 2.1 million for Germany) | no American number, no German total |
| 5 | Voice bot | 21% more handled automatically than by the old phone menu | none for Germany; 49% in Greece for one product | other country, other measure |
| 6 | Help for staff | assistant used in 74% of interactions; satisfaction up 12% where used | more than 12,000 staff on one desktop; calls 7% shorter | both assist people; different measures (partly comparable) |
| 7 | Done digitally | more than 80% of upgrades, Q3 2026 | up to 70% of tariff changes by 2030 (target) | different transactions; achieved against target |
| 8 | Satisfaction | score of 46 (one survey) | score above 67 (another kind of score) | two different scores |
| 9 | Savings | about 3 billion dollars of profit contribution by 2027 against 2025 | about 2.5 billion euros gross by 2030 against 2023, whole group outside the US | scope, measure and base year differ |
| 10 | Cost of staff change | 531 million dollars of severance to September 2026 | not published | only one side is filed |

Sources for all rows: R6-06, R6-02, R6-03, R6-04, R6-16, R6-12, R6-14, R6-09, R6-11, R6-01, R10-50. The figure's own note: "None compares fully; row 6 does in part."

## `obstacles` (scene, 2 steps): why German firms decided against AI

Five-second reading: "missing knowledge comes first; the law comes second and third".

- Step 0: all six rows; missing knowledge in the field and the accent, 72% ringed, "first: know-how".
- Step 1: unclear legal consequences (62%) and data protection (60%) take the field and the accent with the bracket "the law: second and third" (section 7 picks them up); missing knowledge back to plain ink, its label stays, muted.
- Print: as before, knowledge in the field and the law rows marked quietly by the bracket.

Six rows of unit dots, one dot is 2 percentage points, 50 dots to a full row, counted from zero at the left. Order as given. Missing knowledge in the accent; the two legal rows marked quietly, the others in ink. The value in mono at the end of each row. Note at the top row: "one dot is 2% of firms". Source R7-06 (Federal Statistical Office, 2025; firms that considered AI and do not use it; several answers possible; the six most named of the listed reasons are shown, and the figure's note says so).

| Reason | % |
| --- | --- |
| Missing knowledge | 72 |
| Unclear legal consequences | 62 |
| Data protection | 60 |
| Systems that do not fit | 45 |
| Data not available or not good enough | 44 |
| Cost | 32 |

## `path` (scene, 9 steps): one decision on both sides

Five-second reading at the last step: "in the US the decision goes straight to launch and the checks come after; in Germany it passes several gates first, and the way out by dismissal is shut until the end of 2028".

Two horizontal tracks, United States above, Germany below. At the left of each a filled dot, "the decision: let a software agent act on accounts". At the right a small flag, "launch". Small dots travel along the tracks (the Processing touch: gentle, seeded, idle only). A gate is a short vertical bar across the track with a gap that dots pass through; its holder is written above in Libre Franklin, its basis below in mono.

- Step 0: both tracks, empty.
- Step 1: US track draws from left to right to the flag. Note over it: "announced September 2024 → a third of contract customers' calls by mid-2026, about 21 months" (R6-08, R6-06). A faint struck slot labelled "no works council" (R11-36).
- Step 2: after the US flag, three marks in a row: "caller authentication (every call)" (R11-40), "state rules from 2027" (R11-41), "lawsuits" (R11-43). Bracket: "after launch".
- Step 3: German gate 1 appears: "Works council is told at the planning stage", basis "§ 90 BetrVG" (R11-05).
- Step 4: gate 2: "Works council agrees, or a conciliation committee decides", basis "§ 87(1) no. 6, § 76 BetrVG" (R11-07, R11-08). Italic note: "applies to systems suited to monitoring staff".
- Step 5: gates 3 and 4: "Privacy and security approval", basis "company procedure" (R11-21); "Impact assessment · AI Act duties", basis "GDPR Art. 35 · AI Act Art. 50" (R11-22, R9-04). Six small unlabelled ticks stand for the other gates, with the note "6 more in the research".
- Step 6: after the launch flag on both tracks a second stretch, "taking the saving". US: an open way marked "dismissal: management decides, 60 days' notice for a mass layoff" (R11-34, R11-35). Germany: a shut gate marked "no dismissals for business reasons until 31 Dec 2028" (R11-14) and a side track leaving downward: "about 4,000 a year leave by agreed routes" (R12-01).
- Step 7: gate 2 opens out into a queue: many dots waiting in a line, note "until 2021: six weeks per system, sometimes over a hundred in one meeting" (R11-12).
- Step 8: the queue becomes a sieve: dots that fit a small template pass without stopping, note "since 2021: a profile checked against agreed rules"; one dot of a different shape is led aside to a closed box with a question mark, "a screen that listens to calls: own agreement, not public" (R11-12).
- Phone layout (`tall`): the two tracks run top to bottom, side by side.

## `exits` (scene, 3 steps): the agreed routes out

Five-second reading: "about four thousand positions a year leave Telekom in Germany by agreed routes, most by partial retirement; severance is the one that doubled".

- Step 0: one stack of marks per year, routes not told apart, the totals above each stack and "about 4,000 a year" (data: `average`, 20,223 over five years, rounded as in the text).
- Step 1: each stack splits into the five routes on shared base lines; route labels arrive.
- Step 2: severance in the field and the accent, "526 in 2021 → 1,016 in 2025" and the ring; the other routes step back to a muted grey (screen only; print keeps them in ink).
- One mark is 50 positions (data: `unit`), not 25 as the paragraph below first said.

Five columns, 2021 to 2025. Each column is a stack of unit marks, one mark is 25 full-time positions, grouped by route in this order from the bottom: partial retirement, retirement of civil servants, severance, early retirement, transfers to public authorities. Routes are told apart by position and a label at the right edge joined by a thin leader, not by a colour legend. Severance marks in the accent; one pen-like ring around the 2025 severance group with the italic note "526 in 2021 → 1,016 in 2025". The yearly total in mono above each column. Source R12-01 (Deutsche Telekom, HR Factbook 2025). The totals are the article's own addition; say so in a small note.

| Route | 2021 | 2022 | 2023 | 2024 | 2025 |
| --- | --- | --- | --- | --- | --- |
| Partial retirement | 2,444 | 2,086 | 2,201 | 2,399 | 2,294 |
| Retirement of civil servants | 630 | 1,183 | 995 | 1,213 | 595 |
| Severance | 526 | 619 | 551 | 760 | 1,016 |
| Early retirement | 66 | 79 | 54 | 39 | 47 |
| Transfers to public authorities | 70 | 49 | 259 | 37 | 11 |
| Total | 3,736 | 4,016 | 4,060 | 4,448 | 3,963 |

## `attitudes` (scene, 3 steps): the same questions in both countries

Five-second reading: "Germans are not more wary of AI than Americans; what stands out is that Germans reject monitoring of workers".

Step n shows question n in full ink; the questions before it stay and step back to the muted colour. The third (EU only, 79%) is the one in the field, the worry the text says to answer first. Print shows all three in ink, as before.

Three small panels, each a pair of 100-dot strips (one dot is 1%).

1. "AI will eliminate jobs rather than create them": Germany 61, United States 67. Ipsos for Google, 2025, 21 countries (R12-25).
2. "I trust my government to regulate AI responsibly": Germany 49, United States 31. Ipsos AI Monitor, 2025, 30 countries (R12-25).
3. "Digital monitoring of workers: negative": Germany 79. One strip only, with the note "second-highest in the EU, after Sweden's 80%; asked in the EU only" (R12-28).

Never place panel 3 as if it compared with the US.

## `house` (margin scene, 6 states): where the text is

A small exact drawing of a house in section, drawn in ink line with the accent field behind one part at a time. Parts from the ground up: foundations ("customer data, who is calling"), wiring ("own software"), rooms ("service: agent and staff"), the supply line entering from the side ("models from outside"), the inspector's mark at the door ("gates"), and the coat of paint on the outside ("the agent everyone sees"). One or two words per label, set in mono, shown only for the part that is active.

- State 0 (opening): the paint is the field; label "what was announced".
- State 1 (section 3): foundations and wiring are the field; label "what T-Mobile did first".
- State 2 (section 4): foundations drawn as unfinished (dashed), label "Telekom: planned work".
- State 3 (section 5): the supply line is the field; label "bought from outside".
- State 4 (section 6): the inspector's mark at the door is the field; label "gates before launch".
- State 5 (section 7): a closed back door; label "no dismissals until 2028".

On phones and in print each state is a small figure at the start of its section.

## Hero

If `art/house-line.png` and `art/house-field.png` exist, the shell shows them behind the title (line layer over field layer, the field in the article's accent). If they do not exist, the title stands alone. Do not draw a substitute.
