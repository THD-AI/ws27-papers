# Speaker notes

What the slides no longer say, so the speakers do. One field term per page, said once, out loud. Page numbers are the 18-page deck.

| Page | Say | The field's word |
|---|---|---|
| 2 | Google, December 2024. The headline was speed: under five minutes against 10 septillion years, a benchmark with no known use. The errors are counted in the stored value, per 100,000 rounds of checks, read by matching, Google's standard decoder. | error suppression |
| 3 | The map: the chip asks its checks every round, each round gives a frame of hints, an ordinary computer reads them and decides the fix. Everything after this is about the right half. | decoder |
| 4 | Same chip, same data; only the decoder changed. 143 is the number in the paper's abstract. The network is of AlphaQubit's design, trained on simulations, then on the chip's data. | neural decoder |
| 5 | The estimates for breaking today's encryption assume about 1 slip in 1,000 and two to three billion costly steps. Without error correction, such hardware cannot finish. | physical error rate |
| 6 | Measuring a qubit destroys the mix. So the chip never measures the qubits that store; it measures checks between them. The flip shows up, and nobody looked at a qubit. The same idea as the parity bits in ECC memory. On the chip, a check asks four neighbours at once: even, or odd? | stabilizer measurement |
| 7 | a and b: how much of each; physicists write a&#124;0⟩ + b&#124;1⟩. Measuring 0 or 1 can't see a phase error, but it changes what a calculation gives. From here on, X is a flip and Z a phase error. | Pauli errors |
| 8 | Distance: the side of the grid; that many flips in a line change the value unnoticed. Willow's three grids, 17, 49 and 97 qubits. | surface code, threshold |
| 9 | 9 storing qubits, 8 checks. Shaded checks ask about flips, open ones about phase errors; a flip doesn't move the phase checks. | detection event |
| 10 | Nothing has read these hints yet. The frame is simulated to fire as often as Google's chip, at distance 7. | syndrome |
| 11 | Three of five, more than half, fool the decoder. The decoder adds the shortest fix; together they cross the grid, so the value changed and no check fires. | logical error |
| 12 | Left: what matching picks; right: the likelier answer, from the same fired checks. 5% error per qubit, set high so the effect can be counted; the checks are taken as never wrong. X a flip, Z a phase error, Y both at once; white marks are a decoder's guess. | maximum likelihood |
| 13 | A better decoder buys part of what a bigger grid buys, with no new qubits. The distance-9 number is our estimate: 171 ÷ 2.04. | error suppression factor |
| 14 | Google's 2024 network, the one behind the 143. Three frames later about 62 are waiting. So both 171 and 143 were read afterwards; a simpler matching ran live on a 72-qubit chip and kept pace. Faster networks are claimed in a preprint, not yet reviewed. | backlog |
| 15 | Our own runs: a small three-layer network, distance 5, noise 0.5%. Learning beat plain matching, not the free one; correlated matching is free to download and still about a fifth ahead. Why try at all: a network can learn a real chip's quirks, and that is still untested. | neural decoder |
| 16 | Distance 3 and 5, the same noise on every operation. | circuit-level noise |
| 17 | The goal is one answer per round, in time. | real-time decoding |
| 18 | The open question, then questions. | |
