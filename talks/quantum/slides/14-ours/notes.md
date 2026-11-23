# 14 · Our distance-5 network finished between the two matchers

At distance 3 the network beat plain matching early. We set aside its lead over correlated matching because that decoder missed six single errors in this setup (backup 4).

At distance 5, all five runs with 66 million examples finished behind both matchers. We started over with a budget of about 250 million examples and a longer learning-rate schedule. The band shows how the results varied across seeds. At half a percent noise, the network failed in 1.33 percent of runs. Plain matching failed in 1.41 percent. Correlated matching did best, at 1.09. A smaller budget might have been enough.

**Our distance-5 network finished between the two matchers.**
