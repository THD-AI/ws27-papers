# Lay reader: a primary-school teacher reading on her phone

Reader: primary-school teacher in Germany, likes science, school maths and physics only. Read the text and the printed PDF (pages 1–11). I did not open the live page, so the moving scenes are judged only from their printed stills and captions.

My honest overall impression: the first three sections pulled me in. Somewhere in section 4 I began to nod along without really seeing anything. In section 6 the clear story fell apart for me, and from section 9 on I was skimming numbers and reading only the bold sentences. I came away with the main point (a program on an ordinary computer decides whether the quantum computer works, and a learning program can do it better but is slow and costly). I couldn't have explained to a friend how that program actually does its job.

---

## 1. Where I got lost or skimmed

**Opening, "What we wanted to know".** Clear and inviting. "A quantum chip can be excellent and the computer can still fail" is a good first line. One wobble: "the first quantum memory that gets more reliable as it gets bigger, which nobody had managed before". I didn't know that bigger normally makes things *worse*, so I couldn't see why this mattered. Section 2 explains it later, but by then I had forgotten the question.

**Section 1.** I followed it. "About a thousandth of a blink" worked. The encryption paragraph was harder: "two and three billion steps of the costly kind, each built from many basic operations". What is "the costly kind"? I skipped that and kept the conclusion, "millions of slips where one is enough", which landed.

**Section 2.** The first paragraph is the best paragraph in the article for me: "storing it three times and taking a vote", then "looking destroys it". Then "store the information in the way several qubits relate to each other, and in none of them alone" – I read it twice and still couldn't picture it. "Only ever all-0 or all-1 together" – fine, but how does that protect anything if I can't look? This is where I first accepted something on trust. "Threshold" was understandable as a rule ("good enough qubits, bigger grid helps").

**Section 3.** The helpers made sense as an idea (a referee standing between players). "Whether the number of errors among those neighbours is even or odd" – I understood the words, but not why even/odd is enough, or why it "leaves the stored information alone". The phase error paragraph lost me: "'0 plus 1' becomes '0 minus 1'" means nothing to me, and "shifts its rhythm" was a nice try but water doesn't have a rhythm in my head. I skimmed it and decided "there are two kinds of errors, half the checks see one kind". The paragraph about a check reporting wrongly and firing "twice in a row" made me stop and work it out; I got it, but only because I read it slowly.

**Section 4.** Too many numbers in the first paragraph (1.1 millionths, 48 checks, ninety thousand rounds, four million results). I took away only "very fast, lots of data". See point 5.

**Section 5.** First half fine. Then "If the real errors and the decoder's correction together make an unbroken line across the grid, from one edge to the opposite edge, the stored value has changed." Why a *line*? Why edge to edge? The text says it, but doesn't tell me why a line is special. Only the figure (three black errors plus two dashed ones in a column) made it click – partly.

**Section 6.** This is where I really got lost. "103 get an answer from the standard decoder that isn't the most likely one" – I wasn't sure what "most likely" means when there is only one truth. Then the scene: "a combined error in that corner, a flip and a phase error at once, which the figure marks Y, plus one phase error on the right... it can happen in two ways... the two ways are right about six times in ten." I read it three times. I can repeat it, but I don't understand it. "Explanations that differ only in a way the code doesn't care about add up" – no picture at all for that.

**Section 7.** Mostly fine, because it is a story: Google tried, it worked a little, then clearly. "Λ (lambda)" made me feel I had walked into a maths lesson. "Λ = 2.04" and "Λ = 2.14" – I would never have noticed that these differ meaningfully. "171 per 100,000 rounds and the network's 143, about one in six fewer" – the "one in six fewer" is what I kept. "Same chip, same data; only the reader changed" is a lovely line.

**Section 8.** The interpreter comparison saved this section (see 3). "By the time the network has answered round 3, at 72 millionths of a second, the chip is at round 65" – I skipped the numbers and kept the interpreter.

**Section 9.** I skimmed almost all of it. "4,096 fresh runs at one of seven noise levels between 0.2% and 1%", "138,241 adjustable numbers", "seeds", "1.29% to 1.36%", "a fifth to a quarter more than the other". Too many percentages that are all close to each other – 1.48, 1.72, 1.66, 1.41, 1.09 – and I couldn't tell which ones were good. "Correlated matching" arrived as a third player and I lost track of who was who. The lookup-table paragraph and the whole "finding we didn't plan for" read like notes for other researchers. The last paragraph (what would make us drop the idea) was readable and honest; I wish it had come first.

**Sections 10 and "What we could not show".** Short and clear. "A decoder doesn't make a quantum algorithm faster in itself" – useful, I had assumed it did.

---

## 2. Ideas I needed a picture for

- **"Stored in the way several qubits relate to each other."** A picture of three people holding hands in a ring: you can't ask any one person what the secret is, but the secret is in *how* they hold hands. Or three light switches wired so they must all point the same way – the information is "same way", not any one switch.
- **Checks asking "even or odd" without looking.** A picture of a teacher counting raised hands in a group without seeing whose: "an odd number of you broke the rule" – she knows something happened in the group but not who. That is exactly what a primary teacher would get immediately.
- **Why a check fires twice when it lies.** A little strip of three frames: quiet – wrong – quiet, with arrows "changed" and "changed back".
- **Why a line of errors is invisible except at its ends.** Dominoes or a row of children each holding hands with two others: in the middle everyone has two partners (even), only the two at the ends have one. The lattice still does this partly; one plain drawing would do it better.
- **Why an edge-to-edge line changes the stored value.** A zip: open it in the middle and it's broken, but a gap that runs all the way across splits the jacket in two. Or a crack across a plate versus a chip in the middle.
- **"Explanations that add up."** Two different paths across a park that end at the same gate: if I only see you arrive, two ways of getting here make that gate more likely than a single path that is a bit shorter.
- **How fast 1.1 millionths of a second is.** The text tries ("ninety thousand rounds in a blink"), but a picture of one blink stretched over a page full of tiny ticks would hit harder than the number.
- **Λ.** Three stairs going down, each half as high as the last, and a price tag on each stair: "+48 qubits", "+64 qubits".

---

## 3. Analogies: which helped, which didn't, which were missing

**Helped**
- "Storing it three times and taking a vote" – instantly clear, and it makes the problem clear by contrast.
- "About a thousandth of a blink" – good.
- "An interpreter who needs twenty-two seconds for every second of speech is more than twenty minutes behind after one minute." The best line in the article for me. I *felt* the problem.
- "Same chip, same data; only the reader changed." Not an analogy exactly, but it made the whole point land.
- The film, partly – see section 5 below.

**Did not help**
- The water pattern for a qubit. It worked for "smears", but the phase error as "keeps the pattern's shape and shifts its rhythm" broke it. A pattern on water doesn't have a rhythm I can imagine, and I couldn't connect that to "0 plus 1 becomes 0 minus 1".
- "Pairing puzzle" (section 6) – I understood the word "pairing" but not why pairs. It needed the hand-holding picture first.

**Missing**
- For "relate to each other" (section 2): nothing at all. This is the core trick and it has no image.
- For "even or odd" (section 3): a counting-hands or coin image.
- For the logical error line (section 5): crack across a plate, zip, chain.
- For "the decoder guesses" (section 5): a doctor reading symptoms – the same fever can come from different illnesses, and the doctor picks the likeliest one. That would also carry section 6: "the doctor picks the single likeliest illness, but two related illnesses together are more likely".
- For training (section 8): learning from thousands of worked examples, like a child learning to read faces.
- For section 9 as a whole: a race with three runners would have kept the three decoders straight for me.

---

## 4. Figures: what helped, what confused or bored me

- **Opening drawing (page 1).** Pretty, and it does say "a big quantum machine wired to an ordinary computer". I didn't know what the hanging thing was, but I got "two halves".
- **The small qubit grids in the margin (pages 1–2, 5: "1 qubit", "17 · distance 3", "49 · distance 5", "97 · distance 7", "161 · distance 9").** These are tiny and look nearly the same to me. Circles and dots, no explanation of which are storing and which are helpers. They gave a sense of "it grows" and nothing more. The "the other half / the decoder" box next to the grid on page 2 was a nice idea but I only understood it after reading the title again.
- **Figure 1, "the one mistake that matters" (page 3).** The most useful figure. Three panels with "what happened / what the chip reports / what the decoder adds" is exactly the right order, like a story. "3 real + 2 added = 5 = the distance" is where it clicked. What I didn't get: why the chip reports only one check (the middle panel needs the "even number" reasoning spelled out in the picture), and the grey squares with tiny symbols mean nothing to me.
- **Figure 2, the 256-pattern grid (page 4).** Bored and confused me. A wall of small squares, some filled. I understood "103 of 256" from the big hand-drawn circle and nothing else. The axes ("flips: 0 … 4 checks fired", "phase errors…") I didn't try to read.
- **Figure 3, the smallest grid with X, Z, Y (page 5).** I tried hard. The left panel ("a line of flips: only its ends fire") helped a bit. The two right panels "plain matching picks this one" and "the more likely explanation" with "10 of 30" and "19 of 30" gave me the outcome, but I couldn't see *why* the right one is likelier – the "two ways" isn't drawn, I only see one Z.
- **Figure 4, Google's errors in dots (page 6).** Counting dots was a friendly idea, and the circled "143" with "about one in six fewer" worked. But it's dense, the two columns look almost identical, and "÷ 2.04" and "÷ 2.14" didn't mean anything to me.
- **Figure 5, the clock (page 7).** The left side (ticks, "about 22 rounds meanwhile", "62 waiting after the third") showed me the backlog growing. Good. The right side with three bars and "63 µs" lost me – too many labels.
- **Figure 6, learning curves (page 8).** Lines going down over time – I understood "the network gets better with practice, crosses a line". That's it. "Seeds", log scale, the dotted lookup line – skimmed.
- **Figure 7, eight small panels by noise level (page 10).** Bored me. Eight boxes of dots that look the same, all with different scales. I read only the words under them ("level with correlated", "between the two", "behind both").
- **The table on page 9.** Skipped completely.

---

## 5. Sections 4 and 5 in one sentence each

**Section 4, "A film of hints".** What I think it tells me: the quantum computer can only ever tell you which alarms went off, never what actually went wrong, and it does this so fast and so often that it becomes a flickering film of little lights.

What would make it land: the film is announced but never *shown*. The figure in that section is just another grid of circles ("97 · distance 7, 48 checks a round"). I wanted three or four frames side by side – the same grid, a few lights on in each frame, one light blinking on and off (a liar), two lights staying on (a real error) – and the sentence "Many sets of errors light up the same points" drawn as two different hidden causes giving the same lit frame. The numbers paragraph at the top could move below it; on a phone, four numbers in a row before the image is where I started skimming.

**Section 5, the decoder.** What I think it tells me: an ordinary program has to guess from the lights which errors happened, and the dangerous guess is the one that, together with the real errors, makes a line right across the grid, because then the stored value has silently changed and no alarm rings.

What would make it land: the figure does most of the work, but I needed one plain sentence and picture *before* it about why a full line is invisible (every check along it sees two errors, so stays quiet) – the domino or hand-holding image. And an everyday comparison for "guessing the cause from the symptoms", such as the doctor.

---

## 6. The three moments I most want a visual for, ranked

1. **Section 2: "store the information in the way several qubits relate to each other, and in none of them alone."** Everything after depends on it and it has no picture. Three people holding hands, or three linked switches, showing the secret is in the link, not in anyone.
2. **Section 4: the film of hints.** Show the film: a few frames of the grid with lights coming on, one light that blinks on and off because the check lied, and two different hidden error patterns that produce the same lit frame.
3. **Section 6: why the "other" explanation is more likely (the Y and the "two ways").** Two paths drawn side by side for the second explanation versus one for plain matching, with the 10 and 19 counted as little figures under each, like votes – so I can see two small chances adding up to more than one.

---

## Round 2: the concepts

Judged as the same teacher, from the descriptions in VISUALS-PURPOSE.md only – nothing is drawn yet.

### 1. Is the one idea the right one?

Yes. In my words: "You can't look at the patient, you only hear which alarms beep, they beep incredibly fast, and two different problems can make exactly the same beeping." That is what I missed in round 1. I'd keep the "very fast" part light, though. For me the surprise is that you only get alarms and they can lie about the cause. Speed is the second thing I'd notice, not the first.

### 2. The three concepts

**A. The alarms in a dark building.**
- Would it land on my phone? Mostly yes. A row of dark rooms with alarms on the walls between them is something I can hold in my head straight away. A school corridor at night is a picture I know.
- In five seconds I'd understand: we can't see into the rooms, only which alarms light up, and "the second room, or the third and fourth together?" tells me two different stories can light the same alarms. That question is the best part. I'd read the insets because of it.
- What would confuse me: an alarm *between* two rooms is slightly odd – in my school there's one alarm per room, not one per wall. So I'd need the picture to show clearly that each alarm hangs on a shared wall and hears both sides. "The third and fourth together" only works if I see that the wall between three and four has *two* fires next to it and stays quiet. The brief doesn't say that, and nobody tells me why. That's the "even number" idea again, and it needs one small sign (two flames, a quiet alarm). The "room at the end has an alarm on one side only" detail could make me hunt for a meaning I don't need in the first five seconds. And three snapshots for time would add clutter. I'd leave time to the text here.

**B. The film itself, simply.**
- Would it land on my phone? Honestly, not on its own. I complained that the section 4 figure was "another grid of circles", and three frames of the smallest grid are three more grids of circles. I'd recognise the grid from section 3, but I never understood that grid well enough to read a film of it.
- In five seconds I'd understand: "some dots light up, and they change between frames". The "two faint 'what really happened?' panels" are the important part, but faint panels under three frames on a phone are exactly what I'd scroll past.
- What would confuse me: which circles are qubits and which are checks, why some lit dots stay lit, what "1.1 µs" is. "90,000 frames in a blink" is nice, though.

**C. A then B.**
- Would it land? Yes, best of the three. The building gives me the idea in my own world. Then, when the grid film comes, I already know what I'm looking for: "those dots are the alarms, those circles are the dark rooms". Without A, B is homework. Without B, A stays a nice story that I can't connect to the chip.
- In five seconds: the building. The film is the part I'd spend a further ten seconds on, and I'd only do that because the building made me curious.
- What would confuse me: the two pictures must clearly be the *same* story. If the building asks "room two, or rooms three and four?", the film should ask the same question with the same layout and the same colour for "lit". If the film shows a different example from the building, I'd lose the thread. And the film must stay small and simple, as the brief says. With three frames plus two "what happened" panels plus a caption, it could become the clutter he already rejected.

### 3. Does building-and-alarms feel natural or forced?

Natural, with one catch: alarms in buildings sit in rooms, not between them. With a shared wall it still works, and it's more honest than one alarm per room. But the picture must show it. A *row* of rooms also fits the line-of-errors idea from section 5 nicely.

Comparisons that might be even more everyday for "you only see the alarms, and different causes set off the same ones":
- **Doorbells or motion lights between garden plots.** Similar to the building, no better.
- **A row of children holding hands, and a teacher who only hears who shouts "ouch".** If someone squeezes too hard, both neighbours shout. Two squeezes next to each other, and the child in the middle got squeezed from both sides and shouts too... this gets complicated quickly. Not better.
- **Symptoms and illnesses (the doctor).** "You only see the symptoms; a cold and an allergy can give the same sneezing." Very everyday, and it carries over nicely to the decoder "picking the likeliest cause" in sections 5 and 6. But it has no layout, no neighbours, no edge, so it can't be drawn as the grid.
- **Car dashboard warning lights.** "The same light comes on for several different faults." Clear, but again no neighbours.

So I'd keep the building for the picture, because it has neighbours and walls the way the grid does. I'd lend the doctor comparison to the text in sections 5 and 6, where it's about guessing the likeliest cause.

### 4. My pick

**C**, with the building drawn so that the "two stories, same alarms" question is the biggest thing in it, and the film below it using the very same example. The building makes me want to understand, and the film shows me it's real.

Scores, "this would make it click for me":
- A: 7
- B: 4
- C: 8

What would make it better: put the two-stories question in the drawing itself, not under it (two small versions of the same building, same alarms lit, different rooms on fire). Then give the film the same two-stories example, so I see the building turn into the grid.
