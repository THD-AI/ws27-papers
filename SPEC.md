# Build specification

Two long-form articles by Alexander (Alex) Rudaev: one web page each, scroll-driven on screen, a two-column paper when printed. Static files, no framework, no bundler. Node 22 for the build, native ES modules in the browser.

The owner's bar, in his words: "not generic", "intuitive: people need to understand a visual immediately", "should not look made up", "at the level of a scientific research article", "needs to look like it was made by me", figures in the spirit of Processing: "scientific, simple, friendly". He likes scroll-driven storytelling. He rejects dark pages, fake hand-drawn filters, app-style badges and cards, generic tables and charts, and anything that reads as machine-made (one typeface everywhere, even strokes, perfect symmetry).

## Layout of the repository

```
SPEC.md
lib/build.mjs        builder: articles/<slug>/text.md -> dist/<slug>/index.html      (shell)
lib/article.css      page, type, tables, print                                          (shell)
lib/article.js       scroll engine, source marks, margin scenes                         (shell)
lib/fig.js           drawing helpers shared by all figures                              (figures)
tools/sources.mjs    builds articles/<slug>/sources.json from the research dossiers     (shell)
tools/shots.mjs      screenshots and PDF with puppeteer-core and the installed Chrome   (shell)
articles/<slug>/text.md, sources.json, data/*.json, figures/*.js, art/*.png
dist/                built site (ignored by git; published from the gh-pages branch later)
```

Slugs: `renovate` (Innovation) and `other-half` (Quantum).

## Text format (`text.md`)

Front matter: `title`, `deck`, `author`, `context`, `status`, `accent`. For search and sharing: `summary` (the meta description, under 160 characters), `date` (ISO), `keywords`, `card_alt` (the preview image's alt text), and optionally `draft: false` to allow indexing. `node tools/cards.mjs` writes the preview image to `art/card.png`. Then Markdown with these additions:

- `{{ID ID}}` at the end of a paragraph or list item: the ids of its sources in `sources.json`. Rendered as one small mark at the end of the passage. Selecting it opens the sources of that passage (title, publisher, link). In print the mark becomes bracketed numbers and a numbered list of sources is set at the end. Unknown ids fail the build.
- `:::scene <id>` … `:::` wraps passages that scroll beside one pinned figure. Inside, a line `@step n` sets the step shown while the following passages are in view. A line `@caption …` gives the caption used in print and on phones. `@step n screen` marks a passage for the screen only: it says what the drawing does at that step, and print leaves it out (the caption carries it there). `:::scene <id> screen` is a whole scene for the screen only: print leaves out its figure and passages, and it takes a figure number on screen only (the figures after it carry both numbers, each shown in its medium). Where the scene reads as a sequence of stills (phones held sideways, tablets held upright), a figure that exports `stills = [n]` with one step is shown once, at state n, after the first passage; with several steps, one still after the first passage of each step named; without the export, one before each step.
- `:::figure <id> <wide|column> [fold [summary]]` … `:::` a figure in the text flow; the block's text is its caption. With `fold` the drawing folds behind a switch on phones and wherever it is taller than the window, with the caption above the switch, closed and open (it never jumps below a drawing several windows long), for example `:::figure pairs wide fold Show the ten pairs` (closed it reads "Show the ten pairs", open "Hide the ten pairs"; without a summary, "Show figure n"). Opened by the reader, it is drawn whole at once, at the width of a wide figure (also in the appendix). Paper shows it whole. Where scenes stand beside their passages, a wide figure starts at the text column's left edge and reaches out to the right, as a scene does.
- `:::steps [print]` … `:::` a numbered list drawn as a path of steps. `:::steps print` sets it on paper only (on screen a `:::scene <id> screen` tells the same).
- `:::margin <id> <state>` sets the state of the small margin scene from this point on. `:::margin <id> end` is where its story ends: on screen the pinned figure fades out as this point reaches it and does not come back; nothing is drawn there, on screen or on paper.
- `@where <label>` on a line of its own sets the place the text is about (for example `United States · T-Mobile US`) from that point until the next `@where` or the next `##` heading. Rendered as a small mono kicker in the accent colour above the next block; inside a scene, above the first passage and wherever the place changes, and as a label at the top-left of the pinned figure that follows the active passage. Figures receive it as `ctx.where`.
- Tables are Markdown tables.

## Figure contract

Each figure is `articles/<slug>/figures/<id>.js`:

```js
export const steps = 5;                       // number of steps (1 for a plain figure)
export const aspect = { wide: 16 / 10, tall: 4 / 5 };
export default function mount(el, ctx) {      // el: empty container; build one <svg> in it
  // ctx = { layout: 'wide' | 'tall', print: boolean, reduced: boolean, data, css(name) }
  return { set(step, t) {}, destroy() {} };   // t in [0,1]: progress inside the step
}
```

- `set` must be idempotent and cheap: any `(step, t)` can be asked for in any order (scrolling backwards, jumping). No timers that own state. A figure may run a gentle idle motion with `requestAnimationFrame` only while `ctx.reduced` and `ctx.print` are false and it is on screen; `set` decides what is true, idle motion only breathes.
- With `ctx.print` the shell calls `set(steps - 1, 1)` once. A figure whose steps show different information (not one picture assembling) draws a composite in print that contains all of it.
- `ctx.data` is `articles/<slug>/data/<id>.json` if present. Every number drawn comes from that file, and every entry there names its source id. No number is typed into drawing code.
- SVG only (prints sharp). `viewBox` set, width 100%. Text in SVG uses the page's fonts.
- The shell supports `?freeze=<id>:<step>:<t>` to pin any figure state for review, and `?print=1` to preview print mode on screen.

## Design system

- Page (changed 16 November: the first version, warm cream paper with a clay accent and a serif text face, was too close to Claude's own look, and the owner asked for it to go): paper `#FBFBFC`, ink `#15171C`, muted `#5C6370`, hairline `#DADDE3`. No grain, no cream, no clay, no terracotta, no orange anywhere.
- One accent per article, used for the one field and for emphasis only. `renovate`: line `#1F7A54`, field `#CDE9D9` (green). `other-half`: line `#4254C5`, field `#C9D3F7` (blue). Both lines pass 4.5:1 on the paper.
- Typefaces, the three of the owner's own CV, each with a job: Libre Franklin for body text, headings, captions and table text; Newsreader for the title, the deck and figure notes (notes in italic); JetBrains Mono for kickers, section numbers, axis numbers and units (tabular figures). No other family. Load from Google Fonts with `display=swap`.
- Any device, any orientation: the page must fit and read well from 320 px to 2560 px wide, in portrait and landscape, including phones held sideways (about 844 by 390) and tablets both ways. No sideways scrolling, no text under 11 px on screen inside figures, no pinned figure that leaves fewer than four lines of text visible.
- Kicker: small mono caps with `·` separators and a hairline that runs to the right edge, for example `INNOVATION MANAGEMENT FOR AI · WS 2026/27`. Section numbers in the accent colour.
- Screen: one text column of 62 to 68 characters, a right margin column of about 14rem for the margin scene and notes, wide figures and scenes break out. In a scene the figure is pinned (`position: sticky`) and the passages scroll past it; on phones the figure pins at the top third of the screen and passages scroll under it. Short windows from 640 px wide (a low laptop window, a phone held sideways) keep the figure pinned beside the passages at full height; only windows both under 640 px wide and under 560 px high show scenes as stills. The margin scene is pinned in the margin column from 900×420 (text 32.5rem + gap 3rem + margin 14rem + gutters fit in 840 px) and changes with the scroll at each marker; its opacity follows the distance to anything that crosses the margin column (gone 16 px before contact, faded over 120 px), so it never lies on content at any scroll speed. While scrolling, article.js first measures everything and then changes everything, so no frame lays out the page twice; the opening drawing's drift is a CSS scroll-driven animation where the browser supports it. Narrower or shorter windows show its states as stills at the markers, each changing from the state before as it enters. Two scenes in a row are not cross-faded: a figure stays in full ink while any of it is on screen and leaves with its caption under it; the next rises after that caption. A scene's first passage reaches the reading line once its figure stands whole in the window, half way to its pinned place. After a resize or a turn of the device, the passage (or block) that was at the reading line is brought back to it, at the same point. Short hyphenated names of two parts, up to 14 characters ("T-Mobile", "J-curve"), do not break at the hyphen on screen (`.nobr`, set by the builder; not in links or code; paper breaks as before). A numbered list keeps the number given by its `start`.
- Print: A4, two columns, 15mm margins, 7mm gutter, body about 9.8pt, figures one column or full width, scenes as stills with their captions, margin scene states as small figures at their sections, running footer with title and page number. No grain, no sticky, no hidden text. Ctrl+P must give a paper.
- Tables: no header fill, no zebra. A 1pt ink rule above the header, a hairline under it, a 0.5pt rule at the end. Numbers in mono, right-aligned. Empty cells `·`.
- Figures, in the Processing spirit: structure in 1.25px ink strokes, data in 2 to 2.5px; quantities as counted units (one dot is one thing, stated in the figure); a faint dot grid behind measurement plates; notes in italic serif joined by thin leader lines; at most two pen-like marks per figure (a loose ring around the one number that matters). No filled badges, no ticks and crosses, no cards, no legends in boxes, no drop shadows, no gradients. Bars and counts start at zero. Motion follows the scroll and moves forward: things assemble, units fill, a line draws from left to right. Seeded randomness only.
- Pacing (17 November, after "not an animation, just bang, bang, bang"): a drawing is drawn over a long stretch of scroll, never in a few frames. In a scene a step begins as the passage before it reaches the reading line (or as its own passage comes into the window, if later) and is complete when its own passage reaches the line: a whole pitch, at least about a third of the window (side by side the pitch is 40% of the window; pinned on top 65% of the band (at least 26% of the window) of text under the figure, at most 38% of the window, with the reading line a fifth of the band down; there the first step completes a pitch before the second passage is read). The first step is drawn as the figure comes in (from 30% of it in view to the first passage read, or to the pin on phones), so a scene never opens on a finished picture. A figure in the text is drawn as it comes into view (top from 110% to at most 55% of the window); margin stills over 35% of a window. A gentle ease (half speed at both ends) is applied to every t by the shell. A figure should use the whole t range of a step: what it compresses into a tenth of t is still drawn in a tenth of the scroll. Anything near the end of the page completes when the page is scrolled to the end. `prefers-reduced-motion` and print show every state complete at once. `node tools/motion.mjs <slug>` measures all of this.
- Every figure must pass this test: shown alone without caption for five seconds, a reader with no background says what it claims.
- En dashes, never em dashes. No emoji.

## Quality checks every builder runs before reporting

1. `node lib/build.mjs` runs clean; the page has no console errors.
2. Screenshots at 1440×900 at several scroll positions, at 390×844, and a PDF of the print version; look at them and fix overlaps, clipped text, widows in captions, labels touching lines.
3. No text smaller than 11px on screen or 6.5pt in print inside figures.
4. Keyboard: source marks reachable and closable with Escape. `prefers-reduced-motion` gives stills.
5. `node tools/motion.mjs <slug>` (1536×864 and 390×844) flags no step: every step of a scene, every figure in the text and every margin still is drawn (t 0.02 to 0.98) and seen to change (a signature of its SVG) over at least 25% of the window height of scroll, and every one completes. `--frames <scene>[:<step>]` writes 12 frames over one step and a contact sheet, to look at the motion; still screenshots cannot show it.
