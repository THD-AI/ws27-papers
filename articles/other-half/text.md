---
title: The other half of a quantum computer
deck: The same recorded data from one of Google's quantum chips gave two different results, depending on which program read it. We asked what that program has to do, why a neural network can do it better, and what that costs. In our own small runs, it didn't always.
author: Alexander Rudaev and group
context: Quantum Computing seminar · TH Deggendorf · winter semester 2026/27
status: Draft for review, 16 November 2026
accent: other-half
hero: hero
summary: The program that reads a quantum chip's errors decides whether the computer works: what it does, why a neural network can do it better, and the cost.
date: 2026-11-16
keywords: quantum error correction, surface code, neural network decoder, AlphaQubit, Google Willow, matching decoder
card_alt: Card with the title The other half of a quantum computer beside a line drawing of a quantum computer's cooling stack wired to an ordinary computer.
seo_title: The other half of a quantum computer: neural-network decoders
---

Drawing: made with an image model from Alexander Rudaev's own line reference and reference photographs; the cryostat after a photograph by Lars Ploughman, CC BY-SA 2.0.

:::margin qubits 0

## What we wanted to know

A quantum chip can be excellent and the computer can still fail. The cause sits beside the chip: a program running on an ordinary computer.

We came across this in a paper Google published in December 2024. It reports the first quantum memory that gets more reliable as it gets bigger, which nobody had managed before. One detail in it is easy to miss. Two programs read the same recording from the same chip and came out with different error rates. A neural network, a program that learns from examples, read it better than the standard program almost every experiment uses. {{GQA-2024}}

So we set ourselves three questions: what the program has to do, why a network can do it better, and at what cost. We answer them in the order we understood them.

## 1. A qubit doesn't hold still

A qubit is the quantum version of a bit, and its weakness is that it doesn't keep its state. It behaves like a pattern drawn on the surface of water: it starts to smear as soon as it's made. On Google's 2024 chip the median qubit lifetime is 85 millionths of a second, about a thousandth of a blink. {{GQA-2024 OWN-ARITH}} The operations add errors of their own: each one has a small chance of going wrong.

That sounds harmless until it's set against a real job. A well-known estimate for breaking the encryption that protects much of the internet's traffic puts two numbers side by side. The hardware it assumes slips about once in every thousand basic operations. The calculation it plans needs between two and three billion steps of the costly kind, each built from many basic operations, and a single uncorrected slip can spoil the answer. {{GE-2021}} At one slip per thousand, that means millions of slips where one is enough. Unaided, such hardware cannot finish the calculation.

## 2. The cure costs what it protects

Ordinary computers protect a bit by storing it three times and taking a vote. That doesn't work for qubits. A quantum state can't be copied, and it can't be looked at to see whether it's still right, because looking destroys it.

The way around this is to store the information in the way several qubits relate to each other, and in none of them alone. The simplest version uses three qubits that are only ever all-0 or all-1 together. No single one holds the information, and no copy of it exists anywhere. Many real qubits working together like this are called a **logical qubit**.

:::margin qubits 1

In the scheme we studied, the surface code, the qubits sit on a square grid, and the size of the grid is called its **distance**. A bigger grid should protect better, but only if each qubit is good enough. Below a certain error rate, called the **threshold**, it does. Above it, a bigger grid is worse, since every added qubit is one more thing that smears. For years the hardware sat above it. {{GQA-2023 GQA-2024}}

## 3. Asking without looking

:::margin qubits 2

Only about half of the qubits store anything. The rest are helpers, each sitting between two or four storing qubits. The smallest grid, distance 3, has 9 storing qubits and 8 helpers, 17 in all. Distance 5 has 49 qubits, and distance 7 has 97. {{OWN-ARITH GQA-2024}}

Once every round, each helper interacts with its neighbours and is measured. One bit comes out. It doesn't say what state any neighbour is in – only whether the number of errors among those neighbours is even or odd. That answer is the same whatever is stored. So measuring it leaves the stored information alone.

:::margin qubits 3

These questions are called **checks**. While nothing goes wrong, a check gives the same answer round after round. When a qubit next to it is hit, the answer changes, and we say the check **fires**.

Two kinds of error can hit a qubit. A flip swaps 0 and 1, as in an ordinary bit. A phase error is harder to picture. In the water image, it keeps the pattern's shape and shifts its rhythm: 0 and 1 stay as they are, but "0 plus 1" becomes "0 minus 1". That only shows while the qubit is in both states at once, which an ordinary bit can't be. Half of the checks notice flips and the other half notice phase errors. Some errors are both at once and fire checks of both kinds. We come back to those in section 6.

A check can also just report wrongly. Then it fires twice in a row, once when the wrong answer appears and once when the right one returns, although no storing qubit was hit. So a single round is never enough. The checks must be read as a sequence.

## 4. A film of hints

:::scene film

@caption What leaves the chip each round is every check's answer, drawn here as the opening drawing's cable: a strip of film whose frames show the checks of the distance-7 grid that fired. The frame enlarged above it is the round lit beside section 3. Simulated at distance 7 with a 0.5% chance of error per operation, which makes the inner checks fire about as often as on Google's 2024 chip (8.6% of rounds here, 8.7% there), and shown far slower than real time. {{OWN-FILM-SIM GQA-2024}}

@step 0
One round of checks takes 1.1 millionths of a second, and a grid of distance 7 has 48 checks. In the time of one blink the chip gets through about ninety thousand rounds and puts out over four million check results, for a single logical qubit. {{GQA-2024 OWN-ARITH}}

@step 1
While the computer runs, that stream is all that comes out of it. We ended up thinking of it as a film in which a few points light up in most frames.

@step 2
The fired checks say roughly where something happened and which kind of error it was. They don't say which qubits were hit. Many sets of errors light up the same points.

:::

:::margin qubits off

## 5. The decoder, and the one mistake that matters

A program on a classical computer watches that film and decides which errors happened. It's called the **decoder**. Nothing on the chip gets repaired: the decoder keeps a record of the errors it believes in, and the final result is corrected in software. For simply storing a qubit that's enough. For calculating it isn't, because some operations can only go ahead once the decoder has answered. So its speed matters too (section 8).

The decoder guesses: from the checks that fired, it picks one explanation. Most small mistakes in that guess are harmless. A wrong guess that fires the same checks usually differs from the truth in a way the code doesn't care about.

The harmful case looks like this. A correction acts on the grid just as errors do. If the real errors and the decoder's correction together make an unbroken line across the grid, from one edge to the opposite edge, the stored value has changed. No check fires, because every check along such a line sees an even number of errors. A shorter line of errors behaves the same way inside: only the checks at its two ends fire.

This silent failure is a **logical error**, and how often it happens is what every decoder is measured by. It also shows what distance (section 2) is worth. On a grid of distance 5 a line needs five storing qubits. So three real errors can be enough. A decoder that sees them may add two more.

:::figure line column
A grid of distance 5, showing flips and the checks that notice them. Three real errors in one column fire a single check. The shortest explanation of that one check is two errors below it. If the decoder corrects those two, errors and correction together cross the grid from edge to edge: the stored value has changed and no check fires. Constructed and checked by our script.
:::

## 6. Where the standard method goes wrong

The rules are the same on a grid of any size, so we went down to the smallest one, distance 3, where every case can be counted. We went through every possible error there and compared two answers for each pattern of fired checks: the one the standard decoder gives, and the one most likely to be right. Of the 256 possible patterns on the smallest grid, 103 get an answer from the standard decoder that isn't the most likely one. {{OWN-ENUM}} That sounds like a lot, but these patterns are rare: together they turn up in fewer than 2 cases in 100.

:::figure syndromes wide
All 256 patterns of the eight checks at distance 3, one mark each, ordered by how many checks fire. Filled: the 103 patterns where the standard decoder's answer isn't the most likely one. These are the rarer patterns: with a 5% chance of an error per storing qubit they turn up in about 1.6% of cases, and in 63% of cases no check fires at all. Our own count.
:::

:::scene lattice

@caption The smallest grid: 9 storing qubits and 8 checks; X is a flip, Z a phase error, Y both. On screen, one flip fires the two checks beside it; then a line of two flips fires only its upper end, as the lower end meets the edge (on paper, at the left). Then our example's three fired checks and two explanations; the dots count 30 times this pattern shows up. Plain matching's answer is right in 10, the other in 19, because it can happen in two ways: the phase error in the far corner or one place above it (5% error per storing qubit, checks never wrong; our own count).

@step 0
The standard decoder is called **matching**, and the smallest grid shows how it works: 9 storing qubits, never read directly, and 8 checks between them, each asking its neighbours one question.

@step 1
In the middle of the grid, a single flip fires the two flip-checks on either side of it. The phase-checks stay quiet: a flip isn't their kind of error. The decoder never sees the flip, only two lit checks.

@step 2
Now put several errors in a line. Each check along the line sees two of them, an even number, and stays quiet. Only the checks at the two ends fire. At the edge of the grid a line can end without firing anything.

@step 3
Decoding then becomes a pairing puzzle: join every fired check to another fired check, or to the edge. Matching picks the pairing with the shortest lines in total, since a few errors are more likely than many. Fast, exact methods exist for it, and almost every experiment uses it. {{SB-2025}} Plain matching has two blind spots.

Plain matching solves the puzzle separately for flip-checks and phase-checks, so an error that is both at once (section 3) counts as two. And it seeks the single likeliest explanation, though explanations that differ only in a way the code doesn't care about (section 5) add up.

@step 4
The first of our 103 patterns shows it. Three checks fire. Plain matching explains them with two errors: a flip in one corner and a phase error in the centre. It fits the checks, and it is right one time in three. {{OWN-ENUM}} But when the truth is the other answer, matching's correction and the real errors together cross the grid: a silent logical error, about two times in three. Two cautions: we gave every storing qubit a 5% chance of an error, far more than a real chip has, so the effect is easy to count, and we assumed the checks never report wrongly. {{OWN-ENUM}}

@step 5
The same checks also fit a combined error in that corner, a flip and a phase error at once, which the figure marks Y, plus one phase error on the right. Counting Y as one error, this answer also has two, and on its own it is exactly as likely as plain matching's. What tips the balance is that it can happen in two ways. The phase error can sit in the far corner. Or it can sit one place above it, and the checks fire just the same. Together, the two ways are right about six times in ten. {{OWN-ENUM}} The rest are rarer explanations.

:::

Real chips add trouble of the same sort: errors that hit two neighbouring qubits at once, and qubits that slip into a third state they should never be in. A decoder that learns can take them in. {{AQ-2024}} Plain matching's picture has no place for either.

## 7. The result that started us off

Google first showed, in 2023, a grid of distance 5 that beat distance 3, but only just. A year later, on a new chip, the errors were finally below the threshold – the error rate from section 2 under which bigger grids win – and the effect was clear. Each step from distance 3 to 5 to 7 cut the rate of logical errors roughly in half. At distance 7 the logical qubit lasted more than twice as long as the best single qubit on the chip. {{GQA-2023 GQA-2024}}

:::margin qubits 4

The factor by which the error shrinks per step is written **Λ** (lambda), and it decides how big a useful machine has to be. With Λ near 2, halving the error once more means going from distance 7 to distance 9: from 97 qubits to 161. {{GQA-2024 OWN-ARITH}} That one halving costs 64 more qubits.

Google read the same recorded data with two decoders. Its best matching decoder already links the two kinds of check in a limited way – the idea behind the correlated matching we use in section 9. It learns no rules of its own, though its error weights were tuned on the chip's data. It gave Λ = 2.04, and a neural network gave Λ = 2.14. At distance 7 the matching decoder's logical error rate was 171 per 100,000 rounds and the network's 143, about one in six fewer. {{GQA-2024}} Same chip, same data; only the reader changed.

Other labs have got below the threshold with other hardware, some with decoders that learn {{NA-2025 QTN-2026 QTN-PR-2026 USTC-2025}}, and IBM has shown in simulation a fast one that doesn't {{IBM-RELAY-2025 IBM-FPGA-2025}}. None of these results settles which route is best.

:::figure suppression column
Logical error rate per round, times 100,000, on Google's 2024 chip at distances 3, 5 and 7, each recording read afterwards by two decoders. The values at distances 3 and 5 are averages over 9 and 4 smaller grids on the same chip, so each distance is its own recording. Each step in distance divides the rate by Λ: 2.04 for the matching decoder, 2.14 for the network. Google's measurements, not ours. Source: Google Quantum AI, Nature 638 (2025), with its supplementary table S1.
:::

:::margin qubits end

## 8. Accurate, or in time

Nobody writes a neural decoder's rules; it learns them. It's trained first on a simulator, where the true errors are known, then on the chip's own data, where only the outcome is known: whether the stored value came out as it went in. From this it picks up whatever regularities are there, including the ones matching leaves out. {{AQ-2024 GQA-2024}}

:::scene clock

@caption One time line in millionths of a second. The chip finishes a round of checks every 1.1. The 2024 network needs 24 for each round, so its backlog grows without end. The matching decoder that ran live keeps pace: its answer comes about 63 after the last round of a run, for runs of up to a million rounds. A preprint of December 2025 claims a network under 1 per round on accelerator chips; it is drawn as a claim.

@step 0
The clock is where it struggles. The chip asks its checks once every 1.1 millionths of a second, about 900,000 times a second. {{GQA-2024 OWN-ARITH}} A live decoder has to handle each round in that time.

@step 1
Google's paper quotes 24 millionths of a second per round for its network, from earlier work. {{GQA-2024 AQ-2024}} In that time the chip finishes about 22 more rounds. The network is accurate, but each answer comes late.

@step 2
By the time the network has answered round 3, at 72 millionths of a second, the chip is at round 65. An interpreter who needs twenty-two seconds for every second of speech is more than twenty minutes behind after one minute. {{OWN-ARITH}} And the gap keeps growing.

@step 3
So the network's results were worked out afterwards, on recorded data. The decoder that ran live was a fast, plain version of matching, and it kept pace. On a smaller chip, at distance 5 and on the same data, live matching's logical error rate was 350 per 100,000 rounds and the network's, afterwards, 269. {{GQA-2024}} Part of that gap is live against offline, not only matching against network.

@step 4
A preprint from December 2025 reports a network that keeps pace: under one millionth of a second per round, on the kind of accelerator chips that can simply be bought, for grids up to distance 11. {{AQ2-2025}} As far as we know other researchers haven't reviewed it yet, and we can't test it ourselves. Until then it stays a claim.

:::

## 9. What we measured ourselves

We can't build a chip and we can't match Google's network. We can measure, in simulation, what a small neural decoder costs to train and run. The short answer: on the smallest grid our network soon beats plain matching; one grid larger it needs about 250 million examples to do so, and never catches correlated matching. We simulate the surface code with Stim, a free simulator written at Google, and use its standard noise model. {{STIM-2021}}

We wanted three measurements. First, whether a small network beats matching, and how many more examples it needs at distance 5 than at 3. Second, how long each decoder takes per run of three or five rounds on the same machine, next to how often it's wrong. Third, whether a network trained in simulation still works on the recordings Google has made public {{GQA-DATA-2022 GQA-DATA-2024}}, before and after it has seen some of them. We did the first, part of the second, and not the third.

**What we ran.** One simulated run stores a logical qubit for as many rounds of checks as the grid's distance: three rounds at distance 3, five at distance 5. Every operation in the simulated circuit goes wrong with the same chance, which we call the noise level. Unless we say otherwise it is 0.5%, five times the one slip per thousand that the estimate in section 1 assumed. Every training step draws 4,096 fresh runs at one of seven noise levels between 0.2% and 1%, and afterwards every decoder reads the same 2 million fresh runs at each noise level. {{OWN-D3 OWN-D5}} No training batch is reused. The network is small and plain: three layers of 256 units. That makes 138,241 adjustable numbers at distance 3 and 162,817 at distance 5, few enough to train in minutes on a GPU. It is told only which checks fired, never how the grid is laid out. It gives one answer per run: was the stored value flipped or not.

We compare against two versions of matching from PyMatching, the standard matching program. {{SB-2025}} One is the plain version of section 6. The other is correlated matching, which solves the puzzle in two passes and lets the first inform the second. That is a limited way of linking the two kinds of check, like the one mentioned in section 7. Both are given an estimate of how often each kind of error happens: here, the exact one from the simulator, an advantage matching won't have on a chip. The comparison leans towards matching.

Each training was repeated from different random starting points, or seeds: eight at distance 3, five at distance 5.

:::scene learning

@caption Our own runs, at a noise level of 0.5%. Share of simulated runs in which a decoder was wrong, against the number of examples the network had seen; one thin line per seed. The two level lines are plain and correlated matching, which need no examples. Distance 3: the network ends below both, but its lead over correlated matching is about what a library defect costs that decoder (see "A finding we didn't plan for"). Distance 5 after 66 million examples: above both. Distance 5 after 250 million: below plain matching, above correlated matching. Points along a curve are scored on 1 million runs, not the final test's 2 million, so the crossings are less sharp than the end values.

@step 0
**Distance 3.** Here the network beats plain matching, and early. After about 66 million examples it failed in 1.48% of runs, its eight seeds between 1.46% and 1.49%. Plain matching failed in 1.72% and correlated matching in 1.66%. The curves first dip below plain matching at 6.6 million examples in four seeds and at 9.3 million in the other four. By 13 million all eight were at or below correlated matching. {{OWN-D3}} That second win we don't count. In our library version correlated matching mishandles six single errors, and by a first-order estimate that costs it about the whole gap of 0.18 percentage points (see "A finding we didn't plan for").

@step 1
**Distance 5, the same 66 million examples.** One grid larger, the same network loses in all five seeds. It failed in 1.90% to 2.16% of runs, plain matching in 1.41% and correlated matching in 1.09%. That is about a third to a half more failures than plain matching, and 1.7 to 2 times as many as correlated matching. {{OWN-D5}} The seeds also spread more than at distance 3.

@step 2
**Distance 5, about 250 million examples.** Trained longer, it passes plain matching, not correlated matching. The curves were still falling at 66 million, so we trained it again from scratch on nearly four times as many. The five long runs failed in 1.29% to 1.36% of runs, 1.33% together, or about one run in 75, against 1.41% for plain matching and 1.09% for correlated matching. That is 4% to 8% fewer failures than one, and a fifth to a quarter more than the other. {{OWN-D5-250M}}

:::

At distance 3 the best answer for every pattern can simply be looked up. A table built from 200 million runs per noise level, a hundred times the test set, holds the more frequent answer for each pattern of fired checks. It failed in 1.47% of runs. {{OWN-D3}} Whether its runs overlap the test runs, and how it answers a pattern it never saw, our result files don't record. That table is our estimate of the best possible; since we can't say whether it saw the test runs, it may flatter itself slightly. The network's 1.48% is barely above it.

:::figure noise wide
Distance 5, network trained on about 250 million examples: share of runs in which each decoder was wrong, at eight noise levels, with 95% intervals. Five seeds together, 10 million runs per noise level. At 0.1% the network and correlated matching can't be told apart. From 0.2% the network is behind correlated matching, and from 0.8% it is behind plain matching too. Our own runs.
:::

**A finding we didn't plan for.** We had expected correlated matching to be at least as good as plain matching everywhere. At distance 5 it was, at every noise level we tried. At distance 3 and low noise it was worse. On 4 million runs at a noise level of 0.1%, with both decoders reading the same runs, plain matching failed in 0.075% (0.073% to 0.078%). Correlated matching failed in 0.113% (0.109% to 0.116%), about one and a half times as many failures. At 0.3% it was still worse, 0.705% against 0.659%. From 0.4% upwards it was the better one. When we stored the other kind of value, it was again worse at 0.1%: 0.0986% against 0.0856%. {{OWN-CORR OWN-D3}}

We first suspected our script. Two checks say it isn't at fault. The first: the simulator's error model for this circuit lists 219 error mechanisms. We applied each of them alone and decoded it; at distance 3 a decoder should survive every one. Plain matching corrects all 219. Correlated matching, in the version we used (PyMatching 2.4.0, called the way its documentation says), gets 6 of them wrong. Together those six happen with a chance of 0.4 times the noise level. At a noise level of 0.1% that is 0.04%, about the gap we measured, 0.037%. With the other kind of stored value it gets 4 of 221 wrong, 0.27 times the noise level. The second check: a second script, written by an AI agent from only a description of the test and without seeing ours, found the same six. {{OWN-CORR}}

At distances 5 and 7 no single error defeats correlated matching. At distance 5 we also tried every pair of errors: it fails on 1,253 of 1,405,326 pairs, about one pair in 1,100, and plain matching on none. That pair check was not repeated independently. {{OWN-CORR}} A search turned up no report of any of this, and we haven't traced the cause inside the library. So we state it for our setup only: this circuit, three rounds at distance 3, this version. At distance 3 and low noise it makes plain matching the harder comparison. That is why we always show both.

:::details The numbers behind this: by noise level and seed, timings, and a second implementation

**Seeds and intervals.** Three seeds at distance 3, and three of the five long runs at distance 5, were added later as a repeat. A range in brackets is a 95% interval. A run at distance 5 is longer than one at distance 3, so the failure rates of the two distances can't be set against each other; within one distance, every decoder reads the same runs. {{OWN-D3 OWN-D5 OWN-D5-250M}}

**Learning rate.** How many more examples it would take to reach correlated matching, we can't say. The curves were still falling at the last point. But the last fifth of every run also lowers the learning rate, the size of the network's adjustments, and that alone brings the error down; with the same seed, a long and a short run are identical until the short one starts lowering it, at 52 million examples. {{OWN-D5-250M}} So the final slope may promise too much.

**Against the noise level.** At the lowest noise level, one the network never saw in training, it is level with correlated matching: 0.0099% of runs failed, about one in ten thousand, against 0.0105%. From a noise level of 0.2% it fails more often than correlated matching: 8% more there, and a fifth to a quarter more from 0.4% on. Against plain matching it is ahead up to 0.6%, where four of five seeds still lead and the fifth is level, and behind in every seed from 0.8%. {{OWN-D5-250M}} The pooled intervals count only the chance in the test runs; the five networks differ from each other far more.

**Over noise levels.** The five long runs were also tested at eight noise levels, with 2 million runs each. The table pools them, 10 million runs per noise level, and gives the lowest and the highest seed beside the network's value. {{OWN-D5-250M}}

| Noise level | Network, five seeds together | Lowest to highest seed | Plain matching | Correlated matching |
| --- | --- | --- | --- | --- |
| 0.1% | 0.0099% (0.0093–0.0105) | 0.0093–0.0101% | 0.0136% (0.0129–0.0143) | 0.0105% (0.0099–0.0111) |
| 0.2% | 0.079% (0.077–0.080) | 0.077–0.080% | 0.102% (0.100–0.104) | 0.073% (0.071–0.074) |
| 0.3% | 0.276% (0.273–0.279) | 0.271–0.284% | 0.330% (0.326–0.334) | 0.243% (0.240–0.246) |
| 0.4% | 0.670% (0.665–0.675) | 0.648–0.686% | 0.756% (0.751–0.762) | 0.564% (0.559–0.569) |
| 0.5% | 1.331% (1.324–1.339) | 1.292–1.357% | 1.411% (1.404–1.418) | 1.090% (1.084–1.097) |
| 0.6% | 2.260% (2.251–2.269) | 2.196–2.310% | 2.309% (2.299–2.318) | 1.835% (1.827–1.843) |
| 0.8% | 5.090% (5.077–5.104) | 4.928–5.200% | 4.898% (4.884–4.911) | 4.094% (4.081–4.106) |
| 1.0% | 9.074% (9.056–9.091) | 8.801–9.268% | 8.379% (8.361–8.396) | 7.335% (7.319–7.351) |

**Time.** Training ran on a GPU at Kaggle: about 50 seconds per seed at distance 3, about 100 seconds at distance 5 for 66 million examples, and a little over six minutes for 250 million. On a laptop, running emulated, a training step took about 90 thousandths of a second at distance 3 and a tenth of a second at distance 5. At that pace the long run would take about an hour and three-quarters per seed, about sixteen times as long; without emulation it would likely be faster. {{OWN-TIME}}

Decoding we timed only roughly: on one laptop core, with an untrained network of the same size, as an average over a large batch, and on a machine that has to emulate the processor our software was built for. There the network took between 14 and 27 millionths of a second per run whatever the noise, while matching got faster as errors got rarer. At distance 3 the network was about 20 times slower than plain matching. At distance 5, taking its two timings together (about 17 millionths of a second), it was about twice as slow at a noise level of 0.5% and about ten times as slow at 0.1%. Repeat timings of the same network varied by about half, so these ratios are rough. {{OWN-TIME}} Per round, these times are three or five times shorter. None of this is a live decoder on its own hardware, so we don't set it against the chip's clock.

**A second implementation.** We also had the main result rerun by code that shares nothing with ours: a script and network written by an AI agent from only a description of the claim, without seeing ours, and run on Kaggle. At distance 3 its networks also beat plain matching, failing in 1.46% to 1.48% of runs against 1.71% to 1.73%, also at our network size; against correlated matching (1.66% to 1.67%) the same library defect may apply. At distance 5, after about 250 million examples, its network also ended between the two matchers, closer to correlated matching than ours: 1.15% and 1.16% against 1.09%. Unlike ours, they trained only at their test noise level, 0.5%, which favours them there. But that network is about twenty times larger, with 3.3 million adjustable numbers. At our size its script reached only 1.51%, behind plain matching, where ours reached 1.33%. It ran two seeds for each larger network at the main setting and one at our size, and did not test the finding about correlated matching. {{OWN-REPL}} So the order of the three decoders held up where it is clean, at distance 5. How far a small network gets depends on its training.

:::

Before starting we wrote down what would make us drop the idea: if the network needs so many more examples at distance 5 that a laptop can't train it, or if it loses on real recordings, then for a group like ours a neural decoder isn't worth its cost. We now have numbers for the first. On a laptop the long run would take under two hours per seed, so by the rule we set, the idea survives. But it took about 250 million examples to pass plain matching, and correlated matching, which needs no training and is free to download, stayed about a fifth ahead. {{OWN-D3 OWN-D5 OWN-D5-250M}} The second test, real recordings, is still open.

## 10. What this doesn't show

A decoder doesn't make a quantum algorithm faster in itself. It lets a calculation run longer before an error ruins it, and a better one means fewer qubits for the same reliability. A slow one holds up every step that waits for it.

Our numbers come from small grids and from a network far smaller than Google's. They say something about how the cost of learning grows. About larger grids they say nothing.

## What we could not show

- How any of our decoders would do on a real chip. Every run of ours is a simulation with the same noise on every operation, unlike a real chip's errors (section 6), and matching was handed the exact error model. {{OWN-D3 OWN-D5 OWN-D5-250M OWN-TIME}}
- How the decoders do on the other of the two kinds of value a logical qubit can hold. We stored only one.
- How many examples our network needs to reach correlated matching at distance 5, and whether it learns distance 7 at all.
- Why correlated matching gets those single errors and pairs wrong, and whether another version of the library does too.

## Words used

| Word | Meaning here | First used |
| --- | --- | --- |
| Logical qubit | One qubit's worth of information, stored in the way many real qubits relate to each other | Section 2 |
| Distance | The size of the grid; also the number of storing qubits a line needs to cross it | Sections 2 and 5 |
| Threshold | The error rate below which a bigger grid protects better | Section 2 |
| Check | A question asked of two or four neighbouring qubits through a helper: is the number of errors among you even or odd? | Section 3 |
| Fires | A check gives a different answer than in the round before | Section 3 |
| Decoder | The classical program that works out from the fired checks which errors happened | Section 5 |
| Logical error | Real errors and the decoder's correction together make a line across the grid: the stored value changes and no check fires | Section 5 |
| Matching | The standard decoder: it joins fired checks to each other or to the edge along the shortest lines | Section 6 |
| Λ (lambda) | The factor by which the logical error rate shrinks when the distance grows by two | Section 7 |
| Noise level | In our simulation, the chance that any one operation goes wrong | Section 9 |
| Correlated matching | Matching in two passes, where the first pass informs the second | Section 9 |

## How this was made

:::details Show how this was made
Every figure from outside our group comes from a source one of us opened: published papers, preprints and data records. Each passage carries its sources; they open when you select a mark. Where only an abstract was read, and where a paper has not been peer-reviewed, the source entry says so. Our own results come from code and data in our repository, which is private for now. The figures are drawn from the result files; the numbers in the text were checked against them. A blink is taken as a tenth of a second, a rule of thumb.

- Question, choices, what to keep and drop, and conclusions: the group.
- Code and prose: written and revised with AI assistants under our direction; the code run by us on Kaggle.
- Second scripts: by an AI agent that had not seen ours; a check on our code, not a replication by other people.
- Reviews: four AI readers in different roles (student, outsider, examiner, voice) on an earlier draft, an AI fact checker on a later one; we worked in their lists. No person outside the group has read it yet.
- Opening drawing: an image model, from our own line reference and photographs of real hardware.

We are responsible for the question and every claim.
:::
