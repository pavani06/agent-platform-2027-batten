const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs = {}, parent) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

// Seeded random so the drawings look the same on every load.
function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

/* ---------- scroll reveal ---------- */
const revealIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
      e.target.dispatchEvent(new CustomEvent('reveal'));
    }
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.reveal').forEach((n) => revealIO.observe(n));

// Pause CSS loops in sections that are off screen.
const pauseIO = new IntersectionObserver((entries) => {
  for (const e of entries) e.target.classList.toggle('paused', !e.isIntersecting);
});
document.querySelectorAll('.hero, .section').forEach((n) => pauseIO.observe(n));

/* ---------- count-up numbers ---------- */
document.querySelectorAll('[data-count]').forEach((node) => {
  const target = parseFloat(node.dataset.count);
  const decimals = parseInt(node.dataset.decimals || '0', 10);
  const fmt = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const host = node.closest('.reveal');
  if (reduce || !host) return;
  node.textContent = fmt(0);
  host.addEventListener('reveal', () => {
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 1600);
      node.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, { once: true });
});

/* ---------- hero garden ---------- */
(function hero() {
  const plants = document.getElementById('plants');
  const seeds = document.getElementById('seeds');
  const roots = document.getElementById('roots');
  if (!plants) return;
  const r = rng(7);
  const beds = [[130, 370], [480, 368], [830, 372]];
  const palette = ['#3d6a37', '#5b8a45', '#7fa65a', '#2f5a3a', '#6a8f3c'];
  const blooms = ['#e9b949', '#d97a4a', '#c25d7a', '#f2e6c9', '#8fb8d8'];
  let i = 0;
  for (const [bx, by] of beds) {
    for (let k = 0; k < 6; k++, i++) {
      const x = bx + 20 + k * 40 + r() * 10;
      const h = 70 + r() * 120;
      const delay = (0.3 + i * 0.12).toFixed(2) + 's';
      const color = palette[Math.floor(r() * palette.length)];
      const bend = (r() - 0.5) * 40;
      const g = el('g', { class: 'plant', style: `--sway:${(-r() * 5).toFixed(2)}s` }, plants);
      const d = `M${x} ${by} C ${x} ${by - h * 0.4}, ${x + bend} ${by - h * 0.7}, ${x + bend * 0.6} ${by - h}`;
      const stem = el('path', { d, class: 'stem', stroke: color, 'stroke-width': 3 + r() * 2 }, g);
      const len = Math.ceil(h * 1.15);
      stem.style.setProperty('--len', len);
      stem.style.setProperty('--delay', delay);
      const leaves = 2 + Math.floor(r() * 3);
      for (let L = 0; L < leaves; L++) {
        const t = 0.3 + (L / leaves) * 0.6;
        const ly = by - h * t;
        const lx = x + bend * t * 0.8;
        const dir = L % 2 ? 1 : -1;
        const s = 10 + r() * 12;
        const leaf = el('path', {
          d: `M${lx} ${ly} q ${dir * s} ${-s * 0.2} ${dir * s * 1.4} ${-s} q ${-dir * s * 0.9} ${s * 0.1} ${-dir * s * 1.4} ${s}z`,
          class: 'leaf', fill: color,
        }, g);
        leaf.style.setProperty('--delay', (parseFloat(delay) + 0.6 + L * 0.15).toFixed(2) + 's');
      }
      if (r() > 0.45) {
        const bloom = el('circle', { cx: x + bend * 0.6, cy: by - h, r: 5 + r() * 6, class: 'bloom', fill: blooms[Math.floor(r() * blooms.length)] }, g);
        bloom.style.setProperty('--delay', (parseFloat(delay) + 1.6).toFixed(2) + 's');
      }
      // roots under the plant
      const rd = `M${x} ${by + 20} c ${(r() - 0.5) * 30} 30, ${(r() - 0.5) * 60} 50, ${(r() - 0.5) * 50} ${70 + r() * 70}`;
      const root = el('path', { d: rd, class: 'root' }, roots);
      root.style.setProperty('--len', 200);
      root.style.setProperty('--delay', delay);
    }
  }
  // seeds waiting in deeper soil
  for (let s = 0; s < 14; s++) {
    const x = 60 + r() * 1080;
    const y = 470 + r() * 140;
    const delay = (-r() * 3).toFixed(2) + 's';
    const glow = el('circle', { cx: x, cy: y, r: 14, fill: 'url(#g-seed)', class: 'seed-glow' }, seeds);
    glow.style.setProperty('--delay', delay);
    el('ellipse', { cx: x, cy: y, rx: 4.5, ry: 3, fill: '#e2b964', transform: `rotate(${Math.floor(r() * 180)} ${x} ${y})` }, seeds);
  }
})();

/* ---------- run counter: run 400 starts as naive as run 1 ---------- */
(function runs() {
  const count = document.getElementById('run-count');
  const tiles = document.getElementById('run-tiles');
  if (!count || !tiles) return;
  const cells = Array.from({ length: 80 }, () => tiles.appendChild(document.createElement('i')));
  const host = tiles.closest('.reveal');
  const show = (n) => {
    count.textContent = n;
    const on = Math.round((n / 400) * cells.length);
    cells.forEach((c, i) => c.classList.toggle('on', i < on));
  };
  if (reduce) { show(400); return; }
  host.addEventListener('reveal', () => {
    const loop = () => {
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / 5000);
        show(Math.max(1, Math.round(400 * p)));
        if (p < 1) requestAnimationFrame(step);
        else setTimeout(loop, 2500);
      };
      requestAnimationFrame(step);
    };
    loop();
  }, { once: true });
})();

/* ---------- monoculture vs diverse garden ---------- */
(function mono() {
  const a = document.getElementById('mono-a');
  const b = document.getElementById('mono-b');
  if (!a || !b) return;
  const r = rng(42);
  const beige = '#cdb995';
  const diverse = ['#3d6a37', '#c25d7a', '#e9b949', '#24506f', '#b5561d', '#7fa65a', '#6b4f8a', '#2f8a7a'];
  const make = (svg, isMono) => {
    el('rect', { x: 0, y: 186, width: 300, height: 34, fill: '#6e5238' }, svg);
    const items = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 6; col++) {
        const x = 30 + col * 46 + (row % 2) * 12;
        const y = 62 + row * 44;
        const g = el('g', {}, svg);
        let color;
        if (isMono) {
          color = beige;
          el('rect', { x: x - 8, y: y - 6, width: 16, height: 22, rx: 3, fill: color }, g); // the same bottle-like shape
          el('rect', { x: x - 4, y: y - 12, width: 8, height: 6, fill: '#a9967a' }, g);
          el('rect', { x: x - 12, y: y + 16, width: 24, height: 6, fill: '#e3d6bd' }, g);
        } else {
          color = diverse[Math.floor(r() * diverse.length)];
          const kind = Math.floor(r() * 4);
          if (kind === 0) el('circle', { cx: x, cy: y + 4, r: 11, fill: color }, g);
          else if (kind === 1) el('path', { d: `M${x} ${y - 14} L${x + 12} ${y + 18} L${x - 12} ${y + 18}z`, fill: color }, g);
          else if (kind === 2) el('path', { d: `M${x} ${y + 18} C ${x - 18} ${y}, ${x - 6} ${y - 16}, ${x} ${y - 14} C ${x + 6} ${y - 16}, ${x + 18} ${y}, ${x} ${y + 18}z`, fill: color }, g);
          else el('rect', { x: x - 10, y: y - 8, width: 20, height: 26, rx: 10, fill: color }, g);
          el('line', { x1: x, y1: y + 18, x2: x, y2: y + 24, stroke: '#3d6a37', 'stroke-width': 2 }, g);
        }
        // in the diverse garden only some plants share the blight's weakness
        items.push({ g, x, susceptible: isMono || r() < 0.25 });
      }
    }
    return items;
  };
  const A = make(a, true);
  const B = make(b, false);
  const blightA = el('rect', { x: -60, y: 0, width: 40, height: 186, fill: '#6b5a2e', opacity: 0.18 }, a);
  const blightB = el('rect', { x: -60, y: 0, width: 40, height: 186, fill: '#6b5a2e', opacity: 0.18 }, b);
  const apply = (items, front) => {
    for (const it of items) {
      const hit = it.susceptible && it.x < front;
      it.g.style.transition = 'opacity .6s, filter .6s, transform .6s';
      it.g.style.opacity = hit ? 0.25 : 1;
      it.g.style.filter = hit ? 'grayscale(1) sepia(.6)' : 'none';
    }
  };
  if (reduce) { apply(A, 150); apply(B, 150); blightA.remove(); blightB.remove(); return; }
  let t0 = null;
  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) requestAnimationFrame(tick); }).observe(a);
  function tick(t) {
    if (!visible) { t0 = null; return; }
    if (t0 === null) t0 = t;
    const cycle = ((t - t0) / 9000) % 1; // 0..1
    const front = cycle < 0.6 ? -40 + (cycle / 0.6) * 380 : cycle < 0.85 ? 340 : -40;
    blightA.setAttribute('x', front - 20);
    blightB.setAttribute('x', front - 20);
    apply(A, front);
    apply(B, front);
    requestAnimationFrame(tick);
  }
})();

/* ---------- weather: a market that reacts to our own moves ---------- */
(function weather() {
  const canvas = document.getElementById('weather');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const btn = document.getElementById('weather-move');
  let w = 0, h = 0, dpr = 1;
  const ripples = [];
  const signals = [];
  const r = rng(11);
  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  const move = () => {
    const x = w * (0.15 + r() * 0.7);
    const y = h * (0.3 + r() * 0.45);
    ripples.push({ x, y, t: 0 });
  };

  function field(x, y, time) {
    let v = Math.sin(x * 0.012 + time * 0.6) * 10 + Math.sin(x * 0.027 - time * 0.9 + y * 0.01) * 6;
    for (const rp of ripples) {
      const d = Math.hypot(x - rp.x, y - rp.y);
      const front = rp.t * 160;
      const k = Math.exp(-Math.pow((d - front) / 40, 2)) * Math.max(0, 1 - rp.t / 4);
      v += k * 26;
    }
    return v;
  }

  function draw(time) {
    ctx.clearRect(0, 0, w, h);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#d4e4ee'); sky.addColorStop(1, '#eef1ea');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    const lines = 9;
    for (let L = 0; L < lines; L++) {
      const base = (h / (lines + 1)) * (L + 1);
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const y = base + field(x, base, time + L * 0.4);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(36,80,111,${0.18 + 0.05 * (L % 3)})`;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    for (const rp of ripples) {
      const rad = rp.t * 160;
      const alpha = Math.max(0, 1 - rp.t / 4);
      ctx.beginPath(); ctx.arc(rp.x, rp.y, rad, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(181,86,29,${0.55 * alpha})`; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(rp.x, rp.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(181,86,29,${Math.max(0.25, alpha)})`; ctx.fill();
    }
    // signals picked up by listeners: tagged as our own wake if inside a ripple front
    for (const s of signals) {
      const own = ripples.some((rp) => Math.abs(Math.hypot(s.x - rp.x, s.y - rp.y) - rp.t * 160) < 50 && rp.t < 4);
      ctx.beginPath(); ctx.arc(s.x, s.y + field(s.x, s.y, time) * 0.3, own ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = own ? '#b5561d' : '#24506f';
      ctx.fill();
      if (own) { ctx.strokeStyle = 'rgba(181,86,29,.35)'; ctx.lineWidth = 6; ctx.stroke(); }
    }
  }

  const seedSignals = () => {
    signals.length = 0;
    for (let i = 0; i < 46; i++) signals.push({ x: r() * w, y: 20 + r() * (h - 40) });
  };
  seedSignals();
  // resizing a canvas clears it, so redraw a frame even when the loop is idle
  window.addEventListener('resize', () => { resize(); seedSignals(); draw(performance.now() / 1000); });
  draw(0);

  if (reduce) {
    ripples.push({ x: w * 0.35, y: h * 0.5, t: 1.2 }, { x: w * 0.7, y: h * 0.45, t: 0.7 });
    draw(0);
    btn.addEventListener('click', () => { ripples.length = 0; move(); ripples[0].t = 1; draw(0); });
    return;
  }

  let visible = false;
  let last = 0;
  let auto = 0;
  btn.addEventListener('click', move);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { last = 0; requestAnimationFrame(loop); } }).observe(canvas);
  function loop(t) {
    if (!visible) return;
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
    last = t;
    for (const rp of ripples) rp.t += dt;
    while (ripples.length && ripples[0].t > 4) ripples.shift();
    auto += dt;
    if (auto > 3.2) { auto = 0; move(); }
    draw(t / 1000);
    requestAnimationFrame(loop);
  }
})();

/* ---------- many small bets ---------- */
(function bets() {
  const box = document.getElementById('bets-small');
  if (!box) return;
  const dots = Array.from({ length: 40 }, () => box.appendChild(document.createElement('i')));
  const r = rng(5);
  const shuffle = () => {
    dots.forEach((d) => {
      const v = r();
      d.className = v < 0.12 ? 'win' : v < 0.55 ? 'cut' : '';
    });
  };
  shuffle();
  if (reduce) return;
  let timer = null;
  new IntersectionObserver(([e]) => {
    clearInterval(timer);
    if (e.isIntersecting) timer = setInterval(shuffle, 2200);
  }).observe(box);
})();
