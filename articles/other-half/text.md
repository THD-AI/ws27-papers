---
title: The other half of a quantum computer
deck: The same recorded data from one of Google's quantum chips gave two different results, depending on which program read it. We asked what that program has to do, why a neural network does it better, and what that costs.
author: Alexander Rudaev and group
context: Quantum Computing seminar · TH Deggendorf · winter semester 2026/27
status: Draft for review, 16 November 2026
accent: other-half
hero: hero
summary: The program that reads a quantum chip's errors decides whether the computer works: what it does, why a neural network does it better, and the cost.
date: 2026-11-16
keywords: quantum error correction, surface code, neural network decoder, AlphaQubit, Google Willow, matching decoder
card_alt: Card with the title The other half of a quantum computer beside a line drawing of a quantum computer's cooling stack wired to an ordinary computer.
seo_title: The other half of a quantum computer: neural-network decoders
---

Drawing: made with an image model from Alexander Rudaev's own line reference and reference photographs; the cryostat after a photograph by Lars Ploughman, CC BY-SA 2.0.

:::margin qubits 0

## What we wanted to know

A quantum chip can be excellent and the computer can still fail. The cause sits beside the chip: a program running on an ordinary computer.

We came across this in a paper Google published in December 2024. It reports the first quantum memory that gets more reliable as it gets bigger, which nobody had managed before. One detail in it is easy to miss. The same recorded data from the same chip gave two different results, depending on which program read it. A neural network, a program that learns from examples, read it better than the standard program everyone uses. {{GQA-2024}} That detail is what this text is about.

So we asked three things: what that program has to do, why a neural network does it better, and what that costs. This text goes through what we found, in the order we had to understand it ourselves. It starts with the qubit.

## 1. A qubit doesn't hold still

A qubit is the quantum version of a bit, and its weakness is that it doesn't keep its state. It behaves like a pattern drawn on the surface of water: it starts to smear as soon as it's made. On Google's 2024 chip a typical qubit has lost much of its state after 85 millionths of a second, about a thousand times less than the blink of an eye. {{GQA-2024 OWN-ARITH}} The operations add to it. Each one has a small chance of going wrong.

That sounds harmless until it's set against a real job. A well-known estimate for breaking the encryption that protects much of the internet's traffic puts two numbers side by side. The hardware it assumes slips about once in every thousand basic operations. The calculation it plans needs between two and three billion steps of the costly kind, each built from many basic operations, and a single uncorrected slip can spoil the answer. {{GE-2021}} At one slip per thousand, that means millions of slips where one is enough. Unaided, such hardware gets nowhere.

So adding qubits alone doesn't help. Each one has to last.

## 2. The cure costs what it protects

Ordinary computers protect a bit by storing it three times and taking a vote. That doesn't work for qubits. A quantum state can't be copied, and it can't be looked at to see whether it's still right, because looking destroys it.

The way around this is to store the information in the way several qubits relate to each other, and in none of them alone. The simplest version uses three qubits that are only ever all-0 or all-1 together. No single one holds the information, and no copy of it exists anywhere. Many real qubits working together like this are called a **logical qubit**.

:::margin qubits 1

In the scheme we studied, the surface code, the qubits sit on a square grid, and the size of the grid is called its **distance**. A bigger grid should protect better. Whether it does depends on how good each qubit is. Below a certain error rate, called the **threshold**, a bigger grid protects better. Above it, a bigger grid is worse, since every added qubit is one more thing that smears. For years the hardware sat above the threshold: adding qubits added more errors than the grid could catch. {{GQA-2023 GQA-2024}} The cure itself brought errors.

## 3. Asking without looking

The grid has to be watched without being looked at, and this is how it's done.

Only about half of the qubits store anything. The rest are helpers, each sitting between two or four storing qubits. The smallest grid, distance 3, has 9 storing qubits and 8 helpers, 17 in all. Distance 5 has 49 qubits, and distance 7 has 97. {{OWN-ARITH GQA-2024}}

:::margin qubits 2

Once every round, each helper interacts with its neighbours and is measured. One bit comes out. It doesn't say what state any neighbour is in – only whether the number of errors among those neighbours is even or odd. That answer is the same whatever is stored. So measuring it leaves the stored information alone.

These questions are called **checks**. While nothing goes wrong, a check gives the same answer round after round. When a qubit next to it is hit, the answer changes, and we say the check **fires**.

Two kinds of error can hit a qubit. A flip swaps 0 and 1, as in an ordinary bit. A phase error is harder to picture: it leaves 0 and 1 alone but turns "0 plus 1" into "0 minus 1", which matters as soon as the qubit is in both at once. Half of the checks notice flips and the other half notice phase errors. Some errors are both at once and fire checks of both kinds. We come back to those in section 6.

A check can also just report wrongly. Then it fires twice in a row, once when the wrong answer appears and once when the right one returns, although no storing qubit was hit. So a single round is never enough. The checks must be read as a sequence.

:::margin qubits 3

## 4. A film of hints

One round of checks takes 1.1 millionths of a second, and a grid of distance 7 has 48 checks. In the time of one blink the chip gets through about ninety thousand rounds and puts out about four million check results, for a single logical qubit. {{GQA-2024 OWN-ARITH}}

While the computer runs, that stream is all that comes out of it. We ended up thinking of it as a film in which a few points light up in every frame.

The fired checks say roughly where something happened and which kind of error it was. They don't say which qubits were hit. Many different sets of errors light up exactly the same points. Something has to read the film.

:::margin qubits 4

## 5. The decoder, and the one mistake that matters

A program on a classical computer watches that film and decides which errors happened. It's called the **decoder**. Nothing on the chip gets repaired: the decoder keeps a record of the errors it believes in, and the final result is corrected in software. For simply storing a qubit that's enough. For calculating it isn't, because some operations can only go ahead once the decoder has answered. So its speed matters too (section 8).

The decoder guesses: from the checks that fired, it picks one explanation. Most small mistakes in that guess are harmless. A wrong guess that fires the same checks usually differs from the truth in a way the code doesn't care about.

The harmful case looks like this. A correction acts on the grid just as errors do. If the real errors and the decoder's correction together make an unbroken line across the grid, from one edge to the opposite edge, the stored value has changed. No check fires, because every check along such a line sees an even number of errors.

This silent failure is a **logical error**, and how often it happens is what every decoder is measured by. It also shows what distance (section 2) is worth. On a grid of distance 5 a line needs five links. Three real errors are already enough for trouble. A decoder that sees them may add the other two itself.

:::figure line column
A grid of distance 5, showing flips and the checks that notice them. Three real errors in one column fire a single check. The shortest explanation of that one check is two errors below it. If the decoder corrects those two, errors and correction together cross the grid from edge to edge: the stored value has changed and no check fires. Constructed and checked by our script.
:::

A chip can be excellent and still lose the logical qubit, if the program reading it guesses badly. That's where our title comes from.

## 6. Where the standard method goes wrong

We went through every possible error on the smallest grid and compared two answers for each pattern of fired checks: the one the standard decoder gives, and the one most likely to be right. The smallest grid has 256 possible patterns, and in 103 of them the standard decoder's answer isn't the most likely one. {{OWN-ENUM}} That is two patterns in five. Most of them are rare, as the figure shows.

:::figure syndromes wide
All 256 patterns of the eight checks at distance 3, one mark each, ordered by how many checks fire. Filled: the 103 patterns where the standard decoder's answer isn't the most likely one. These are the rarer patterns: with a 5% chance of an error per storing qubit they turn up in about 1.6% of cases, and in 63% of cases no check fires at all. Our own count.
:::

:::scene lattice

@caption The smallest grid: 9 storing qubits and 8 checks. Left to right: one flip fires the two checks beside it; in a line of errors only the ends fire; the three fired checks of our example, and its two explanations. Plain matching's explanation is right one time in three, the other about six times in ten (5% error per storing qubit, checks that never report wrongly; our own count).

@step 0
To see why, it helps to know how that decoder works. It's called **matching**, and the smallest grid shows it: 9 storing qubits, never read directly, and 8 checks between them, each asking its neighbours one question.

@step 1
In the middle of the grid, a single flip fires the two flip-checks on either side of it. The phase-checks stay quiet: a flip isn't their kind of error. The decoder never sees the flip, only two lit checks.

@step 2
Now put several errors in a line. Each check along the line sees two of them, an even number, and stays quiet. Only the checks at the two ends fire. At the edge of the grid a row can end without firing anything.

@step 3
Decoding then becomes a pairing puzzle: join every fired check to another fired check, or to the edge. Matching picks the pairing with the shortest rows in total, since a few errors are more likely than many. Fast, exact methods exist for it, and almost every experiment uses it. {{SB-2025}} It is a sound shortcut with one blind spot.

Plain matching solves the puzzle twice, once for the flip-checks and once for the phase-checks, and never compares the two. But an error that is both at once (section 3) fires checks of both kinds. A decoder that reads them together can use that.

@step 4
The first of our 103 patterns shows it. Three checks fire. Plain matching explains them with a flip in one corner and a phase error in the centre, and that kind of answer is right one time in three. {{OWN-ENUM}} It isn't wrong, only the less likely answer.

@step 5
Read together, the same three checks point to a combined error in the corner plus a phase error in the far corner. That answer is right about six times in ten. {{OWN-ENUM}} The rest are rarer explanations.

Two cautions. We gave every storing qubit a 5% chance of an error, far more than a real chip has, so that the effect is easy to count. And we assumed the checks themselves never report wrongly. {{OWN-ENUM}}

:::

Real chips add trouble of the same sort: errors that hit two neighbouring qubits at once, and qubits that slip into a third state they should never be in. Plain matching's picture has no place for either. A decoder that learns can take them in. {{AQ-2024}}

## 7. The result that started us off

Google first showed, in 2023, a grid of distance 5 that beat distance 3, but only just. A year later, on a new chip, the errors were finally below the threshold – the error rate from section 2 under which bigger grids win – and the effect was clear. Each step from distance 3 to 5 to 7 cut the rate of logical errors roughly in half. At distance 7 the logical qubit lasted more than twice as long as the best single qubit on the chip. {{GQA-2023 GQA-2024}} The grid finally paid for its qubits.

:::margin qubits 5

The factor by which the error shrinks per step is written **Λ** (lambda), and it decides how big a useful machine has to be. With Λ near 2, halving the error once more means going from distance 7 to distance 9: from 97 qubits to 161. {{GQA-2024 OWN-ARITH}} That one halving costs 64 more qubits.

Google read the same recorded data with two decoders. Its best decoder built on matching, which already links the two kinds of check in a limited way, gave Λ = 2.04; a neural network gave Λ = 2.14. The gap looks small; in errors it isn't. Out of every 100,000 rounds at distance 7, the matching decoder left 171 logical errors and the network 143, about one in six fewer. {{GQA-2024}}

Other groups went other ways. One at Harvard, MIT and QuEra got below the threshold with single atoms held in place by light, and it too used a decoder that learns. {{NA-2025}} IBM is betting on a code that needs fewer qubits and a decoder that doesn't learn at all, built for fast special-purpose hardware. {{IBM-RELAY-2025 IBM-FPGA-2025}} Quantinuum, whose qubits are charged atoms, used the colour code and reported in October 2026 that its errors fell by a factor of about 12 per step, where Google's fell by about 2. It tried neural decoders on its data; that paper hasn't been reviewed yet. {{QTN-2026 QTN-PR-2026}} A group at USTC reported a distance-7 surface code below the threshold, with Λ = 1.4. {{USTC-2025}} Learned decoders are one of several routes. Nobody knows yet which one wins.

:::figure suppression column
Logical errors in 100,000 rounds on Google's 2024 chip at distances 3, 5 and 7, each recording read afterwards by two decoders. The values at distances 3 and 5 are averages over 9 and 4 smaller grids on the same chip, so each distance is its own recording. Each step in distance divides the errors by Λ: 2.04 for the matching decoder, 2.14 for the network. Google's measurements, not ours. Source: Google Quantum AI, Nature 638 (2025), with its supplementary table S1.
:::

:::margin qubits end

## 8. Accurate, or in time

Nobody writes a neural decoder's rules; it learns them. It's trained first on a simulator, where the true errors are known, then on the chip's own data, where only the outcome is known: whether the stored value came out as it went in. From this it picks up whatever regularities are there, including the ones matching leaves out. {{AQ-2024 GQA-2024}}

:::scene clock

@caption One time line in millionths of a second. The chip finishes a round of checks every 1.1. The 2024 network needs 24 for each round, so its backlog grows without end. The matching decoder that ran live keeps pace: its answer comes about 63 after the last round of a run, however long the run. A preprint of December 2025 claims a network under 1 per round on accelerator chips; it is drawn as a claim.

@step 0
The clock is where it struggles. The chip asks its checks once every 1.1 millionths of a second, about 900,000 times a second. {{GQA-2024}} A live decoder has to handle each round in that time.

@step 1
Google's network needed 24 millionths of a second for each round. {{GQA-2024}} In that time the chip finishes about 22 more rounds. The network is accurate, but each answer comes late.

@step 2
By the time the network has answered round 3, at 72 millionths of a second, the chip is at round 65. An interpreter who needs twenty-two seconds for every second of speech is more than twenty minutes behind after one minute. {{OWN-ARITH}} And the gap keeps growing.

@step 3
So the network's results were worked out afterwards, on recorded data. The decoder that ran while the chip was running was a fast version of matching, and it kept pace, answering on average 63 millionths of a second after a run's last round. Google compared the two on a smaller chip, at distance 5 and on the same data. Out of every 100,000 rounds, live matching left 350 logical errors and the network, afterwards, 269. {{GQA-2024}} Google had to choose between accurate and on time.

@step 4
A preprint from December 2025 reports a network that keeps pace: under one millionth of a second per round, on the kind of accelerator chips that can simply be bought, for grids up to distance 11. {{AQ2-2025}} As far as we know other researchers haven't reviewed it yet, and we can't test it ourselves. Until then it stays a claim.

:::

## 9. What we measured ourselves

We can't build a chip and we can't match Google's network. We can measure, in simulation, what a small neural decoder costs to train and run. We simulate the surface code with Stim, a free simulator written at Google, and use its standard noise model. {{STIM-2021}}

We wanted three measurements:

- **Training.** Whether and when a small network beats matching: how many examples it needs, and how that grows from distance 3 to distance 5.
- **Time.** How long each decoder takes per round on the same machine, next to how often it's wrong.
- **Real data.** Whether a network trained in simulation still works on the recordings Google has made public {{GQA-DATA-2022 GQA-DATA-2024}}, before and after it has seen some of them.

We did the first, part of the second, and not the third.

**What we ran.** One simulated run stores a logical qubit for as many rounds of checks as the grid's distance: three rounds at distance 3, five at distance 5. Every operation in the simulated circuit goes wrong with the same chance, which we call the noise level. Unless we say otherwise it is 0.5%, five times the one slip per thousand that the estimate in section 1 assumed. Every training step draws 4,096 fresh runs at one of seven noise levels between 0.2% and 1%, and afterwards every decoder reads the same 2 million fresh runs at each noise level. {{OWN-D3 OWN-D5}} No training batch is reused. The network is small and plain: three layers of 256 units. That makes 138,241 adjustable numbers at distance 3 and 162,817 at distance 5, few enough to train in minutes on a GPU. It is told only which checks fired, never how the grid is laid out. It gives one answer per run: was the stored value flipped or not.

We compare against two versions of matching from PyMatching, the standard matching program. {{SB-2025}} One is the plain version of section 6. The other is correlated matching, which solves the puzzle in two passes and lets the first inform the second. That is a limited way of linking the two kinds of check, like the one mentioned in section 7. Both are given an estimate of how often each kind of error happens: here, the exact one from the simulator, an advantage matching won't have on a chip. The comparison leans towards matching. Everything was repeated with different random seeds, the starting numbers that fix which examples are drawn and where the network begins. Distance 3 has eight seeds, distance 5 five. Three of the eight, and three of the five long runs described below, were run later as a repeat with new seeds. A range in brackets is a 95% interval. A run at distance 5 is longer than one at distance 3, so the failure rates of the two distances can't be set against each other. {{OWN-D3 OWN-D5 OWN-D5-250M}} Each compares decoders on the same runs.

:::scene learning

@caption Our own runs, at a noise level of 0.5%. Share of simulated runs in which a decoder was wrong, against the number of examples the network had seen; one thin line per seed. The two level lines are plain and correlated matching, which need no examples. Distance 3: the network ends below both. Distance 5 after 66 million examples: above both. Distance 5 after 250 million: below plain matching, above correlated matching.

@step 0
**Distance 3.** On the smallest grid the network wins. After about 66 million examples it failed in 148 of every 10,000 runs (1.479%; the eight seeds lie between 1.463% and 1.491%). Plain matching failed in 172 (1.715%, 1.709% to 1.721%) and correlated matching in 166 (1.664%, 1.657% to 1.670%). The curves first dip below plain matching at 6.6 million examples in four seeds and at 9.3 million in the other four. By 13 million all eight were at or below correlated matching. {{OWN-D3}} Points along a curve are scored on 1 million runs, not the final test's 2 million, so the crossings are less sharp than the end values.

@step 1
**Distance 5, the same 66 million examples.** Here the network lost in all five seeds. It failed in 190 to 216 of every 10,000 runs (1.90% to 2.16%), plain matching in 141 (1.411%, 1.403% to 1.418%) and correlated matching in 109 (1.087%, 1.081% to 1.094%). That is between a third and a half more failures than plain matching and 1.7 to 2 times as many as correlated matching. {{OWN-D5}} The seeds also spread more than at distance 3.

@step 2
**Distance 5, about 250 million examples.** The curves were still falling at 66 million, so we retrained the same network from scratch on nearly four times as many examples. With the same seed, a long and a short run are identical up to 52 million examples. They part only where the short one starts lowering its learning rate, the size of its adjustments. The five long runs ended between 1.292% and 1.357% (together 1.331%, 1.324% to 1.339%). All five beat plain matching (1.411%, 1.404% to 1.418%), with 4% to 8% fewer failures. All still trail correlated matching (1.090%, 1.084% to 1.097%), with about a fifth to a quarter more. {{OWN-D5-250M}}

:::

How many more examples it would take to reach correlated matching, we can't say. The curves were still falling at the last point. But the last fifth of every run also lowers the learning rate, and that alone brings the error down. {{OWN-D5-250M}} So the final slope may promise too much.

At distance 3 the best answer for every pattern can simply be looked up. A table built from 200 million runs per noise level, a hundred times the test set, holds the more frequent answer for each pattern of fired checks. It failed in 147 of every 10,000 runs (1.466%, 1.460% to 1.471%). {{OWN-D3}} That table is our estimate of the best any decoder can do here, and the network is within about 1% of it.

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

:::figure noise wide
Distance 5, network trained on about 250 million examples: share of runs in which each decoder was wrong, at eight noise levels, with 95% intervals. Five seeds together, 10 million runs per noise level. At 0.1% the network and correlated matching can't be told apart. From 0.2% the network is behind correlated matching, and from 0.8% it is behind plain matching too. Our own runs.
:::

We compare the 95% intervals of the pooled values. At the lowest noise level, one the network never saw in training, it is level with correlated matching: 989 failures in 10 million runs, about one in ten thousand, against 1,048, and the intervals overlap. From 0.2% it is behind, by 8% there, 14% at 0.3% and about a fifth to a quarter from 0.4% on. Against plain matching the network is ahead up to 0.6%, where the gap has shrunk to 2% and four of the five seeds are ahead. At 0.8% it is behind by 4% and at 1% by 8%, in every seed. {{OWN-D5-250M}} The more noise, the further it falls behind.

**A finding we didn't plan for.** We had expected correlated matching to be at least as good as plain matching everywhere. At distance 5 it was, at every noise level we tried. At distance 3 and low noise it was worse. On 4 million runs at a noise level of 0.1%, with both decoders reading the same runs, plain matching failed in 0.075% (0.073% to 0.078%). Correlated matching failed in 0.113% (0.109% to 0.116%), about half as many failures again. At 0.3% it was still worse, 0.705% against 0.659%. From 0.4% upwards it was the better one. When we stored the other kind of value, it was again worse at 0.1%: 0.0986% against 0.0856%. {{OWN-CORR OWN-D3}}

We first suspected our script. Two checks say it isn't at fault. The first: the simulator's error model for this circuit lists 219 error mechanisms. We applied each of them alone and decoded it; at distance 3 a decoder should survive every one. Plain matching corrects all 219. Correlated matching, in the version we used (PyMatching 2.4.0, called the way its documentation says), gets 6 of them wrong. Together those six happen with a chance of 0.4 times the noise level. At a noise level of 0.1% that is 0.04%, about the gap we measured, 0.037%. With the other kind of stored value it gets 4 of 221 wrong, 0.27 times the noise level. The second check: a second script, written by a second AI agent that had not seen the first script, found the same six. {{OWN-CORR}}

At distances 5 and 7 no single error defeats correlated matching. At distance 5 we also tried every pair of errors: it fails on 1,253 of 1,405,326 pairs, about one pair in 1,100, and plain matching on none. That pair check was not repeated independently. {{OWN-CORR}} A search turned up no report of any of this, and we haven't traced the cause inside the library. So we state it for our setup only: this circuit, three rounds at distance 3, this version. At distance 3 and low noise it makes plain matching the harder comparison. That is why we always show both.

**Time.** Training ran on a GPU at Kaggle: about 50 seconds per seed at distance 3, about 100 seconds at distance 5 for 66 million examples, and a little over six minutes for 250 million. On a laptop the long run would take about two hours per seed, nearly twenty times as long: single training steps took about 90 to 130 thousandths of a second when we timed them. {{OWN-TIME}}

Decoding we timed only roughly: on one laptop core, with an untrained network of the same size, as an average over a large batch, and on a machine that has to emulate the processor our software was built for. There the network took between 14 and 27 millionths of a second per run whatever the noise, while matching got faster as errors got rarer. At distance 3 the network was about 20 times slower than plain matching (19.5 against 1.0). At distance 5 it was nearly twice as slow at a noise level of 0.5% (13.6 against 7.7) and 13 times as slow at 0.1% (20.6 against 1.55). {{OWN-TIME}} None of this is a live decoder on its own hardware. So we don't set it against the chip's clock from section 8.

**What these runs don't cover.** All of it is simulation with the same noise on every operation, and a real chip's errors aren't like that (section 6). Matching was handed the exact error model, and we stored only one of the two kinds of value a logical qubit can hold. {{OWN-D3 OWN-D5 OWN-D5-250M OWN-TIME}} The list at the end gives the rest.

**A separate replication.** We also had the main result tested by code that shares nothing with ours. A second AI agent got only a description of the claim, wrote its own script and network, and ran it on Kaggle. At distance 3 its networks failed in 1.46% to 1.48% of runs, against 1.71% to 1.73% for plain matching and 1.66% to 1.67% for correlated matching: the same order and nearly the same numbers as ours, also at our network size. At distance 5, after about 250 million examples, its network also ended between the two matchers, closer to correlated matching than ours: 1.15% and 1.16% against 1.09%. But that network is about twenty times larger, with 3.3 million adjustable numbers. At our size its script reached only 1.51%, behind plain matching, where ours reached 1.33%. It ran two seeds for each larger network and one at our size, and did not test the finding about correlated matching. {{OWN-REPL}} So the order of the three decoders held up. How far a small network gets depends on its training.

Before starting we wrote down what would make us drop the idea: if the network needs so many more examples at distance 5 that a laptop can't train it, or if it loses on real recordings, then for a group like ours a neural decoder isn't worth its cost. We now have numbers for the first. On a laptop the long run would take about two hours per seed, so that reason doesn't apply. But it took about 250 million examples to pass plain matching, and correlated matching, which needs no training and is free to download, stayed about a fifth ahead. {{OWN-D3 OWN-D5 OWN-D5-250M}} Whether that is worth it is less clear. The second, real recordings, is still open.

## 10. What this doesn't show

A decoder doesn't speed anything up. It lets a calculation run longer before an error ruins it, and a better decoder means fewer qubits for the same reliability.

Our numbers come from small grids and from a network far smaller than Google's. They say something about how the cost of learning grows. About larger grids they say nothing.

## What we could not show

- How any of our decoders would do on a real chip. Every run of ours is a simulation with uniform noise.
- How many examples our network needs to reach correlated matching at distance 5, and whether it learns distance 7 at all.
- Whether a network trained in simulation still works on Google's recordings.
- What a neural decoder costs in time against the chip's clock.
- Why correlated matching gets those single errors and pairs wrong, and whether another version of the library does too.
- Whether the network in the December 2025 paper keeps pace as reported. We can't run it, and it hasn't been peer-reviewed.

## Words used

| Word | Meaning here | First used |
| --- | --- | --- |
| Logical qubit | One qubit's worth of information, stored in the way many real qubits relate to each other | Section 2 |
| Distance | The size of the grid; also the number of links a line needs to cross it | Sections 2 and 5 |
| Threshold | The error rate below which a bigger grid protects better | Section 2 |
| Check | A question asked of two or four neighbouring qubits through a helper: is the number of errors among you even or odd? | Section 3 |
| Fires | A check gives a different answer than in the round before | Section 3 |
| Decoder | The classical program that works out from the fired checks which errors happened | Section 5 |
| Logical error | Real errors and the decoder's correction together make a line across the grid: the stored value changes and no check fires | Section 5 |
| Matching | The standard decoder: it joins fired checks to each other or to the edge along the shortest rows | Section 6 |
| Λ (lambda) | The factor by which the logical error rate shrinks when the distance grows by two | Section 7 |
| Noise level | In our simulation, the chance that any one operation goes wrong | Section 9 |
| Correlated matching | Matching in two passes, where the first pass informs the second | Section 9 |

## How this was made

Every figure from outside our group comes from a source one of us opened: published papers, preprints and data records. Each passage carries its sources; they open when you select a mark. Where only an abstract was read, and where a paper has not been peer-reviewed, the source entry says so. Our own results come from code and data in our repository, which is private for now. The figures are drawn from the result files; the numbers in the text were checked against them. A blink is taken as a tenth of a second, a rule of thumb. The second script that checked the correlated-matching finding was written by an AI agent, and so were the reviews: an earlier draft was read by four independent AI readers, in the roles of a student, a reader from outside the field, an examiner and a reviewer of voice, and a later one by an AI fact checker, and their lists were worked in. No person outside the group has read it yet. The opening drawing was made by an image model from our own line reference and from photographs of real hardware. Research, code, drafts and reviews were done with AI assistants under our direction. We are responsible for the question and every claim.
