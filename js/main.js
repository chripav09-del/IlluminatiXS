import { soffio } from './soffio.js';

const root = document.documentElement;
root.classList.remove('no-js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const WA = '393278147742';
const waLink = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

/* hero: il soffio + la luce sul nome */
const canvas = document.getElementById('soffio');
const wordmark = document.querySelector('.wordmark');
if (canvas) soffio(canvas, { onWave: () => wordmark && wordmark.classList.add('is-lit') });
if (reduce && wordmark) wordmark.style.backgroundPosition = '0 0';

/* header che si scurisce scorrendo */
const header = document.querySelector('.site-header');
if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 24);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
}

/* ingressi */
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
document.querySelectorAll('.reveal, .emerge').forEach((el) => io.observe(el));

/* video: parte solo quando si vede */
document.querySelectorAll('video[data-autoplay]').forEach((v) => {
  if (reduce) return;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { v.play().catch(() => {}); } else v.pause();
  }, { threshold: 0.3 }).observe(v);
});

/* caroselli */
document.querySelectorAll('[data-carousel]').forEach((car) => {
  const track = car.querySelector('.track');
  const items = [...track.children];
  const prev = car.querySelector('[data-prev]');
  const next = car.querySelector('[data-next]');
  const count = car.querySelector('.carousel__count');
  let active = 0;
  const set = (i) => {
    active = i;
    items.forEach((el, k) => el.classList.toggle('is-active', k === i));
    if (count) count.textContent = `${i + 1} / ${items.length}`;
    if (prev) prev.disabled = i === 0;
    if (next) next.disabled = i === items.length - 1;
  };
  const go = (i) => {
    i = Math.max(0, Math.min(items.length - 1, i));
    const pad = parseFloat(getComputedStyle(track).scrollPaddingInlineStart) || 0;
    track.scrollTo({ left: items[i].offsetLeft - track.offsetLeft - pad, behavior: reduce ? 'auto' : 'smooth' });
  };
  let raf = 0;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const left = track.scrollLeft;
      let best = 0, bd = Infinity;
      items.forEach((el, k) => {
        const d = Math.abs(el.offsetLeft - track.offsetLeft - left - (parseFloat(getComputedStyle(track).scrollPaddingInlineStart) || 0));
        if (d < bd) { bd = d; best = k; }
      });
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) best = items.length - 1;
      if (best !== active) set(best);
    });
  }, { passive: true });
  prev && prev.addEventListener('click', () => go(active - 1));
  next && next.addEventListener('click', () => go(active + 1));
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
  });
  set(0);
});

/* prima e dopo */
document.querySelectorAll('[data-compare]').forEach((box) => {
  const cmp = box.querySelector('.compare');
  const handle = box.querySelector('.compare__handle');
  const before = box.querySelector('.compare__before');
  const after = box.querySelector('.compare__after');
  const cap = box.querySelector('.pd__cap strong');
  const tabs = [...box.querySelectorAll('[role="tab"]')];
  let pos = 50;
  const setPos = (p) => {
    pos = Math.max(0, Math.min(100, p));
    cmp.style.setProperty('--pos', pos + '%');
    handle.setAttribute('aria-valuenow', Math.round(pos));
    handle.setAttribute('aria-valuetext', `${Math.round(100 - pos)}% dopo`);
  };
  const fromEvent = (e) => {
    const r = cmp.getBoundingClientRect();
    setPos(((e.clientX - r.left) / r.width) * 100);
  };
  let dragging = false;
  cmp.addEventListener('pointerdown', (e) => {
    dragging = true; cmp.setPointerCapture(e.pointerId); fromEvent(e);
  });
  cmp.addEventListener('pointermove', (e) => { if (dragging) fromEvent(e); });
  const stop = () => { dragging = false; };
  cmp.addEventListener('pointerup', stop);
  cmp.addEventListener('pointercancel', stop);
  handle.addEventListener('keydown', (e) => {
    const map = { ArrowLeft: -5, ArrowRight: 5, Home: -100, End: 100 };
    if (e.key in map) { e.preventDefault(); setPos(pos + map[e.key]); }
  });
  const select = (tab, focus) => {
    tabs.forEach((t) => { const on = t === tab; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    before.src = tab.dataset.before; before.alt = tab.dataset.beforeAlt;
    after.src = tab.dataset.after; after.alt = tab.dataset.afterAlt;
    cap.textContent = tab.dataset.title;
    setPos(50);
    if (focus) tab.focus();
    // piccolo invito: la linea di luce si muove da sola una volta
    if (!reduce) {
      let t = 0; const s = performance.now();
      const anim = (now) => { t = (now - s) / 900; if (t > 1 || dragging) return; setPos(50 + Math.sin(t * Math.PI * 2) * 14); requestAnimationFrame(anim); };
      requestAnimationFrame(anim);
    }
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') select(tabs[(i + 1) % tabs.length], true);
      if (e.key === 'ArrowLeft') select(tabs[(i - 1 + tabs.length) % tabs.length], true);
    });
  });
  setPos(50);
});

/* orari: aperto ora, sul fuso di Roma */
const OPEN = { 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19], 6: [9, 19] }; // mar-sab
function romeNow() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, h: +get('hour') % 24 + (+get('minute')) / 60 };
}
const NAMES = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
function statusText() {
  const { day, h } = romeNow();
  const today = OPEN[day];
  if (today && h >= today[0] && h < today[1]) return { open: true, text: `Aperto ora · fino alle ${today[1]}:00` };
  if (today && h < today[0]) return { open: false, text: `Chiuso ora · apre oggi alle ${today[0]}:00` };
  for (let k = 1; k <= 7; k++) {
    const d = (day + k) % 7;
    if (OPEN[d]) return { open: false, text: `Chiuso ora · riapre ${k === 1 ? 'domani' : NAMES[d]} alle ${OPEN[d][0]}:00` };
  }
}
document.querySelectorAll('[data-status]').forEach((el) => {
  const s = statusText();
  el.textContent = s.text;
  el.classList.toggle('is-open', s.open);
});
document.querySelectorAll('[data-day]').forEach((row) => {
  const { day } = romeNow();
  if (row.dataset.day.split(',').map(Number).includes(day)) row.classList.add('is-today');
});

/* form → WhatsApp (nessun dato salvato) */
const form = document.getElementById('prenota');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.nome;
    const err = form.querySelector('#nome-err');
    if (!name.value.trim()) {
      name.setAttribute('aria-invalid', 'true');
      err.textContent = 'Scrivi il tuo nome, così sappiamo chi sei.';
      name.focus();
      return;
    }
    name.removeAttribute('aria-invalid'); err.textContent = '';
    const parts = [`Ciao, sono ${name.value.trim()}.`, `Vorrei prenotare: ${form.servizio.value}.`, `Giorno preferito: ${form.giorno.value}.`];
    if (form.messaggio.value.trim()) parts.push(form.messaggio.value.trim());
    window.open(waLink(parts.join(' ')), '_blank', 'noopener');
  });
}
