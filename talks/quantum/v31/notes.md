# Speaker notes – Quantum deck v3.1

*P0.5, 24 November 2026. One section per beat, one block per build: the spoken sentences, the speaker slot and the seconds. Numbers trace to `facts.json` by id; beats, flags and the spoken lines that carry teaching come from STORY.md (revision 3). Speaker A is the default and carries the machine (beats 0–3, 8); speaker B carries the readers (beats 4–7). Who B is stays open (Q3); with one speaker, A says everything and the two handovers drop out (−16 s).*

## Timing

**Model:** words at 140 a minute, 1.5 s per click (one per build), the pauses written on each build, 8 s per handover. **Total: 12:13** (1469 words) against the plan's 12:12 and the G15 range 11:30–12:30.

At G15's 130 words a minute the same notes run 13:01, over the range; then take cut 1 and cut 2 (12:24 after both). Rehearsal (H8) decides which rate is real.

| Beat | Title | Spk | Starts | Words | s | STORY s |
| ---: | --- | --- | ---: | ---: | ---: | ---: |
| 0 | The other half of a quantum computer | A | 0:00 | 40 | 20 | 20 |
| 1 | A qubit smears like water – and the chip cannot look at it | A | 0:20 | 130 | 60 | 60 |
| 2 | Neighbours ask "even or odd?" every round | A | 1:19 | 193 | 90 | 91 |
| 3 | Each round is one frame of a film | A | 2:49 | 126 | 60 | 60 |
| 4 | Which errors made these three checks fire? The room votes | B | 3:57 | 266 | 134 | 128 |
| 5 | Same recording, another reader: a neural network | B | 6:10 | 192 | 87 | 87 |
| 6 | Accurate, or in time: in 2024, the network could not keep up | B | 7:37 | 223 | 104 | 110 |
| 7 | Ours, honestly: better than plain matching, not than correlated matching | B | 9:20 | 226 | 104 | 100 |
| 8 | One run of a million rounds, Google's 2024 network – not ours | A | 11:12 | 73 | 60 | 60 |

## Cut order (if a rehearsal runs over 12:30)

1. **Beat 3's second sentence** (build 3.1, marked below): about 9 s.
2. **Beat 6's preprint build** (build 6.4): about 26 s; the sentence moves to QUESTIONS.md ("Isn't speed already solved?"), and build 6.3's closing line ("in 2024 you got one or the other") becomes the beat's end.

Never cut: the water image (beat 1), the vote pause (beat 4), the 24 s of silence (beat 8).

## Teach before use (H6 checklist, for the fact checker)

reader 0 · qubit, cryostat 1 · stored value, distance, helper, check, fires, round 2 · frame, decoder 3 · flip, phase error, Y, matching, logical error 4 · neural network, error rate per round 5 · correlated matching 7. "Error rate" first appears at 5.2; beat 0 carries no number; Λ and threshold appear only in QUESTIONS.md.

## Beat 0 – The other half of a quantum computer

Camera: overview · speaker A · STORY target 20 s

### 0.1 · speaker A · 19.6 s (40 words, 1 click, pause 1 s: let the question stand)

*On screen:* Overview of the whole map, route in red; the question at title size, no numbers

> This talk is about the other half of a quantum computer: the ordinary computer that sits beside the chip and reads it. One question carries the talk. Same recording, two readers – which reads it right, and can it keep up?

## Beat 1 – A qubit smears like water – and the chip cannot look at it

Camera: overview → A (one hop) · speaker A · STORY target 60 s

### 1.1 · speaker A · 27.2 s (60 words, 1 click)

*On screen:* Hop to the cold box; one qubit's ripple in red

> The chip sits in a cold box, a cryostat; the other half is an ordinary computer beside it. On the chip are qubits, the quantum version of a bit. A qubit smears like a pattern on water – and the chip cannot look at it without destroying it. Making a qubit is the easy part; keeping it is the hard part.

### 1.2 · speaker A · 32.5 s (70 words, 1 click, pause 1 s: after the number) · facts: `qubit-life-85`, `blink-thousandth`

*On screen:* Hero number: 85 µs, flag "median, largest grid"

> How fast does it smear? On Google's 2024 chip, the qubits of the largest grid have a median lifetime of 85 millionths of a second, about a thousandth of a blink. And every operation on them adds a small chance of error of its own. So no single qubit can keep a value for long, and nobody can check it by looking. The next stop shows the way around that.

## Beat 2 – Neighbours ask "even or odd?" every round

Camera: A → B · speaker A · STORY target 91 s

### 2.1 · speaker A · 21.6 s (47 words, 1 click) · facts: `d7-distance`

*On screen:* Hop to the chip; the distance-7 grid, the stored value drawn spread over it

> The way around it: one value is stored across the whole grid. No single qubit holds it, and no copy of it exists anywhere. The size of the grid is called its distance – here 7. A bigger grid can protect better, if each qubit is good enough.

### 2.2 · speaker A · 24.6 s (54 words, 1 click) · facts: `d7-checks-48`

*On screen:* Helpers between the storing qubits; one check outlined

> Between the storing qubits sit helpers. The helpers between its qubits ask their neighbours one question: is the number of errors among you even or odd? The answer is the same whatever is stored, so asking does not touch the value. These questions are called checks. At distance 7 there are 48 of them.

### 2.3 · speaker A · 22.9 s (50 words, 1 click)

*On screen:* One check fires (red)

> While nothing goes wrong, a check gives the same answer every time. When a neighbour is hit, its answer changes, and we say the check fires. Here, one check fires. It doesn't say which neighbour was hit, and it says nothing about the stored value – only that something changed nearby.

### 2.4 · speaker A · 20.5 s (42 words, 1 click, pause 1 s: before the hop) · facts: `round-1.1`

*On screen:* Round tick: 1.1 µs

> All the checks are asked together, once every 1.1 millionths of a second. That is one round. But a check can also just report wrongly, and then switch back. So a single round is never enough: rounds are read as a sequence.

## Beat 3 – Each round is one frame of a film

Camera: B → BC · speaker A · STORY target 60 s

### 3.1 · speaker A · 13.5 s (28 words, 1 click) · **cut 1 if over 12:30**

*On screen:* Hop to the film; frames running out of the chip

> Each round is one frame of a film. [cut 1 starts] While the computer runs, this film is all that comes out of it, a few lit points in most frames. [cut 1 ends]

### 3.2 · speaker A · 15.4 s (30 words, 1 click, pause 1 s: after the number) · facts: `frames-per-0.1s`, `round-1.1`

*On screen:* Hero number: ≈ 90,000 frames in 0.1 s, flag "our arithmetic, Google's 1.1 µs"

> And the film runs fast. One round every 1.1 millionths of a second makes about 90,000 frames in a tenth of a second, roughly one blink – for one stored value.

### 3.3 · speaker A · 30.6 s (68 words, 1 click)

*On screen:* The newest frame in red; the reader at the end of the film

> The lit points say roughly where something went wrong, and of which kind. They don't say which qubits were hit; many different sets of errors light up the same points. So something has to watch the film and decide what happened. The thing that reads the film – the article calls it the decoder. It runs on the ordinary computer beside the cold box. It is the other half.

## Beat 4 – Which errors made these three checks fire? The room votes

Camera: BC → CD-frame · speaker B · STORY target 128 s · handover from the other speaker first (8 s)

### 4.1 · speaker B · 31.1 s (69 words, 1 click) · facts: `d3-storing-9`, `d3-checks-8`

*On screen:* Hop to the lifted frame: the smaller 3 × 3 tile, caption "The smallest grid: 9 storing qubits, 8 checks, one round, checks never wrong"

> Let's be the decoder for one frame. To count it, we lift out the smallest grid: 9 storing qubits, 8 checks, one round, and checks that never report wrongly. Two kinds of error – a flip, and a phase error; Y is both at once; half the checks watch each kind. A flip swaps 0 and 1; a phase error keeps the pattern on the water and shifts its rhythm.

### 4.2 · speaker B · 16.9 s (36 words, 1 click) · facts: `puzzle-5pct`

*On screen:* Three checks fire; the question

> Here three checks fire. We give every storing qubit a 5% chance of an error, far more than a real chip has, so the effect is easy to count. Which errors made these three checks fire?

### 4.3 · speaker B · 31.2 s (46 words, 1 click, pause 10 s: the room votes (open Q3: aloud or a volunteer))

*On screen:* The two candidate answers, side by side (red)

> Two answers fit. Answer one: a flip in this corner and a phase error in the centre. Answer two: both at once in the corner, a Y, and one phase error on the right. Which would you bet on? Hands up for one … and for two.

### 4.4 · speaker B · 32.1 s (69 words, 1 click, pause 1 s: after the count) · facts: `match-10of30`, `other-19of30`

*On screen:* The reveal: dots, 10 against 19 of 30

> The standard decoder is called matching. It joins fired checks along the shortest lines and solves flips and phase errors separately, so a Y costs it two. It picks answer one. Of 30 times this pattern shows up, answer one is right in 10. Answer two is right in 19, because it can happen in two ways: the phase error in the far corner, or one place above it.

### 4.5 · speaker B · 22.2 s (46 words, 1 click, pause 1 s: before the hop)

*On screen:* Stakes: the line across the grid, no check lit

> Why does that matter? Errors and correction together cross the grid; the stored value flips and no check fires – a logical error. Here, that happens whenever matching picks answer one and the truth was answer two. This silent failure is what every decoder is measured by.

## Beat 5 – Same recording, another reader: a neural network

Camera: D · speaker B · STORY target 87 s

### 5.1 · speaker B · 54.2 s (123 words, 1 click)

*On screen:* Hop to the reader; two prisms appear, unlabelled

> Now the real chip. In Google's 2024 experiment, one recording was read by two readers. The first was Google's best matching decoder. Google's matching already links the two kinds of check, in a limited way, with weights tuned on the chip's data. The second was a neural network, a program that learns from examples: trained first on simulated errors, then on the chip's own data. Nobody writes its rules. It picks up whatever patterns are there, including ones matching leaves out. Real chips have plenty of those: errors that hit two neighbouring qubits at once, and qubits that slip into a third state they should never be in. Matching's picture has no place for either; a reader that learns can take them in.

### 5.2 · speaker B · 32.6 s (69 words, 1 click, pause 1.5 s: after 143) · facts: `d7-match-171`, `d7-net-143`, `d7-one-in-six`, `order-d3-d5`

*On screen:* Hero numbers 171 / 143; the 143 prism and its number in red; flag "Google 2024 chip – Nature 2025"

> We measure a decoder by its error rate: how often, per round, the stored value is lost. At distance 7, matching lost it 171 times per 100,000 rounds. The network: 143. Same chip, same data; only the reader changed. That is about one in six fewer failures, and the smaller grids on the chip show the same order. But note one thing: both readers worked afterwards, on the recording.

## Beat 6 – Accurate, or in time: in 2024, the network could not keep up

Camera: CD (3200 wide, pans between builds) · speaker B · STORY target 110 s

### 6.1 · speaker B · 17.8 s (38 words, 1 click) · facts: `round-1.1`

*On screen:* The chip's clock: 1.1 µs in

> Why does afterwards matter? A calculation cannot wait for the recording to end. The chip delivers a round every 1.1 millionths of a second, and a reader that runs live has to finish each round in that time.

### 6.2 · speaker B · 35.6 s (75 words, 1 click, pause 2 s: let the pile grow) · facts: `net2024-24`, `net-rounds-22`, `waiting-62-at-66`, `interpreter-20min`

*On screen:* 24 µs out; the pile of unread frames grows (red)

> Google's paper quotes 24 millionths of a second per round for its network. In that time the chip finishes about 22 more rounds. Watch the pile. When the network has answered round 3, the chip is at round 66, and 62 rounds wait. An interpreter who needs twenty-two seconds for every second of speech is more than twenty minutes behind after one minute. Storing can wait; a calculation has steps that wait for the answer.

### 6.3 · speaker B · 24.2 s (53 words, 1 click) · facts: `live-match-pace`

*On screen:* Marker "plain matching live: kept pace"

> So in 2024 the network's results were worked out afterwards. The reader that ran live was a fast, plain version of matching, and it kept pace: its answer came shortly after the last round, and that delay did not grow. More accurate, or in time – in 2024 you got one or the other.

### 6.4 · speaker B · 25.9 s (57 words, 1 click) · facts: `preprint-sub1`, `preprint-d11`, `preprint-date` · **cut 2 if still over: whole build to QUESTIONS.md**

*On screen:* Hand note, dashed: "preprint, Dec 2025: under 1 µs – unreviewed" + date of last status check

> Is that solved now? A preprint from December 2025 claims a network under one millionth of a second per round, for grids up to distance 11. As of the date on the slide, nobody else has reviewed it, and we can't test it. A claim nobody has checked yet – so in 2024, still one or the other.

## Beat 7 – Ours, honestly: better than plain matching, not than correlated matching

Camera: E · speaker B · STORY target 100 s

### 7.1 · speaker B · 46.9 s (106 words, 1 click) · facts: `d5-distance`, `d5-rounds-5`, `sim-noise-0.5`, `d5-examples-250m`, `d5-66m-lost`

*On screen:* Hop to results; our setup in one line; three empty bars

> And our own part. We can't build a chip, so we simulated one: a grid of distance 5, five rounds per run, every operation going wrong with a chance of 0.5%. We trained a small neural network on about 250 million simulated examples and compared it with two kinds of matching. Correlated matching links the two kinds of error and needs no training: it solves the puzzle in two passes, and the first informs the second. Our first try, 66 million examples, lost to both matchers. The curves were still falling, so we trained again from scratch on nearly four times as many, five times over.

### 7.2 · speaker B · 26.6 s (55 words, 1 click, pause 1.5 s: after 1.09) · facts: `d5-plain-1.41`, `d5-net-1.33`, `d5-corr-1.09`, `pooled-10m`, `d5-seeds-5`

*On screen:* Three bars by name, "lower is better"; the correlated prism in red

> Each reader read the same 10 million fresh runs. The share it got wrong, lower is better: plain matching 1.41%. Our network 1.33% – better than plain matching. Correlated matching 1.09% – still ahead. All five of our networks land between the two matchers. Correlated matching is the one to beat, and it is free to download.

### 7.3 · speaker B · 30.4 s (65 words, 1 click, pause 1 s: before the handover)

*On screen:* Caption band: per run of 5 rounds, simulated; never on beat 5's scale

> Three things keep this honest. These are runs of five rounds in simulation, so they never sit on the same scale as Google's per-round numbers. Matching was told exactly how often each kind of error happens – so the comparison leans its way. And we compared accuracy; our timings are emulated on a laptop and stay off the clock. Honest progress on accuracy, not a win.

## Beat 8 – One run of a million rounds, Google's 2024 network – not ours

Camera: E → CD → overview · speaker A · STORY target 60 s · handover from the other speaker first (8 s)

### 8.1 · speaker A · 20.8 s (45 words, 1 click) · facts: `run-1e6`, `run-1e6-1.1s`, `net2024-run-24s`, `net2024-24`

*On screen:* Back to the clock at true scale; flag "Google's 2024 network, not ours"; chip bar fills to 1.1 s

> Back to the clock, at true scale. The longest runs in Google's live test were a million rounds: 1.1 seconds of chip time. Google's 2024 network, one copy at 24 millionths a round, needs 24 seconds to read it. Our arithmetic, Google's times. Let's wait.

### 8.2 · speaker A · 25.5 s (0 words, 1 click, pause 24 s: silence while the bar fills)

*On screen:* The 24 s bar fills in silence (red)

> *(silence)*

### 8.3 · speaker A · 14.0 s (28 words, 1 click, pause 0.5 s: end)

*On screen:* Overview; last frame "The how and the ranges: the article"

> The chip is half the computer; the other half has to read it – right, and in time. The how and the ranges are in the article. Thank you.
