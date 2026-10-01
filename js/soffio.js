// Il soffio: le ciocche sottili vengono separate da un'onda d'aria e si schiariscono (AirTouch).
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function soffio(canvas, { onWave } = {}) {
  const ctx = canvas.getContext('2d');
  const host = canvas.parentElement;
  let W = 0, H = 0, dpr = 1, strands = [], gBase, gLit;
  let raf = 0, visible = true, t0 = 0, waveStart = -1;
  const WAVE_MS = 1800, BAND = 110;
  const pointer = { x: -999, y: -999, vx: 0, last: 0 };

  function build() {
    const r = host.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const n = Math.round(Math.min(420, Math.max(160, W / 2)));
    const prev = strands;
    strands = [];
    // le ciocche nascono a ciuffi: ogni ciuffo ha la sua onda e la sua caduta
    let lock = null, left = 0;
    for (let i = 0; i < n; i++) {
      if (left <= 0) {
        const u = Math.random();
        left = 6 + Math.floor(Math.random() * 10);
        lock = {
          x: (W < 900 ? 0.2 + 0.8 * Math.pow(u, 0.6) : 0.32 + 0.68 * Math.pow(u, 0.75)) * W,
          drift: (Math.random() - 0.35) * 70,
          amp: 8 + Math.random() * 16,
          freq: 1.6 + Math.random() * 1.6,
          phase: Math.random() * Math.PI * 2,
          len: H * (0.6 + Math.random() * 0.42),
        };
      }
      left--;
      const thin = i % 3 === 0;  // una su tre: quelle che l'AirTouch separa
      const p = prev[i];
      strands.push({
        x0: lock.x + (Math.random() - 0.5) * 22,
        len: lock.len * (0.88 + Math.random() * 0.14),
        drift: lock.drift + (Math.random() - 0.5) * 10,
        amp: lock.amp * (0.85 + Math.random() * 0.3),
        freq: lock.freq,
        wphase: lock.phase + (Math.random() - 0.5) * 0.5,
        w: thin ? 0.55 + Math.random() * 0.3 : 0.9 + Math.random() * 0.6,
        a: 0.3 + Math.random() * 0.25,
        thin,
        phase: Math.random() * Math.PI * 2,
        sway: 2 + Math.random() * 3,
        dx: 0, v: 0,
        lit: reduce || (p && p.lit > 0.99) ? (thin ? 1 : 0) : 0,
        litTarget: reduce || (p && p.litTarget) ? (thin ? 1 : 0) : 0,
      });
    }
    gBase = ctx.createLinearGradient(0, 0, 0, H);
    gBase.addColorStop(0, 'hsla(25,30%,22%,0)');
    gBase.addColorStop(0.2, 'hsla(24,26%,30%,1)');
    gBase.addColorStop(1, 'hsla(28,24%,40%,1)');
    gLit = ctx.createLinearGradient(0, 0, 0, H);
    gLit.addColorStop(0, 'hsla(36,55%,62%,0)');
    gLit.addColorStop(0.18, 'hsla(36,55%,62%,0)');
    gLit.addColorStop(0.5, 'hsla(38,62%,70%,1)');
    gLit.addColorStop(1, 'hsla(42,80%,90%,1)');
  }

  const SEG = 16;
  function path(s, sway) {
    ctx.moveTo(s.x0, -10);
    for (let k = 1; k <= SEG; k++) {
      const u = k / SEG;
      const x = s.x0 + s.drift * Math.pow(u, 1.3)
        + s.amp * Math.sin(s.freq * 6.283 * u + s.wphase) * u
        + (sway + s.dx) * Math.pow(u, 1.5);
      ctx.lineTo(x, -10 + (s.len + 10) * u);
    }
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const tt = now * 0.0006;
    // base: tutte le ciocche
    ctx.strokeStyle = gBase;
    for (const s of strands) {
      ctx.globalAlpha = s.a;
      ctx.lineWidth = s.w;
      ctx.beginPath(); path(s, Math.sin(tt + s.phase) * s.sway); ctx.stroke();
    }
    // le ciocche schiarite
    ctx.strokeStyle = gLit;
    for (const s of strands) {
      if (s.lit < 0.01) continue;
      ctx.globalAlpha = Math.min(1, s.lit * (s.a + 0.6));
      ctx.lineWidth = s.w + 0.7;
      ctx.beginPath(); path(s, Math.sin(tt + s.phase) * s.sway); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function step(now) {
    raf = 0;
    if (!visible) return;
    // onda d'aria da sinistra a destra
    if (waveStart >= 0) {
      const p = (now - waveStart) / WAVE_MS;
      if (p <= 1.15) {
        const e = 1 - Math.pow(1 - Math.min(p, 1), 3);
        const fx = -BAND + e * (W + BAND * 2);
        for (const s of strands) {
          const d = Math.abs(s.x0 + s.drift * 0.5 - fx);
          if (d < BAND) {
            const f = 1 - d / BAND;
            s.v += f * (s.thin ? 2.4 : 0.5);
            if (s.thin) s.litTarget = 1;
          }
        }
      } else waveStart = -1;
    }
    // soffio locale del puntatore / dito
    if (now - pointer.last < 120) {
      for (const s of strands) {
        const d = Math.abs(s.x0 + s.drift * Math.min(1, pointer.y / s.len) + s.dx - pointer.x);
        if (d < 120 && pointer.y < s.len + 40) {
          const f = 1 - d / 120;
          s.v += f * pointer.vx * (s.thin ? 0.09 : 0.03);
          if (s.thin && f > 0.3) s.litTarget = 1;
        }
      }
    }
    // molla smorzata
    for (const s of strands) {
      s.v += -s.dx * 0.08;
      s.v *= 0.86;
      s.dx += s.v;
      if (s.dx > 32) { s.dx = 32; s.v *= -0.3; } else if (s.dx < -32) { s.dx = -32; s.v *= -0.3; }
      s.lit += (s.litTarget - s.lit) * 0.06;
    }
    draw(now);
    raf = requestAnimationFrame(step);
  }

  function start() { if (!raf && visible && !reduce) raf = requestAnimationFrame(step); }

  build();
  if (reduce) { draw(0); }
  else {
    t0 = performance.now();
    setTimeout(() => { waveStart = performance.now(); onWave && onWave(); }, 300);
    start();
  }

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting && !document.hidden;
    if (visible) start();
  });
  io.observe(host);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; start(); });

  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      const r = host.getBoundingClientRect();
      if (Math.abs(r.width - W) < 2 && Math.abs(r.height - H) < 80) return; // barra indirizzi mobile
      build(); draw(performance.now());
    }, 180);
  });

  if (!reduce) {
    host.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const now = performance.now();
      pointer.vx = Math.max(-40, Math.min(40, x - pointer.x));
      if (pointer.x < -900) pointer.vx = 0;
      pointer.x = x; pointer.y = y; pointer.last = now;
      start();
    }, { passive: true });
    host.addEventListener('pointerleave', () => { pointer.x = -999; });
    let lastY = scrollY;
    addEventListener('scroll', () => {
      const dy = scrollY - lastY; lastY = scrollY;
      if (!visible) return;
      const k = Math.max(-6, Math.min(6, dy * 0.06));
      for (const s of strands) s.v += k * (s.thin ? 0.5 : 0.2) * (0.6 + Math.random() * 0.8);
      start();
    }, { passive: true });
  }
}
