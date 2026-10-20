import { mix, dist, css, recipe, PAINT, PAINT_NAME, TARGETS, nameOf, MAX, MATCH } from "./colour.js";
import { SONGS, CHORD } from "./songs.js";
import { isHalloween, costume } from "./halloween.js";

const KEY = "paint-pots";
let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch {}
let halloween = isHalloween(new Date(), location.search, typeof saved.halloween === "boolean" ? saved.halloween : null);
const SPOOKY = ["orange", "purple", "green"].map(n => TARGETS.find(t => t.name === n).rgb);

// ---------- state ----------
let S = {
  drops: { r: 0, y: 0, b: 0, w: 0 },
  mode: "game",
  order: shuffle([...TARGETS.keys()]),
  ti: 0,
  shelf: [],
  kind: 0,
};
let pending = 0, celebrating = false, hintShown = false, muted = false;

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
const total = () => S.drops.r + S.drops.y + S.drops.b + S.drops.w;
const target = () => TARGETS[S.order[S.ti % S.order.length]];

// ---------- sound + voice ----------
let ac;
function audio() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { ac = null; } } return ac; }
function tone(freq, t0, dur, type = "sine", gain = .18, slide) {
  const a = audio(); if (!a || muted) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, a.currentTime + t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, a.currentTime + t0 + dur);
  g.gain.setValueAtTime(0.0001, a.currentTime + t0);
  g.gain.exponentialRampToValueAtTime(gain, a.currentTime + t0 + .02);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t0 + dur);
  o.connect(g).connect(a.destination); o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + dur + .05);
}
const sfx = {
  plop: () => { tone(520 + Math.random() * 120, 0, .18, "sine", .22, 180); },
  stir: () => { tone(300, 0, .3, "triangle", .08, 600); },
  full: () => { tone(200, 0, .15, "square", .05); tone(160, .12, .2, "square", .05); },
  pour: () => { tone(500, 0, .6, "triangle", .1, 90); },
  yay: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .11, .35, "triangle", .16)); tone(1568, .5, .5, "sine", .08); },
};
function say(text) {
  document.getElementById("announce").textContent = text;
  if (muted) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = .9; u.pitch = 1.25;
    speechSynthesis.speak(u);
  } catch {}
}

// ---------- title letters in paint colours ----------
function renderTitle() {
  const cols = halloween ? SPOOKY : [PAINT.r, PAINT.y, PAINT.b];
  document.getElementById("title").innerHTML = [..."Paint Pots"].map((ch, i) =>
    ch === " " ? " " : `<span aria-hidden="true" style="color:${css(cols[i % 3])};-webkit-text-stroke:1.5px #26314a;paint-order:stroke fill">${ch}</span>`).join("");
}
// Halloween look: the table, the title and the switch. The monsters read `halloween` as they're drawn.
function dressUp() {
  document.body.classList.toggle("halloween", halloween);
  document.getElementById("spooky").setAttribute("aria-pressed", String(halloween));
  renderTitle();
}
dressUp();

// ---------- creatures ----------
const BODIES = [
  // round blob
  `<path class="body" d="M18 98 C8 60 26 18 60 18 C94 18 112 60 102 98 C96 108 24 108 18 98Z"/>`,
  // cat-ish with ears
  `<path class="body" d="M22 100 C14 70 20 44 30 34 L26 8 L48 26 C56 24 64 24 72 26 L94 8 L90 34 C100 44 106 70 98 100 C90 110 30 110 22 100Z"/>`,
  // tall with antenna
  `<g><path d="M60 22 C60 14 64 8 70 6" fill="none" stroke="#26314a" stroke-width="4" stroke-linecap="round"/><circle class="body" cx="71" cy="6" r="6"/></g><path class="body" d="M30 104 C24 80 26 30 60 22 C94 30 96 80 90 104 C80 112 40 112 30 104Z"/>`,
  // wide bug with spots
  `<path class="body" d="M8 92 C4 58 30 34 60 34 C90 34 116 58 112 92 C104 106 16 106 8 92Z"/><circle cx="26" cy="80" r="5" fill="#26314a" opacity=".18"/><circle cx="94" cy="80" r="5" fill="#26314a" opacity=".18"/>`,
];
const FACES = [
  [[46, 58], [74, 58]],
  [[46, 60], [74, 60]],
  [[60, 52]],
  [[42, 62], [60, 56], [78, 62]],
];
function creatureSVG(kind, fill, happy) {
  const eyes = FACES[kind].map(([x, y]) =>
    `<circle cx="${x}" cy="${y}" r="9" fill="#fff" stroke="#26314a" stroke-width="3"/><circle cx="${x + 1.5}" cy="${y + 1.5}" r="4.2" fill="#26314a"/><circle cx="${x + 3}" cy="${y - 1}" r="1.4" fill="#fff"/>`).join("");
  const my = kind === 3 ? 80 : 80;
  const mouth = happy
    ? `<path d="M46 ${my} Q60 ${my + 16} 74 ${my}Z" fill="#26314a"/><path d="M53 ${my + 6} Q60 ${my + 12} 67 ${my + 6}" fill="#ff7a8a"/>`
    : `<path d="M50 ${my + 2} Q60 ${my + 8} 70 ${my + 2}" fill="none" stroke="#26314a" stroke-width="3.5" stroke-linecap="round"/>`;
  const feet = `<ellipse cx="42" cy="106" rx="11" ry="6" class="body"/><ellipse cx="78" cy="106" rx="11" ry="6" class="body"/>`;
  const blush = `<circle cx="34" cy="76" r="6" fill="#ff8aa0" opacity=".35"/><circle cx="86" cy="76" r="6" fill="#ff8aa0" opacity=".35"/>`;
  const dashed = fill ? "" : `stroke-dasharray="7 6"`;
  const dress = halloween ? costume(kind, happy) : { behind: "", front: "" };
  return `<svg viewBox="0 0 120 120" aria-hidden="true">${dress.behind}<g fill="${fill || "#e6e8ee"}" stroke="#26314a" stroke-width="3.5" stroke-linejoin="round" ${dashed} style="--f:1">${feet}${BODIES[kind]}</g>${blush}${eyes}${mouth}${dress.front}</svg>`;
}
function splatSVG(rgb) {
  const pts = [];
  const n = 11;
  for (let i = 0; i < n * 2; i++) {
    const a = i / (n * 2) * Math.PI * 2;
    const r = i % 2 ? 34 + (i * 7 % 5) : 46 - (i * 3 % 6);
    pts.push([60 + Math.cos(a) * r, 60 + Math.sin(a) * r]);
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[(i + 1) % pts.length], q = pts[i];
    const cx = (q[0] + p[0]) / 2, cy = (q[1] + p[1]) / 2;
    d += ` Q${q[0].toFixed(1)} ${q[1].toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)}`;
  }
  return `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="${d}Z" fill="${css(rgb)}" stroke="#26314a" stroke-width="4" stroke-linejoin="round"/><circle cx="104" cy="22" r="7" fill="${css(rgb)}" stroke="#26314a" stroke-width="3.5"/><circle cx="14" cy="100" r="5" fill="${css(rgb)}" stroke="#26314a" stroke-width="3"/><ellipse cx="46" cy="44" rx="10" ry="6" fill="#fff" opacity=".5" transform="rotate(-30 46 44)"/></svg>`;
}

const $ = id => document.getElementById(id);
const creatureEl = $("creature"), splatEl = $("splat"), hintEl = $("hint"), shelfEl = $("shelf");

function renderHint() {
  hintEl.innerHTML = "";
  if (!hintShown) {
    hintEl.innerHTML = `<button class="hint-btn" id="hint-btn" aria-label="Show a hint"><svg viewBox="0 0 24 24" fill="none" stroke="#26314a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" fill="#ffd84a"/></svg></button>`;
    $("hint-btn").onclick = () => { hintShown = true; renderHint(); speakHint(); };
    return;
  }
  const keys = Object.keys(target().rec);
  hintEl.innerHTML = keys.map(k => `<span class="dot" style="background:${css(PAINT[k])}" title="${PAINT_NAME[k]}"></span>`).join(`<span class="plus">+</span>`);
}
function speakHint() {
  const keys = Object.keys(target().rec).map(k => PAINT_NAME[k]);
  say(keys.slice(0, -1).join(", ") + " and " + keys.at(-1) + " make " + target().name);
}
function renderWish() {
  const game = S.mode === "game";
  $("want").hidden = !game;
  creatureEl.hidden = !game;
  shelfEl.hidden = !game;
  $("name-card").hidden = game;
  if (game) {
    creatureEl.style.visibility = "";
    creatureEl.innerHTML = creatureSVG(S.kind, null, false);
    creatureEl.setAttribute("aria-label", `A monster who wants to be ${target().name}`);
    splatEl.innerHTML = splatSVG(target().rgb);
    splatEl.classList.add("pulse");
    renderHint();
  }
  renderShelf();
  renderName();
}
function renderShelf() {
  shelfEl.innerHTML = S.shelf.slice(-8).map(s => `<div>${creatureSVG(s.kind, css(s.rgb), true)}</div>`).join("");
}
function renderName() {
  const c = mix(S.drops);
  const el = $("name");
  el.textContent = c ? nameOf(c) : "Pick a paint!";
  el.style.color = c ? css(c) : "var(--ink-soft)";
  el.style.webkitTextStroke = c ? "1.5px #26314a" : "0";
}

// ---------- bowl canvas ----------
const bowlBtn = $("bowl"), cv = $("bowl-canvas"), ctx = cv.getContext("2d");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
let size = 300, dpr = 1;
let shown = null;          // displayed colour (eases toward mix)
let level = 0;             // displayed fill 0..1
let swirls = [];
let spin = 0;
function resize() {
  const r = cv.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  size = Math.max(10, r.width);
  cv.width = size * dpr; cv.height = size * dpr;
}
new ResizeObserver(resize).observe(cv);
resize();

function frame(now) {
  const target = mix(S.drops);
  const goalLevel = total() ? .5 + .5 * Math.min(total(), MAX) / MAX : 0;
  level += (goalLevel - level) * (reduce ? 1 : .08);
  if (target) {
    if (!shown) shown = target.slice();
    for (let i = 0; i < 3; i++) shown[i] += (target[i] - shown[i]) * (reduce ? 1 : .045);
  }
  spin += .004;
  draw(now);
  requestAnimationFrame(frame);
}

function draw(now) {
  const s = size;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, s, s);
  const cx = s / 2, cy = s / 2, R = s * .46, Ri = s * .385;

  // shadow + rim
  ctx.save();
  ctx.shadowColor = "rgba(38,49,74,.25)"; ctx.shadowBlur = s * .04; ctx.shadowOffsetY = s * .025;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = "#fbfaf6"; ctx.fill();
  ctx.restore();
  ctx.lineWidth = Math.max(3, s * .012); ctx.strokeStyle = "#26314a";
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  // rim stripe
  ctx.lineWidth = s * .018; ctx.strokeStyle = "#7cc6ff";
  ctx.beginPath(); ctx.arc(cx, cy, R * .93, 0, Math.PI * 2); ctx.stroke();

  // inner well
  const g = ctx.createRadialGradient(cx - Ri * .3, cy - Ri * .3, Ri * .1, cx, cy, Ri);
  g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#e4e3dd");
  ctx.beginPath(); ctx.arc(cx, cy, Ri, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = Math.max(2, s * .008); ctx.strokeStyle = "rgba(38,49,74,.35)"; ctx.stroke();

  // paint
  if (shown && level > .01) {
    const pr = Ri * level;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, pr, 0, Math.PI * 2); ctx.clip();
    const pg = ctx.createRadialGradient(cx - pr * .35, cy - pr * .4, pr * .05, cx, cy, pr * 1.05);
    pg.addColorStop(0, css(shown.map(v => Math.min(1, v * 1.08 + .06))));
    pg.addColorStop(.6, css(shown));
    pg.addColorStop(1, css(shown.map(v => v * .82)));
    ctx.fillStyle = pg; ctx.fillRect(0, 0, s, s);

    // swirls of newly poured paint
    swirls = swirls.filter(w => now - w.t < w.life);
    for (const w of swirls) {
      const p = (now - w.t) / w.life;
      const alpha = (1 - p) * .95;
      ctx.strokeStyle = css(w.c);
      ctx.globalAlpha = alpha;
      ctx.lineCap = "round";
      for (let arm = 0; arm < 3; arm++) {
        ctx.beginPath();
        const rot = w.rot + p * 5 + arm * (Math.PI * 2 / 3);
        for (let t = 0; t <= 1; t += .04) {
          const rr = pr * (.08 + .8 * t);
          const a = rot + t * Math.PI * 2.4;
          const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
          t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.lineWidth = s * .05 * (1 - p * .7);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // gloss
    ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = s * .022; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(cx, cy, pr * .78, Math.PI * 1.08 + Math.sin(spin) * .1, Math.PI * 1.38 + Math.sin(spin) * .1); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, pr * .78, Math.PI * 1.46 + Math.sin(spin) * .1, Math.PI * 1.5 + Math.sin(spin) * .1); ctx.stroke();
    ctx.restore();
    ctx.lineWidth = Math.max(2, s * .008); ctx.strokeStyle = "rgba(38,49,74,.4)";
    ctx.beginPath(); ctx.arc(cx, cy, pr, 0, Math.PI * 2); ctx.stroke();
  }
}
requestAnimationFrame(frame);

// ---------- actions ----------
function addSwirl(c, life = 1700) { if (!reduce) swirls.push({ c, t: performance.now(), life, rot: Math.random() * 6.28 }); }

function pour(k, potEl) {
  if (celebrating) return;
  if (total() + pending >= MAX) {
    bowlBtn.classList.remove("wobble"); void bowlBtn.offsetWidth; bowlBtn.classList.add("wobble");
    sfx.full();
    return;
  }
  audio();
  potEl.classList.remove("tilt"); void potEl.offsetWidth; potEl.classList.add("tilt");
  pending++;
  const land = () => {
    pending--;
    S.drops[k]++;
    if (!shown) shown = PAINT[k].slice();
    addSwirl(PAINT[k]);
    sfx.plop();
    renderName();
    check();
  };
  const from = potEl.getBoundingClientRect(), to = cv.getBoundingClientRect();
  if (reduce) { land(); return; }
  const drop = document.createElement("div");
  drop.className = "drop";
  drop.style.background = css(PAINT[k]);
  document.body.appendChild(drop);
  const x0 = from.left + from.width / 2, y0 = from.top + from.height * .1;
  const x1 = to.left + to.width / 2 + (Math.random() - .5) * to.width * .15, y1 = to.top + to.height / 2;
  const xm = (x0 + x1) / 2, ym = Math.min(y0, y1) - 60;
  const anim = drop.animate([
    { transform: `translate(${x0}px,${y0}px) scale(.6)` },
    { transform: `translate(${xm}px,${ym}px) scale(1.1)`, offset: .45 },
    { transform: `translate(${x1}px,${y1}px) scale(.9,1.1)` },
  ], { duration: 520, easing: "cubic-bezier(.3,.1,.6,1)" });
  anim.onfinish = () => { drop.remove(); land(); };
}

function check() {
  if (S.mode !== "game" || celebrating) return;
  const c = mix(S.drops);
  if (c && dist(c, target().rgb) < MATCH) return win();
  if (!hintShown && total() >= 5) { hintShown = true; renderHint(); }
}

function win() {
  celebrating = true;
  const t = target();
  splatEl.classList.remove("pulse");
  creatureEl.innerHTML = creatureSVG(S.kind, css(t.rgb), true);
  creatureEl.classList.remove("happy"); void creatureEl.offsetWidth; creatureEl.classList.add("happy");
  sfx.yay();
  say(`${t.name}! You made ${t.name}!`);
  confetti(t.rgb);
  S.shelf.push({ kind: S.kind, rgb: t.rgb });
  const danceMs = dance();
  setTimeout(() => (S.shelf.length % 5 === 0 ? concert(S.shelf.slice(-5), next) : next()), Math.max(3200, danceMs));
  function next() {
    renderShelf();
    emptyBowl(true);
    S.ti++;
    if (S.ti % S.order.length === 0) { S.order = shuffle(S.order); }
    S.kind = (S.kind + 1 + (Math.random() * 3 | 0)) % BODIES.length;
    hintShown = false;
    creatureEl.classList.remove("happy");
    setTimeout(() => { celebrating = false; renderWish(); }, 700);
  }
}

// The newly painted monster hops out of its card and conga-dances across
// the screen, with up to three earlier monsters from the shelf following.
function dance() {
  if (reduce) return 0;
  const line = S.shelf.slice(-4).reverse();
  const W = innerWidth, H = innerHeight;
  const DUR = 3400, GAP = 420;
  const startHop = 500;
  setTimeout(() => { creatureEl.style.visibility = "hidden"; }, startHop);
  line.forEach((m, i) => {
    const el = document.createElement("div");
    el.className = "dancer";
    el.innerHTML = `<div class="moves">${creatureSVG(m.kind, css(m.rgb), true)}</div>`;
    document.body.appendChild(el);
    const w = el.getBoundingClientRect().width;
    const y = H * .52 - w / 2;
    const start = i === 0 ? creatureEl.getBoundingClientRect() : null;
    const from = start
      ? `translate(${start.left + start.width / 2 - w / 2}px,${start.top + start.height / 2 - w / 2}px) scale(.6)`
      : `translate(${-w * 1.2}px,${y}px)`;
    const anim = el.animate([
      { transform: from },
      { transform: `translate(${W * .42 - w / 2}px,${y}px) rotate(0deg)`, offset: .42 },
      { transform: `translate(${W * .5 - w / 2}px,${y - w * .5}px) rotate(360deg)`, offset: .55 },
      { transform: `translate(${W * .58 - w / 2}px,${y}px) rotate(360deg)`, offset: .66 },
      { transform: `translate(${W + w * .2}px,${y}px) rotate(360deg)` },
    ], { duration: DUR, delay: startHop + i * GAP, easing: "ease-in-out", fill: "both" });
    anim.onfinish = () => el.remove();
  });
  return startHop + (line.length - 1) * GAP + DUR;
}

function emptyBowl(quiet) {
  if (!total() && !pending) return;
  bowlBtn.classList.remove("tip"); void bowlBtn.offsetWidth; bowlBtn.classList.add("tip");
  if (!quiet) sfx.pour();
  setTimeout(() => { S.drops = { r: 0, y: 0, b: 0, w: 0 }; shown = null; swirls = []; renderName(); }, reduce ? 0 : 380);
}

function stir() {
  const c = mix(S.drops);
  audio();
  if (!c) { say("Pick a paint!"); return; }
  addSwirl(c.map(v => Math.min(1, v + .18)), 1400);
  addSwirl(c.map(v => v * .8), 1400);
  sfx.stir();
  say(nameOf(c));
}

// ---------- concert: five painted monsters play a song under laser lights ----------
const KEY_LINES = Array.from({ length: 11 }, (_, i) => `<path d="M${20 + 8 * i} 98v12"/>`).join("");
const BLACK_KEYS = [1, 2, 4, 5, 6, 8, 9, 11].map(i => `<rect x="${12 + 8 * i - 2.5}" y="98" width="5" height="7"/>`).join("");
const INSTR = {
  guitar: `<svg viewBox="0 0 120 120" aria-hidden="true"><g transform="rotate(-28 60 88)" stroke="#26314a" stroke-width="3" stroke-linejoin="round"><rect x="58" y="84" width="54" height="8" rx="2" fill="#a86a32"/><rect x="108" y="80" width="13" height="16" rx="3" fill="#26314a"/><path d="M28 74 C40 68 52 72 56 79 C63 77 69 82 67 88 C69 95 63 99 56 97 C52 104 40 108 28 102 C16 97 16 79 28 74Z" fill="#ff5a5f"/><circle cx="46" cy="88" r="5" fill="#26314a"/></g></svg>`,
  keys: `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M28 112 L20 134 M92 112 L100 134" stroke="#26314a" stroke-width="4" stroke-linecap="round" fill="none"/><rect x="6" y="88" width="108" height="26" rx="5" fill="#26314a"/><rect x="12" y="98" width="96" height="12" fill="#fff"/><g stroke="#26314a" stroke-width="1.5">${KEY_LINES}</g><g fill="#26314a">${BLACK_KEYS}</g><circle cx="18" cy="93" r="2.5" fill="#ff5a5f"/><circle cx="26" cy="93" r="2.5" fill="#ffd84a"/><circle cx="34" cy="93" r="2.5" fill="#7cc6ff"/></svg>`,
  mic: `<svg viewBox="0 0 120 120" aria-hidden="true"><g stroke="#26314a" stroke-width="3.5" stroke-linecap="round" fill="none"><path d="M92 134 V98 L80 90"/><path d="M78 134 H106"/></g><rect x="70" y="84" width="8" height="15" rx="3" transform="rotate(38 74 90)" fill="#26314a"/><circle cx="72" cy="82" r="8.5" fill="#c9ccd6" stroke="#26314a" stroke-width="3"/><path d="M66 80h12M66 84h12" stroke="#26314a" stroke-width="1.5"/></svg>`,
  drums: `<svg viewBox="0 0 120 120" aria-hidden="true"><g stroke="#26314a" stroke-width="3" stroke-linejoin="round"><path d="M102 70 V134" fill="none"/><ellipse cx="102" cy="68" rx="17" ry="4" fill="#ffd84a"/><path d="M2 96 v12 a16 6 0 0 0 32 0 v-12" fill="#ff5a5f"/><ellipse cx="18" cy="96" rx="16" ry="6" fill="#fff"/><circle cx="60" cy="110" r="24" fill="#fff"/><circle cx="60" cy="110" r="16" fill="none" stroke="#7cc6ff" stroke-width="5"/></g><g stroke="#a86a32" stroke-width="4" stroke-linecap="round"><path d="M30 74 L14 92"/><path d="M90 74 L106 62"/></g></svg>`,
  trumpet: `<svg viewBox="0 0 120 120" aria-hidden="true"><g stroke="#26314a" stroke-width="3" stroke-linejoin="round"><rect x="76" y="86" width="16" height="10" rx="2" fill="#ffc83d"/><rect x="62" y="79" width="44" height="7" rx="3" fill="#ffc83d"/><path d="M104 82 L124 68 V98 Z" fill="#ffc83d"/><path d="M80 72 v7 M86 72 v7 M92 72 v7" fill="none"/></g></svg>`,
};
const ROLES = ["guitar", "keys", "mic", "drums", "trumpet"];

let concertOut = null;
const mf = m => 440 * Math.pow(2, (m - 69) / 12);


// Schedules the song on the audio clock. Returns the beat
// length, start delay and when the tune ends, all in seconds.
function playSong(song) {
  const a = audio();
  const beat = 60 / song.bpm;
  const tuneBeats = song.chords.length * song.bar * song.reps;
  if (!a) return { beat, start: 0, end: tuneBeats * beat };
  try { a.resume(); } catch {}
  const out = a.createGain();
  out.gain.value = muted ? 0 : .9;
  out.connect(a.destination);
  concertOut = out;
  const noise = a.createBuffer(1, a.sampleRate, a.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  const env = (node, t, peak, dur) => {
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + .01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    node.connect(g).connect(out);
  };
  const noteNow = (m, t, dur, type, peak) => {
    const o = a.createOscillator(); o.type = type; o.frequency.value = mf(m);
    env(o, t, peak, dur); o.start(t); o.stop(t + dur + .05);
  };
  const kickNow = t => {
    const o = a.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + .15);
    env(o, t, .7, .22); o.start(t); o.stop(t + .3);
  };
  const hissNow = (t, type, freq, peak, dur) => {
    const s = a.createBufferSource(); s.buffer = noise;
    const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    s.connect(f); env(f, t, peak, dur); s.start(t); s.stop(t + dur + .05);
  };
  // Queue every sound, then create the audio nodes only a moment before
  // each one plays. Building the whole song's nodes up front overloads the
  // audio thread and the music drops out until near the end.
  const queue = [];
  const note = (m, t, ...rest) => queue.push([t, () => noteNow(m, t, ...rest)]);
  const kick = t => queue.push([t, () => kickNow(t)]);
  const hiss = (t, ...rest) => queue.push([t, () => hissNow(t, ...rest)]);

  const t0 = a.currentTime + 1.6; // leave room for "Concert time!"
  const sub = song.sub, barLen = song.bar * beat;
  for (let rep = 0; rep < song.reps; rep++) {
    const rt = t0 + rep * song.chords.length * barLen;
    song.chords.forEach((names, bar) => {
      const parts = names.split(" ");
      for (let k = 0; k < song.bar; k++) {
        const [c1, c2, c3, bass] = CHORD[parts[Math.floor(k * parts.length / song.bar)]];
        const t = rt + bar * barLen + k * beat;
        if (k % 2 === 0) kick(t); else hiss(t, "bandpass", 1800, .3, .16);
        note(bass, t, beat * .45, "triangle", .32);
        for (let s = 0; s < sub; s++) {
          const ts = t + s * beat / sub;
          hiss(ts, "highpass", 7000, s ? .04 : .06, .04);
          if (s) {
            note(bass + 12, ts, beat / sub * .8, "triangle", .16);
            for (const m of [c1, c2, c3]) note(m, ts, beat / sub * .6, "square", .022);
          }
        }
      }
    });
    let mt = rt;
    for (const [m, len] of song.melody) {
      note(m, mt, len * beat * .88, "square", .065);
      note(m + 12, mt, len * beat * .88, "sine", .05);
      mt += len * beat;
    }
  }
  const end = t0 + tuneBeats * beat;
  hiss(end, "highpass", 4000, .3, 1.8);
  kick(end);
  for (const m of [48, 60, 64, 67, 72]) note(m, end, beat * 2, "triangle", .1);
  queue.sort((x, y) => x[0] - y[0]);
  let qi = 0;
  const pump = () => {
    const now = a.currentTime;
    while (qi < queue.length && queue[qi][0] < now + .3) {
      const [t, make] = queue[qi++];
      if (t > now - .05) make(); // skip anything a stalled tab already missed
    }
    if (qi >= queue.length) clearInterval(timer);
  };
  const timer = setInterval(pump, 50);
  pump();
  return { beat, start: t0 - a.currentTime, end: tuneBeats * beat, stop: () => clearInterval(timer) };
}

function concert(band, done) {
  // each set of five monsters plays the next rhyme in the list
  const tune = SONGS[(Math.max(1, Math.floor(S.shelf.length / 5)) - 1) % SONGS.length];
  const song = playSong(tune);
  const beat = song.beat;
  const ov = document.createElement("div");
  ov.className = "concert";
  ov.style.setProperty("--beat", beat + "s");
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-label", "Monster concert");
  ov.innerHTML = `<canvas></canvas><div class="floor"></div>
    <div class="marquee">${halloween ? "Spooky Monster Concert!" : "Monster Concert!"}<div class="song-name">${tune.name}</div></div>
    <div class="band">${band.map((m, i) => `<div class="member${ROLES[i] === "mic" || ROLES[i] === "guitar" ? " sway" : ""}"><div class="moves">${creatureSVG(m.kind, css(m.rgb), true)}${INSTR[ROLES[i]]}</div></div>`).join("")}</div>
    <button class="end-concert" aria-label="End the concert"><svg viewBox="0 0 20 20" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M4 4l12 12M16 4L4 16"/></svg></button>`;
  document.body.appendChild(ov);
  requestAnimationFrame(() => ov.classList.add("on"));
  say(`Concert time! ${tune.name}!`);

  const lc = ov.querySelector("canvas"), lx = lc.getContext("2d");
  let W = 0, H = 0, ldpr = 1;
  const fit = () => { ldpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; lc.width = W * ldpr; lc.height = H * ldpr; };
  fit(); addEventListener("resize", fit);
  const members = [...ov.querySelectorAll(".member")];
  const cols = [...band.map(m => m.rgb), ...(halloween ? SPOOKY : [PAINT.r, PAINT.y, PAINT.b])].map(c => css(c.map(v => Math.min(1, v * 1.1 + .1))));
  const stars = Array.from({ length: 50 }, () => [Math.random(), Math.random() * .7, Math.random() * 6]);
  const t0 = performance.now() + song.start * 1000;
  let running = true;

  function beam(x, y, ang, col, alpha) {
    const L = Math.hypot(W, H) * 1.3;
    const x2 = x + Math.cos(ang) * L, y2 = y + Math.sin(ang) * L;
    lx.strokeStyle = col;
    lx.globalAlpha = alpha * .18; lx.lineWidth = 14;
    lx.beginPath(); lx.moveTo(x, y); lx.lineTo(x2, y2); lx.stroke();
    lx.globalAlpha = alpha; lx.lineWidth = 2.5;
    lx.beginPath(); lx.moveTo(x, y); lx.lineTo(x2, y2); lx.stroke();
  }
  function lasers(now) {
    if (!running) return;
    const t = reduce ? 1 : Math.max(0, (now - t0) / 1000);
    const b = t / beat;
    const pulse = reduce ? .6 : Math.exp(-(b % 1) * 3);
    const shift = Math.floor(b / 4);
    lx.setTransform(ldpr, 0, 0, ldpr, 0, 0);
    lx.clearRect(0, 0, W, H);
    lx.globalCompositeOperation = "lighter";
    lx.lineCap = "round";
    // twinkling haze
    lx.fillStyle = "#fff";
    for (const [sx, sy, ph] of stars) { lx.globalAlpha = .25 + .25 * Math.sin(t * 3 + ph); lx.fillRect(sx * W, sy * H, 2, 2); }
    // spotlights on each band member
    members.forEach((m, i) => {
      const r = m.getBoundingClientRect();
      const cx = r.left + r.width / 2, by = r.bottom;
      const g = lx.createLinearGradient(0, 0, 0, by);
      g.addColorStop(0, cols[i]); g.addColorStop(1, "rgba(0,0,0,0)");
      lx.globalAlpha = .14 + .14 * pulse;
      lx.fillStyle = g;
      lx.beginPath(); lx.moveTo(cx - 10, 0); lx.lineTo(cx + 10, 0); lx.lineTo(cx + r.width * .6, by); lx.lineTo(cx - r.width * .6, by); lx.fill();
    });
    // laser fans: two from the top corners, one from behind the band
    for (let i = 0; i < 5; i++) {
      const c = cols[(i + shift) % cols.length];
      beam(-10, H * .12, .25 + i * .12 + Math.sin(t * 1.4 + i * .7) * .3, c, .55 + .45 * pulse);
      beam(W + 10, H * .12, Math.PI - .25 - i * .12 - Math.sin(t * 1.4 + i * .7) * .3, cols[(i + shift + 2) % cols.length], .55 + .45 * pulse);
    }
    for (let i = 0; i < 7; i++) {
      const spread = (i - 3) * .28 + Math.sin(t * .9) * .35;
      beam(W / 2, H * .78, -Math.PI / 2 + spread, cols[(i + shift + 4) % cols.length], .35 + .65 * pulse);
    }
    lx.globalAlpha = 1;
    lx.globalCompositeOperation = "source-over";
    if (!reduce) requestAnimationFrame(lasers);
  }
  requestAnimationFrame(lasers);

  // music notes floating up from the band, one per beat
  let noteTimer = 0;
  const startNotes = setTimeout(() => {
    noteTimer = setInterval(() => {
      if (reduce) return;
      const i = Math.random() * members.length | 0, r = members[i].getBoundingClientRect();
      const n = document.createElement("span");
      n.className = "note";
      n.textContent = Math.random() < .5 ? "♪" : "♫";
      n.style.color = cols[i];
      n.style.left = r.left + r.width * (.2 + Math.random() * .6) + "px";
      n.style.top = r.top + "px";
      ov.appendChild(n);
      n.animate([
        { transform: "translateY(0) scale(.6)", opacity: 0 },
        { transform: "translateY(-30%) scale(1)", opacity: 1, offset: .2 },
        { transform: `translate(${(Math.random() - .5) * 80}px,-180px) rotate(${(Math.random() - .5) * 60}deg)`, opacity: 0 },
      ], { duration: 1800, easing: "ease-out" }).onfinish = () => n.remove();
    }, beat * 1000);
  }, song.start * 1000);

  let finished = false;
  function finish(early) {
    if (finished) return;
    finished = true;
    clearTimeout(startNotes); clearInterval(noteTimer); clearTimeout(endTimer);
    if (early) song.stop?.();
    if (early && concertOut && ac) {
      concertOut.gain.setTargetAtTime(0, ac.currentTime, .05);
    }
    const out = concertOut;
    setTimeout(() => { try { out && out.disconnect(); } catch {} }, early ? 300 : 2500);
    concertOut = null;
    const bowMs = early ? 0 : 1500;
    if (!early) { ov.querySelector(".band").classList.add("bow"); say("Yay! Thank you!"); }
    setTimeout(() => {
      ov.classList.remove("on");
      setTimeout(() => { running = false; removeEventListener("resize", fit); ov.remove(); done(); }, 650);
    }, bowMs);
  }
  const endTimer = setTimeout(() => finish(false), (song.start + song.end) * 1000 + 300);
  ov.querySelector(".end-concert").onclick = () => finish(true);
}

// ---------- confetti ----------
const cc = $("confetti"), cx2 = cc.getContext("2d");
let bits = [], confettiOn = false;
function confetti(rgb) {
  if (reduce) return;
  cc.width = innerWidth; cc.height = innerHeight;
  const r = cv.getBoundingClientRect();
  const cols = halloween ? [rgb, ...SPOOKY, rgb] : [rgb, PAINT.r, PAINT.y, PAINT.b, rgb];
  for (let i = 0; i < 90; i++) {
    bits.push({
      x: r.left + r.width / 2, y: r.top + r.height / 2,
      vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4,
      s: 6 + Math.random() * 10, c: css(cols[i % cols.length]), a: Math.random() * 6, va: (Math.random() - .5) * .3,
      round: Math.random() < .5,
    });
  }
  if (!confettiOn) { confettiOn = true; requestAnimationFrame(tickConfetti); }
}
function tickConfetti() {
  cx2.clearRect(0, 0, cc.width, cc.height);
  bits = bits.filter(b => b.y < cc.height + 40);
  for (const b of bits) {
    b.vy += .38; b.vx *= .99; b.x += b.vx; b.y += b.vy; b.a += b.va;
    cx2.save(); cx2.translate(b.x, b.y); cx2.rotate(b.a); cx2.fillStyle = b.c;
    cx2.strokeStyle = "#26314a"; cx2.lineWidth = 2;
    if (b.round) { cx2.beginPath(); cx2.arc(0, 0, b.s / 2, 0, 7); cx2.fill(); cx2.stroke(); }
    else { cx2.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); cx2.strokeRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); }
    cx2.restore();
  }
  if (bits.length) requestAnimationFrame(tickConfetti); else { confettiOn = false; cx2.clearRect(0, 0, cc.width, cc.height); }
}

// ---------- wiring ----------
document.querySelectorAll(".pot").forEach(p => {
  p.querySelector(".jar").style.setProperty("--paint", css(PAINT[p.dataset.k]));
  p.addEventListener("click", () => pour(p.dataset.k, p));
});
bowlBtn.addEventListener("click", stir);
$("empty").addEventListener("click", () => { audio(); emptyBowl(false); });
function setMode(m) {
  S.mode = m;
  $("mode-game").setAttribute("aria-pressed", m === "game");
  $("mode-free").setAttribute("aria-pressed", m === "free");
  renderWish();
  check();
}
$("mode-game").onclick = () => setMode("game");
$("mode-free").onclick = () => setMode("free");
$("spooky").onclick = () => {
  halloween = !halloween;
  try { localStorage.setItem(KEY, JSON.stringify({ ...saved, halloween })); } catch {}
  dressUp();
  if (!celebrating) renderWish(); else renderShelf();   // a monster mid-dance keeps its outfit
};
$("mute").onclick = () => {
  muted = !muted;
  $("wave").style.display = muted ? "none" : "";
  $("mute").setAttribute("aria-label", muted ? "Sound off" : "Sound on");
  if (muted) try { speechSynthesis.cancel(); } catch {}
  if (concertOut) concertOut.gain.value = muted ? 0 : .9;
};
document.addEventListener("keydown", e => {
  const k = { r: "r", y: "y", b: "b", w: "w" }[e.key.toLowerCase()];
  if (k) pour(k, document.querySelector(`.pot[data-k="${k}"]`));
  if (e.key === "Backspace" || e.key === "Delete") emptyBowl(false);
});

// keep progress across live updates of the page
function start(saved) {
  if (saved && saved.drops) {
    S = { ...S, ...saved };
    if (total()) shown = mix(S.drops);
  }
  $("mode-game").setAttribute("aria-pressed", S.mode === "game");
  $("mode-free").setAttribute("aria-pressed", S.mode === "free");
  renderWish();
}
window.claude?.hot?.snapshot?.(() => ({ ...S, drops: { ...S.drops } }));
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
