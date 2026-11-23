# 5 · A check fires when its answer changes

Once every round, each helper interacts with its neighbours and is measured. One bit comes out. It reports the parity of the neighbours together. In this example a check that detects flips changes its answer for an odd number of flips. We compare its answer with the previous round. If it changed, that's a detection event: the check fired. Tinted ones ask about flips, open ones about phase errors. An error that is both at once is called Y.

One flip in the middle: the two flip-checks beside it fire. The flip itself is never seen. A line of two flips: the check between them sees two, an even number, and stays quiet. Only the end fires, and at the edge a line can end without firing anything.

**A check fires when its answer changes.**
