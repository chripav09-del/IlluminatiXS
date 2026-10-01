// Illuminati XS v2
const root = document.documentElement;
root.classList.remove('no-js');
root.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const canAnimateX = !!(window.CSS && CSS.registerProperty);
const WA = '393278147742';
const waLink = (t) => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- la luce che colora ---------- */
function light(el) {
  if (!el || el.classList.contains('is-lit') || el.classList.contains('is-lighting')) return;
  if (reduce || !canAnimateX) { el.classList.add('is-lit', 'no-anim'); return; }
  el.classList.add('is-lighting');
  el.addEventListener('animationend', () => { el.classList.remove('is-lighting'); el.classList.add('is-lit'); }, { once: true });
}
const lightIO = new IntersectionObserver((es) => {
  for (const e of es) if (e.isIntersecting) { setTimeout(() => light(e.target), 150); lightIO.unobserve(e.target); }
}, { threshold: 0.55 });
document.querySelectorAll('.lit[data-light="view"]').forEach((el) => lightIO.observe(el));

/* ---------- ingressi ---------- */
const riseIO = new IntersectionObserver((es) => {
  for (const e of es) if (e.isIntersecting) { e.target.classList.add('is-in'); riseIO.unobserve(e.target); }
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
document.querySelectorAll('.rise').forEach((el) => riseIO.observe(el));

/* ---------- testata ---------- */
const top = document.querySelector('.top');
const hero = document.querySelector('.cover');
let lastY = scrollY;
function onScrollTop() {
  const y = scrollY;
  const limit = hero ? hero.offsetHeight * 0.6 : 40;
  top.classList.toggle('is-solid', y > limit || !hero);
  if (!document.body.classList.contains('menu-open')) top.classList.toggle('is-hidden', y > lastY && y > limit + 200);
  lastY = y;
}
if (top) { onScrollTop(); addEventListener('scroll', onScrollTop, { passive: true }); }

/* ---------- menu a tutto schermo ---------- */
const menuBtn = document.querySelector('.menu-btn');
const menu = document.getElementById('menu');
if (menuBtn && menu) {
  const focusables = () => [...menu.querySelectorAll('a,button'), menuBtn];
  const setOpen = (open) => {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menu.inert = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.querySelector('span').textContent = open ? 'Chiudi' : 'Menu';
    document.body.classList.toggle('menu-open', open);
    top.classList.remove('is-hidden');
    if (open) setTimeout(() => menu.querySelector('a').focus(), 300);
  };
  menu.inert = true;
  menuBtn.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  addEventListener('keydown', (e) => {
    if (!menu.classList.contains('is-open')) return;
    if (e.key === 'Escape') { setOpen(false); menuBtn.focus(); }
    if (e.key === 'Tab') {
      const f = focusables(); const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
}

/* ---------- copertina: insegna che si monta + luce + 3D ---------- */
const mast = document.querySelector('.mast');
if (mast) {
  let k = 0;
  mast.querySelectorAll('span').forEach((line) => {
    const txt = line.textContent; line.textContent = '';
    for (const c of txt) {
      const s = document.createElement('span');
      s.className = 'ch'; s.textContent = c; s.style.setProperty('--k', k++);
      line.appendChild(s);
    }
  });
  const go = () => requestAnimationFrame(() => mast.classList.add('is-up'));
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go);
  setTimeout(go, 1200);
}
const coverLit = document.querySelector('.cover .lit');
if (coverLit) setTimeout(() => light(coverLit), reduce ? 0 : 900);

const tilt = document.querySelector('.cover__photo .tilt');
if (tilt && !reduce) {
  const photo = tilt.parentElement;
  let px = 0, py = 0, sp = 0, raf = 0, sheen = 0;
  const render = () => {
    raf = 0;
    tilt.style.setProperty('--rx', (sp * 16 - py * 5).toFixed(2) + 'deg');
    tilt.style.setProperty('--ry', (px * 7).toFixed(2) + 'deg');
    tilt.style.setProperty('--tz', (-sp * 180).toFixed(1) + 'px');
    tilt.style.setProperty('--sc', (1 - sp * 0.05).toFixed(3));
    tilt.style.setProperty('--so', sheen.toFixed(2));
  };
  const req = () => { if (!raf) raf = requestAnimationFrame(render); };
  addEventListener('scroll', () => { sp = clamp(scrollY / photo.offsetHeight, 0, 1); req(); }, { passive: true });
  photo.addEventListener('pointermove', (e) => {
    const r = photo.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    px = x - 0.5; py = y - 0.5; sheen = 0.75;
    tilt.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
    tilt.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    req();
  });
  photo.addEventListener('pointerleave', () => { px = 0; py = 0; sheen = 0; req(); });
  // telefono: segue l'inclinazione (Android; su iOS serve un permesso, si resta sullo scroll)
  if (!fine && 'DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    addEventListener('deviceorientation', (e) => {
      if (e.gamma == null) return;
      px = clamp(e.gamma / 45, -0.5, 0.5); py = clamp((e.beta - 45) / 60, -0.5, 0.5);
      sheen = 0.45; tilt.style.setProperty('--mx', (50 + px * 80) + '%'); tilt.style.setProperty('--my', (35 + py * 60) + '%');
      req();
    });
  }
}

/* ---------- caroselli (con coverflow 3D) ---------- */
document.querySelectorAll('[data-carousel]').forEach((car) => {
  const track = car.querySelector('.track');
  const items = [...track.children];
  const prev = car.querySelector('[data-prev]');
  const next = car.querySelector('[data-next]');
  const count = car.querySelector('.count b');
  const bar = car.querySelector('.progress');
  const flow = car.classList.contains('coverflow') && !reduce;
  let active = -1, raf = 0;
  const pad = () => parseFloat(getComputedStyle(track).scrollPaddingInlineStart) || 0;
  const set = (i) => {
    if (i === active) return;
    active = i;
    if (count) count.textContent = String(i + 1).padStart(2, '0');
    if (bar) bar.style.setProperty('--p', ((i + 1) / items.length * 100) + '%');
    if (prev) prev.disabled = i === 0;
    if (next) next.disabled = i === items.length - 1;
    const lit = items[i].querySelector('.lit');
    if (lit) light(lit);
  };
  const update = () => {
    raf = 0;
    const tr = track.getBoundingClientRect();
    const anchor = tr.left + pad();
    let best = 0, bd = Infinity;
    items.forEach((el, k) => {
      const r = el.getBoundingClientRect();
      const d = (r.left - anchor) / r.width;
      if (Math.abs(d) < bd) { bd = Math.abs(d); best = k; }
      if (flow) {
        const card = el.firstElementChild;
        card.style.setProperty('--cy', clamp(-d * 24, -38, 38).toFixed(2) + 'deg');
        card.style.setProperty('--cs', (1 - Math.min(Math.abs(d), 1.4) * 0.08).toFixed(3));
      }
    });
    if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) best = items.length - 1;
    set(best);
  };
  const go = (i) => {
    i = clamp(i, 0, items.length - 1);
    track.scrollTo({ left: items[i].offsetLeft - track.offsetLeft - pad(), behavior: reduce ? 'auto' : 'smooth' });
  };
  track.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(update); });
  prev && prev.addEventListener('click', () => go(active - 1));
  next && next.addEventListener('click', () => go(active + 1));
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
  });
  // il primo si accende quando il carosello entra in vista
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { update(); o.disconnect(); } }, { threshold: 0.4 }).observe(track);
  update(); active = -1;
  if (count) count.textContent = '01';
});

/* ---------- filtri della galleria ---------- */
const chips = document.querySelectorAll('.chip');
if (chips.length) {
  const cards = document.querySelectorAll('.gallery li');
  chips.forEach((c) => c.addEventListener('click', () => {
    chips.forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
    const f = c.dataset.filter;
    cards.forEach((li) => {
      const show = f === 'tutti' || li.dataset.cat.split(' ').includes(f);
      li.classList.toggle('is-out', !show);
      if (show) { const l = li.querySelector('.lit'); if (l && l.getBoundingClientRect().top < innerHeight) light(l); }
    });
  }));
}

/* ---------- prima e dopo ---------- */
document.querySelectorAll('.compare').forEach((cmp) => {
  const handle = cmp.querySelector('.handle');
  let pos = 50, drag = false;
  const setPos = (p) => {
    pos = clamp(p, 0, 100);
    cmp.style.setProperty('--pos', pos + '%');
    handle.setAttribute('aria-valuenow', Math.round(pos));
  };
  const fromE = (e) => { const r = cmp.getBoundingClientRect(); setPos((e.clientX - r.left) / r.width * 100); };
  cmp.addEventListener('pointerdown', (e) => { drag = true; cmp.setPointerCapture(e.pointerId); fromE(e); });
  cmp.addEventListener('pointermove', (e) => { if (drag) fromE(e); });
  cmp.addEventListener('pointerup', () => { drag = false; });
  cmp.addEventListener('pointercancel', () => { drag = false; });
  handle.addEventListener('keydown', (e) => {
    const m = { ArrowLeft: -5, ArrowRight: 5, Home: -100, End: 100 };
    if (e.key in m) { e.preventDefault(); setPos(pos + m[e.key]); }
  });
  setPos(50);
  if (!reduce) new IntersectionObserver(([e], o) => {
    if (!e.isIntersecting) return; o.disconnect();
    const s = performance.now();
    const a = (n) => { const t = (n - s) / 1400; if (t > 1 || drag) return setPos(50); setPos(50 + Math.sin(t * Math.PI * 2) * 22); requestAnimationFrame(a); };
    requestAnimationFrame(a);
  }, { threshold: 0.6 }).observe(cmp);
});

/* ---------- orari: aperto ora (fuso di Roma) ---------- */
const OPEN = { 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19], 6: [9, 19] };
const NAMES = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
function romeNow() {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  const g = (t) => p.find((x) => x.type === t).value;
  return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')), h: (+g('hour') % 24) + (+g('minute')) / 60 };
}
const now = romeNow();
function status() {
  const t = OPEN[now.day];
  if (t && now.h >= t[0] && now.h < t[1]) return [true, `Aperto ora · fino alle ${t[1]}:00`];
  if (t && now.h < t[0]) return [false, `Chiuso ora · apre oggi alle ${t[0]}:00`];
  for (let k = 1; k <= 7; k++) { const d = (now.day + k) % 7; if (OPEN[d]) return [false, `Chiuso ora · riapre ${k === 1 ? 'domani' : NAMES[d]} alle ${OPEN[d][0]}:00`]; }
}
document.querySelectorAll('[data-status]').forEach((el) => { const [o, t] = status(); el.textContent = t; el.classList.toggle('is-open', o); });
document.querySelectorAll('[data-day]').forEach((r) => { if (r.dataset.day.split(',').map(Number).includes(now.day)) r.classList.add('is-today'); });

/* ---------- modulo → WhatsApp (nessun dato salvato) ---------- */
const form = document.getElementById('prenota');
if (form) form.addEventListener('submit', (e) => {
  e.preventDefault();
  const n = form.nome, err = form.querySelector('#nome-err');
  if (!n.value.trim()) { n.setAttribute('aria-invalid', 'true'); err.textContent = 'Scrivi il tuo nome, così sappiamo chi sei.'; n.focus(); return; }
  n.removeAttribute('aria-invalid'); err.textContent = '';
  const parts = [`Ciao, sono ${n.value.trim()}.`, `Vorrei prenotare: ${form.servizio.value}.`, `Giorno preferito: ${form.giorno.value}.`];
  if (form.messaggio.value.trim()) parts.push(form.messaggio.value.trim());
  window.open(waLink(parts.join(' ')), '_blank', 'noopener');
});
