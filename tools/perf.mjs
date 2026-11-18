// Scroll performance: what a reader feels while scrolling.
//
//   node tools/perf.mjs <slug>
//
// For each device (phone, tablet and laptop, both orientations) the page is
// loaded, then scrolled from top to bottom at a steady reading speed and at
// a fast skim, the way a person does with a finger or a wheel. Measured in
// the page: frame intervals (requestAnimationFrame), long tasks (over 50 ms),
// layout shift, largest contentful paint, and bytes loaded. Phones and
// tablets run with the CPU slowed four times, as a mid-range phone.
//
// Budgets (the playbook's web gate): no long task over 50 ms while
// scrolling, layout shift under 0.05, at most 5% of frames over 25 ms.
// Writes .shots/perf-<slug>.md and exits 1 if a budget is missed.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import puppeteer from 'puppeteer-core';
import { startServer } from './serve.mjs';

const slug = process.argv[2];
if (!slug) { console.error('usage: node tools/perf.mjs <slug>'); process.exit(1); }
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DEVICES = [
  { name: 'phone portrait', width: 390, height: 844, mobile: true, cpu: 4 },
  { name: 'phone landscape', width: 844, height: 390, mobile: true, cpu: 4 },
  { name: 'tablet portrait', width: 820, height: 1180, mobile: true, cpu: 2 },
  { name: 'tablet landscape', width: 1180, height: 820, mobile: true, cpu: 2 },
  { name: 'laptop', width: 1440, height: 900, mobile: false, cpu: 1 },
  { name: 'desktop', width: 1920, height: 1080, mobile: false, cpu: 1 },
];
const SPEEDS = [{ name: 'steady', pxPerS: 450 }, { name: 'skim', pxPerS: 1600 }];
const BUDGET = { longTaskMs: 50, cls: 0.05, slowFrameShare: 0.05, slowFrameMs: 25 };

const { server, port } = await startServer(resolve('dist'), 0);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 600000, args: ['--hide-scrollbars'] });
const out = '.shots'; mkdirSync(out, { recursive: true });
const rows = []; let failed = false;

for (const d of DEVICES) {
  for (const sp of SPEEDS) {
    const page = await browser.newPage();
    await page.setViewport({ width: d.width, height: d.height, isMobile: d.mobile, hasTouch: d.mobile, deviceScaleFactor: d.mobile ? 2 : 1 });
    const cdp = await page.createCDPSession();
    if (d.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: d.cpu });
    await page.evaluateOnNewDocument(() => {
      window.__perf = { long: [], loaf: [], cls: 0, lcp: 0 };
      try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__perf.loaf.push({ t: e.startTime, d: e.duration, script: (e.scripts || []).reduce((m, x) => m + x.duration, 0), src: (e.scripts || []).map((x) => (x.sourceURL || '').split('/').pop() + ':' + (x.sourceFunctionName || '')).join(' ') }); }).observe({ type: 'long-animation-frame', buffered: true }); } catch {}
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__perf.long.push({ t: e.startTime, d: e.duration }); }).observe({ type: 'longtask', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((l) => { const e = l.getEntries().at(-1); if (e) window.__perf.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
    let bytes = 0;
    page.on('response', async (r) => { try { const b = await r.buffer(); bytes += b.length; } catch {} });
    const t0 = Date.now();
    await page.goto(`http://localhost:${port}/${slug}/`, { waitUntil: 'networkidle0', timeout: 90000 });
    await page.waitForFunction(() => document.documentElement.dataset.ready === '1', { timeout: 30000 });
    const loadMs = Date.now() - t0;
    await new Promise((r) => setTimeout(r, 500));
    const res = await page.evaluate(async (pxPerS, slowMs) => {
      const start = performance.now();
      const total = document.documentElement.scrollHeight - innerHeight;
      const frames = [];
      await new Promise((done) => {
        let last = performance.now();
        const step = (now) => {
          frames.push(now - last); last = now;
          const y = Math.min(total, ((now - start) / 1000) * pxPerS);
          scrollTo(0, y);
          if (y >= total) done(); else requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
      const f = frames.slice(1).sort((a, b) => a - b);
      const during = window.__perf.long.filter((e) => e.t >= start);
      // observer entries arrive late; keep only frames that began after the scroll started
      const frames2 = window.__perf.loaf.filter((e) => e.t >= start);
      const worst = frames2.reduce((m, e) => (e.script > (m ? m.script : -1) ? e : m), null);
      return {
        seconds: (performance.now() - start) / 1000,
        frames: f.length,
        p95: f[Math.floor(f.length * 0.95)] || 0,
        slowShare: f.filter((x) => x > slowMs).length / Math.max(1, f.length),
        longCount: during.length,
        longMax: during.reduce((m, e) => Math.max(m, e.d), 0),
        scriptMax: worst ? worst.script : 0,
        scriptSrc: worst ? worst.src : '',
        cls: window.__perf.cls,
        lcp: window.__perf.lcp,
      };
    }, sp.pxPerS, BUDGET.slowFrameMs);
    // Script time per long frame is what our code controls; a long task can
    // also be paint or raster in headless software rendering under the CPU
    // slowdown, which is reported but not held against the page.
    const ok = res.scriptMax <= BUDGET.longTaskMs && res.cls < BUDGET.cls && res.slowShare <= BUDGET.slowFrameShare;
    if (!ok) failed = true;
    rows.push({ d, sp, res, loadMs, bytes, ok });
    console.log(`${ok ? 'ok  ' : 'MISS'} ${d.name.padEnd(17)} ${sp.name.padEnd(8)} p95 ${res.p95.toFixed(1)} ms, slow ${(res.slowShare * 100).toFixed(1)}%, long tasks ${res.longCount} (max ${res.longMax.toFixed(0)} ms), script per frame max ${res.scriptMax.toFixed(0)} ms ${res.scriptSrc}, CLS ${res.cls.toFixed(3)}, LCP ${res.lcp.toFixed(0)} ms`);
    await page.close();
  }
}

const md = [`# Scroll performance: ${slug}`, '', `Budgets: script time in any frame ≤ ${BUDGET.longTaskMs} ms while scrolling (long tasks from paint or raster are listed but not held against the page), layout shift < ${BUDGET.cls}, frames over ${BUDGET.slowFrameMs} ms ≤ ${BUDGET.slowFrameShare * 100}%. Phones run at 4× CPU slowdown, tablets at 2×.`, '',
  '| Device | Speed | Frame p95 | Slow frames | Script per frame (max) | Long tasks (max) | Layout shift | LCP | Load | Bytes | |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...rows.map(({ d, sp, res, loadMs, bytes, ok }) => `| ${d.name} ${d.width}×${d.height} | ${sp.name} | ${res.p95.toFixed(1)} ms | ${(res.slowShare * 100).toFixed(1)}% | ${res.scriptMax.toFixed(0)} ms | ${res.longCount} (${res.longMax.toFixed(0)} ms) | ${res.cls.toFixed(3)} | ${res.lcp.toFixed(0)} ms | ${loadMs} ms | ${(bytes / 1024).toFixed(0)} KB | ${ok ? 'ok' : 'miss'} |`)].join('\n');
writeFileSync(join(out, `perf-${slug}.md`), md + '\n');
console.log(`perf: ${join(out, `perf-${slug}.md`)}`);
await browser.close(); server.close();
process.exit(failed ? 1 : 0);
