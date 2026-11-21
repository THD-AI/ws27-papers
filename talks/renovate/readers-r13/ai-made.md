# Reader r13: the sceptic of AI-made work

Seat: someone who has scrolled past hundreds of Claude, ChatGPT and Gemini decks, landing pages and scripts in 2025–2026 and spots the house style in seconds. The question is not "is AI good for Telekom" but "does this deck look or sound like a model made it".

Material read: all 46 rendered pages (`.shots/deck/renovate-v2/p01–p46`, plus full-size p01, p18, p33, p40), `deck.js` and `deck.css` (fonts, palette, motion), the live page at thd-ai.github.io/ws27-papers/renovate/talk/ (loads; no transitions referenced), `CUES-v2.md` (everything he says), `slides2.js` (slide text), `BRAND/methods/his-pacing.md` and the 15 Nov dictation `2026-11-15-001`.

Short verdict: he is mostly right. The visuals would pass almost anyone. The speech would not pass a trained ear: the one Claude habit left is the contrast sentence ("doesn't just X. It Y", "not X, but Y", "can't X. It can Y"), and it comes about once a minute.

## 1. The tells, as of late 2026

**Visual**
- Inter or system sans, purple or indigo-to-violet gradients on white, gradient buttons; three rounded feature cards in a row with soft shadows and thin-line icons; dark generic hero (925 Studios; Anthropic's own frontend-design write-up names "Inter fonts, purple gradients on white backgrounds, and minimal animations" as the unguided default).
- Claude's own deck look specifically: a warm cream canvas with muted red accents, and **a sans title that ends in an italic serif phrase**, called Claude's "signature typographic flourish"; thin coloured accent bars beside every block; all-caps eyebrow labels over headings; dashboard rows of oversized stat tiles with equal weight (Plus AI).
- When pushed off one default, models jump to the next one: dark with bright green, or beige with a bright accent (Plus AI).
- Meaningless icon rows, identical structure on every slide, flattened hierarchy (Plus AI, 925 Studios).
- Image-model drawings: mangled small details, lines that fade or cross where no hand would cross them.

**Motion**
- Fade plus slide-up as the default entrance on every element, a fixed 100 ms stagger, IntersectionObserver reveals, counters that tick up (frontend-slides skill docs; Builder.io GSAP reveal guide).

**Writing and speech**
- Negative parallelism: "It's not X, it's Y", "doesn't just X, it Y", "not only… but"; Pangram measures it at about 3× the human rate; Wikipedia's WikiProject AI Cleanup lists it as a core sign; explainx calls the antithesis Claude's most-cited structural tic.
- Triads (about 4×), em dashes (about 7× for Anthropic models), unusual Unicode such as → and ≈ (≈ about 241×), bold and bullets where prose would do (Pangram).
- Claude-specific: fragments for drama ("Not a detail. A design decision."), colon and semicolon pauses replacing "but" and "because", "load-bearing", "full stop", "worth stating plainly", "The X matters more" (explainx; Hacker News threads collected there and by the-decoder).
- Vocabulary: delve, pivotal, testament, underscore, showcase, landscape, seamless, crucial (Wikipedia).
- Every paragraph closing on an aphorism; rhetorical questions as transitions; even sentence length; hedging boilerplate.

Sources: [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing); [Pangram, 9 signs of AI writing](https://www.pangram.com/signs-of-ai-writing); [Plus AI, AI slides that don't look like AI slop](https://plusai.com/blog/how-to-make-ai-slides-that-dont-look-like-ai-slop); [925 Studios, AI slop design tells](https://www.925studios.co/blog/ai-slop-design-tells); [Claude blog, improving frontend design through skills](https://claude.com/blog/improving-frontend-design-through-skills); [explainx, Claudisms 2026](https://explainx.ai/blog/claude-opus-5-load-bearing-claudisms-writing-tells-2026); [frontend-slides SKILL.md](https://raw.githubusercontent.com/zarazhangrui/frontend-slides/9906a34d640d2111f724544cbc50f7f130569ae1/SKILL.md); [Builder.io, GSAP reveal](https://www.builder.io/blog/gsap-reveal). Several are vendor blogs with an interest in selling the fix; the claims used here are the ones that agree across sources.

## 2. What does not read as AI-made (keep it)

- **Palette and type.** Near-white `#FBFBFC`, near-black ink, one muted green `#1F7A54` with a pale field. No purple, no gradient, no cream-and-terracotta. Libre Franklin is a Franklin Gothic, not Inter; with Newsreader only on the title and the close it reads like a newspaper, not a SaaS page.
- **No cards, shadows, emoji, icon bullets, eyebrow caps or accent bars.** Structure is hairlines and white space. The only small label above a heading is the course name on page 1, which does a job.
- **Charts that admit what's missing.** Page 8–9: the hatched gap "nothing published that I found" between 2021 and 2026 is the single most human thing in the deck; a model fills that gap or smooths over it. Same for page 7 "how many of these the software finished: not published", page 21 "totals added by me", and footers like "Lengths schematic" and "The walls picture conditions; they are not evidence."
- **Sources on every slide**, in small type, with the odd specific ("Bargmann 2022", "DIN 18015-3", "amended by 2026/1744"). Invented-looking round numbers are absent: 3,736 / 4,016 / 4,060 / 4,448 / 3,963 and $278 million read like copied figures, because they are.
- **The wall drawings** (pages 1, 31–33, 40) wobble, overshoot and leave bricks unclosed like a pen does. With the credit on page 1 they read as his. The crisp vector cable running through a wobbly wall is a deliberate mix, not a model artefact.
- **The cable–wall analogy held across the whole talk** (pages 10–13, 15, 18, 31–33, 40) and called back by name. That is his Unit 4 and Unit 6, and models rarely hold one picture for fifteen minutes.
- **Plain, slightly odd headlines** a model would "fix": "Nobody outside can tell how much was the agents.", "Both took part of it back.", "The ten pairs: none compares fully."
- **The self-correction on slide 3** ("A correction to my own proposal… I used that number") and the scene with reported speech on slide 2 ("Please move me to a cheaper tariff." / "Here's how."). Both are his Units 5 and 7.
- **Motion.** `deck.js` swaps whole pages on a key press; a build is the next page with one more thing drawn. No fades, no slide-ups, no stagger, no counters. That is the opposite of the 2026 generated deck.
- **No em dashes** anywhere in `slides2.js` or `CUES-v2.md`, none of the AI vocabulary, no "load-bearing".

## 3. Hits

Ordered by page. "Cost" = how quickly a trained eye or ear would catch it (high, medium, low).

| # | Page / slide | Element or sentence | Tell | Fix in the deck's own language | Cost |
|---|---|---|---|---|---|
| 1 | p3–4, slide 2 (headline) and notes | "An agent doesn't just answer. It acts." | Textbook "doesn't just X. It Y" negative parallelism, on the second slide, in the largest type | "A chatbot answers. An agent changes the tariff." | high |
| 2 | Notes, whole talk | About two dozen not/n't contrast sentences in ~15 minutes: "not the number, but the slow work behind it" (slide 2), "T-Mobile didn't just repaint" (6), "That's not the same as solved" (6), "Two cases don't make a rule. They show what repainting can cost" (8), "the agent works with them, not instead of them" (9 and again 16), "the business measure from this course, not accuracy" (13), "enforced by the systems, not by the model" (15), "It is harder. That doesn't make it worse." (16) | Negative parallelism as a rhythm; spoken aloud it becomes the cadence people now mock as "ChatGPT voice" | Keep at most three on purpose (the 40/32 correction, "not the same as solved", the closing). Turn the rest into plain statements: "T-Mobile rebuilt." / "Two cases. Both cost money." / "The agent works with the staff." (say once, on slide 9 only) | high |
| 3 | p13, slide 5 | Italic serif line "The cable is the agent. The wall is what's already there: old systems, rules, people." | Claude's signature italic serif flourish under a sans slide; also a colon reveal and a triad | Set it in the body sans like every other caption, or drop it: he says it aloud anyway | high |
| 4 | p27, slide 12 | Italic serif line "You can buy a language model and screw it onto the wall. Without your own people, you can't cut it in." | Same italic serif flourish, plus "can X… can't Y" antithesis closing the slide as an aphorism | Drop it from the slide and keep it spoken; if it must stay, sans, one sentence: "Without your own people, the cable stays on the wall." | high |
| 5 | p21, p23–25, p26–27, p34–36 headlines | "First brick: no dismissals, but positions go." / "Second brick: here the checks come first." / "Third brick: missing knowledge first. The law after." / "Then the keys: read first, risky changes last." | Label-colon-claim formula four times in a row, each a balanced two-beat; reads as one template filled four times | Keep the bricks spoken, vary the titles: "No dismissals until 2028. About 4,000 positions a year still go." / "In Germany the works council agrees before it runs." / "Firms miss the know-how more than the law." | medium |
| 6 | p28–30, slide 13 headline | "Measure first. Start beside the staff." | Two-imperative slogan ("Build faster. Ship smarter.") | Descriptive title: "Steps 1 to 4 come before the first key." | medium |
| 7 | p10–13, slide 5 headline | "The cable is the same. The wall decides the work." | Two short beats ending on an aphorism | Acceptable; it is the core picture. If anything, "Same cable. The wall decides how much work." Low priority | low |
| 8 | Notes slides 3, 6, 12; p21 | "Still, one in three is a lot." / "Still, a real result." / "Still, the order says a lot." / slide text "Still, positions leave…" | Same concessive opener four times; repeated fragment-landings sound generated | Keep one "Still" (slide 6). Slide 3: "One in three is still a lot." Slide 12: "But the order is clear." p21: "Positions leave Telekom in Germany by agreed routes" | medium |
| 9 | Notes slide 9, 12, 5; slide p13 | "the staff, the rules and the know-how"; "slow, loud and dusty"; "old systems, rules, people"; "partial retirement, early retirement, severance"; three bricks; three ways to be wrong | Triad density (about 4× human rate per Pangram) | Keep the three bricks and three ways to be wrong (they are structure). Break the decorative ones: "slow and dusty"; "old systems and the people who run them" | low |
| 10 | Notes slide 16, lead-in to the close | "I started out thinking Germany was the harder case. It is harder. That doesn't make it worse." | Callback, fragment, reversal: a Claude closing cadence | The closing slide stays; only the spoken lead-in: "I started out thinking Germany was the harder case. I still think so. Harder is not the same as slower." or simply cut the last sentence | medium |
| 11 | p22, slide 10 | Giant green "79%" under the bar | Oversized hero stat tile repeating what the bar already shows | Put 79% at the bar's end at the size used on p26–27 | low |
| 12 | p17–18, slide 7 | 14 identical socket faces in a 7 × 2 grid | Can read as an icon grid; saved by the fact that the faces are real plug standards and the metaphor is his | Keep; optionally vary spacing or draw them in the same pen line as the plug so they belong to the drawings, not to an icon set | low |
| 13 | p36, slide 15 last build | "Stage-gate: the stages are the keys; each gate, the error rate and a works-council annex. Step 1 is the kill rule." | Colon plus semicolon compression and jargon stack ("kill rule"); reads like model notes pasted on a slide | "Each key is a stage gate: error rate checked, works-council annex signed. If step 1 shows no gain, it stops." | medium |
| 14 | p3, slide 2 subtitle | "In this course's terms: a transformation, not a change." | Another "X, not Y" in the second slide's first line, stacked with hit 1 | "In this course's terms, a transformation." | low |
| 15 | p44 (B3) and p42 (B1) | "read → undoable → fraud-prone"; "≈ 32%", "≈ $3 bn", "≈ €2.5 bn" | → and ≈ are among the Unicode most over-represented in AI text | "read, then undoable, then fraud-prone"; "about 32%" or "c. 32%" | low |
| 16 | Captions p10–13, p14–16 | "quick; the wall stays closed", "a duct on the face; quick", "cut in, plastered; slow" | Semicolons in captions, the colon-semicolon pause habit | Commas: "quick, the wall stays closed" | low |

Not hits, checked on purpose: the title "Renovate, don't repaint" (an antithesis, but it is the thesis and the analogy is his father's); the closing slide p40 (his standing call, and it lands); plugs, keys and the wall drawings (standing calls); no QR code (standing call). Nothing found on emoji, em dashes, AI vocabulary, purple, gradients, cards, shadows or animated reveals.

## 4. Against his own voice

`his-pacing.md` asks for runs of three to six longer sentences and one short landing (Unit 8), and allows contrast paragraphs (America, then Europe) but not inside one sentence. The notes follow the first rule well: the slide 5 analogy and the slide 9 staff paragraph sound like the 15 Nov dictation ("Capitalism is the game."). They break the second: most contrasts are packed into one sentence ("with them, not instead of them"), which is the model's habit, not his. His dictation turns with "but" and "the bigger problem is", not with "not X, Y". Swapping half of the contrast sentences for his turn words is the single biggest gain.

## 5. Scores

| | Score | Why |
|---|---|---|
| Visuals (not AI-looking) | 8 | Palette, type, charts, sources and drawings all read human and editorial. Two italic serif asides (p13, p27) are the one Claude-signature mark; the giant 79% and the socket grid are minor |
| Motion | 9 | Hard page swaps and additive builds; none of the fade-up, stagger or counter habits |
| Words and speech (not AI-sounding) | 6 | No em dashes or AI vocabulary, real scenes and a self-correction, but contrast sentences roughly once a minute, a templated "Nth brick:" title run, slogan headlines and repeated "Still," landings. A trained ear would hear it within the first two minutes, starting at slide 2 |
| Overall | 7 | "A trained eye would notice in places", and almost all of those places are in what he says, not what he shows |

## 6. The three hits that cost the most

1. **The contrast sentence, once a minute (slide 2 headline "An agent doesn't just answer. It acts." and about two dozen in the notes).** Fix: headline "A chatbot answers. An agent changes the tariff."; keep three contrasts in the talk, turn the rest into plain statements with his "but" and "the bigger problem is".
2. **The italic serif asides on p13 and p27.** Fix: set them in the body sans, or take them off the slide and say them.
3. **The templated headline run "First brick: …" / "Second brick: …" / "Third brick: …" / "Then the keys: …" plus "Measure first. Start beside the staff."** Fix: keep "first, second, third brick" spoken and give each slide a plain descriptive title of what its chart shows.
