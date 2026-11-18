// Grid lab harness. lab.html?v=current,a,b&steps=0,3,5&layout=wide|tall&w=<px>
// renders each variant at each step (t = 1) in a grid: rows are variants.
const q = new URLSearchParams(location.search);
const SRC = { clock: '../clock.js', current: '../lattice.js', f2: '../lattice.js', g: './lattice-g.js', orig: './lattice-orig.js', a: './lattice-a.js', b: './lattice-b.js', c: './lattice-c.js', d: './lattice-d.js', e: './lattice-e.js', f: './lattice-f.js' };
const vs = (q.get('v') || 'current,a,b').split(',');
const steps = (q.get('steps') || '0,1,2,3,4,5').split(',').map(Number);
const layout = q.get('layout') === 'tall' ? 'tall' : 'wide';
const w = Number(q.get('w')) || (layout === 'tall' ? 360 : 860);
const lab = document.getElementById('lab');
lab.style.gridTemplateColumns = `repeat(${steps.length}, ${w}px)`;
const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

async function main() {
  await Promise.all(['italic 14px "Newsreader"', '14px "Newsreader"', '14px "Libre Franklin"', '500 14px "Libre Franklin"', '600 14px "Libre Franklin"', '14px "JetBrains Mono"', '500 14px "JetBrains Mono"'].map((f) => document.fonts.load(f).catch(() => null)));
  const dataL = await (await fetch('../../data/lattice.json')).json();
  const dataC = await (await fetch('../../data/clock.json')).json();
  const report = [];
  for (const v of vs) {
    const mod = await import(SRC[v]);
    const data = v === 'clock' ? dataC : dataL;
    for (const s of steps) {
      const cell = document.createElement('div'); cell.className = 'cell';
      if (q.get('bare') !== '1') { const hd = document.createElement('h2'); hd.textContent = `${v} · ${layout} · step ${s}`; cell.append(hd); }
      const frame = document.createElement('div'); frame.className = 'frame';
      frame.style.width = `${w}px`; frame.style.aspectRatio = String(mod.aspect[layout]);
      cell.append(frame); lab.append(cell);
      const h = mod.default(frame, { layout, print: false, reduced: true, data, css });
      h.set(s, 1);
      await new Promise((r) => requestAnimationFrame(r));
      // smallest visible lettering, in screen px
      const svg = frame.querySelector('svg'); const sc = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
      let min = 99;
      svg.querySelectorAll('text').forEach((t) => {
        for (let n = t; n && n !== svg; n = n.parentNode) if (n.style && n.style.display === 'none') return;
        min = Math.min(min, parseFloat(t.getAttribute('font-size')) * sc);
      });
      report.push(`${v} ${layout} step ${s}: frame ${w} x ${frame.getBoundingClientRect().height.toFixed(0)} px, smallest text ${min.toFixed(1)} px`);
    }
  }
  document.getElementById('audit').textContent = report.join('\n');
  window.__lab = { ready: true, report };
}
main().catch((e) => { document.getElementById('audit').textContent = e.stack; window.__lab = { ready: true, error: String(e.stack) }; });
