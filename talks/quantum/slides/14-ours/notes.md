# 14 · Ours passed plain matching at distance 5 only after about 250 million examples

At distance 3 the network beat plain matching early: 1.48 percent of runs wrong, against 1.72, barely above the lookup table. Its lead over correlated matching we don't count: in our setup that decoder fails on a few single errors, for a reason we haven't traced (backup 4).

One size up, after the same 66 million examples, it was behind in all five seeds. We trained again on nearly four times as many. After about 250 million it reached 1.33 percent, between plain matching at 1.41 and correlated matching at 1.09. The curves first fell below plain matching between 210 and 250 million examples, and the falling learning rate helps the end, so read it as a training budget and not as a measured minimum.

**Ours passed plain matching at distance 5 only after about 250 million examples.**
