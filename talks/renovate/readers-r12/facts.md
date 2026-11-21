# Fact check, round 12: Renovate, don't repaint (talk)

Reader: fact checker. Date: 21 November 2026. Material: `talks/renovate/slides2.js` (diff HEAD~1, commit b6a6944), `talks/renovate/CUES-v2.md`, `talks/renovate/QUESTIONS.md`, `.shots/deck/renovate-v2/p20.png` and `p45.png`, `articles/renovate/text.md`, `sources.json`, `data/pairs.json`.

Primary sources opened today: T-Mobile AI Investor Day deck (R6-06, text extracted, p. 15–18), Telekom "AI in Customer Interactions" deck (R6-04, text extracted), T-Mobile Form 10-Q Q3 2026 (R6-11, Note 15, from SEC EDGAR), Bitkom release of 13 Nov 2025 (B-2025), Telekom release of 28 May 2026 (R11-14), DGB Tarifmeldung (DGB-2026). Via search only: T-Mobile Q3 2025 10-Q figures (net income $2,714 m, income before taxes $3,528 m, impairment $278 m, $208 m after tax), Bloomberg/Fortune/TechCrunch on Klarna's hiring freeze (Dec 2024). Carried over from round 11 without reopening: Klarna release, Entrepreneur, Information Age, Eurobarometer 554, AI Index 2026.

## Scores

| | Score |
|---|---:|
| Facts | 8 |
| Sourcing on slides | 8 |
| Hedging | 8 |
| Overall | 8 |

All ten round-11 fixes landed (one only half: the Bitkom wording is fixed in the notes but not in the slide box). The new material is mostly right. One rewrite made a correct line wrong (Klarna's freeze), and the new staff-help line on slide 6 uses Telekom's term for T-Mobile's measure.

## Round-11 fixes: did they land?

| # | Fix | Status | Note |
|---:|---|---|---|
| 1 | "Telekom says 40" → "Telekom's release says 40"; notes add "even Telekom's investor slide shows thirty-two" | landed | Title, notes and cue sheet line 13 all read "release". |
| 2 | Quotation marks round "handled by AI agents" | landed | Now unquoted paraphrase. |
| 3 | Monitoring "more than Americans" | landed | Notes: "they stand out even within the EU: only Sweden is higher". SP554: Sweden 80%, Germany 79%. |
| 4 | "fall as 55%" → "more than 55%" | landed | Deck: "Call Reduction >55%". |
| 5 | "Both had to walk it back" | landed | "Both took part of it back." Fair: CBA withdrew the redundancies but kept the bot; Klarna rehired some staff and kept the assistant. |
| 6 | Write-off vs net income | landed, still loose | "before tax. Close to a tenth of that quarter's profit." See claim 9 below. |
| 7 | Bitkom "depend strongly" | half | Notes now say "say they depend strongly". The slide box (step 3, `slides2.js` line 339) still reads "Bitkom: 51% of firms depend strongly on US technology". |
| 8 | "mostly brick" | landed | "mostly masonry, brick and block". Destatis: 67% masonry. |
| 9 | "nothing in between is published" | landed | Notes "I found nothing published in between"; drawn label "nothing published that I found". (Click label in `clicks` still says "nothing in between": presenter-only, fine.) |
| 10 | 12 Dec 2026 is a Saturday | open | No change seen; still confirm against the course schedule. |

## Claims new or reworded since round 11

| # | Where | Claim | Source | Status | Fix |
|---:|---|---|---|---|---|
| 1 | Slide 6 notes (new) | "in about three of four conversations, the system suggests the next step to the person handling it" | R6-06 p. 18 | overstated | Deck, Expert Assist page: "% of interactions with AI recommendations (Q2 2026) 74%". Expert Assist preps experts with customer context, one-click fixes, flags at-risk moments. "Next step" (next-best-action) is Telekom's wording in R6-04, not T-Mobile's. Say "in about three of four conversations, the staff see the system's recommendations". |
| 2 | Slide 6 source | adds "Form 10-K 2025" | R6-09 | confirmed (no harm) | The 74% is in the deck, which the line already names. |
| 3 | Slide 6 notes | "one customer record, one system that knows each customer" | R6-06 | confirmed | Deck: "Built a Customer Data Platform". |
| 4 | Slide 3 notes/title | Release says 40; "even Telekom's investor slide shows thirty-two" | R6-01, R6-03 | confirmed | CEO slide: "~32% Contacts handled, AI Agent". |
| 5 | Slide 8 notes | "In February 2024 Klarna stopped hiring" | Bloomberg 12 Dec 2024 (via search); R12-15 | contradicted | The rewrite dropped "had". In Dec 2024 the CEO said Klarna stopped hiring "a year ago", so late 2023. Restore "By February 2024 Klarna had stopped hiring". |
| 6 | Slide 8 label + notes | "the work of 700 service staff" / "seven hundred people in customer service, by its own estimate" | R12-14 | confirmed | Release: "equivalent work of 700 full-time agents". |
| 7 | Slide 8 notes | "In 2025 it was hiring people again, and it kept the assistant" | R12-15 | confirmed (secondary) | Entrepreneur, 9 May 2025: new human service staff alongside the AI; the assistant wasn't withdrawn. |
| 8 | Slide 8 notes | Commonwealth Bank "cut forty-five jobs for a voice bot, and took that back within weeks" | CBA-2025 | overstated (mild) | Roles were declared redundant, then the decision was reversed; nobody was shown to have left. Slide says "45 roles redundant": match it ("declared forty-five jobs redundant"). |
| 9 | Slide 14 notes | "$278 million, before tax. Close to a tenth of that quarter's profit." | 10-Q Q3 2025 (via search) | overstated (mild) | 278 / 3,528 pre-tax income = 7.9%; after tax 208 / 2,714 net income = 7.7%. "Close to a tenth" only holds when a pre-tax charge is set against after-tax profit (10.2%). Say "about a twelfth of that quarter's profit". Slide box (line 394) is fine. |
| 10 | Slide 9 title | "First brick: no dismissals, but positions go." | R11-14, R12-01 | confirmed | Dismissal protection to 31 Dec 2028; ~4,045 FTE a year by agreed routes. |
| 11 | Slide 9 source + slide text | "about 60,000 employees under its collective agreements" | DGB-2026 | confirmed | DGB: "für bundesweit rund 60.000 Tarifbeschäftigte". Telekom's own release gives no number. |
| 12 | Slide 10 notes | "Germans are no more worried than Americans" on AI and jobs | R12-25 | confirmed | 61% vs 67% expect AI to eliminate jobs. |
| 13 | Slide 10 notes, B4 label | "only Sweden is higher"; "Sweden 80%, the only higher one in the EU" | R12-28 | confirmed | SP554 p. 55. |
| 14 | B4 title (p45) | "On AI and jobs, no more worried. On monitoring, near the top of the EU." | R12-25, R12-28 | confirmed | The comparison with the US is now only on the jobs question; source line says "EU only". |
| 15 | Slide 11 notes | "At T-Mobile, as far as I could find, the staff had no say before launch" | R6-08, R11-36/37 | confirmed (hedged absence) | – |
| 16 | Slide 12 notes | "Most of those firms are much smaller than Telekom" | R7-06 | confirmed (trivially) | ICT survey covers firms with 10+ staff; nearly all are smaller. |
| 17 | Slide 13 box (line 339) | "Bitkom: 51% of firms depend strongly on US technology" | B-2025 | overstated | Release: 51% "sehen sich 'stark abhängig'" (self-assessment, 605 firms, 20+ staff). Box should read "say they depend strongly". |
| 18 | Slide 15 text/notes | "stage-gate, with a works-council gate and a stop point"; "always a way to a person" | own proposal | own proposal | No factual claim. |
| 19 | Slide 2 notes | "For the company, in this course's words, that's a transformation" | course | not checkable here | As in round 11. |
| 20 | Slide 16 notes | "I can't prove the rebuild caused T-Mobile's result" | – | confirmed (hedge) | Good hedge. |

## QUESTIONS.md

| # | Q | Claim | Source | Status | Fix |
|---:|---|---|---|---|---|
| 21 | Q1 | Telekom's own slide says "simplify before automating"; 14 ways in | R6-05, R6-02 | confirmed | – |
| 22 | Q2 | Organisation / environment / technology split of the three bricks | framing | own framing | That is the TOE framework (Tornatzky and Fleischer 1990). Name it if the professor asks "which adoption model". |
| 23 | Q3 | Stop threshold: "Cost per finished request has to fall below today's cost per contact, without repeat contacts going up" | own proposal | framing slip | It sets a cost per finished request against a cost per contact, two different units. A request today can take several contacts. Compare like with like: "cost per finished request with the agent below today's cost per finished request (cost per contact times contacts per request), with repeat contacts not rising." "The exact figure is Telekom's to set" is fine. |
| 24 | Q4 | "At T-Mobile the system suggests the next step to staff in about three of four conversations. (Slide 9, B1 row 6)" | R6-06 | overstated | Same as claim 1: "AI recommendations in about three of four interactions". The figure is in slide 6's notes, not on slide 9. |
| 25 | Q4 | 4,000 positions a year go | R12-01 | confirmed | 20,223 over 2021–2025. |
| 26 | Q5 | "about 60,000 employees under Telekom's collective agreements; that's what the agreement says" | DGB-2026, R11-14 | overstated (attribution) | The 60,000 is the union's (DGB) figure for the pay deal; Telekom's release gives no number. Say "the union puts it at about 60,000". |
| 27 | Q5 | "nothing is agreed beyond 2028" | R11-14 | not verifiable (absence) | Say "I found nothing agreed beyond 2028". |
| 28 | Q7 | "$531 million of severance up to September 2026" | R6-11, Note 15 | confirmed | 10-Q Q3 2026, 2025–2026 Workforce Transformation: severance incurred to date $531 m ($141 m in the first nine months of 2026, none in Q3). Begun Q4 2025. Excludes the separate UScellular severance ($129 m to date), so "in a restructuring" must stay. |
| 29 | Q7 | "a restructuring that cut management layers" | R6-11 | overstated (mild) | Filing: "centralizing leaders and teams, reducing organizational layers and eliminating duplicative roles". Say "organisational layers and duplicate roles". |
| 30 | Q7 | "its filings don't tie that to the agents" | R6-11 | confirmed (absence, checked in the 10-Q) | The 10-Q mentions AI only in risk factors. Safer: "I found nothing in its filings tying it to the agents". |
| 31 | Q7 | T-Mobile 46 vs Telekom "more than 67": two different kinds of score | R6-06, R6-04 | confirmed | T-Mobile: "46 Overall Company NPS" (HarrisX, Q2 2026). Telekom: ">67 Contact center tNPS" (transactional NPS after a contact). Both are NPS variants; if pressed: "company-wide score against a score right after a service call". |
| 32 | Q6, Q8 | Keys in stages; always a way to a person; the wall includes people | own proposal | own proposal | – |

## Required fixes

1. **Slide 8 notes, "In February 2024 Klarna stopped hiring".** Klarna stopped hiring in late 2023 (CEO to Bloomberg, Dec 2024: "a year ago"). Restore "By February 2024 Klarna had stopped hiring".
2. **Slide 6 notes, "the system suggests the next step".** T-Mobile's deck says "% of interactions with AI recommendations, 74%"; "next-best-action" is Telekom's wording. Say "in about three of four conversations, the staff see the system's recommendations".
3. **QUESTIONS Q4.** Same wording as fix 2, and point to slide 6 (notes) and B1 row 6, not slide 9.
4. **Slide 13 step-3 box (slides2.js line 339).** "Bitkom: 51% of firms depend strongly on US technology" → "Bitkom: 51% of firms say they depend strongly on the US". The round-11 fix reached the notes only.
5. **QUESTIONS Q3, stop threshold.** Compares cost per finished request with cost per contact. Compare like with like: today's cost per finished request against the agent's, with repeat contacts not rising.
6. **QUESTIONS Q5.** "that's what the agreement says" → "the union puts it at about 60,000" (Telekom's release has no number); "nothing is agreed beyond 2028" → "I found nothing agreed beyond 2028".
7. **QUESTIONS Q7.** "cut management layers" → "reduced organisational layers and duplicate roles" (10-Q wording).
8. **Slide 14 notes, "close to a tenth of that quarter's profit".** Before tax against before tax it is 7.9%; after tax 7.7%. Say "about a twelfth of that quarter's profit".
9. **Slide 8 notes, "cut forty-five jobs".** The roles were declared redundant, then the decision reversed. Say "declared forty-five jobs redundant", as the slide does.
10. **Carried over: 12 December 2026 is a Saturday.** Confirm against the course schedule.
