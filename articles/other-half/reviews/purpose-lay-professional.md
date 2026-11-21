# Purpose read: a product manager from LinkedIn

Reader: product manager at a German software company. Knows roughly what a neural network is, knows nothing about quantum physics. Gives an article a few minutes before deciding whether to finish it. Read the text and the eleven-page print (I did not open the live page).

## 1. Where I stopped or skimmed

- **Hooked, then fine through section 2.** The deck and the first paragraph do their job: "A quantum chip can be excellent and the computer can still fail." I know this pattern from software (great hardware, bad driver). The encryption example in section 1 is the best paragraph in the article for me: two numbers, one conclusion.
- **First wobble, section 3:** "In the water image, it keeps the pattern's shape and shifts its rhythm: 0 and 1 stay as they are, but "0 plus 1" becomes "0 minus 1"." Here I stopped understanding and started trusting. I skimmed the rest of that paragraph. I did not need phase errors to follow the story, but the article told me I'd need them again in section 6, so I felt behind.
- **Skimmed hard, section 6, the scene steps 4 and 5:** "The phase error can sit in the far corner. Or it can sit one place above it, and the checks fire just the same." I can't hold a 3x3 grid, X/Y/Z labels and "one time in three" against "six times in ten" in my head. I took away only "the standard method picks one answer when two weaker answers together are more likely" – and that came from the earlier sentence about explanations that "add up", not from the example.
- **Where I would have stopped for real, section 9:** "That makes 138,241 adjustable numbers at distance 3 and 162,817 at distance 5, few enough to train in minutes on a GPU." From here the article becomes a lab notebook: seeds, noise levels, 4,096 runs per step, two kinds of matching. Then "A finding we didn't plan for" opens a second story about a library bug, with confidence intervals to three decimals. On LinkedIn I would have closed the tab here, and I'd have missed the one paragraph I actually wanted, the bottom line ("Before starting we wrote down what would make us drop the idea…"), which is buried after the details block.

## 2. The main story, in three sentences

A quantum computer needs an ordinary program beside it, the decoder, that reads a stream of warning lights from the chip and guesses which errors happened; a bad guess silently corrupts the result. On Google's 2024 chip a neural network guessed better than the standard method (about one in six fewer failures), but it was far too slow to run live. When the students tried a small network themselves, it won on the smallest grid, needed about 250 million examples to beat the plain standard method one size up, and never caught the improved standard method that is free to download.

Where it was hard to see:
- The title's "other half" only lands in section 5, when the word "decoder" finally appears. Until then I didn't know the article was about software. Saying "decoder" and "this is the other half" in the first paragraph would have given me the frame.
- The three questions (what it does, why a network is better, at what cost) are promised up front, but the answers aren't signposted. I couldn't tell which section answered which question.
- Two versions of matching (plain and correlated) blur the verdict. In section 7 "Google's best matching" already is a correlated kind; in section 9 there are two. I had to reread to understand that the network's real rival is the free correlated one.
- The bottom line sits at the very end of section 9, after a long details block. It should be near the top of section 9 (the "short answer" sentence is there, but it's dense) and echoed at the end.

## 3. Ideas that needed a picture I didn't get

- **Storing information in "how qubits relate".** Section 2 says it and moves on. I needed an everyday image: three light switches wired so that you only ever learn "are these two the same or different", never "is this one on". You can spot that one switch was flipped without ever looking at what the switches say.
- **A check (even or odd).** A picture of one helper between four storing qubits, with an arrow out saying only "even" or "odd". Everyday version: a cashier who can't see the notes, only whether the drawer's count changed from even to odd.
- **Threshold.** This is the plot of the whole field and it's only words. Two lines: error rate against grid size, one going up (hardware above threshold), one going down (below). Mark "for years: here" and "Google 2024: here". Everyday version: a relay of messengers – adding messengers helps only if each one garbles less than a certain amount.
- **The film of hints (section 4).** The text invents the metaphor and then never draws it. The margin grids show qubits, not a film. See question 5.
- **Many errors, same lights.** "Many sets of errors light up the same points" is the core of the decoder's job, and it needs two small grids side by side: different hits, identical lit checks.
- **Live vs. afterwards.** The interpreter line ("twenty minutes behind after one minute") is excellent and needs no picture. Keep it.
- **The cost verdict of section 9.** One simple scoreboard: three decoders, two grid sizes, plus "examples needed" and "free / must be trained". The learning-curve and noise-level figures don't give me that.

## 4. The existing figures

Earned their space:
- **Figure 1, the line across the grid (section 5).** The best figure. Three steps, plain labels ("what happened / what the chip reports / what the decoder adds"), and the punchline line "an error nobody sees". I understood the logical error from this, not from the text.
- **Figure 5, the clock (section 8).** The right half is clear: chip pacing along, network bar falling behind, matching keeping up. The left half ("41 waiting after the second answer", "62") is busy; the interpreter sentence already does that work.
- **Figure 4, Google's suppression (section 7).** The circled 171 to 143 is the article's hook made visible – keep it. But dot rows where "one dot is 10 errors in 100,000 rounds" are hard to read; plain bars would do.
- **Opening drawing.** Cryostat wired to a plain computer box says "other half" before I read a word. Good.

Would cut (for this reader, or move to the details):
- **Figure 2, all 256 patterns.** A wall of squares to say "103 of 256, but rare". The number alone is enough; the grid looks impressive and tells me nothing extra.
- **Figure 7, eight panels by noise level.** Each panel has its own scale, which made me compare heights that can't be compared. Belongs inside the details block with the table.
- **The margin qubit grids (1 qubit, 17, 49, 97, 161).** Pretty, but I didn't know what the small dots were or why "the other half / the decoder" was a box beside a grid. They read as decoration.

Confused me:
- **Figure 3, the 3x3 lattice with X, Y, Z.** The left panel (a line of flips, only its ends fire) is useful. The right three panels need the text open beside them, and "10 of 30 / 19 of 30" with tiny dot strings didn't help. I couldn't see where "the far corner or one place above it" is.
- **Figure 6, learning curves.** The right panel (distance 5) tells the story; the left has so many labels that the lines disappear. "Not comparable with distance 3" in the caption made me wonder why they sit side by side.

## 5. Section 4, "A film of hints"

In one sentence: the only thing that ever comes out of a running quantum computer is a very fast stream of a few blinking lights – about four million results per blink for one logical qubit – and those lights hint at errors without saying which qubits were hit.

Does it matter: yes, it is the hinge of the article. It sets up both problems that follow – guessing (section 5 and 6, because the lights are ambiguous) and speed (section 8, because the stream never stops). But the section doesn't say that, so it reads as a numbers interlude and is easy to skip. One sentence at the end would fix it: "So the decoder has two jobs: guess well, and guess in time."

Single image: a film strip running left to right, each frame the distance-7 grid with two or three checks lit; a scale bar under it saying "one blink = about 90,000 frames"; and under one frame, two small grids showing different hits that light exactly that frame, with a question mark between them.

## 6. The three moments I'd most want a visual for

1. **Section 4 into 5: the film and its ambiguity.** The film strip above, with "different errors, same lights" under one frame. It is the whole job of the decoder in one picture, and right now the article's own metaphor is never shown.
2. **Section 9's verdict: a scoreboard.** Plain, correlated matching and the network at distance 3 and 5, with "examples needed" (0 / 0 / 66 million / 250 million) and "free to download / must be trained". This is the answer to "at what cost", and it is currently spread across two dense charts and a paragraph at the very end.
3. **Section 2: the threshold.** Two lines of error against grid size, one rising and one falling, with "years of hardware" and "Google 2024" marked. It makes section 7's result feel like a milestone instead of a number (Λ = 2.04).

## Round 2: the concepts

Judged as the same product manager, from the descriptions in `VISUALS-PURPOSE.md` (nothing drawn yet).

### 1. Is the one idea the right one?

Mostly. "You never see the errors, only alarms going off, very fast, and different errors can set off the same alarms" is exactly what I took from section 4. But it stops one step short of why I should care. It describes the input and never names the job. The point of the hinge is the consequence: *so a program has to guess which errors it was, and guess before the next frame arrives.* Without that half the picture is a curiosity. With it, it sets up section 5 (guessing, and the silent wrong guess), section 8 (keeping pace) and section 9 (what a better guesser costs). I'd add that clause to the one idea and to whatever caption goes under the picture. "Very fast" in the idea only matters once it is tied to a deadline.

### 2. The three concepts

**A. Alarms in a dark building**
- Would it stop me skipping? Yes. After two sections of grids and qubits, a building is the first thing I'd recognise, and I'd slow down for it.
- In five seconds I'd get: some alarms are lit, I can't see inside, and the caption asks which room it was. Quickly getting "two stories, same alarms" depends on the two insets being big enough to compare at a glance. If they're thumbnails, I'd miss them.
- What would put me off: a smoke alarm *on the wall between two rooms* isn't how alarms work, so I'd notice the oddity before the idea. A generated night-time building could also look like stock art and read as decoration, like the margin grids did. And the time element (three snapshots, "millions a second") is a second idea squeezed into one picture. I'd leave it to the text or a single line.

**B. The film itself**
- Would it stop me skipping? Probably not. I'd see a third set of circles-on-a-grid and take it as more of the same. That is exactly why I skimmed the margin figures.
- In five seconds I'd get: frames with some dots lit. I would not get "different errors, same frame" unless the two faint panels sit right next to the frame they explain, with a clear "=" or "both give this".
- What would put me off: faint panels and unlabelled grids. It's honest, but it asks me to do the decoding the article is about.

**C. A, then B**
- Would it stop me skipping? Yes, because A comes first. The analogy hooks me and gives me the words, and the film then looks familiar instead of technical.
- In five seconds I'd get A's message. B becomes a short confirmation, "this is the real version", which I'd glance at and accept.
- What would put me off: length. Two pictures for one short section is a lot when the section itself is three paragraphs. If B ends up as big and detailed as A, the hinge turns into a detour. B has to stay small, plain and clearly marked as the same thing as A.

### 3. Building and alarms: natural or forced?

Slightly forced. Rooms as hidden places I can't see into is natural. Alarms *between* rooms that light for either neighbour is not: real smoke alarms sit in one room and say which room. The analogy works only if the sensor is something that really is shared. Two ideas that fit better:
- **Thin walls between flats.** A neighbour on each shared wall hears a bang and knocks, but can't tell which side it came from. "Someone knocks" = check fires, and a bang in the end flat makes only one knock. It's still a building, so it keeps the civil-engineering eye.
- **For readers like me, a monitoring dashboard.** Alerts fire *between* services (a timeout means one of two services is slow), and on-call has to guess the root cause, because different failures light the same alerts. Every software person has lived this, including the pressure to answer fast. It wouldn't suit the teacher, though, so it fits better as one sentence in the text than as the picture.

Either way, whatever the sensor is has to be shown sitting between two rooms and reacting to both.

### 4. My pick

**C**, with two conditions: the caption carries the consequence ("so a program has to guess which, before the next frame"), and B stays small and is clearly the same scene as A on the real grid. A alone would be my second choice. B alone would not change my reading.

**Next of the other moments:** the §9 scoreboard. For a reader like me, "at what cost" is the question I came for, and the answer is now buried after the details block. The threshold picture would be my second choice.

**Scores:** A 7, B 4, C 8.
