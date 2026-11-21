# Review: the purpose brief for section 4, read by the AI-made sceptic

Brief reviewed: `VISUALS-PURPOSE.md`, draft 1 (21 November 2026), sections 3 and 4. Reference drawings: `other-half/art/hero-line.png` (cryostat and servers) and `renovate/art/house-line.png` and `deck-*.png`, with both `SOURCES.md` files. I also checked the live pages' structure (figures numbered by caption; no step counters).

Seat: a sceptic of AI-made visuals, not of AI as a topic. I take the author's correction as given: this is his own research article, parts of it illustrated with OpenAI image generation, and it has to work for anyone.

## 1. What already keeps his generated drawings his

The two drawings that work (the cryostat with its servers, and the house in section) share four things, and any new drawing has to keep all four:
- **One loose, continuous pen line on white**, with wobble, overshoot and a cable that loops for no reason. That comes from his own banner, which the forge passes as `hand.png`.
- **A real object behind each drawing.** The cryostat comes from a Wikimedia photograph, and the deck's key, plug and wall from real photographs. The objects are specific (the cryostat's plates and the servers' vent holes), not "a quantum computer" or "a server".
- **No text, number or mark from the model.** Everything exact is placed on top by code (SOURCES: "No text, number or mark on the page comes from the model").
- **Asymmetric, with air**: the drawing sits to one side and is never centred in a frame.

`deck-wall.png` shows the failure mode: dark ground, a soft vignette, a faint glowing line. On its own as a slide background it passes. As an article picture it would be the night-scene look.

## 2. Question 1: can A, a building in section with wall alarms, look like his own hand?

**Yes, if it is made the way the house and the cryostat were.** The building in section is his father's eye, and the line suits it. What it needs:

**References (all real, as for the cryostat):**
- `hand.png`, his line, as the only style reference.
- One real architectural or measured section of a terraced row or a corridor of rooms (a Wikimedia or public-domain survey drawing, or a photograph of a cutaway), so the walls have real thickness, a floor slab and a footing instead of a dollhouse.
- One real photograph of the device on the wall, so it is a specific object, not an icon.

**Constraints:**
- **No night, no dark ground.** The brief says "at night" and "dark building". That invites a navy ground, lit windows and glowing alarms, the stock generated-explainer scene. Draw it on white like the house. "We can't see inside" is carried by the rooms being empty and unshaded, not by darkness.
- **The model draws only the building and unlit devices.** Which alarms are lit (accent field and solid dot, the article's fired state, set and never glowing), the question under it and the two stories are all placed by code on top, as the checks on the hero are. Then the lit alarms are exact, can match the film in B mark for mark, and can't drift between generations.
- **No glow, halo, rays, motion lines, sirens or red.** Lit means the article's one accent, flat.
- **No cute.** No faces, no people, no pets, no furniture story, no smoke drawn as clouds. The renovate house was allowed a ladder and a bucket because renovation is the subject. Here the rooms stay empty: the reader may not see in.
- **Four or five rooms in one row, with one end room** (the edge alarm). No floors stacked into an isometric cutaway. A flat section, like the house.
- **Not the renovate house again.** Two articles from one author, both opening on a little house in section, would read as a template. Make it a different building: a terrace or a corridor of equal rooms, a long low shape, no pitched-roof icon.
- **The device must be true to a builder.** Smoke alarms go on ceilings, not in party walls; his father would notice. Two honest options: a sensor mounted *in* the party wall that reacts to either side, or a civil engineer's crack monitor (a tell-tale) bridging the joint between two units, which really does read the relation between two neighbours. The tell-tale is the truer analogy and the more his-own picture. The lay reader still needs the word "alarm" in the caption.
- **The two inset stories are not two more generations.** Reuse the same building, small, with code marks showing which rooms were hit: one picture, three states. Three generated buildings that differ slightly in every line is the clearest generated tell there is.

**What would make A slop:** a night scene with glowing alarms; an isometric dollhouse with floors; a cosy cottage; little figures or a burglar; generated labels or numbers; a centred, symmetric composition; smoke as cartoon puffs; three almost identical generated buildings for the insets; a candidate approved by an agent without him looking (the house SOURCES still says "Alexander has not looked yet").

## 3. Question 2: does B risk "another grid of circles"?

**Yes, as written.** Three frames plus two "what really happened?" panels is five copies of the grid on one screen. That is the filmstrip I rejected in the sketch review (a sheet of identical stickers), and it is the teacher's complaint word for word. It is not an AI tell; generated explainers rarely draw a real code. But it is clutter, and on a phone it is unreadable.

B survives if it is small and does one job: one row of three frames of the section 3 grid (the reader already knows it), unlabelled, lights in the article's fired state, the "1.1 µs" line under them. The two stories belong in A, shown on the building, not as two more grids.

## 4. Question 3: which would I trust as real work?

**C, weighted towards A, with the two pictures sharing their marks.** A is the picture a non-specialist holds in her head. B is the proof that the picture is the real thing. What makes the pair trustworthy rather than decorative is that the lit alarms in A and the lit checks in the first frame of B are the same pattern, in the same accent, placed by the same code. A reader who notices the match trusts both. A on its own is an illustration; B on its own is the grid of circles again.

## 5. Question 4: section 4 concepts that would inevitably look like stock imagery

- **§2, "three people holding hands, the message in the hold".** Unavoidable stock: the generated teamwork and connection image, the hands-joined icon. Drop it. If the relation needs a picture, use a real object that only works as a pair (the tell-tale across a joint, or two halves of a torn ticket that only prove anything together), drawn from a photograph.
- **§3, "two notes that cancel when one is shifted".** It ends up as two sine waves cancelling, the stock physics-explainer graphic, and he has already said pencil, not waves. Leave it to the text, or find a drawn real object.
- **§6, "guessing someone's city instead of their route".** At risk: map pins and a dotted route on a stylised map is the stock travel or logistics image. The votes (10 and 19 of 30) drawn as code dots are fine; the map is not.
- **§2, the threshold curves, and §9, the scoreboard.** Not AI tells if they are drawn by code in the article's own chart style. The scoreboard must not become a dashboard card (rounded boxes, big coloured numbers, icons). A plain table, set like the rest of the article, is the honest form.

## 6. Scores (risk of AI look, 10 = none)

- **A, the building:** 5 as written ("at night", "dark building", lit alarms, generated insets). 8 under the constraints in section 2.
- **B, the film itself:** 8 for AI look (nobody generates a real surface code). It fails for clutter, not for the AI look, until it is cut to one row of three frames.
- **C, A then B:** 8, rising to 9 if the two pictures share their lit marks exactly.

## 7. Required constraints (if A goes ahead)

1. Generate from `hand.png` plus real photographs only (a measured section and the real device), on white, never night; he approves the candidate himself.
2. The model draws the building and unlit devices only; every lit alarm, story mark and word is placed by code in the article's flat fired state. No glow, no red, no motion lines.
3. One building, a different shape from the renovate house, with no people and no cute props. The two stories reuse it small with code marks, never as fresh generations.
