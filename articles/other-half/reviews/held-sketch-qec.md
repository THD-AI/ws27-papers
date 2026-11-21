# Review: film sketches A and C – QEC specialist seat

Reviewer: quantum error-correction researcher, round 2. Read against my plan review (`held-plan-qec.md`), `HELD-SCENE.md` section 3, the `film` block of `tools/other-half-data.mjs`, `data/film.json`, `figures/film.js` and the sketches `film-A-*` and `film-C-*` (wide, tall, print, steps 0 to 4).

## Scores

| Form | Correctness | Teaching value |
|---|---|---|
| A, filmstrip | 7 | 6 |
| C, space-time chart | 8.5 | 8 |

**Pick: C.** It is the standard picture a specialist draws for detection events (check × round), the two joins have the right geometry by construction (one down a column, one along a row), and the X sits on a line between rounds 2 and 3 instead of floating. With the key-grid join below, it keeps the spatial meaning A gets for free.

## 1. Did the round 1 changes land?

- **Two lights in the middle row, one at the edge.** Landed in the plan (section 3) and in nothing the figure claims beyond what it shows: note 3 is specific ("round 3: z0 and z1 fire – a flip on qubit 4"). No general claim anywhere in the drawing. Fine.
- **Wrong report on z3.** Landed in the generator, `film.json` and both forms. Both pairs are flip-check pairs; the phase-check rows in C stay dark, which teaches "not their kind of error" without words. Correct.
- **"Across rounds, not round by round".** In the plan, **not in the figure.** Note 5 says only "pairs run across the chip and along time", and no note mentions the decoder or the edge. This was a must; it has to be in the step 4 note.
- **A window from a longer run.** Landed: ellipses at both ends, foot line "8 rounds from a longer run", and the `rule` field in `film.json` says round 1 is compared with an undrawn earlier round. The axis still shows a bare "1", but with the leading ellipsis and the foot line that is honest enough.
- **X between rounds 2 and 3.** Landed in both. C does it best: a dotted rule between columns 2 and 3 labelled "flip on qubit 4", and the X on the key grid at qubit 4. In A the X sits in the gap between frames 2 and 3 at qubit 4's height, but it touches no qubit, so the reader cannot see which qubit was flipped; only the note says so.

## 2. Is every drawn mark physically right?

Checked against the check definitions (`q = row * 3 + col`):

- **Lights.** z0 {1,2,4,5} is the upper-right square, z1 {3,4,6,7} the lower-left square, z3 {5,8} the right half-disc on the lower row. In A, round 3 lights exactly those two squares and rounds 5 and 6 light exactly that half-disc; in C, cells (z0,3), (z1,3), (z3,5), (z3,6) and no others. Every other cell is dark in every round. Correct.
- **Generator.** `answer(c, r)` is the parity of the persistent flip (from `between[1]` on) plus a one-round wrong report; lights are computed as answer(r) ≠ answer(r − 1), with answer(0) = 0 as the undrawn earlier round. This reproduces the four lights. The assertion that every light is in exactly one pair and that the counts agree is the test I asked for, and it would catch a wrong report in round 8 (its partner in round 9 is not in the window). Good.
- **Space join.** A: tile centre z1 (0.5, 1.5) to z0 (1.5, 0.5) passes exactly through qubit 4 at (1, 1). Correct and the best possible drawing. C: a vertical segment between adjacent rows z0 and z1 in column 3. Correct as a matching-graph edge, but it says nothing about qubit 4 or about the two checks being neighbours on the chip (see 3).
- **Time join.** C: horizontal segment along row z3 from column 5 to 6. Correct. A: a dashed arc dipping under frames 5 and 6; correct as an edge, but its length and curve carry no meaning and it passes close to qubit 8 of round 6.
- **"Pairs" in the data are the true causes, not decoder output.** With uniform weights, minimum-weight matching returns the same pairs here (z0–z1 weight 1 against two edge joins; z3 time pair weight 1 against z3 to the right edge twice), so the figure's claim holds. The generator does not check it; one line saying so in `film.json` is enough.
- **Code details.** `lightsOn` hard-codes `m.r === 3` instead of `pAcross.round`; change the data and the lights appear at the wrong step. `gapX` in A has two identical branches; with a different flip round in the tall layout the X would land at the start of the next row. Neither is wrong today.

## 3. Which form teaches the space-time idea with less room for misreading?

**A, the filmstrip.**
- The grid does not change from frame to frame, so the reader is unlikely to think the chip changes. But the frames read as eight snapshots of the chip's state. Then rounds 4 to 8 look like "healed": qubit 4 is still flipped, yet nothing is lit. Without a line saying a light means "changed since the round before", A teaches the wrong model of what a light is. This is the biggest misreading risk in either form.
- The time pair is the hard half of the idea, and A draws it worst: two tiny half-discs in different frames joined by a long arc. The space pair is drawn well (through qubit 4).
- At wide and phone widths the film wraps (4 + 4, 3 + 3 + 2), so time runs in reading order, not along one axis. Rounds 5 and 6 sit next to each other only by luck of the layout.

**C, the space-time chart.**
- Time is one straight axis, and "same check, next round" is one cell to the right. The time pair is as easy to see as the space pair. This is exactly the idea of section 4.
- What C loses: rows are not geometry. z0 and z1 are neighbouring rows and also neighbours on the chip, but z2 and z3 are neighbouring rows and far apart on the chip, and z1–z2 (which do share qubit 3) look no closer than z0–z3. A reader can take "down one row" as the space step, the twin of "right one column", and think space is one-dimensional. The fix is cheap: in step 4 draw the z0–z1 join on the key grid too, through the X on qubit 4, in the same dashed accent.
- The key's X has no time on it, and the dotted rule has no place on it; together, with the label "flip on qubit 4", they are correct. Keep both.
- The same "lit = changed" line is needed here too, but the risk is smaller: a cell in a row of events reads naturally as an event.

## 4. Wording of the five notes

1. "one round: 8 checks, one answer each" – correct (d² − 1 = 8).
2. "a round every 1.1 µs, the same 8 checks each time" – 1.1 µs is Google's round time on their chip, not something this grid has; acceptable in a lay figure, or "a round every microsecond or so".
3. "round 3: z0 and z1 fire – a flip on qubit 4" – correct and checkable.
4. "z3 fires in rounds 5 and 6 – a wrong report, no qubit hit" – "no qubit hit" is too strong: a wrong report is often caused by an error on the helper qubit that measures z3. Say "no storing qubit hit". Same in `film.json` (`cause`).
5. "pairs run across the chip and along time" – true but misses the required decoder point and the edge. Suggested: "the decoder pairs lights across rounds, not round by round – across the chip, along time, or to the edge".

Not a note, but needed in both forms: a short key line, for example "lit: the answer changed since the round before".

## 5. Smaller points

- Print, both forms: the foot line overprints the round labels 5 and 6 and the arc in A, and the "flip on qubit 4" label in C.
- C key: the "z3" label runs out of its half-disc.
- A tall: three columns, not the planned two rows of four. Not a physics issue.
- A step 0: the trailing ellipsis is drawn at round 8's place while only round 1 is shown.
- Still recommended from round 1, not yet used: one caption line that an error in the middle of a round can light one check in one round and its neighbour in the next. C can show this later at no cost (a diagonal of two cells); A cannot.

## Required fixes

- Step 4 note: "the decoder pairs lights across rounds, not round by round – across the chip, along time, or to the edge".
- Note 4 and `film.json`: "no qubit hit" becomes "no storing qubit hit".
- Add a key line in the figure: "lit: the answer changed since the round before".
- C, step 4: also draw the z0–z1 join on the key grid through qubit 4.
- Print: move the foot line below the round labels and "flip on qubit 4"; in `film.js`, use `pAcross.round` instead of the hard-coded round 3 in `lightsOn`.
