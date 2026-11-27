# Figures for "Renovate, don't repaint"

Read `SPEC.md` first (figure contract, design system). Each figure below says what a reader must take from it in five seconds, its steps, and its data. Put the data in `data/<id>.json` with the source id on every entry; draw nothing that is not in the data. The article text is `text.md`; the step numbers below match its `@step` lines.

Honesty rules that override looks: where a value is not published, draw the absence (an empty slot with an italic note "not published"), never an estimate. Never connect two measured points with a line that suggests the path between them. Company-reported figures carry a small mono tag `company-reported`.

## Motion timing (17 November 2026): triggered by scroll, played by time

A step now starts when its passage is reached and plays its timeline (t 0 to 1) over a set time; each figure exports `durations` in seconds, one per step (dotUni `docs/papers/innovation/loop-motion.md`). Inside a step things arrive in reading order at least 0.15 s apart, a label 0.2 to 0.4 s after what it names, and the timeline is busy over about 75% or more of t (measured as in `tools/timing.mjs`).

- **`walls`** `[2.8, 2.0, 3.0]`: step 1, the cable starts at once (0.02) and the three arrive 0.12 apart; the tag and its leaders end at 0.92.
- **`terms`** `[1.8, 2.4]`: step 0, the handbook, its name and the note "what people picture" spread over 0.02 to 0.92 (was done by 0.82 with a pause).
- **`numbers`** `[2.4, 2.2, 1.6, 2.2, 2.0]`: step 2, the empty bracket and its words are separate (0.46, 0.62). Steps 3 and 4: plate B's arrivals overlap a little; step 4 now goes mark, its words, bracket, its words, T-Mobile's other causes, to 0.9 (was active 40%).
- **`repaint`** `[2.4, 2.2]`: step 1, the two ways back 0.42 apart, each to its note.
- **`exits`** `[2.6, 2.6, 1.6]`: step 2, severance takes the field from 0.0; the ring on 2025 comes before the note that names it (note last, to 0.92).
- **`attitudes`** `[2.2, 2.0, 1.6]`: steps 1 and 2, each row takes longer and the rows lie further apart, so a step ends near 0.9; in step 2 the note follows the ring.
- **`obstacles`** `[2.4, 1.6]`: step 1 in reading order: knowledge gives up the field (0.0 to 0.34), the two legal rows take it (0.12 to 0.54), the bracket, then its words (0.6 to 0.9). It used to stand still from 0.55.
- **`permits`** `[2.0, 2.2, 2.2]`: steps 1 and 2 spread to about 0.9.
- **`plan`** `[2.6, 1.8, 1.8, 1.8, 2.2, 1.8, 1.8, 1.8, 1.2]`: the pen walks with a soft ease over 0.03 to 0.9 (the cubic ease crept for half the step); the walk round the turn (step 4) is the longest. Step 0 now ends on its own small sequence: the ink runs to station 1, station 1 takes the field, then the staff note.
- **`pairs`** (in-text) `medium: [2.0]`: ten rows 0.16 s apart; unchanged inside.

## Twelve-reader round on the web page (17 November 2026)

- **`plan`**: the staff band is no longer drawn under the path ("throughout" overreached: the protection ends on 31 Dec 2028, the plan has no dates). It is a separate note with a short band that stops at a marked end: "no dismissals for business reasons until 31 Dec 2028" / "about 60,000 staff · about 4,000 a year leave by agreed routes" (R11-14, DGB-2026, R12-01). A ninth state, step 8, is the overview: every station in ink, none in the field; it is the still where scenes read as a sequence (`stills = [8]`) and the print state. The text never scrolls to it (its `@step` lines stop at 7). Tall (phones, pinned): a compact strip, 360 × 236 (about 233 px at 355 wide, 28% of an 844 px screen): eight small numbered stations on one line, the bracket "need step 5" over 6 to 8, and under it "step n of 8" with the current station's name and measure. The retired `data/house.json` (tag `archive/renovate-retired-figures`) said "no dismissals for business reasons until 31 Dec 2028".
- **`exits`**: on phones the severance field reaches up over its route name, so name, "526 in 2021 → 1,016 in 2025" and its marks share one field; tall frame 360 × 398.
- **`attitudes`**: one dot is 2% on screen (50 dots, one row per country at every width; the value at the end of the row; note "one dot is 2%, rounded"). Print keeps 5%.
- **`permits`**: step 2 draws the German side as two rows: the row of step 1, now named "outside the framework: its own agreement · how long: not published", with the conciliation board as a muted note under it; and a new row "inside the framework agreement (2021): a short check" with a short check, build and launch (words inside the bars). The stamp and the dashed ghost are gone. Lengths stay schematic.
- **`numbers`** steps 3–4: one date axis 2021 to 2026, the two published values as large numbers over their dates (7.0 at Q4 2021, 3.1 at Q2 2026), nothing drawn between them; "2022 to 2025: no figures published" in the gap; "−55% against Q4 2021" beside 3.1 as a label; step 4 adds the September 2024 mark, the bracket "first point almost three years before the agents" and T-Mobile's other causes. Plate A leaves first (3.00–3.14), then the axis draws and the numbers arrive in order (done by 3.88). The month rulers are gone.
- **`walls`**: on phones the timber wall's cable enters in the first bay that leaves its tag "the same new cable" room inside the viewBox.

## Web loop (17 November 2026)

- **`plan`** (new, screen-only scene, 8 steps; step n = item n + 1 of section 9): one path of eight numbered stations, each with its short name and, in small italic type, its measure. The current station is in the field at full ink, earlier ones stay in ink, later ones are muted; the path is inked up to the current station. A thin bracket over 6 to 8: "they need step 5"; three notches after station 6 and "read → undoable → fraud-prone" in its label (keys in stages). One quiet hairline band runs under the whole path: "the staff stay throughout · no dismissals for business reasons until 31 Dec 2028" (R11-14). No dates or durations exist, so none are drawn; the figure says "order only · no dates". Wide: two rows of four, the path turns at the right and goes on from the left (720 × 408). Tall: the path runs down, a window shows the current station and its neighbours (360 × 380, about 375 px at 355 wide). Print: final state, all in ink. Data `data/plan.json`. Replaces the failed `roadmap` forms (icons, Gantt, ladder).
- **`stills`**: walls, terms, repaint, exits, attitudes, obstacles and permits show one still, the final state, where scenes read as a sequence; plan too.
- **`exits`**: route labels "Early retirement, civil servants" / "Early retirement, other staff"; wide labels break after the comma and are moved apart so none overlaps. Step 0 packs every year into one continuous stack (only the top row unfilled) and lifts the drawing under the title; it settles onto its base lines as the stacks split. The severance note sits over 2021 to 2023, clear of the 2024 marks.
- **`attitudes`**: the value column stands clear of the strips by more than the pen ring reaches; question 1 notes "(the other option: create new jobs)".
- **`numbers`**: month letters and year ticks in ink at 14 units wide (12.5 tall).
- **`terms`**: the keys now hang from a hook on a split ring, three cut keys fanned unevenly (the upright pair under a round ring was read as a person).

## Drafts 7 to 9 (17 November 2026): three reader rounds

Twelve readers per round; the log is in dotUni `docs/papers/innovation/loop-draft-6.md`.

- **`permits`**: cars removed. The figure now shows the real schedules: T-Mobile build → launch, checks afterwards; Telekom works council and privacy review → build → launch; the 2021 framework agreement as the shortcut; the conciliation board note. The cars remain one sentence in the text.
- **`roadmap`**: off the page since draft 9. It failed in all three rounds in three forms (icons, Gantt, ladder of equal steps). The numbered list with a measure per step carries section 9. Its files are kept under the tag `archive/renovate-roadmap-figure`.
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
- **`obstacles`**: the accent is on missing knowledge, which the section is about; the law rows are marked quietly.
- **`exits`**, **`attitudes`**: labels enlarged for laptop screens.
- **`pairs`**: moved to an appendix; the text keeps a two-sentence summary.

## Draft 5 (16 November 2026, evening): the building analogy

Alexander's rule for this article (dotUni transcripts `2026-11-16-019`, `-020`): every hard idea is explained with an everyday analogy, and the main one is his father's, a civil engineer: American houses are timber frames, so new wiring is pulled through hollow walls; German houses are mostly masonry, so a new cable means a channel cut and plastered. **The analogy is drawn in its own world. No AI agents, robots, screens or office workers inside it.** The plan with the analogy dictionary and the storyboard is in arudaev/dotUni `docs/papers/innovation/plan-restart.md`.

Retired in draft 5: `path` (its point did not come across; replaced by `permits`) and the margin scene `house` (distracting). Their files are kept under the tag `archive/renovate-retired-figures`; the text does not use them. The five house directions of the same day (`house-a` to `house-e`, tag `archive/renovate-house-directions`) were all rejected.

New in draft 5:

- **`walls`** (figure, column, 3 steps, the hero): the same new cable added to a timber stud wall and to a brick wall. Five-second reading: "the same job is quick in one wall and building work in the other". Sources: NAHB-2026, DESTATIS-2021, BAUNETZ-DIN18015.
- **`terms`** (figure, column, 2 steps): four everyday pictures for the parts of an AI system: apprentice (language model), plans archive (retrieval), keys (an agent's permissions), wiring (connections). Five-second reading: "what people picture as AI is only the apprentice".
- **`permits`** (figure, column, 3 steps): one decision as two construction schedules on one time axis: Germany checks before the work, the US after; a pre-approved standard design (Telekom's 2021 framework agreement) keeps the German permit short. Facts and ids then came from `data/path.json` (now under the tag `archive/renovate-retired-figures`; the figure reads `data/permits.json`).

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

## Hero

If `art/house-line.png` and `art/house-field.png` exist, the shell shows them behind the title (line layer over field layer, the field in the article's accent). If they do not exist, the title stands alone. Do not draw a substitute.

## Pacing: steps spread over the passage again (17 November 2026)

The earlier rounds made every step finish by t ≈ 0.3, which read as a slideshow ("bang, bang, bang"). Every Renovate scene (walls, terms, numbers, repaint, exits, attitudes, obstacles, permits, plan) now spreads each step over t ≈ 0 → 0.9 of its passage: pen lines drawn on at a readable pace, elements in reading order, each label after the thing it labels, eased. Final states and print are unchanged. `pairs` (one step, a fold) already ran to 0.92 and is unchanged.

## Readers' round s3 (17 November 2026): order inside a step

From the visual editor's retime table and the motion QA (dotUni `docs/papers/innovation/readers/s3-visual-editor.md`, `s3-web-qa.md`). Arrivals are now set in seconds: each changed figure maps seconds to t through the engine's own ease (`soft`, article.js), so "0.6 s" means 0.6 s on screen.

- **`rewire`** (new, scene in section 3, `:::scene rewire column`, 2 steps, `[2.4, 2.2]`, `stills = [1]`). Step 0, United States · T-Mobile US: the rebuilt base (a pen line, "one system holding what the company knows about each customer"), then the share of chat conversations that never reached a person as two separate strips of 50 dots (one dot is 2%): mid-2024 about a quarter, mid-2026 78% (ringed); no line joins them; `company-reported`. Step 1, Germany and Europe · Deutsche Telekom: 14 ways customers prove who they are (14 units in ink), the planned 3 drawn hollow and dashed ("planned: a target"), under "Simplify before automating" from Telekom's slide; T-Mobile's panel steps back to muted (screen only). Wide 560 × 420; tall 360 × 350 (380 px at 390 wide, 45% of 844), also the print layout. Sources R6-02, R6-06, R6-09, R6-05.
- **`walls`** `[2.8, 1.2, 2.9]`: step 2 draws timber (0–0.7 s), then the duct (0.7–1.6 s), then the channel (1.6–2.85 s: cut, laid, plastered), each with its note. The timber note stands under its drop, the leader vertical. Wide lettering at least 13.5 of 928 units, so the row of three is chosen from an 800 px frame (1536 × 864).
- **`terms`** `[1.8, 2.4]`: step 1, archive 0–0.6 s, keys 0.6–1.2, cable 1.2–1.8, bracket and its words 1.8–2.4.
- **`numbers`** `[2.4, 1.4, 1.6, 2.4, 2.0]`: the grid keeps its place from step 0 (the room for the labels over it is reserved), the 32 fill first and their label follows after about 0.9 s. Step 3: plate A's title leaves (0–0.2 s) before plate B's comes (0.2–0.4 s); the grid leaves over 0–0.4 s; 7.0 at 0.4–1.0, 3.1 at 1.0–1.6, then −55% and the axis 1.6–2.4. Steps 1 and 2 spread their changes over the step. Tall: shorter release and overlap notes (`short` in the data).
- **`repaint`**: 3 steps `[2.4, 2.0, 1.4]`, Klarna's way back at its own passage (step 1), Commonwealth Bank's at its own (step 2); `stills = [2]`, print unchanged.
- **`exits`** `[2.6, 2.4, 1.6]`: step 1, the routes split off one after another from the bottom (partial retirement first, transfers last), each name after its band; step 2, the severance band 0–0.8 s, then the ring 0.8–1.6 s, its note last.
- **`plan`** `[2.6, 1.0 × 6, 1.2, 1.2]` (the engine plays at least 1.2 s): the ring leaves its station over about 0.35 s, the pen walks, the ring comes in at the next over about 0.35 s; never in one frame. Step 8 (the overview) fades the ring on station 8 inside its own time, so the end of step 7 still shows it. Tall: the station's name is handed over in the middle of the walk. Wide frame 720 × 440 so the longer staff note fits.
