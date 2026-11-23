# 8 · Errors plus a wrong correction can cross the grid without firing a single check

Most small mistakes in that guess are harmless. Here is the one that matters. Three real flips in one column fire a single check. Matching's cheapest explanation of that check is two flips below it. Corrected that way, errors and correction together make a line from edge to edge. Every check along it sees an even number, so nothing fires, and the stored value has changed. That silent failure is a logical error, and every decoder is measured by how often it happens.

**Errors plus a wrong correction can cross the grid without firing a single check.**
