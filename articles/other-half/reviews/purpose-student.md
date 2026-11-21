# Purpose review – first-year AI student

Reader: first semester AI at TH Deggendorf. I can write some Python, I know what a neural network, a training set, a seed and a learning rate are, I've met matching once in an algorithms context. No quantum computing at all.

Read: `text.md` in full and the printed PDF (pages 1–11) with its figures. I didn't open the live site, so I can't judge the scroll scenes as they move; where I talk about the lattice, clock and learning scenes I mean their printed stills.

Overall: I came out knowing what the group did and what they found (the small network wins at distance 3, needs about 250 million examples to pass plain matching at distance 5, never catches correlated matching, and the fast network from Google is still just a claim). I didn't come out able to *picture* the thing being decoded. The words are defined, but the film that section 4 promises never actually appears, and that's what the rest hangs on.

---

## 1. Where I got lost, section by section

### What we wanted to know
Fine. "Two programs read the same recording from the same chip and came out with different error rates" is a good hook. I didn't yet know what "recording" meant (a recording of what?). Section 4 answers it, but I had to hold the question for three sections.

### 1. A qubit doesn't hold still
Clear. The water image works. Small stumble: "two and three billion steps of the costly kind". What's the costly kind? I let it go.

### 2. The cure costs what it protects
- "store the information in the way several qubits relate to each other, and in none of them alone." The three-qubit all-0/all-1 example helped, but then the text jumps to a square grid and never comes back to it. I didn't see how the grid is the same idea as the three qubits.
- **Distance:** "the size of the grid is called its distance." Size how? Width? Number of qubits? I only learned in section 3 that distance 3 means 9 storing qubits (3 × 3), and only in section 5 that distance is "the number of storing qubits a line needs to cross it". The second meaning is the useful one and it comes far too late.
- **Threshold:** "Below a certain error rate, called the threshold, it does. Above it, a bigger grid is worse." I understood the sentence and couldn't picture it. Why would more protection make things worse? "every added qubit is one more thing that smears" half-explains it, but I couldn't see the crossover.

### 3. Asking without looking
- **Checks:** "only whether the number of errors among those neighbours is even or odd." This clicked only because I remembered the parity bit from a networking lecture. The article never says "parity", and a reader without that lecture gets "even or odd" with nothing to hang it on.
- **Firing:** "When a qubit next to it is hit, the answer changes, and we say the check fires." I first read "fires" as "says yes". It took the glossary ("gives a different answer than in the round before") to see that firing is a *change over time*, not a value. Also, if two neighbours are hit, the check *doesn't* fire. That's true from this definition, but I only realised it in section 6, step 2.
- **Flips vs phase errors:** "it keeps the pattern's shape and shifts its rhythm: 0 and 1 stay as they are, but '0 plus 1' becomes '0 minus 1'." This is where I lost the thread. I don't know what "0 plus 1" is, so "0 minus 1" means nothing to me. "Shifts its rhythm" in the water image is nice, but then I can't see why that's an error if nothing I could measure changes.
- **A check that lies:** "Then it fires twice in a row, once when the wrong answer appears and once when the right one returns." I had to reread this three times. It only makes sense once "fires" means "changed since last round", and I didn't have that yet. This is the most important sentence for section 4, and it has no picture.

### 4. A film of hints
- The numbers (1.1 µs, 48 checks, ninety thousand rounds, four million results per blink) are impressive, but they're just big numbers to me.
- "We ended up thinking of it as a film in which a few points light up in every frame." I liked this, then looked for the film and there isn't one. The figure beside it is the distance-7 grid of dots, a still frame with nothing lit.
- "Many sets of errors light up the same points." This is the key sentence of the whole article and I took it on trust. No example.

### 5. The decoder, and the one mistake that matters
- "Nothing on the chip gets repaired" surprised me, in a good way. Clear.
- "A wrong guess that fires the same checks usually differs from the truth in a way the code doesn't care about." Lost. Why doesn't the code care? What does a harmless difference look like? Section 6 leans on this sentence ("explanations that differ only in a way the code doesn't care about … add up"), so not getting it here cost me later.
- **Logical error:** "If the real errors and the decoder's correction together make an unbroken line across the grid … the stored value has changed." Figure 1 rescued this. I could see the line. *Why* a full line changes the stored value is never said. I accepted it as a rule.

### 6. Where the standard method goes wrong
- "the one the standard decoder gives, and the one most likely to be right." Wait, isn't the standard decoder trying to give the most likely one? The answer (it gives the single likeliest *set of errors*, not the likeliest *outcome*) only arrives in step 3 of the scene, a page later.
- **Matching:** "join every fired check to another fired check, or to the edge." The pairing puzzle clicked for me, but no figure shows the pairing lines being drawn. The lattice figure shows the answers, not the puzzle.
- "explanations that differ only in a way the code doesn't care about (section 5) add up." Hardest sentence in the article for me. Step 5's "it can happen in two ways" made it concrete, and the dot counts (10 of 30 against 19 of 30) made it believable. I still had to work to see that the two ways are "the same answer" because they lead to the same outcome.
- "Counting Y as one error, this answer also has two." This is fine once you know that plain matching counts Y as two, but that fact is in step 3 and easy to miss.

### 7. The result that started us off
- **Λ:** clear enough as "the factor the error shrinks by per step".
- "171 per 100,000 rounds" here, then "1.48% of runs" in section 9. Different units. The details box says the distances can't be compared, but I'd have liked one line in the main text saying "per round" (Google) and "per run" (ours) aren't the same ruler.
- **Threshold** comes back here ("the error rate from section 2 under which bigger grids win"). Thanks for the reminder; I needed it.

### 8. Accurate, or in time
- **The clock:** the interpreter comparison ("twenty-two seconds for every second of speech") is the best comparison in the article. I got it instantly.
- "some operations can only go ahead once the decoder has answered" (section 5, pointing here). I never got an example of such an operation, so I believed speed matters without feeling why.
- "its answer comes about 63 after the last round": 63 what? The caption leaves the unit to the axis. I worked out µs from the figure.

### 9. What we measured ourselves
- Mostly fine for me, since this is the ML part. Seeds, fresh batches, three layers of 256 units: all clear.
- **The learning curves:** the distance-3 panel has a log x-axis (1, 10, 100, 250) and the distance-5 panel a linear one (50, 100, 250). I didn't notice at first and thought distance 3 learned in a strange shape. The d3 curves are crammed into the right corner.
- "the lookup table, our estimate of the best" is a great idea and it gave me a floor to look at. I understood immediately what 1.47% against 1.48% meant.
- **The correlated-matching defect:** I followed that something was wrong in the library. The details (219 mechanisms, 0.4 times the noise level) went over my head, and that's fine. It's clearly marked as a side finding.

### 10 and after
Clear. "A decoder doesn't make a quantum algorithm faster in itself" is a useful sentence. I'd have liked it earlier, because I'd half assumed the network makes the quantum computer faster.

---

## 2. What would have made each concept click

| Concept | Picture or comparison that would have worked for me |
| --- | --- |
| **Check (parity)** | Say "parity check", and give the everyday version: a teacher who can't look at answer sheets, only asks two neighbours "do your answers agree?" A "no" tells her one of the two is wrong, not which, and not what the right answer is. That also explains "asking without looking": she never learns anyone's answer. |
| **Firing** | A single check drawn as a strip over time, like a row of lamps: off off off ON ON ON. It fires at the moment it *switches*, not while it's on. One small strip, five rounds. |
| **A lying check** | The same strip: off off ON off off. One wrong reading makes *two* switches, one in and one out. Compare a smoke alarm that chirps once by mistake: you hear it start and you hear it stop, but there was never a fire. |
| **Flip vs phase error** | Two tuning forks playing the same note together sound loud. Turn one of them over in time (same note, same loudness, opposite swing) and together they go quiet. Alone, each fork sounds exactly the same as before. A flip changes *which note*; a phase error changes *how the two parts line up*, and that only shows when both are playing at once. That's the article's "only shows while the qubit is in both states at once", made audible. (Noise-cancelling headphones work the same way.) |
| **Distance** | Lead with the second meaning: "distance is how many storing qubits an error has to cross to get from one edge to the other unnoticed". A picture of a d3 and a d5 grid with the shortest crossing line drawn on each. |
| **Threshold** | A jury vote. If each juror is right more often than wrong, a bigger jury gets the verdict right more often. If each juror is right less often than half the time, a bigger jury makes it *worse*. Two curves, small grid and big grid, crossing at the threshold. That's exactly the shape of the claim, and the figure is tiny. |
| **Logical error (why a full line changes the value)** | Go back to the three-qubit example from section 2. One flip gives 010: the neighbours disagree, the checks notice. Flip *all three*, 000 → 111, and every neighbour still agrees, so no check notices, yet the stored value is now 1. A line across the grid is "flip all three" in two dimensions. That one sentence would join sections 2 and 5. |
| **Harmless wrong guesses** | Draw the true errors and the decoder's correction together. If they form a closed loop or a line that doesn't reach both edges, nothing happened. If they reach edge to edge, it's a logical error. It works like a cut in a sheet of paper: a loop cut out of the middle leaves the sheet in one piece, a cut from edge to edge splits it in two. |
| **Matching** | Show the puzzle itself: the lit checks as dots, the edge as a coastline, and matching drawing the shortest strings between pairs. It's a dating app that pairs everyone with the nearest match, or sends them to the edge if no one's near. |
| **"Explanations add up" (section 6)** | Guessing where a friend went. The single most likely route ends in Munich (30%). Two slightly less likely routes, 25% each, both end in Berlin. If what you need is the *city*, not the route, Berlin wins at 50%. The decoder only needs to know whether the stored value flipped (the city), not exactly which qubits were hit (the route). Plain matching picks the best route; the best decoder picks the best city. |
| **The clock** | The interpreter already works. One addition: a conveyor belt bringing a new parcel every 1.1 µs to a packer who needs 24 µs per parcel, with the pile growing behind him. |
| **Learning curves** | Say in one line that the flat lines are opponents who never practise, and the falling curves are a player who gets better with every game. The question is whether, and after how many games, the player passes each opponent. The figure already shows this; the text could say it. |

---

## 3. Figures: what taught me something, what I looked past

**Taught me something**
- **Figure 1 (line column, distance 5).** The best figure in the article. "3 real + 2 added = 5 = the distance" made distance *and* logical error click at once. I'd have liked it to also show the shortest crossing line on a clean grid first.
- **Figure 3 (lattice scene, printed).** The dot rows "10 of 30" and "19 of 30" are what made section 6 believable. The left panel (a line of flips, only its end fires) is also good. The X/Z/Y key is easy to find.
- **Figure 5 (clock).** The "41 waiting after the second answer, 62 after the third" numbers and the bar for the 2024 network that keeps growing teach the backlog well. The bottom half (live matching, the 2025 preprint) is busier and I skimmed it.
- **Figure 4 (Google suppression, dots).** Counting dots, where one dot is 10 errors, gave me a feel for 712 → 349 → 171. Halving was visible. Good.
- **Figure 6 (learning curves).** The distance-5 panel taught me the main result: the curves come down through the plain-matching line and stop above the correlated line. The distance-3 panel I misread at first (log axis).

**Looked past**
- **The margin grids (1 qubit, 17, 49, 97, 161 qubits).** Pretty, but I didn't know which dots were storing and which were helpers, and they never light up. The "the other half – the decoder" box at section 5 is the title idea and I missed it on the first pass. It's a small empty square beside a grid.
- **Figure 2 (all 256 patterns).** I looked at "103 of 256", the circled example and the caption, and skipped the grid. The two axes ("flips: 0 … 4 checks fired", "phase errors: 0 … 4 checks fired") didn't tell me anything I could use. The one fact I needed, "these patterns are rare, about 1.6%", is in the text already.
- **Figure 7 (noise panels).** Each panel has its own scale, so I couldn't compare across panels by eye. I read only the labels underneath ("between the two", "behind both"). Those labels are the figure for me.
- **Hero drawing.** Nice, and it does say "two halves: cold machine, ordinary computer". It didn't teach me anything new after the title.

---

## 4. Section 4, "A film of hints", and how it holds 3, 5, 6 and 8 together

**The one idea:** the decoder never sees an error. It sees only a film, one frame per round, in which some checks light up. A hit qubit lights up two neighbouring checks *in the same frame*. A lying check lights up the *same check in two frames in a row*. Many different error histories produce the same film, so decoding means guessing a history from a film.

**How it connects:**
- **Section 3** defines one frame (checks, firing) and gives the reason it has to be a film rather than a photo: a lying check is only recognisable across two frames.
- **Section 5** is the reader of the film: the decoder watches it and picks one history.
- **Section 6** is how the standard reader does it: join lit points in pairs along the shortest lines. In the film that means pairing in space (a qubit error) *and in time* (a lying check). The article only ever shows matching on a single frame, so the time direction, which is the film, quietly drops out. I only realised matching must also join lights across frames because I worked it out from section 3.
- **Section 8** is the film's frame rate: a new frame every 1.1 µs, and a reader who needs 24 µs per frame falls behind for good.

Right now section 4 is three short paragraphs of numbers and a metaphor, followed by a still grid. It's the hinge of the article and the thinnest part.

**The single visual that would carry it:** a flipbook of the distance-3 grid, frames stacked into a short block (time going up), with a few lit checks.
1. One qubit hit: two lights side by side in one frame, staying on in the frames after, with the switch marked once.
2. One lying check: the same light in two consecutive frames, a vertical pair.
3. Matching then draws its strings through the block: sideways for the qubit error, upwards for the liar.
4. Last, a ticker at the side adding a frame every 1.1 µs, and the decoder's progress mark falling behind it (this sets up section 8).

On paper it can be three small stacked frames with the pairs drawn in. On screen, frames sliding in one per scroll step. It's the article's own metaphor made literal, and it carries "checks", "fires", "a lying check", "matching" and "the clock" in one picture.

---

## 5. The three moments I'd most want a visual for, ranked

1. **Section 4, the film of hints.** The stacked-frames block above, where a qubit error is a pair in one frame and a lying check is a pair across two frames, with matching drawing strings through space and time. Everything before builds towards it and everything after reads it, and right now there's no picture.
2. **Section 3, flip versus phase error.** "'0 plus 1' becomes '0 minus 1'" is where a reader like me stops understanding the words. Two waves (or tuning forks) that add up loud, then cancel when one is turned over in time, side by side with an ordinary bit flip. Even one small drawing would do it.
3. **Section 6, step 5, "two ways add up".** One route to the wrong answer against two routes to the right answer, with the dot counts (10 against 19 of 30) already in figure 3 placed under the route picture. This is the real reason a learning decoder can beat matching, and it's the paper's own finding.

Runner-up: the threshold as two curves crossing (section 2). I needed it twice, in section 2 and again in section 7.

---

## Round 2: the concepts

Judged from the descriptions in `VISUALS-PURPOSE.md`, section 3. Nothing is drawn yet, so I judged what each picture would be if it came out as described.

### (1) The one idea, and whether it sets up sections 5, 6 and 8

*"You never see the errors, only alarms going off, very fast, and different errors can set off the same alarms."*

Mostly right, and shorter than mine, which is good. Each part points forward:
- "you never see the errors" sets up section 5: someone has to guess, so the decoder exists.
- "different errors can set off the same alarms" sets up section 6: so which guess? Matching's answer against the likelier one.
- "very fast" sets up section 8: the guess has to keep up.

One thing is missing: why it's a *film* and not one photo. In my round 1 that reason was the check that reports wrongly, the alarm that blinks once with nothing behind it. Without it, "very fast" reads as "lots of photos", not as "you need several frames to tell a real event from a false alarm". I don't think it needs its own panel. One alarm that's lit in the middle snapshot only, with "sometimes an alarm itself is wrong" under it, would do. If that's too much for five seconds, the text has to say it right beside the picture.

**Keeping "matching draws strings through space and time" out of section 4:** I agree. In round 1 I packed too much into one picture, and section 4 should only pose the problem. On one condition: the section 6 scene must then show at least one pairing *across time* (the same check lit in two frames, joined upwards). Otherwise the film from section 4 is never used again and matching looks like a puzzle on a single frame, which is how I read it the first time.

### (2) A, B and C: five seconds, and what would mislead

**A. Alarms in a dark building**
- *Five seconds:* "Something happened in a room I can't see; the alarms beside it went off." I'd get "you only see the alarms" instantly. Good.
- *The inset example is wrong as written.* "Was it the second room, or the third and fourth together?" In a row with an alarm on each wall between rooms, room 2 lights the alarms on walls 1|2 and 2|3. Rooms 3 and 4 together light 2|3 and 4|5, because the alarm on wall 3|4 sees two events and stays quiet. Those aren't the same alarms. A version that works: in a row of three rooms, "the first room, or the second and third together?" Both light only the alarm on wall 1|2, since the far end has no alarm. That's the edge from section 5, and it quietly previews the logical error: all three rooms together light nothing. Please have the specialist check whichever example is drawn, because a student like me *will* count the alarms.
- *What would mislead me:* a smoke alarm says "something is near me". A check says "my two sides disagree". With smoke alarms, fire in two neighbouring rooms should make the wall alarm between them *louder*, not quiet. That's exactly backwards from section 3's "even or odd", and section 6 step 2 (a line of errors only lights its ends) then contradicts the picture I was given. The brief lists the comparison with the round before as the mislead. For me this one is bigger.
- *Also:* a row, not a grid, is fine for five seconds. Phase errors missing is fine too, since the text carries them.

**B. The film itself**
- *Five seconds:* "Three frames, some dots lit." I'd know something is changing over time, and not what it means. I'd ask which dots are the alarms, because the margin grids never told me helpers from storing qubits.
- *What would mislead:* whether a lit dot means "fired at this moment" or "is in a fired state". If an error in frame 1 lights its checks only in frame 1 (the article's "fires = changes"), frames 2 and 3 go dark again and I'd think the error went away. If the checks stay lit, the frames contradict the glossary. Decide which, and say it in four words under the frames ("lit = changed just now").
- The two "what really happened?" panels on a 2D grid are where it becomes a chart I have to decode. That's the clutter he rejected.

**C. A then B**
- *Five seconds:* A gives me the idea, B tells me it's real and fast. That's the right order for me: comparison first, then the real thing.
- *What would mislead:* if A and B use different symbols, I won't connect "alarm on a wall" to "small dot on a grid". B has to reuse A's alarm mark on the grid's checks, so the bridge is a matching icon, not a sentence. And B must then *drop* the two "what really happened?" panels, because A already carries "different causes, same alarms". B only has to carry "and it's a film, very fast".
- On a phone that's two visuals in one short section. Fine, if B stays small.

### (3) Building and alarms: does the mapping hold, and is there a better comparison?

- **Rooms = qubits:** holds.
- **Alarm on the wall between two rooms = check:** holds for position. Here the building is a one-row code, which is honest for flips. It fails on *what the alarm senses*, as above.
- **End room with one alarm = edge:** holds, and it's the best part. It's exactly why an error at the edge lights one check.

**A better comparison, same building:** keep the rooms and walls, and replace the smoke alarm with a **hallway lamp wired to two switches**, one in each room either side, the way a staircase light has a switch at the top and the bottom. Everyone has used one: flip one switch and the lamp turns on, flip both and it's off again. That's parity, and it's correct without explanation:
- Something happens in a room means its switch gets flipped, so the lamps on both its walls change.
- Two neighbouring rooms means the lamp between them flips twice and stays as it was. That's section 6 step 2, for free.
- The end room has one lamp, so one light. That's the edge.
- Every room flipped leaves every lamp as it was: nothing lights, and yet everything changed. That's the logical error from section 5, in the same picture.
- "A lamp changed since last time" also fits "fires" better than "an alarm is ringing".

It costs nothing in drawing (a lamp over each doorway instead of a smoke alarm). It reads at night in his line style just as well, and the caption becomes: "You only see which lamps changed. Was it the first room, or the second and third together?"

If the smoke alarm stays for its instant "danger" reading, the text right under it has to say: "unlike a smoke alarm, it goes quiet when both rooms have something". A smoke alarm with a correction is weaker than a picture that's already right.

### (4) My pick

**C, with A redrawn as the lamp building and its example fixed, and B cut down to three small frames reusing the lamp mark, with no "what really happened?" panels and one lamp lit in the middle frame only as the false alarm.** A makes the idea land in five seconds. B is what stops me treating it as a metaphor only and links it to the grid I'll see again in sections 5 and 6. Neither works alone for me: A on its own is a nice story about a building, and B on its own is "another grid of circles".

| Concept | Score (1–10), as described | What would raise it |
|---|---|---|
| A | 5 | Correct the room example; lamps on two-way switches instead of smoke alarms |
| B | 5 | Say what "lit" means; drop the two hidden-error panels; reuse A's mark |
| C | 7 | Both of the above; B kept small; section 6 then shows one pairing across time |
