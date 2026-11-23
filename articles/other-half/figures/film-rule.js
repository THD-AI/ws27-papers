// Which simulated rounds the film shows, by rule and not by eye, and where a
// simulated check sits on the article's grid. Pure functions, no drawing:
// used by figures/film.js, and by tools/other-half-data.mjs to light the same
// round in the margin scene (data/qubits.json, "lit_d7").
//
// The frames at rest after the film's quickening (start + beats .. + frames - 1)
// are the first stretch, after round 0, that lights about as many checks as the
// whole run does (within 10%); the frame held up is the one of them nearest
// that mean that has checks of both kinds.

export const BEATS = 8;     // beats in the film's step 0
export const FRAMES = 5;    // frames drawn on the strip

export function filmRounds(run, beats = BEATS, frames = FRAMES) {
  const mean = run.lit_per_frame_mean, last = run.frames.length - 1;
  const atRest = (s0) => Array.from({ length: frames }, (_, i) => s0 + beats + (frames - 1 - i));
  let start = 1;
  for (let s0 = 1; s0 + beats + frames <= last; s0++) {
    const m = atRest(s0).reduce((a, r) => a + run.frames[r].length, 0) / frames;
    if (Math.abs(m - mean) <= 0.1 * mean) { start = s0; break; }
  }
  const kinds = (r) => new Set(run.frames[r].map((id) => run.checks[id].kind)).size;
  const from = atRest(start).map((r, i) => ({ i, r, d: Math.abs(run.frames[r].length - mean) }))
    .filter((o) => kinds(o.r) === 2).sort((a, b) => a.d - b.d)[0]?.i ?? 1;
  const held = start + beats + (frames - 1 - from);
  return { start, from, held, last };
}

// A simulated check (Stim's coordinates of surface_code:rotated_memory_z) on
// the article's grid (shared.js surface(d)): Stim's y down is the row, its x
// runs the other way to the article's columns. Checked for all 48 checks at
// distance 7: every one lands on a check of the same kind (Z, on flips).
export const toGrid = (c, d) => ({ row: c.y / 2 - 1, col: d - 1 - c.x / 2, asks_about: c.kind === 'Z' ? 'flips' : 'phase errors' });
