# Quantum Computing seminar proposal

11 December 2026, on Zoom. Two static slides and about 80–90 seconds with the
pause to change slides. Give the proposal once per group.

Serve the repository root and open `talks/quantum/proposal/`. In Edge, print to
PDF with the page's custom size, no headers or footers, and background graphics
enabled. The result should contain exactly two 16:9 pages. The result graphic
uses the article's simulation data. The cover reuses the
[credited drawing](../art/SOURCES.md) from the full talk.

## 1. When is it worth training a decoder?

A quantum chip tells us which checks fired. It leaves an ordinary computer to
work out what went wrong. On the same recordings from Google’s chip, a neural
network left fewer logical errors than matching. It ran afterwards. The matching
decoder that ran live was a faster version. We wanted a smaller question we
could test ourselves. How much training does a small network need before it
beats the decoders we can already run?

## 2. Training put our network between the two matchers

We tested a distance-five surface-code memory in simulation. At half a percent
noise, our longer run used about 250 million examples. Its error rate was
1.33%. Plain matching gave 1.41% and correlated matching gave 1.09%. So the
network passed one baseline and the stronger one still had the better result.
In January we want to show what matching does, why a network can help, and what
we’d need to check before trusting a result on real chip recordings.
