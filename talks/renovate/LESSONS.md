# Lessons: the Renovate deck

Kind: log, newest first. Read this before every loop on the deck; add to it at the end of every loop (the compound step). Each entry: what happened, what it means, the rule that follows. His words are in dotUni `.docs/transcripts/` (numbers given).

## State after loop 12 (21 November): where things are

- The deck: `slides2.js` (open `index.html?v=2`), 46 pages. Build: `node tools/deck.mjs renovate --v2` (PDF, cue sheet `CUES-v2.md`, gates), `node tools/deck-offline.mjs renovate --v2` (one presenting file in `.shots/deck/renovate-v2/`).
- Live: https://thd-ai.github.io/ws27-papers/renovate/talk/ (gh-pages `145ee27`, loop 12). Notes on N, hidden in full screen; F for full screen. Publish steps in the README.
- Q&A: `QUESTIONS.md`, nine expected questions with short answers from the article's facts.
- Clock: the notes speak in about 14 minutes (130 words a minute, 1.5 s a click, 2.5 s a landing); the cue sheet's start times are computed from that, not set by hand.
- Readers: round 11 median 7.5, round 12 median 8 (professor 8 and grade 1.7, voice 8, facts 8, projector 8, sceptic 7). Reports in `readers-r11/`, `readers-r12/`.
- Open PRs: ws27-papers#12 (the talk on the site, now with loops 11–12), paper-studio#3 (stacked on #2).
- His standing calls: no QR code on any slide; plugs and keys stay simple one-line drawings; the closing socket plate stays as it is; "How this was made" is folded, never a slide.
- Waiting on him: is 12 December 2026 (a Saturday) right; are the two new first-person lines true (slide 15 "read first, then we see", the closing "It is harder. That doesn't make it worse."); does the worker thesis go on the closing slide (the sceptic's ask, a slide he liked). Then the real projector, and rehearsal run 0.

## Loops 11–12 (21 November): the room, the clock and the defence

What happened:
- Projector: every page rendered at 1024×768 with 12% ambient light and slight blur (`.shots/deck/projector/`). It all reads; the wall strip on slide 14 nearly vanished (thin grey lines in the drawing) and now carries the ink filter. A label on slide 8 sat under the wrong dot.
- Clock: the notes spoke in 11 minutes against a cue sheet planned for 14:40, with some windows too tight and others too loose. The start times are now computed from the words.
- Round 11 (projector, professor, fact checker, voice and pacing, AI-sceptic): median 7.5. Convergent: the thesis came only at minute 14, the worker side of his thesis was never said, the course theory was hidden, ten fact wordings overstated their sources ("Telekom says 40" was only its press release; "walked it back" was half true for Klarna; "the staff stay" over a chart of 4,000 positions a year leaving).
- Fixed: his short answer at the start of slide 2; "the agent works with them, not instead of them" on slide 9 and in the close; an honest line that the rebuild can't be shown to have caused T-Mobile's result; a customer case and "always a way to a person" in step 6; the staff load in step 4; adoption terms (TOE) on slide 9 and stage-gate on slide 15, on the slide and not in speech; spoken grammar throughout; every fact fix.
- Round 12 (the four seats whose part changed): median 8. The sceptic stays at 7 until the worker thesis is on a slide, not only spoken.

Rules that follow:
50. **Time a talk from its words, never by hand.** 130 words a minute, plus the clicks and the landings; a cue sheet wrong in both directions is worse than none.
51. **Test the projector, not the file.** Low resolution, lifted blacks and blur first: thin grey drawing lines are the first to go.
52. **Course terms go on the slide; the voice stays in the notes.** The grader reads the slide; a spoken aside for the grader is the sentence the room loses.
53. **Say the claim first and end on his own line.** When the title only repeats the slide, the landing steps backwards.
54. **Every fact rewrite gets checked again.** Round 12 found five new overstatements made by round 11's fixes ("cut forty-five jobs", "close to a tenth", "next step").

## Loop 10 (20 November): the last kink, and the talk on the site

What happened:
- On slide 6 a 2 px kink showed where the drawn cord met the cable. The cause: the drawings were scaled by the cord's outer width, but the eye follows the line centres. The drawn cords' line centres are 49.5 px (side) and 53.75 px (upright) apart; scaled to the cable's 20.4 and 18.4 px, they now meet without a step. The cable on slide 6 moved 80 px clear of the text.
- He asked for the deck on the site with speaker notes, but never in full screen. The page hides the notes when the Fullscreen API is on, the browser is in its own full screen (F11), or the window is as large as the screen; tested in a window and at full-screen size.

Rules that follow:
48. **Scale a drawing to meet code by its line centres, not its outer edge.**
49. **What the room sees in full screen is not what the speaker sees in a window.** Anything private (notes, hints) hides in full screen, whichever way full screen was reached.

## Loop 9 (19 November): drawn plugs with their cords, and a full audit

What happened:
- With credits back, the plug was redrawn WITH its cord in one drawing (side view) and three different keys were drawn. He liked the side plug and found the first upright plug (a detailed Schuko face) "way too detailed" (`-017`). It was redrawn from the side plug as reference: the same simple plug, standing up.
- Readers measured the seam: the drawn cord's lines render at about 1.5 px of mid-grey (#535353). The cable now uses that ink and weight (#505055, 1.6 px), and it ends 30 px under the drawing, whose first stretch of cord is filled with paper, so no cap or edge shows.
- Slide 6: the pins now go into the box (the box is drawn over their tips). Slide 7: a dashed line runs from the pins to the socket they fit. Closing slide: the plug is cropped before its pin collars and seated on a plate in the drawing's ink and weight.
- A final audit of all 46 pages (designer and QA) scored 8 and 7.5. Fixed: a dashed line through "4,448"; dashed guides cutting through timeline labels (the labels now sit on paper); a label past the margin; a second cable in the footer of the walls slide; unexplained ticks on columns; an orphaned title word (the line was widened, the words kept: "Nearly four in five" is the fact); a stray full stop; awkward wording; a three-line source.
- Not taken: the walls slide's duct shadow (held since loop 1) and green on headline numbers (the deck's way of marking the figure that matters).

Rules that follow:
45. **Simple beats detailed.** When he likes a drawing, it becomes the reference for its siblings: "the same object, only turned".
46. **A drawn cord and a code cable meet under the drawing,** never edge to edge: fill the drawing's cord with paper and run the cable 30 px beneath it.
47. **An audit may suggest changing a fact's wording to fix layout; fix the layout instead.**

## Loop 8 (19 November): the plug, the socket and the cable as one object

What happened:
- He said the plug, the cable going into it, the keys and the closing socket look off in every appearance (`-016`). Three readers (an electrician, an illustrator, an AI-sceptic) agreed on the main cause. The code cable was about three times heavier, and in darker ink, than the drawn plug's pen line. The drawn plug kept its own one-line cord, under a tube that ended in a rounded cap. The plug body was see-through. The closing socket was a face-on green box against a plug drawn from the side. Several of the 14 sockets were not real socket types.
- Fixed in code: one ink (#2B2B2E) for the cable, the sockets and, through the ink filter, the drawn plug and keys; a lighter tube wall (2.5 px). The cable ends square inside an opaque paper silhouette of the plug body (`deck-plug-body.png`). The closing socket is now a cover plate seen edge on, proud of the wall, with the plug's face against it. Slide 7 uses the real IEC types A to O (without M), and the three planned sockets (C, F, E) are ones the Euro plug fits.
- Not possible yet: new drawings (no OpenAI credits). Boards are ready in Paper Studio: `deck-plug-cord` (plug and cord in one drawing, side view), `deck-plug-up` (upright, for slides 6 and 7, instead of a rotated copy) and `deck-keys3` (three different keys for the three stages). The closing socket in section still needs a real socket photograph to draw from (a download, his OK first).

Rules that follow:
41. **Where code meets a drawing, they share one ink and one weight.** Measure the drawing's line in pixels before choosing the code's stroke.
42. **Every drawn object is opaque.** A transparent body shows the joins behind it.
43. **One projection per picture.** A plug seen from the side meets a socket seen from the side.
44. **Symbols of real things must be real:** 14 sockets means 14 real socket types; the one the plug enters must fit it.

## Loop 7 (19 November): no QR code; the title is the link

What happened:
- He rejected every QR placement on the main slides: the plaster patch, the access panel and the cable flag (`-015`). He asked for the closing slide he had liked before, and, in the HTML version, a link to the article from the title instead.
- The closing slide is back as it was before loop 6. No QR code is left in the deck. In the HTML deck, the title on the first and last slides and the address on the last slide link to the article in a new tab; a click on them no longer turns the page. On paper and in the PDF they are plain text.

Rules that follow:
38. **When he likes a slide, adding to it needs his yes first.** Three variations on a slide he liked cost three rounds; the right move was to ask whether anything should be added at all.
39. **Rules 34–37 are void for this deck:** no QR code on any slide. A link belongs where it costs nothing: the title, in the HTML version.
40. **Readers choose between the options they are shown; they can't say "none of these".** Before a panel ranks variants, check with him that the thing is wanted.

## Loop 6 (19 November): where the QR code belongs, and how it may look

What happened:
- He rejected the socket-faced QR code on the sources slide ("it looks weird", `-014`) and asked for a brainstorm through the playbook.
- Research: on slides the code should be about 15% of the slide's width and come with a plain call to action; the closing slide is the classic place; image-model "art" QR codes always trade scanning for looks.
- Three directions on the closing slide (it stays up through the questions): a plaster patch in the wall, an engineer's title block, a tag hanging from the cable. A brick-wall QR from the image model could not be tried (no credits).
- Four readers: three would ship the plaster patch, one the cable tag. Convergent fixes: the code on white with the green only around it; no sentence explaining the metaphor; keep clear of the slide's edges and the bottom third, where heads and the speaker stand.
- Built: one renovated stretch of the wall, fresh plaster from the socket up to the code. The code is 300 px (16% of the width) on white with a four-module quiet zone. It decodes at 100%, 50% and 30% size, and in a simulated photo of a washed-out projector (flat, at an angle, with mild blur). The sources slide keeps only the link line.

Rules that follow:
34. **Put a QR code where people have time to scan it:** the slide that stays up longest, in the upper half, never the bottom third or a backup.
35. **Style the surroundings, never the modules.** Square modules, ink on white, a four-module quiet zone; the story lives in what holds the code (here, the plaster).
36. **"Perfect" means tested like the room:** decode the rendered slide small, washed out, at an angle and blurred, not only the clean file.
37. **Metaphors aren't captioned.** "Scan the plaster" made readers decode the sentence instead of the code.

## Loop 5 (19 November): don't advertise how it was made; a way into the article

What happened:
- His call (`-013`): "How this was made" shouldn't be advertised. In both articles it is now a heading with its text folded (`:::details`), like the sources. In the deck it is no longer a slide (B6 is gone); the sources slide links to it.
- A QR code to the article sits between the two columns of the sources slide, set into a German socket face (pin holes, earth clips, recess), drawn in code. It decodes at full, 70% and 50% size; image-model stylising would have risked the scan, and the account has no credits anyway.

Rules that follow:
32. **Disclosure stays complete, but quiet:** folded on the page, one link in the deck; never a slide or a headline of its own.
33. **A styled QR code is tested by decoding the rendered page** at several sizes before it is shown (superseded in part by rules 34–36: the socket face was rejected).

## Loop 4 (19 November): one wall, reused instead of regenerated

What happened:
- He said "do whatever is best" to drawing the socket and bricks himself. A round-3 redraw of the channel, with the approved wall as its brick reference, could not run: the OpenAI account has no credits left.
- Slide 14 now cuts its channel in code into a strip of the approved slide-1 wall (three courses, at nearly the title's scale, top and bottom softened with paper). All three wall pictures share one brick; the stones and the blob of green are gone. The generated deck-chase.png is no longer used.
- The sockets stay in code: the count of 14 distinct faces must be exact, and no real socket photograph is on file to draw one from.
- Two things failed on the way: an SVG mask on a group holding a nested svg did not apply in Chrome's print, and a crop scaled to 1.95× turned his hairline into a crude marker line.

Rules that follow:
29. **Reuse an approved drawing before generating a new one.** A crop of the wall he already accepted matches the deck by construction; a new generation has to earn the match.
30. **A drawing's scale is part of its line.** Keep a crop within about 1.3× of the scale it was approved at; beyond that the hairline becomes a marker.
31. **Fade a crop with paper-gradient rectangles, not masks** (masks on nested svg did not render in print).

## Loop 3 (19 November): the whole deck in the v2 direction; two critic pairs on all 47 pages

What happened:
- Slides 2, 4, 6, 8–12, 15, 16, the end slide and six backups were built in the drafting grammar; the closing picture plugs the cable into a socket set in the wall, the bookend of slide 1.
- Scores: designer 7/5/5/6 (first glance, human feel, consistency, legibility), sceptic 6/4/5/6, examiner 7/8/7/6 (clarity, honesty, fit, legibility), coach 8/8/6/6.
- Fixed in the loop: the dashed grammar broken in three places (existing systems drawn dashed, dotted leaders, the plan's last floors drawn as built); four stills that looked unfinished (an empty chart, a lone sentence, reserved numbered boxes, a corner of small boxes); "all contacts" where the release never says whose; "error" where the bank's own words exist; Hall and Soskice stated as fact instead of argued; the course concepts (transformation, business measure) only spoken.

Rules that follow:
24. **Check the grammar on every page, not just the device slides.** A leader, a box for something that existed, a roof: each line is solid or dashed for a reason. Existing = solid, even when it is the bad old state.
25. **Every first build is a still too** (rule 1 again, now for charts): an axis with nothing on it, a numbered slot with nothing in it, or one sentence on an empty page reads as broken. Merge builds before leaving a page half empty.
26. **Quote the source's words or none.** A paraphrase in quotation marks ("error") or a word the source lacks ("all contacts") is the first thing an examiner checks.
27. **Course concepts go on the page,** in the subtitle where they belong, not only in the notes.
28. **Still open, for his eye:** the channel drawing on slide 14 has stones where the other walls have bricks, and the sockets are clean vectors beside a drawn plug. Both point to lesson 19: his own pen for a socket and a row of bricks would close the gap. The title-from-the-first-click rule (his) wins over the coach's wish to hide the title until the reveal.

## Loop 2, the build (19 November): what fixing the critics' points taught

What happened:
- Round 2 of the wall, plug and channel came back in a thin, open line; the channel drawing now has its cable as a tube, the plug only a thin stub.
- Slide 3 became two bars on two bases; slide 7 became fourteen socket faces, no two alike, then three dashed (planned) with the plug pointing up at them; slide 13 carries the step names inside the floors and the measures beside them; slide 14 lets the page's cable run into the drawn channel and on, dashed, under the plaster.

Rules that follow:
20. **One cable, one look.** Where a drawing has its own cable, crop it away at the grip (or join it square, `cap: 'butt'`) so the deck's tube runs straight into the drawing.
21. **Place drawings by measured pixels, not by eye.** Read the alpha channel for the row where the brick juts, the grip's centre, the tube's rows; then compute the page position. Every guess in loop 1 was off by 20 to 80 px.
22. **The drafting conventions carry over to symbols:** planned sockets are dashed like planned floors, so the deck keeps one grammar.
23. **Text that leads to a drawing measures itself first** (`textSize`), so a leader starts after the words instead of through them.

## Loop 2 (19 November): drawings joined the frames; what two critic pairs found (dotUni `readers/frames-2-*.md`)

What happened:
- He said yes to drawings (`-012`). Five forge boards (key, plug, wall, cut channel, duct), each from his hand plus a real Commons photograph, three candidates each; one approved per board.
- Scores: examiner and coach 7 (clarity 7, honesty 7, legibility 6); designer and sceptic 6 (human feel 4).
- The drawings read as generated: every shape closed and outlined in an even, jittery line, the opposite of his thin, single, open contour that runs from one shape into the next with a flat green that ignores the outline. Thickening the line for the projector made the jitter worse.
- One picture, two meanings: keys meant permissions on slides 2 and 15 and ways to prove identity on slide 7.
- The bar on slide 3 drew the 32 inside the 40 while its own footer said whether the 40 include the 32 isn't published.
- The cable was recognised only on slide 1; elsewhere it read as a double footer rule.

Rules that follow:
14. **His line, stated as what to avoid:** closed outlines around every shape, a trembling or jittery stroke, doubled strokes, even weight; ask for one thin continuous line that leaves shapes open and runs on into the next, and a green field set off the outline. Never thicken a drawing with a filter; scale it so its own line reads.
15. **One symbol, one meaning across the whole deck.** Keys are permissions; the ways to prove identity become sockets the agent's plug must fit (14 standards, then 3).
16. **The picture may not claim what the footer denies.** Two counts with different bases get two bars.
17. **The cable must act, not decorate:** it stops (slide 1), runs through the walls (5), meets the sockets (7), is cut into the wall (14) and finally plugs in (16). On evidence slides it may rest in the bottom band; on device slides it leaves the band and enters the drawing.
18. **Anything he says aloud is on the slide in readable size,** never only in the source line.
19. **The strongest human feel would be his own pen:** a plug, a key ring and a row of bricks drawn and scanned by him beat any generation. Offer it.

## Loop 1 (19 November): one cable, drafting marks, four key frames

What happened:
- Three directions (one street, the survey file, one picture a beat) went to two pairs of critics (dotUni `readers/concept-1-*.md`). Both ranked the survey file first; the street was called the most dangerous (data turned into scenery invites "is that to scale?"). The designer proposed the pick: one cable through the whole deck, data as drafting marks.
- First render of the key frames: the title page (cable stopping short of a brick wall) worked at once; the walls drawn as sections with the cable winding through them did not read; scaffolding with diagonal braces looked like random lines; the cable as a ground line collided with the source lines.
- Second render: walls seen face on, one cable at one height through all three (dashed inside timber, a duct box standing on the brick with its shadow edge, a plastered channel that cuts the brick courses) read at a glance. The plan as a building drawn floor by floor (built floors solid, planned floors dashed, the current floor green) carries order and measure together.

Rules that follow:
9. **One idea per drawing, aligned to one axis.** The cable at one height made the three walls comparable; the winding cable made them a puzzle.
10. **Use the drafting conventions engineers read without thinking:** dashed = hidden or planned, solid = built, hatch = cut masonry, dimension lines with ticks = measured. The examiner reads them faster than any legend.
11. **Reserve the bottom band.** The cable is the page's ground line at y 968; sources and the page marker live below it; nothing else may enter that band.
12. **The review sheet must read the folder it was written for** (it showed the old deck's pages once). Look at single pages at full size before trusting a sheet.
13. **Open question for him:** the frames are exact and clean; the human hand (his line) is so far only in the old house drawing. Whether generated drawings or sprites join them is his call after seeing the frames.

## Loop 0 → 1 (19 November): the first deck and why it isn't the bar

What happened:
- The deck Claude Design made from the synced design system was "horrible" (`-009`): artifacts are not the medium for his slides.
- The first coded deck (assertion–evidence, title as the last build, counted dots, a step row) scored 7–8 with five readers twice, and he still found it wrong on sight (`-010`): on most pages the title band was empty until the last click, so the slide looked broken.
- His bar after seeing it and the CheXVision and GKD4HYDRO decks (`-011`): not that pattern at all; "ten times better", unique, perfectly explained, made for the projector (no animation is seen, every page is a still), speaking to the expected audience. Generated images and sprites allowed. Compound engineering with written lessons.

Rules that follow:
1. **A page is a still.** On a projector nothing moves; each build must be a complete, good picture on its own. Never leave a reserved empty slot (the title-last band read as an error). If something arrives later, the page before it must not look unfinished.
2. **Reader scores are not his eye.** Five readers at 7–8 did not predict his reaction in one second. Show him key frames early; judge the first glance of every page, not the argument.
3. **Templates are out.** The reference decks (CheXVision, GKD4HYDRO, Lodkai, Kaffeelisten) share one engine and one look: card grids, kicker caps, big numbers, dark section dividers. Take their mechanics only (keyboard, number-key jumps, presenter notes, print one page per slide, scaling); never their layouts.
4. **What readers called machine-made in loop 0:** the same device on every slide (dot rows), big green numbers beside a label (stat cards without boxes), a numbered stepper, the same three-step build everywhere, the tilted mint field under the house, two-beat aphorism titles. Variety of form and one human hand matter more than polish.
5. **What held:** the 40 against 32 correction, "nothing published in between", sources on every slide, company figures marked, the walls with the drafting convention (hidden cable dashed, duct standing on the wall, plaster cutting the brick), the slide on how this could be wrong.
6. **Facts drift where numbers are typed.** Every number from a data file or the article's text, checked against `text.md`; the write-off quarter (Q3 2025) was wrong once.
7. **Delivery:** Edge's PDF viewer has no slide mode (full screen scrolls and drifts on a 3:2 screen). Ship the offline single-file HTML for presenting and a PDF at 13.333 × 7.5 in for the record. Test at 3:2 and 16:9.
8. **Gates catch only what they measure.** The overlap gate missed labels that touched and a label crossing a line; every page still needs a look by eye at full size.
