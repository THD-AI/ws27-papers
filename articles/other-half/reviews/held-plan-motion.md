# Review: the held scene plan (motion and interaction)

Reviewer seat: interaction and motion designer, scroll stories. Reviewed: `HELD-SCENE.md` (round 1), against `SPEC.md` (Text format, Figure contract, Design system, Motion, the three modes) and `lib/article.js` (players, triggers, jumps, resize). The live page was not driven for this review; judgements on feel come from the spec and the engine code, and are marked where they need a real device to settle.

## Scores

| | Score |
|---|---|
| Mechanism | 6 |
| Storyboard | 6 |
| Evaluation plan | 6 |
| Overall | 6 |

The plan is careful and honest about the physics and the print path. What holds it back is that the hold's one real risk, a reader scrolling through a stretch where nothing on screen moves except the figure, is described but not designed for, and the timing tools as they stand measure a reader the held scene will not have.

## 1. Is "held" the right mechanism, and is the mapping sound?

**Is it the right tool for this content?** Only just. The held passage is two sentences ("While the computer runs …"), and the step notes live inside the figure. That means the held scene is really a figure that tells its own story while the reader scrolls past nothing. The existing pinned scene can tell the same story today: five short `@step` passages (the five notes as text) scrolling past the pinned film. That version is already measured by `timing.mjs`, already accessible (the notes are real text), already has its stills, and cannot feel like scroll-jacking, because text always moves. The plan should say in one paragraph why this figure needs the passage to stay still, and the prototype should build both and let him compare. If held wins, it wins on evidence; if it doesn't, the engine stays simpler.

There is a case for held, and it is worth writing down: the frames are dense and the reader's eye should stay on the figure, not hop to a moving paragraph. That case is strongest where steps are visual (the tilt into a stack, the lights in two directions) and the words are few. This figure qualifies. So: right mechanism is plausible, not proven.

**The mapping (35% bands, time-played, back 0.6 s).** Sound in principle: the scroll picks the step, time plays it, which is his rule. The problems are in the details.

- **Where band 1 starts.** If the first band begins when the block pins, the reader scrolls 35% of a window (about 300 px on a laptop, three wheel notches) with only the scrollbar moving. That first dead stretch is the moment a reader decides "this page has taken my scroll". Step 1 (the tilt into the film) should trigger within about 10% of a window of the pin, so the first input gets an answer.
- **Readers don't read during a hold, they scroll.** In a normal scene the reader pauses to read each passage, and the 230 wpm reader in `timing.mjs` models that. In a hold there is nothing new to read after the first five seconds, so readers scroll at a steady rate. At 300 px per second (an unhurried wheel), a 315 px band is crossed about every second, faster than a 1.8 s step. The queue builds, the engine squeezes steps toward 0.5 s, and the reader gets exactly "bang, bang, bang". The fix is in the playing, not the band: in a held scene, play queued steps at full time when two or fewer are behind (the reader has nothing else to look at), and keep the figure on screen until the queue is done (see exit, below).
- **Trackpad inertia.** One swipe with momentum easily carries 600–1500 px, so one gesture crosses two to four bands. Same remedy as above; plus the inertial tail must not trigger a step backwards when it settles a few pixels back.
- **Hysteresis.** A reader resting on a band edge with a trackpad jitters across it, and the figure plays forward, back, forward. Add hysteresis: once a step is due, scrolling back starts the reverse only after 8–10% of a band (about 25 px).
- **Touch.** A flick on a phone crosses the whole 1.4 windows. The engine's "more than three behind: set to second-last, play the last" means a flick through all four bands shows the stack already lit and plays only the joins. That is acceptable for a reader who chose to skip, but the figure must still be in view when the last step ends.
- **Keyboard.** Space and Page Down move about 87.5% of a window: one press crosses two or three bands. Today's squeeze turns that into two or three steps in a second. With full-time queueing (above), one Space press becomes a short film of two or three steps, which is the right outcome. Arrow keys (40 px) take eight presses a band; fine.
- **Back in 0.6 s.** Right. Going back is navigation, not reading.
- **Exit.** "A quarter-window of rest, then the block lets go." If steps are still queued when the block unpins, the figure plays while it scrolls away, and the last step (the decoder's pairs, the point of the whole figure) can finish off screen. The rest at the end should be at least as long as it takes to finish the queue, or the last step should be set at once if it would otherwise finish off screen. Better still: let the block go only after the last step has played, measured in scroll, by making the rest stretch 35% (one band) rather than 25%.

## 2. Is 1.4 windows of hold acceptable? What makes a hold a beat and not jacking?

1.4 windows for four transitions is not long; well-made scroll stories often use a full window per step. Length is not where the jacking feeling comes from. It comes from four things, and the plan covers one of them.

1. **Every input gets an answer.** Within the first few wheel notches something changes (see band 1 above). After that, each band crossing starts a step at once. Dead scroll at the start or at the end reads as a trap.
2. **The reader can see how much is left.** The five mono ticks do this, and they are the right weight (no bar, no percentage). They should be visible from the moment the block pins, with the current tick in the accent, and the next tick should be faintly marked as "next" so the reader knows another step is coming.
3. **Entry and exit look like an entry and an exit.** On entry, the block arrives like any scene: the figure whole, step 0, ticks present. On exit, the figure should not simply slide away with the text; it should show its final state for at least the rest stretch, and the passage after it should come into view under it, as the text column resumes.
4. **A way through.** There is none in the plan. Two cheap ones, both keeping the scroll as the only source of truth: make the ticks links that scroll to the start of their band (mouse and keyboard can step or skip), and give keyboard and screen-reader users a skip link before the block ("Skip the film figure") that jumps to the passage after the hold. Neither intercepts the scroll.

With these, 1.4 windows is fine. Without the first and fourth, even one window will feel trapped. His own "not jacking the scroll" is about the feel, so the question to him should come after he has scrolled it, not before.

## 3. Devices and situations

- **Phones upright (390×844).** In the "on top" mode the figure has at most 45% of the height. An 8-frame stack at 60° is tall and narrow; at about 360 px wide each frame is maybe 140 px across, and 8 checks per frame with labels at 11.5 px will not fit. Label only the front frame (and lit checks), and test the fallback early rather than after building the desktop version.
- **Mobile toolbars.** On iOS Safari and Android Chrome the address bar hides on the first scroll down and fires `resize`. `article.js` treats every resize as a relayout: scroll updates are ignored while `resizing` is true, then `restoreAnchor()` moves the page back to the active passage and `jumped` sets every figure at once. In a hold that means the first step on a phone may be set at once instead of played, and the anchor correction can move the scroll inside the hold (the "active passage" is a sticky block that never moves). Size the hold in `svh` (or measure once in px), and ignore height-only changes under about 150 px on touch devices for held scenes. Verify on a real phone; this may affect today's scenes too.
- **Phones sideways (844×390) and windows under 560 px high.** Stills, as planned. But use the engine's own `MODES` rather than a new 560 px number: low laptop windows (640 px wide, 450–559 high) are "beside" in the engine, and the plan would hold in none of them while scenes pin in all of them. One rule for both.
- **Small laptops (1280×720 with browser chrome, about 1280×630).** The held block is a window high and holds the passage, the stack, the notes and the ticks. Check that the figure gets at least 60% of the width and the notes stay at 11 px. Also 1366×768, the most common small laptop.
- **Reduced motion.** Five stills on screen is long for this figure: steps 0 and 1 carry little information. Two stills (the single frame, then the composite) or the composite alone with the notes say everything. The contract's `stills = [n]` export already allows this.
- **Screen readers.** The step notes live in the SVG, which the engine marks `aria-hidden`. A screen-reader user gets the two-sentence passage and nothing of the film. The five notes must exist as text: a visually hidden ordered list after the passage, or the print caption exposed as the figure's accessible description. The empty scroll stretch itself is harmless to them (the virtual cursor doesn't scroll), so the skip link is mostly for sighted keyboard users.
- **Anchor jumps and reload mid-hold.** "Set at once" is right, and the engine already has `jumped` for hash changes and clicks on in-page links. The state at an arbitrary scroll position inside the hold must come from the same band function as live scrolling, so a reload and a scroll to the same point show the same step.
- **Back and forward.** Not covered. A back navigation restores the scroll position, sometimes from the back-forward cache, where `load` does not fire and the page resumes as it was left. Listen for `pageshow` (with `persisted`) and set the state at once. Also check that `history.scrollRestoration` restoring into the middle of a hold doesn't play steps 0 to 3 in a row.
- **Zoom and large text.** At 200% browser zoom the window is effectively half as wide and half as high; it should fall into "on top" or stills, not a squeezed hold.
- **Print.** The composite is right. Make sure the print caption says what the ticks and the steps said on screen, since paper has neither.

## 4. The storyboard

**Will it read in five seconds?** The final state has the right content, but as drawn it is at risk.

- **Occlusion.** Time runs to the right and back, so frame 1 is in front and frames 3, 5 and 6 are behind it. If the frames are filled sheets, frames in front cover parts of the frames where the events are: `z0`/`z1` in frame 3 and `x2` in frames 5 and 6 can sit under frames 1–4. If the frames are open line grids, eight overlapping grids at a half-foreshortened 30° make a moiré of tiles in which two lit dots are hard to find. Either way the five-second test fails. Decide now: draw the full tiled grid only on the front frame (and let its tiles fade to an outline as it tilts back in step 1), and draw the frames behind as a thin plate outline with the 8 check points only. 64 dots, 3 lit, reads at a glance.
- **Space between frames.** The depth step has to be large enough that a check in one frame never lands on a check in the next. Compute it from the grid, don't eyeball it; on phones at 60° this is the binding constraint.
- **The flat alternative.** A literal film strip, eight frames in a row from left to right, is a picture a lay reader already knows, and "film" is the article's own word. The pair in time becomes a short horizontal join between two neighbouring frames; the pair in space stays inside one frame. It needs no projection to be decoded, wraps to two rows of four on a phone, and prints cleanly. The oblique stack is more like the space-time diagrams in the papers, which is its strength for specialists and its cost for lay readers. Prototype both and put both in front of the lay reader.
- **Order.** Right: one frame, then the film, then a pair in space, then a pair in time, then the decoder's joins. Space before time is correct, because the article taught the space pair first (the lattice figure). Two small changes: step 2 shows the lights and the dashed X together, so the reader sees the cause and the effect at once; consider lights first and the X a beat later inside the same step, so the X reads as "what the chip never shows". And the scale (1.1 µs, 48 checks, about ninety thousand rounds in a blink) is promised for "the last step" in section 3 of the plan but appears in no step of the table. Either add it to step 4's note or drop it from the plan; the axis line `1.1 µs each` may be enough.
- **The tilt.** Step 1 tilts a face-on frame into the oblique view. Interpolate the 2D shear and scale, not a 3D rotation, or it will look like the rendered 3D the plan forbids. Lay the seven frames in with a stagger (about 0.12 s apart) inside the 1.8 s, so the stack builds from front to back as time runs.
- **Step time cap.** The engine caps a step's time by the words of its passage at 230 wpm. In a held scene every step has the same passage, so the cap must come from the step's note (about eight words, about 2 s), or be defined afresh.

## 5. The evaluation plan

Good: physics recomputed in code, gates first, devices named, his eye last, readers before building. Missing:

- **A reader model for holds.** `timing.mjs` models a 230 wpm reader who pauses for passages. Add four readers for the held stretch: a steady wheel (one notch every 0.3 s), a continuous trackpad swipe with inertia, a phone flick, and Space presses. Pass: no step shorter than 1.2 s at the steady wheel, the last step complete while the figure is still in view for every reader.
- **A comparison.** The same film as a normal pinned scene with five `@step` passages, built in the same lab page, shown to the readers and to him side by side. Without it, "held" is judged against nothing.
- **Real phones.** Puppeteer at 390×844 does not hide an address bar or carry momentum. One iPhone in Safari and one Android in Chrome, scrolled by hand, recorded.
- **A first-scroll test.** Record what happens on the first three wheel notches after the block pins, at 1440×900 and 1280×720. If nothing visible changes, it fails.
- **Accessibility checks.** Screen reader (NVDA on Windows, VoiceOver on a phone): are the five notes read? Keyboard: does Tab reach the ticks and the skip link, and does focus stay visible? `prefers-reduced-motion` on: what is shown?
- **Back, forward and reload.** Leave the page from inside the hold, come back with the back button (and once with the back-forward cache), reload mid-hold: the state must match the scroll position, nothing replays.
- **The lay reader's test needs a protocol.** Five seconds on the last state, no caption, then "what does this show?"; and separately, the whole scene scrolled once, then "did the page ever stop doing what you asked?". The second question is the scroll-jacking test, and it is the one he will ask.
- **Who scores the motion.** The readers are told to "drive the live lab page", but stills cannot judge motion (his rule). Each reader gets the reading-pace video and the hand-scrolled phone video, not only screenshots.

## Required changes (must)

1. Trigger step 1 within about 10% of a window after the block pins, so the first scroll gets an answer.
2. In a held scene, play queued steps at full time when two or fewer are behind; squeeze only beyond that.
3. Keep the figure in view until its last step has played: make the end rest one band (35%), or set the last step at once if it would finish off screen.
4. Add hysteresis at band edges (about 25 px) so a resting trackpad doesn't flip steps.
5. Give a way through without touching the scroll: ticks as links to their bands, and a skip link before the block.
6. Put the five notes in the page as text for screen readers (hidden list or the figure's accessible description).
7. Use the engine's `MODES` for when to hold and when to show stills, not a new 560 px threshold.
8. Make mobile address-bar resizes (height-only, under about 150 px) neither relayout nor re-anchor a held scene; size the hold in `svh` or fixed px.
9. Handle `pageshow` (back-forward cache) and scroll restoration by setting the state at once.
10. Solve occlusion: full tiles on the front frame only, the frames behind as outline plus 8 check points, depth step computed so no checks overlap.
11. Decide where the scale fact goes (step 4 note or out of the plan) and make section 3 and the storyboard agree.
12. Add hold reader models (steady wheel, trackpad inertia, phone flick, Space) to the timing check, with a 1.2 s minimum step at the steady wheel.
13. Build the same figure as a normal five-passage scene beside the held one, and let the readers and him compare.
14. Test on one real iPhone and one real Android, scrolled by hand and recorded.

## Suggestions (may)

- Prototype the flat film strip next to the oblique stack and give both to the lay reader.
- In step 2, light the checks first and bring in the dashed X a beat later.
- Stagger the seven frames in step 1 (about 0.12 s apart), front to back; interpolate shear, not a 3D turn.
- Under reduced motion show two stills (one frame, then the composite) rather than five.
- Mark the next tick faintly so the reader knows more is coming.
- Take the step's time cap from its note, not the shared passage.
- Ask him about the length after he has scrolled it, not before; the open question in section 7 is premature as a paper question.
- Keep held scenes rare (one per article) until the first one has been through real phones; a second one should only come with a reason the pinned scene can't serve.
- Check 1366×768 and 200% zoom alongside the listed sizes.
