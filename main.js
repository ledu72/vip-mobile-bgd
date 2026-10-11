/* VIP Mobile BGD: navigacija, pozadine, efekti pri skrolu, filter ponude, forma u koracima */

// Paste the Apps Script URL here after running Skill 03
const ENDPOINT = '';

const PHONE_DISPLAY = '061/2047 543';

document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Pozadina: kamen i greben (SVG filter) ---------- */

let uid = 0;

function stoneFilter(id, freq, seed, azimuth) {
  return (
    `<defs><filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="5" seed="${seed}"/>` +
    `<feDiffuseLighting surfaceScale="40" diffuseConstant="1" lighting-color="#9a9a9a"><feDistantLight azimuth="${azimuth}" elevation="20"/></feDiffuseLighting>` +
    '<feComposite in2="SourceGraphic" operator="in"/></filter></defs>'
  );
}

function rockSVG(seed) {
  const id = 'rk' + ++uid;
  return (
    '<svg viewBox="0 0 500 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
    stoneFilter(id, '0.0075 0.0019', seed, 205) +
    `<polygon filter="url(#${id})" points="0,0 430,0 330,120 400,260 270,430 360,600 240,770 330,900 280,1000 0,1000"/></svg>`
  );
}

function ridgeSVG(seed) {
  const id = 'rd' + ++uid;
  return (
    '<svg viewBox="0 0 1600 400" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
    stoneFilter(id, '0.004 0.011', seed, 250) +
    `<polygon filter="url(#${id})" points="0,400 0,250 140,190 300,230 460,120 640,200 800,90 960,180 1130,110 1290,210 1450,150 1600,230 1600,400"/></svg>`
  );
}

document.querySelectorAll('[data-rock]').forEach((el) => { el.innerHTML = rockSVG(el.dataset.rock || 4); });
document.querySelectorAll('[data-ridge]').forEach((el) => { el.innerHTML = ridgeSVG(el.dataset.ridge || 9); });

/* ---------- Navigacija ---------- */

const nav = document.querySelector('.nav');
const toggle = document.querySelector('.nav__toggle');
const menu = document.getElementById('menu');

function setMenu(open) {
  if (!toggle || !menu) return;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Zatvori meni' : 'Otvori meni');
  menu.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
}

if (toggle && menu) {
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 768px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
}

/* ---------- Efekti pri skrolu ---------- */

const appear = document.querySelectorAll('[data-appear]');
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  appear.forEach((el) => io.observe(el));
} else {
  appear.forEach((el) => el.classList.add('in'));
}

// Tekst koji se pali reč po reč
const revealEls = [...document.querySelectorAll('[data-reveal]')].map((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', words.join(' '));
  el.innerHTML = words.map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
  return { el, spans: [...el.querySelectorAll('.w')] };
});

const drifters = [...document.querySelectorAll('[data-drift]')];
const heroPhone = document.querySelector('.hero__phone');

function onScroll() {
  const y = window.scrollY;
  const vh = window.innerHeight;

  if (nav) nav.classList.toggle('is-solid', y > 40);

  revealEls.forEach(({ el, spans }) => {
    const r = el.getBoundingClientRect();
    const p = (vh * 0.86 - r.top) / (vh * 0.5 + r.height);
    const lit = reduceMotion ? spans.length : Math.round(Math.max(0, Math.min(1, p)) * spans.length);
    spans.forEach((s, i) => s.classList.toggle('on', i < lit));
  });

  if (reduceMotion) return;

  drifters.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) return;
    const offset = r.top + r.height / 2 - vh / 2;
    el.style.translate = `${(offset * parseFloat(el.dataset.drift)).toFixed(1)}px 0`;
  });

  // Blago pomeranje samo na desktopu: na telefonu slika stoji iznad naslova i ne sme da pređe preko njega
  if (heroPhone && y < vh * 1.2) {
    heroPhone.style.translate = window.innerWidth >= 768 ? `0 ${(y * 0.06).toFixed(1)}px` : '';
  }
}

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { onScroll(); ticking = false; });
}, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

/* ---------- Ponuda: prikaz telefona uz red ---------- */

const stage = document.querySelector('.catalog__stage');
const rows = [...document.querySelectorAll('.row[data-img]')];

if (stage && rows.length) {
  const stageImg = stage.querySelector('.phone img');
  const stageName = stage.querySelector('[data-stage-name]');
  const stageSpec = stage.querySelector('[data-stage-spec]');
  let current = null;

  const show = (row) => {
    if (row === current) return;
    current = row;
    rows.forEach((r) => r.classList.toggle('is-active', r === row));
    stageImg.src = row.dataset.img;
    stageName.textContent = row.querySelector('.row__name').textContent;
    stageSpec.textContent = row.dataset.colorName ? 'Boja na slici: ' + row.dataset.colorName : '';
  };

  rows.forEach((row) => {
    row.addEventListener('mouseenter', () => show(row));
    row.addEventListener('focusin', () => show(row));
  });
  show(rows[0]);
}

/* ---------- Proizvodi: filter ---------- */

const chips = [...document.querySelectorAll('.chip[data-filter]')];
const groups = [...document.querySelectorAll('.group[data-cat]')];

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    groups.forEach((g) => g.classList.toggle('is-hidden', f !== 'all' && !g.dataset.cat.split(' ').includes(f)));
  });
});

/* ---------- Kontakt: forma u koracima ---------- */

const wizard = document.querySelector('.wizard');

if (wizard) {
  const form = wizard.querySelector('form');
  const steps = [...wizard.querySelectorAll('.wstep')];
  const dots = [...wizard.querySelectorAll('.dots li')];
  const counter = wizard.querySelector('[data-step-count]');
  const back = wizard.querySelector('[data-back]');
  const next = wizard.querySelector('[data-next]');
  const submit = wizard.querySelector('[data-submit]');
  const msg = wizard.querySelector('.wizard__msg');
  let index = 0;

  // Dolazak sa stranice proizvoda: model je već upisan
  const preset = new URLSearchParams(location.search).get('model');
  if (preset && form.elements.model) form.elements.model.value = preset.slice(0, 80);

  const stepReady = (step) => {
    const hidden = step.querySelector('input[type="hidden"]');
    if (hidden) return hidden.value !== '';
    return true;
  };

  function render(focus) {
    steps.forEach((s, i) => s.classList.toggle('is-active', i === index));
    dots.forEach((d, i) => d.classList.toggle('is-done', i <= index));
    if (counter) counter.textContent = `Korak ${index + 1} od ${steps.length}`;
    const last = index === steps.length - 1;
    back.hidden = index === 0;
    next.hidden = last;
    submit.hidden = !last;
    next.disabled = !stepReady(steps[index]);
    msg.textContent = '';
    if (focus) {
      const target = steps[index].querySelector('input:not([type="hidden"]), textarea, .choice');
      if (target) target.focus({ preventScroll: true });
    }
  }

  wizard.addEventListener('click', (e) => {
    const choice = e.target.closest('.choice');
    if (!choice) return;
    const step = choice.closest('.wstep');
    step.querySelectorAll('.choice').forEach((c) => c.setAttribute('aria-pressed', String(c === choice)));
    step.querySelector('input[type="hidden"]').value = choice.dataset.value;
    // Jedan izbor po koraku: odmah idemo dalje
    if (index < steps.length - 1) { index += 1; render(true); }
  });

  next.addEventListener('click', () => {
    if (!stepReady(steps[index])) return;
    if (index < steps.length - 1) { index += 1; render(true); }
  });

  back.addEventListener('click', () => {
    if (index > 0) { index -= 1; render(true); }
  });

  // Enter u tekstualnom koraku vodi na sledeći korak, ne šalje formu
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && index < steps.length - 1) {
      e.preventDefault();
      next.click();
    }
  });

  const rules = {
    name: (v) => (v.trim().length >= 2 ? '' : 'Upiši ime.'),
    phone: (v) => (v.replace(/\D/g, '').length >= 6 ? '' : 'Upiši broj telefona na koji možemo da te pozovemo.'),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Upiši ispravnu email adresu.')
  };

  function validate() {
    let ok = true;
    Object.keys(rules).forEach((name) => {
      const input = form.elements[name];
      const error = rules[name](input.value);
      const slot = input.closest('.field').querySelector('.err');
      slot.textContent = error;
      input.setAttribute('aria-invalid', String(Boolean(error)));
      if (error && ok) { input.focus(); ok = false; }
    });
    return ok;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (index !== steps.length - 1) return;
    if (!validate()) return;
    if (form.elements.website.value) return; // zamka za botove

    if (!ENDPOINT) {
      msg.textContent = `Forma još nije povezana sa prijemnim sandučetom. Pozovi nas na ${PHONE_DISPLAY}.`;
      return;
    }

    const params = new URLSearchParams();
    ['service', 'model', 'timing', 'name', 'phone', 'email', 'message'].forEach((key) => {
      params.set(key, form.elements[key].value.trim());
    });
    params.set('page', location.pathname);

    submit.disabled = true;
    back.disabled = true;
    const label = submit.textContent;
    submit.textContent = 'Šaljem...';

    try {
      // Apps Script pretvara POST u GET, zato šaljemo kao GET sa parametrima (vidi Skill 03)
      await fetch(`${ENDPOINT}?${params.toString()}`, { method: 'GET', mode: 'no-cors' });
      wizard.classList.add('is-sent');
      wizard.querySelector('.wizard__done').focus();
    } catch (err) {
      msg.textContent = `Slanje nije uspelo. Pokušaj ponovo ili pozovi ${PHONE_DISPLAY}.`;
      submit.disabled = false;
      back.disabled = false;
      submit.textContent = label;
    }
  });

  render(false);
}

/* ---------- Godina u footeru ---------- */

document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
