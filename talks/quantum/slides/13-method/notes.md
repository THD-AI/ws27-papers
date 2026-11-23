# 13 · We trained a small network in simulation and wrote down our stop rule first

We measured what a small network costs to train. We simulated the surface code with Stim, with the same chance of error on every operation, trained at seven noise levels and tested at half a percent. The network is plain: three layers of 256 units, and it sees only which checks fired. We compared it with plain matching and with correlated matching, which runs the puzzle in two passes. Both got the exact error model, so the comparison leans towards matching. At distance 3 a lookup table gives our estimate of the best possible. And before we started, we wrote down when we would drop the idea.

**We trained a small network in simulation and wrote down our stop rule first.**
