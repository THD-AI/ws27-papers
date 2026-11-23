# Questions we expect, and short answers

For the question round, 10 points. Each answer uses only the article's facts; the backup slide to open is in brackets. Answer in two or three sentences, then stop.

## On the topic

**Why this topic?**
In this course it is where machine learning works for quantum hardware. A neural-network decoder is classical machine learning, so it is our field, and Google's 2024 result shows it decides real error rates.

**Is this quantum machine learning?**
No. The network is ordinary classical software that reads the chip's checks. It gives no quantum speed-up (slide 15).

**What do your results mean for the four properties?**
Performance: at distance 5 ours passed plain matching after about 250 million examples, and correlated matching stayed about a fifth ahead. Speed-up: none. Relevance: on Google's data the reader alone moved Λ from 2.04 to 2.14. Availability: correlated matching is free; a network that keeps pace live is only claimed so far (slide 15).

## On the basics

**If a state can't be copied, how does a code add redundancy?**
It stores the value in how several qubits relate, never in one of them; no copy exists anywhere (slide 3).

**How does a check measure without destroying the state?** (B1)
A helper starts at 0, collects the parity of its two or four neighbours through controlled-NOTs and is measured. Only even or odd comes out, the same whatever is stored; the helper is reset for the next round.

**Where are decoherence and the phase-flip channel in your noise model?** (B3)
Every operation in our simulation goes wrong with the same chance p: a flip, a phase error or both. The phase-flip channel is the phase-error part of that.

**What is the threshold?**
An error rate per qubit below which a bigger grid protects better. Google was barely there in 2023 and clearly below it in 2024 (slide 2).

## On the method

**A lookup table reaches 1.47% at distance 3. Why a network at all?** (B2)
The table is our estimate of the best possible at distance 3, and the network's 1.48% is barely above it. The table needs an entry for every pattern of fired checks. How the network's cost grows with the grid is what we measured: 6.6 to 9.3 million examples at distance 3, about 250 million at distance 5.

**You gave matching the exact error model. Isn't that unfair?**
It is unfair to the network: matching won't have the exact model on a chip. So the comparison leans towards matching.

**Simulation or real data?** (B8)
Only simulation. The test on Google's public recordings is the second half of our stop rule, and it is still open.

**Is the correlated-matching problem a library bug or your mistake?** (B4)
We don't know the cause. Plain matching corrects all 219 single error mechanisms; correlated matching gets 6 wrong in our setup (PyMatching 2.4.0, called as documented), and a second script written separately found the same six. We state it for our setup only and don't count the distance-3 lead over correlated matching.

**How sure is "250 million"?**
It is a training budget, not a measured minimum. The curves first fell below plain matching between 210 and 250 million (learning.json, panel d5-250m), and the falling learning rate at the end of each run helps (slide 14).

## On speed

**Can the network keep up?**
Google's paper quotes 24 millionths of a second per round for its network, against a round every 1.1 (slide 12). A December 2025 preprint claims under one per round, not yet reviewed (B7).

**How fast is yours?** (B2)
Roughly 14 to 27 millionths of a second per run on one laptop core, emulated, with an untrained network of the same size. That isn't a live decoder, so we don't set it against the chip's clock.

## On the result

**Is the difference between 2.04 and 2.14 big?**
At distance 7 it is 171 against 143 errors per 100,000 rounds, about one in six fewer, from the same recordings. Λ decides how many qubits a halving costs: near 2, one more halving costs 64 qubits.
