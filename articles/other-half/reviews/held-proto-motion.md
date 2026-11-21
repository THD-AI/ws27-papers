# Review, round 3: the held scene prototype (motion and interaction)

Reviewer seat: interaction and motion designer, scroll stories (same seat as `held-plan-motion.md` and `held-plan2-motion.md`). Read: `HELD-SCENE.md` section 0, `reviews/held-build-notes.md`, `.shots/held/report.md`, `figures/_held.js`, `_held.css`, both lab pages, the step screenshots and the `video-wheel-1440x900` frames.

Driven myself (21 November), with the lab server on 8823 and headless Chrome through Puppeteer, CDP screencast frames looked at in order plus a per-frame log of scroll, player position, goal, note classes and figure box. Fifteen runs:

- 1440×900, `_held.html` default and `?band=0.6&rest=0.6`, `_pinned.html`: a **calm reader** (one wheel notch every 0.4 s, a 1.5 s pause every four notches), a **skimmer** (bursts of four fast notches, 0.7 s apart), a reader who **stops at step 3 and scrolls back** four notches, then on, then back up into the block from below; **Space** on the default.
- 390×844 (touch phone emulated), held default and 0.6/0.6, pinned: a **calm thumb** (short drags of about 180 px), a **flick**, and a thumb that **stops and goes back**.
- Keyboard: Tab to the skip link, Enter, Shift+Tab back, on both pages.

## Scores

| | Score |
|---|---|
| Feel | 7 (default 6.5, 0.6/0.6 7.5) |
| Correctness | 8 |
| Held vs pinned | Held wins: by about 1 point on desktop, by about 2.5 on a phone |
| Overall | 7.5 |

## 1. Beat or scroll-jacking?

A deliberate beat, for a reader who reads. The calm reader at 1440×900 sees each note arrive in the list as its step starts, the drawing follow at the figure's own pace, and the step finish inside the pause he would take anyway. Nothing ever flips at an edge; going back four notches plays step 3 back in 0.6 s and the note returns to grey in the same frame; coming back up from below finds the figure whole and leaves it alone. That is the opposite of scroll-jacking: the scroll is never taken, only the page stops moving.

Where it tips towards jacking is **scroll that changes nothing**. In the held block the page is still, so a wheel notch that neither moves the page nor starts a step reads as "is it stuck?". Measured as scroll px inside the hold with the figure at rest:

| Page | Calm reader, 1440×900 | Calm thumb, 390×844 |
|---|---:|---:|
| held, 0.45 / 0.5 | 900 px (9 notches) | 538 px |
| held, 0.6 / 0.6 | 1600 px (16 notches) | 1127 px |
| pinned | 600 px, but the passages move, so it never reads as stuck | stills |

Most of it is the rest after step 4 and the stretches where the reader's pause already finished a step. For the steady (unpausing) wheel it is the reverse: at the default the steps fall behind the scroll and the last one is cut, which reads as the figure lagging, not as a beat. A figure that lags behind the hand is worse than a short still stretch, because the note list and the drawing then disagree with where the reader is.

## 2. The exit rule, and the skip rule (the real snap)

**Exit (queued steps set as the block lets go): acceptable.** For the skimmer at the default, step 4 was set in one frame at let-go, with the figure still whole on screen (top at 52 px) and already moving up; note 5 fades in as the next paragraph arrives. It reads as "it finished as I left", not as a glitch, because the page is moving. At 0.6 / 0.6 the same skimmer got step 4 played (shortened to 0.6 s), with nothing set. Keep the rule.

**The four-behind skip in the middle of the hold: jarring.** This is the one snap that happens while the page is still, so the eye has nothing to blame it on:
- Space at 1440×900, default: one press is 787 px, about two bands. At 3.2 s the player went from 1.78 to 4.00 in one frame: the rest of step 1, all of step 2 (the flip pair) and all of step 3 (the pair in time) appeared at once, figure pinned and fully in view, and the note list jumped from note 2 to note 5 in two frames.
- Flick at 390×844: 0.98 to 3.00 in one frame, pinned, in view.

The flip pair and the pair in time are the two things this figure exists to show. A Space reader, who is a careful reader, gets both as a cut. Under a still page any set-at-once should become a fast run-through (each queued step at about 0.35 s, in order, the pen still left to right): the eye then sees the order, which is what carries the meaning. Reserve true setting for a figure that is off screen or leaving.

## 3. Which default

**0.6 / 0.6.** It is the only setting where the steady wheel passes at all three sizes with every step at full length, and the skimmer's last step is played, not set. Its cost is dead scroll for a pausing reader (16 notches over the whole hold, about 1.8 s of wheel), which is real but quiet; the default's cost is lag and cut steps, which is visible. Two refinements so it holds in short windows too:
- measure the band as `max(0.6 svh, 540 px)`, so 1280×720 still gives about 1.8 s a band at 300 px/s (the harness cut step 4 to 1.27 s there);
- keep the rest at 0.6 only as long as it covers the last step (1.6 s, about 480 px at 300 px/s); do not lengthen it.

## 4. Held vs pinned, per size

**1440×900 (and 1280×720): held, by about 1 point.** The pinned scene feels more natural (the passages move, so scroll is always visibly doing something), but it teaches this figure less well. Its notes stand about 360 px apart, so at the end only note 5 is next to the finished chart, and at a steady wheel the engine squeezes steps 2 to 4 to 0.7–0.8 s. In the held block the five notes build into a numbered legend beside the chart, and the final frame (chart, both pairs, the dashed joins, all five notes) is a complete caption: that is the frame a reader remembers. Held 7.5, pinned 6.5.

**390×844: held, by about 2.5 points.** The pinned scene cannot pin this figure on a phone (235 px wide in 45% of the window) and falls back to five stacked tall stills, about 3000 px of scroll for one idea. The held block keeps a 366 px figure with the passage and one current note above it, and the calm thumb passed cleanly at both settings. Held 7.5, pinned (stills) 5. The estimate that a real iPhone in Safari (`svh` about 660) falls back to stills still stands and still needs his hand test.

## 5. Broken or rough

- **Note crossfade on the phone double-exposes.** In the single note slot the outgoing and incoming notes fade over each other for 0.25 s; frame 309 of the calm thumb run shows "round 3: z0 and z1 fire" printed over "a round every 1.1 µs…". Readable after, smeary during.
- **The skip link moves the block when it gets focus.** It goes from off-screen to `position: static`, which pushes the held block down 32 px (pinned: 51 px); the triggers are not recomputed, so every edge is 32 px early until a resize. It also first appears half cut at the bottom of the window (scrolled only 14 px into view).
- **Skip link works.** Enter moves focus to `#after-film`, the figure is set complete, nothing plays. Shift+Tab back scrolls up to the link and the figure plays back from 5 to 1 (set to 2, then 0.6 s) while in view: harmless but busy; it could be set at once since it is a jump.
- **Entry:** step 0 plays while about 40% of the figure is in view at the bottom of the screen; by the pin it is complete, so the figure is never blank. Fine as built.
- **Notes in sync:** the note changes in the same frame the step starts (0 mismatched frames in every held run, one frame on going back). The drawing's lights come later in a step than its note; that is a reasonable lead, not a bug.
- **No blank frames, no flicker in the figure, no edge flips, no horizontal scroll** in any run.

## 6. Fixes, ranked

1. Replace every set-at-once while the figure is pinned and in view (the four-behind skip) with a fast run-through, queued steps about 0.35 s each in order; keep setting only off screen.
2. Make 0.6 / 0.6 the default, with the band as `max(0.6 svh, 540 px)`.
3. On the phone, fade the outgoing note out (0.12 s) before the new one fades in, so the slot never shows two notes.
4. Keep the skip link out of the flow on focus (absolute, over the run-in) so it neither moves the block nor leaves the triggers stale, and give it `scroll-margin` so it shows whole.
5. Treat a focus jump back (Shift+Tab from after the figure) as a jump: set, do not play backwards.
