// A clock the tools can drive: frame sequences and videos of steps that play
// over time (lib/article.js), however long a screenshot takes.
//
//   await page.evaluateOnNewDocument(clockScript);   // before page.goto
//   await page.evaluate(() => __clock.start());      // the tool drives frames from now on
//   await page.evaluate((y, ms) => __clock.scroll(y, ms), y, 1000 / 30);   // scroll, then one frame of ms
//   await page.evaluate(() => __clock.stop());       // back to the browser's own frames
//
// Until start() the page runs on the browser's frames. After it, every
// requestAnimationFrame callback waits for tick(), which runs them all with
// a timestamp that advances by exactly the given milliseconds: the engine's
// players (and a figure's idle motion) see that much time pass. Used by
// tools/timing.mjs --video and tools/motion.mjs --frames; the gates that
// measure real time (tools/timing.mjs, tools/motion.mjs) use the browser's
// own clock.

export function clockScript() {
  const real = window.requestAnimationFrame.bind(window);
  const realCancel = window.cancelAnimationFrame.bind(window);
  const c = { manual: false, t: 0, q: new Map(), n: 1e9 };
  window.__clock = c;
  window.requestAnimationFrame = (cb) => {
    if (!c.manual) return real(cb);
    const id = ++c.n;
    c.q.set(id, cb);
    return id;
  };
  window.cancelAnimationFrame = (id) => { if (!c.q.delete(id)) realCancel(id); };
  c.start = () => { c.manual = true; c.t = performance.now(); };
  c.tick = (ms) => {
    c.t += ms;
    const q = [...c.q.values()];
    c.q.clear();
    for (const cb of q) { try { cb(c.t); } catch (err) { console.error(err); } }
  };
  // scroll to y and run one frame: the scroll event is sent at once, so the
  // engine sees the new position in this frame
  c.scroll = (y, ms) => {
    if (y !== null && y !== undefined && Math.round(y) !== Math.round(scrollY)) { scrollTo(0, y); dispatchEvent(new Event('scroll')); }
    c.tick(ms);
  };
  c.stop = () => {
    c.manual = false;
    const q = [...c.q.values()];
    c.q.clear();
    for (const cb of q) real(cb);
  };
}

// Waits (in the page, on the browser's frames) until no step is playing.
export function settledInPage(max = 8000) {
  return new Promise((ok) => {
    const t0 = performance.now();
    const wait = () => (!document.documentElement.dataset.moving || performance.now() - t0 > max ? ok() : requestAnimationFrame(wait));
    requestAnimationFrame(() => requestAnimationFrame(wait));
  });
}
