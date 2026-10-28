// Spacing QA, run inside the page (node tools/shots.mjs <url> <out> "eval:$(cat tools/qa/gaps.js)").
// Measures, from the real glyph boxes, the vertical gap between consecutive text blocks of the
// screen that is open: the bottom of the lowest ink of one block (its last baseline plus the
// descent of its text) against the top of the highest ink of the next (its first baseline minus
// the ascent). A gap under 0 is a collision; the result lists the tightest pairs.
(() => {
  const ctx = document.createElement('canvas').getContext('2d');
  const font = (el) => { const s = getComputedStyle(el); return `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`; };
  const baseline = (el, first) => {
    const p = document.createElement('span');
    p.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    first ? el.prepend(p) : el.append(p);
    const y = p.getBoundingClientRect().top;
    p.remove();
    return y;
  };
  const ink = (el) => {
    ctx.font = font(el);
    const text = el.innerText.trim();
    const lines = text.split('\n');
    const m1 = ctx.measureText(lines[0]), m2 = ctx.measureText(lines.at(-1));
    return { top: baseline(el, true) - m1.actualBoundingBoxAscent, bottom: baseline(el, false) + m2.actualBoundingBoxDescent };
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    if (!(r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && el.innerText.trim())) return false;
    // Faded out (the opening title once a story starts, closed panels): not on screen.
    for (let e = el; e; e = e.parentElement) { const o = getComputedStyle(e); if (Number(o.opacity) < 0.05 || o.visibility === 'hidden') return false; }
    return el.closest('[aria-hidden="true"]') == null;
  };
  // Blocks of text: elements whose own text is not only in child blocks.
  const SEL = window.__gapSel || '.intro-mark, .intro-line, .kicker, .title, .line, .data-credit, .drawer-kicker, .drawer h2, .fact b, .fact span, .drawer-text, .drawer-source, .ex-head, .ex-title, .ex-note p, .country-card h3, .cc-title, .cc-now, .cc-source, .search-results b, .search-results small, .search-born, .search-note, .anchor b, .anchor small, .a-fact, .about h2, .about h3, .about p, .credits h2, .credits p';
  const els = [...document.querySelectorAll(SEL)].filter(visible);
  const pairs = [];
  for (let i = 0; i < els.length; i++) {
    for (let j = 0; j < els.length; j++) {
      if (i === j) continue;
      const a = els[i].getBoundingClientRect(), b = els[j].getBoundingClientRect();
      if (b.top < a.top || Math.min(a.right, b.right) - Math.max(a.left, b.left) < 8) continue;
      if (els[i].contains(els[j]) || els[j].contains(els[i])) continue;
      const A = ink(els[i]), B = ink(els[j]);
      if (B.top < A.top) continue;
      const gap = B.top - A.bottom;
      const name = (e) => e.className.toString().split(' ')[0] || e.tagName.toLowerCase();
      pairs.push({ a: name(els[i]), b: name(els[j]), gap: Math.round(gap), size: getComputedStyle(els[j]).fontSize });
    }
  }
  // Inside a block of several lines: the line height against the tallest ascent plus the
  // deepest descent of its text (conservative: they may not stand one above the other).
  for (const el of els) {
    const st = getComputedStyle(el), lh = parseFloat(st.lineHeight) || parseFloat(st.fontSize) * 1.2;
    if (el.getBoundingClientRect().height < lh * 1.6) continue;
    ctx.font = font(el);
    const m = ctx.measureText(el.innerText.replace(/\s+/g, ' '));
    pairs.push({ a: `${el.className.toString().split(' ')[0] || el.tagName.toLowerCase()} (lines)`, b: '', gap: Math.round(lh - m.actualBoundingBoxAscent - m.actualBoundingBoxDescent), size: st.fontSize });
  }
  // Keep, for each upper block, only the nearest block below it.
  const best = new Map();
  for (const p of pairs) { const k = p.a; if (!best.has(k) || p.gap < best.get(k).gap) best.set(k, p); }
  return JSON.stringify([...best.values()].sort((x, y) => x.gap - y.gap).slice(0, 8));
})()
