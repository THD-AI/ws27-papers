# 5 · A check reports whether the number of errors next to it is even or odd

Once every round, each helper interacts with its neighbours and is measured. One bit comes out. It doesn't say what state any neighbour is in, only whether the number of errors among them is even or odd. So measuring it leaves the stored information alone. These are the checks. Tinted ones ask about flips, open ones about phase errors. An error that is both at once is called Y.

One flip in the middle: the two flip-checks beside it fire. The flip itself is never seen. A line of two flips: the check between them sees two, an even number, and stays quiet. Only the end fires, and at the edge a line can end without firing anything.

**A check reports whether the number of errors next to it is even or odd.**
