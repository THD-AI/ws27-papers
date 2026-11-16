// The any-device matrix, used by tools/shots.mjs when called with --matrix.
//
// For 17 window sizes from 320×568 to 2560×1440, portrait and landscape, it
// writes shots into .shots/<slug>/matrix/ (top, first and last passage of
// every scene, one wide and one column figure, a table, a source popover)
// and runs script checks: sideways overflow, elements wider than the window,
// lettering under 11 px inside figures, room for text under a pinned figure,
// characters per line. The results are the table in .shots/<slug>/matrix.md.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const SIZES = [
  [320, 568], [360, 740], [390, 844], [430, 932],          // phones, portrait
  [568, 320], [740, 360], [844, 390], [932, 430],          // phones, landscape
  [768, 1024], [1024, 768], [834, 1194], [1194, 834],      // tablets, both ways
  [1280, 720], [1366, 768], [1440, 900], [1920, 1080], [2560, 1440],
];

// Runs inside the page. Returns what the summary table needs.
async function checkPage() {
  const vw = document.documentElement.clientWidth;
  const vh = innerHeight;
  const res = {};
  const frame = () => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));

  const pop = document.querySelector('.src-pop')?.getBoundingClientRect();
  res.popover = pop ? (pop.left >= 0 && pop.right <= vw + 0.5 ? 'ok' : 'leaves the window') : 'none';
  document.body.click();

  res.mode = matchMedia('(min-width: 1000px) and (min-height: 560px), (min-width: 640px) and (max-height: 559.98px)').matches ? 'side'
    : matchMedia('(max-width: 999.98px) and (min-height: 560px)').matches ? 'top' : 'sequence';

  // Hero: where it is, and whether the drawing itself (not the empty paper
  // of the image file) is inside the window and clear of the title and deck.
  scrollTo(0, 0);
  await frame();
  const hero = document.querySelector('.hero');
  res.hero = !hero ? 'none' : getComputedStyle(hero).position === 'absolute' ? 'beside' : 'above';
  res.heroNote = '';
  if (hero) {
    const r = hero.getBoundingClientRect();
    const v = (n) => parseFloat(hero.style.getPropertyValue(n)) || 0;
    const left = r.left + v('--pl') * r.width;
    const right = r.right - v('--pr') * r.width;
    const top = r.top + v('--pt') * r.height;
    const bottom = r.bottom - v('--pb') * r.height;
    const notes = [];
    if (left < -1 || right > vw + 1) notes.push(`drawing cut: ${Math.round(left)}..${Math.round(right)} of ${vw}`);
    const over = (el) => {
      const b = el.getBoundingClientRect();
      return left < b.right - 2 && right > b.left + 2 && top < b.bottom - 2 && bottom > b.top + 2;
    };
    // Measure the text itself, not its box: a range around the words.
    for (const sel of ['.title-block h1', '.deck']) {
      const range = document.createRange();
      range.selectNodeContents(document.querySelector(sel));
      if ([...range.getClientRects()].some((b) => left < b.right - 2 && right > b.left + 2 && top < b.bottom - 2 && bottom > b.top + 2)) {
        notes.push(`drawing under ${sel === '.deck' ? 'the deck' : 'the title'}`);
      }
    }
    void over;
    res.heroNote = notes.join('; ');
    res.heroW = Math.round(right - left);
  }
  res.margin = document.querySelector('.rail')?.getClientRects().length ? 'column' : 'stills';

  // Characters per line in the text column.
  const p = [...document.querySelectorAll('main.body > p')].find((el) => el.textContent.length > 300);
  const cs = getComputedStyle(p);
  const c = document.createElement('canvas').getContext('2d');
  c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const text = p.textContent;
  res.chars = Math.round(p.getBoundingClientRect().width / (c.measureText(text).width / text.length));
  res.bodyPx = parseFloat(cs.fontSize);
  const lh = parseFloat(cs.lineHeight);

  res.overflow = document.documentElement.scrollWidth - vw;

  // Every figure is brought into view once, so that figures in the text are
  // complete and everything displayed is mounted.
  const figs = [...document.querySelectorAll('[data-fig]')].filter((el) => el.getClientRects().length);
  for (const el of figs) { el.scrollIntoView({ block: 'center' }); await frame(); }
  await new Promise((ok) => setTimeout(ok, 200));

  // Elements that reach outside the window. The hero's empty paper and what
  // is inside a frame that scrolls on its own do not count.
  const wide = [];
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('.hero, .table-frame, .skip') || (el.closest('svg') && el.tagName !== 'svg')) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    if (r.right > vw + 1 || r.left < -1) wide.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} ${Math.round(r.left)}..${Math.round(r.right)}`);
  }

  // Lettering inside figures as it is shown: font size × the drawing's scale.
  const small = {};
  const layouts = {};
  for (const el of figs) {
    const svg = el.querySelector('svg');
    if (!svg || !svg.viewBox.baseVal.width) continue;
    const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
    let min = Infinity;
    for (const t of svg.querySelectorAll('text')) {
      if (!t.textContent.trim() || !t.getClientRects().length) continue;
      const st = getComputedStyle(t);
      if (st.visibility === 'hidden' || st.display === 'none') continue;
      // an element faded out by an ancestor is not lettering the reader sees
      let seen = true;
      for (let a = t; a && a !== svg; a = a.parentElement) {
        if (parseFloat(getComputedStyle(a).opacity) < 0.05) { seen = false; break; }
      }
      if (seen) min = Math.min(min, parseFloat(st.fontSize) * scale);
    }
    const role = el.dataset.role;
    const id = el.dataset.fig + (role === 'still' ? ' (still)' : role === 'margin' ? ' (margin)' : role === 'seq' ? ' (sequence)' : '');
    layouts[id] = `${el.dataset.mounted || '?'} ${Math.round(svg.getBoundingClientRect().width)}px ×${scale.toFixed(2)}`;
    if (min < 10.95) small[id] = Math.min(small[id] ?? Infinity, Math.round(min * 10) / 10);
    if (svg.getBoundingClientRect().height > vh && role === 'scene') wide.push(`pinned figure ${el.dataset.fig} taller than the window`);
  }
  res.wide = [...new Set(wide)];
  res.small = small;
  res.layouts = layouts;

  // Room for text under a figure pinned on top, in lines of body text.
  res.lines = [];
  if (res.mode === 'top') {
    for (const stage of document.querySelectorAll('.scene-stage')) {
      res.lines.push(Math.floor(((vh - stage.getBoundingClientRect().height) / lh) * 10) / 10);
    }
  }
  res.toc = Math.round(document.querySelector('.toc a').getBoundingClientRect().height);
  return res;
}

// open, settle, scrollTo and log are the helpers of tools/shots.mjs.
export async function runMatrix({ slug, out, open, settle, scrollTo, log }) {
  const dir = join(out, 'matrix');
  const rows = [];

  for (const [w, h] of SIZES) {
    const touch = Math.max(w, h) <= 1200;
    const page = await open({ width: w, height: h, isMobile: touch, hasTouch: touch });
    const tag = `${w}x${h}`;
    const snap = (name) => page.screenshot({ path: join(dir, `${tag}-${name}.png`) });
    await settle(page, 300);
    await snap('top');

    // First and last passage of every scene, placed where its step is complete.
    const scenes = await page.evaluate(() => [...document.querySelectorAll('.scene')].map((s) => s.dataset.scene));
    for (let i = 0; i < scenes.length; i++) {
      for (const which of ['first', 'last']) {
        await page.evaluate((si, wh) => {
          const scene = document.querySelectorAll('.scene')[si];
          const ps = scene.querySelectorAll('.passage');
          const p = wh === 'first' ? ps[0] : ps[ps.length - 1];
          const stage = scene.querySelector('.scene-stage');
          const top = matchMedia('(max-width: 999.98px) and (min-height: 560px)').matches;
          const seq = matchMedia('(max-height: 559.98px)').matches;
          // sequence: the still that precedes the passage goes to the top of the window
          const target = seq ? p.previousElementSibling : p;
          const offset = seq ? 8 : top ? stage.getBoundingClientRect().height + 18 : innerHeight * 0.24;
          scrollTo(0, Math.max(0, target.getBoundingClientRect().top + scrollY - offset));
        }, i, which);
        await settle(page, 380);
        await snap(`scene-${scenes[i]}-${which}`);
      }
    }
    for (const [sel, name] of [['.fig-wide', 'figure-wide'], ['.fig-column', 'figure-column'], ['.table-frame', 'table']]) {
      if (await scrollTo(page, sel, 0, 0.06)) await snap(name);
    }
    if (await scrollTo(page, '.src-mark', 3, 0.4)) {
      await page.evaluate(() => document.querySelectorAll('.src-mark')[3].click());
      await settle(page, 120);
      await snap('popover');
    }

    const check = await page.evaluate(checkPage);
    rows.push({ size: tag, ...check });
    await page.close();
    console.log(`${tag}: scenes ${check.mode}, hero ${check.hero}, ${check.chars} chars, overflow ${check.overflow}, `
      + `${check.wide.length} too wide, small text in ${Object.keys(check.small).length} figures`);
  }

  const cell = (s) => String(s).replace(/\|/g, '/');
  const md = [
    `# Any-device matrix: ${slug}`,
    '',
    `Written by \`node tools/shots.mjs ${slug} --matrix\`. The shots are in \`matrix/\`.`,
    '',
    '| Window | Scenes | Hero | Margin scene | Body px | Chars per line | Sideways overflow | Wider than window | Figure text under 11 px (smallest, px) | Lines under a pinned figure | Section list row px | Popover |',
    '| --- | --- | --- | --- | ---: | ---: | --- | --- | --- | --- | ---: | --- |',
    ...rows.map((r) => `| ${[
      r.size, r.mode, `${r.hero}${r.heroW ? ` ${r.heroW}px` : ''}${r.heroNote ? ` (${r.heroNote})` : ''}`, r.margin,
      r.bodyPx.toFixed(1), r.chars,
      r.overflow > 0 ? `${r.overflow}px` : 'none',
      r.wide.length ? r.wide.slice(0, 4).join('; ') : 'none',
      Object.keys(r.small).length ? Object.entries(r.small).map(([k, v]) => `${k} ${v}`).join(', ') : 'none',
      r.lines.length ? r.lines.join(', ') : '–',
      r.toc, r.popover,
    ].map(cell).join(' | ')} |`),
    '',
    '## Layout each figure got (layout, width shown, scale of the drawing)',
    '',
    ...rows.map((r) => `- **${r.size}**: ${Object.entries(r.layouts).filter(([k]) => !k.includes('(still)'))
      .map(([k, v]) => `${k} ${v}`).join('; ')}`),
    '',
    '## Console',
    '',
    log.length ? log.map((l) => `- ${l}`).join('\n') : 'No console errors, warnings or failed requests.',
    '',
  ].join('\n');
  writeFileSync(join(out, 'matrix.md'), md);
  console.log(`matrix: ${rows.length} sizes -> .shots/${slug}/matrix.md`);
  return rows;
}
