# Review: the held scene and the film of hints, read by the AI-made sceptic

Plan reviewed: `HELD-SCENE.md`, round 1 (21 November 2026). Nothing built yet. Read against `SPEC.md` (Design system), `figures/lattice.js` and `figures/shared.js`, and the live article.

Seat: a sceptic of AI-made work, not of AI as a topic. The question is whether this figure and this mechanism would look, at a glance, like the generated explainers that have flooded the web since 2025, and what keeps them his.

## 1. What the generated look is, in 2026 (research, briefly)

The evidence is mostly practitioner writing, ban lists and stock libraries, not studies. It is consistent all the same.

- **Fade-up on everything, staggered.** Ban lists for AI-made UI name "every section, every card, every paragraph fades up when scrolled into view" and elements "fading in on scroll for no reason" as the first motion tell; they also flag default `ease`/linear curves and more than one parallax per page ([Anti-AI-slop ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list)). The models learn "subtle fades and hover effects" first because tutorials teach them first ([prg.sh, Why your AI keeps building the same purple gradient website](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website)). Builders sell staggered fade-up reveals as a feature ([Emergent](https://emergent.sh/ai-landing-page-builder/animated-landing-page), [Framer template](https://www.framer.com/community/marketplace/templates/inkwell/)).
- **Glow, gradients, glass.** Purple-to-blue gradients, glowing cards, frosted glass and soft blurred shapes are the most named visual tells ([MindStudio](https://www.mindstudio.ai/blog/avoid-vibecoded-landing-pages), [Smithery frontend-designer skill](https://smithery.ai/skills/braw-dev/frontend-designer), [SheCodes](https://books.shecodes.io/make-your-website-pretty)). The article's blue accent sits close to that palette, which is a reason to keep it to the one field it already has.
- **Isometric stacked layers.** I found no critic who names it as a tell outright. What I found instead: stock libraries and prompt feeds are full of "layered 3D structure", "exploded" and "isometric" diagrams marked *Generated with AI* ([Adobe Stock, layered architecture](https://stock.adobe.com/images/enterprise-it-architecture-as-a-layered-3d-structure-with-cloud-application-and-data-levels/1474155259), [Adobe Stock, exploded diagram](https://stock.adobe.com/images/3d-architecture-exploded-diagram-illustration/546268009), [Krea feed](https://www.krea.ai/feed/a-vibrant-isometric-3d-cross-section-of-a-multi-level-35d5d1af-c964-50cf-92ae-98bd4bd8c0b9)), and prompt libraries sell generators for them ([God of Prompt, axonometric generator](https://godofprompt.ai/prompt-library/generate-axonometric-architecture-diagrams)). A stack of translucent planes is the stock answer to "show layers". My own reading of 2025–2026 generated explainers agrees: tilted panes, a few lit nodes, a connecting line, all floating on white.
- **Sameness from defaults.** Generated pages converge because the same defaults ship underneath (Inter in 8 of 10 specimens in one small benchmark: [Claude frontend aesthetics benchmark](https://dmwyatt.github.io/web-tools/claude-frontend-aesthetics-benchmark); [Why AI websites all look the same](https://www.neura.market/directories/stable-diffusion/blog/devto-4517997)). The article already left one of these (cream, clay, serif text: too close to Claude's look, SPEC 16 November).
- **Scrollytelling clichés.** Parallax and sticky steps were "everywhere" long before AI; Kosara argued that a story told in discrete steps should be stepped by a discrete action, and others ask for the principle of least astonishment ([Nightingale, past and future of scrollytelling](https://nightingaledvs.com/the-past-present-and-future-of-scrollytelling/); [Kosara, The Scrollytelling Scourge](https://tagteam.harvard.edu/hub_feeds/1977/feed_items/2177427)). A 2025 studio note: for reference reading, readers "want to find quickly, not experience" ([StudioMeyer](https://studiomeyer.io/en/blog/scroll-storytelling)). The vibe-coded version of a held scene is the "sticky text left, visual right, step dots underneath" feature tour.

Short version of the house style: soft entrances, 3D panes, lit nodes, a stepper, and a metaphor spoken out loud. The plan has some of each. It also has more protection than most.

## 2. The verdict on the core idea

**Does a stack of tilted grid frames, tilting into place on scroll, risk the generic isometric-layers look? Yes, as written.** Not because of the idea (rounds as frames is the right idea, and the space-time picture is the field's own), but because three choices in the plan are the stock moves:

1. **The tilt.** A flat panel rotating back into depth is exactly what `rotateX` card stacks do on generated landing pages. It also contradicts the plan's own geometry: in an oblique (cabinet) projection the front face stays true shape and size. Nothing tilts. If the frame visibly tips back, it is a perspective or isometric rotation in disguise, and the eye reads it as 3D UI, not drafting.
2. **Eight full grids overlapping.** Whatever the line weight, eight copies of a tiled, tinted grid offset diagonally will either occlude each other (opaque: a fanned deck of cards, the "3D card stack") or show through each other (transparent: glass panes, the "isometric layers"). There is no third outcome while the frames overlap. This is the strongest risk in the plan and the plan doesn't mention it.
3. **"Lights", the frames laying themselves in, and the ticks.** "Lights up" invites glow and pulse in the build. Seven frames arriving one after another, eased, is the staggered reveal. Five mono ticks with the current one in the accent is a stepper, the exact furniture of the generated sticky feature tour.

## 3. What protects it

- **Drafting oblique, no vanishing point, no shading, no gradients.** Correct and well stated in "What it must not be". Keep that paragraph word for word in the build brief.
- **Thin ink, one accent, the article's own grid.** The frames reuse `lattice` (same tiles, tints, weights). Recognition from section 3 is the best defence: a reader who has seen this grid flat reads the stack as *that grid again*, not as decoration.
- **Real, checked data.** A generator from `lattice.json`, a physics test, "a constructed example, not a measurement" as the source label. Generated explainers almost never have this. It is the plan's strongest asset, so it should be visible on the figure, not only in the repo.
- **The dashed X.** Drawing the error dashed because the chip never sees it is a real idea with an argument behind it. Nobody's template has it.
- **Played in time, never scrubbed; no percentage, no bar.** Good. The scroll decides which step, time decides how.
- **Fallbacks.** Stills for reduced motion, short windows and print; the composite holds everything.

## 4. What would push it over

- The tilt from face-on into depth (above).
- Overlapping frames, opaque or translucent (above).
- Frames "laying themselves in" with the article's eased curve: the uniform stagger.
- Any brightness on a light beyond the `lattice` fired state: a halo, a pulse, an accent ring that breathes.
- The five accent ticks under the figure.
- Notes that name the metaphor ("a round every 1.1 µs: a film"). Generated explainers love to announce their metaphor in the picture. The italic serif notes themselves are the article's settled system (SPEC), so they are not the problem; what they say is.
- A symmetric, centred composition (stack centred, notes balanced left and right). The `lattice` figure is asymmetric and working; keep that.
- The dashed accent "join" if drawn as a smooth bezier between floating points: that is the lit-nodes-and-arc look. A join should run along the drawing's own geometry (inside the frame between tile centres; along the time direction between the same check in two rounds).

## 5. Alternatives that keep the idea in the article's own hand (one line each)

- **Filmstrip, flat:** eight small `lattice` grids side by side, round numbers in mono under each, time left to right; on phones two rows of four – no depth at all, and the word "film" becomes literal without being said.
- **Contact sheet with one pen mark:** the same strip, and the time-pair shown as one loose pencil-like arc (`penRing`'s stroke) from `x2` in round 5 to `x2` in round 6 over the gap – one of the two allowed pen marks.
- **Oblique without sheets:** keep the cabinet projection but draw rounds as the 8 check positions only (small open dots), joined through time by hairline "check lines", with the full tiled grid only in round 1 at the front – the field's space-time lattice, not a stack of panes.
- **No tilt, ever:** round 1 stays exactly where and as it was in step 0; the later rounds are added behind it along the 30° axis, because a true oblique never rotates the front face.
- **Frames by the clock, not by easing:** if rounds appear one by one, they appear at a constant, linear cadence with a mono round counter, drawn by the pen (outline drawn, not faded or slid) – rounds really are evenly spaced, so even timing is truthful here, and eased stagger is not.
- **Lights as the lattice's fired state, nothing more:** field tint plus solid dot, set, not animated in brightness.
- **Replace the progress ticks with the round axis:** the `round 1 … 8` mono axis already shows where the story is; drop the ticks, or let the place label the engine already has do it.
- **Notes that say facts, not the metaphor:** "round 3: z0 and z1 fire", "x2 fires in rounds 5 and 6, no qubit hit", "pairs run across the chip and along time" – the word "film" stays in the passage.
- **One join in each direction, drawn as straight hairline segments along the grid and along the time axis,** not curves floating between nodes.
- **Hold short or not at all on first try:** prototype the same figure as an ordinary pinned scene with two short passages; build the held mechanism only if that version fails his eye.

## 6. What would make a viewer trust it as real work

- **The emptiness is the data.** Show all 64 checks (8 rounds × 8), quiet ones drawn as plainly as the lit ones. Four lights among sixty empties reads as a record; four lights alone reads as an illustration.
- **Name the checks and rounds in mono** (`z0`, `z1`, `x2`, `round 3`) exactly as section 3 names them, so a reader can check the figure against the text.
- **Say it is constructed, on the figure:** a mono foot line like `lattice`'s ("a constructed example · checks per round from the grid · our own construction"). Honesty about the example is more convincing than a polished one.
- **Tie it to the measured scale once:** the last state's `1.1 µs a round` and the distance-7 count from `results-summary.json`. If it can be sourced from the 2024 paper and added to the data file, one line on how dense a real film is (in that paper the detection probability per check per round is around 8%) would show the reader that the clean example is a simplification, which is what real authors say.
- **Recognition from the earlier figure:** round 3 must match `lattice` step 1 light for light (the plan already asks this); a reader who notices the match trusts the rest.
- **Small imperfections of a hand:** asymmetric layout, notes placed where there is room rather than mirrored, one pen mark. The article's existing figures do this; the new one must not be the first tidy one.

## 7. On the held scene as a mechanism

Pinned text with a figure that changes is old craft (NYT, ProPublica), not an AI tell. The generated version is the sticky feature tour: text left, visual right, step dots under it, everything easing in. What separates this plan from that is the absence of dots and fades and the presence of an argument for each step. The ticks undo half of that. The 1.4 window heights of held scroll is a motion-designer question; from this seat, the shorter the hold, the less it feels like a product tour. Kosara's point applies: discrete steps should feel discrete, so each band should produce one clear, complete change and then nothing until the next.

## 8. Scores

- Risk of AI look (10 = no risk): **5/10** as planned (tilt, overlapping frames, staggered entrance, ticks). About 8 with the required changes.
- Originality: **6/10**. The idea is the field's standard picture; the dashed unseen X, the recognisable grid and the checked data are the original parts.
- Overall: **6/10** as planned; the physics and the honesty are 9-level, the visual choices are not yet.

## 9. Required changes (must)

1. Remove the tilt: the front frame never rotates; specify a true cabinet oblique (front face unchanged) or no depth at all.
2. No overlapping frames: either a flat filmstrip, or an oblique in which rounds after the first are drawn as check positions and time lines, not as tiled sheets; never stacked panes, opaque or translucent.
3. Frames appear without fade, slide or eased stagger: drawn by the pen at an even, clock-like cadence, or present at once.
4. Lights are exactly the `lattice` fired state; no glow, halo, pulse or brightness animation, written into the build brief.
5. Drop the five accent progress ticks; the round axis and the engine's place label are enough.
6. Rewrite the step notes as checkable facts with check and round names; the word "film" stays in the passage, not in the figure.
7. Show all quiet checks in every round, and put "a constructed example" on the figure itself in its mono foot line.
8. Draw a storyboard sketch of steps 1 and 4 at desktop and phone width before any code, and have this seat look at it: the overlap problem only shows on paper.

## 10. Suggestions (may)

- Prototype the flat filmstrip and the dots-and-time-lines oblique side by side on the lab page and let him choose; build only one.
- Use one pen mark (the loose arc) for the pair in time, the article's own gesture.
- Add one sourced line on how dense a real film is, if the detection rate can be put into the data with its source.
- Try the figure first as an ordinary pinned scene with two short passages; keep the held mechanism for a case that needs it.
- Keep the composition asymmetric, like `lattice`; resist centring the stack.
- If the held scene ships, make its first appearance the only one in the article until a second figure clearly needs it.
