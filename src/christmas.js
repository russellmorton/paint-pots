// Christmas dress-up, on from 12 November to 6 January: a snowy night with a Christmas tree, and
// every monster in a Santa hat, antlers, a star or an elf hat. The Christmas tree switch in the top
// bar (choice, remembered) beats the date, and ?christmas=1 or ?christmas=0 beats both.
import { isHalloween } from "./halloween.js";

export function isChristmas(date = new Date(), search = "", choice = null) {
  const ask = new URLSearchParams(search).get("christmas");
  if (ask === "1" || ask === "0") return ask === "1";
  if (typeof choice === "boolean") return choice;
  return (date.getMonth() === 10 && date.getDate() >= 12) || date.getMonth() === 11 || (date.getMonth() === 0 && date.getDate() <= 6);
}

// Halloween and Christmas are never on together. One that was asked for (in the address, or with
// its switch) beats one that's only on because of the date; if both were asked for, Christmas wins.
export function seasons(date = new Date(), search = "", choice = {}) {
  let halloween = isHalloween(date, search, choice.halloween ?? null);
  let christmas = isChristmas(date, search, choice.christmas ?? null);
  if (halloween && christmas) {
    const asked = key => new URLSearchParams(search).get(key) === "1" || choice[key] === true;
    if (asked("christmas") || !asked("halloween")) halloween = false; else christmas = false;
  }
  return { halloween, christmas };
}

const INK = `stroke="#26314a" stroke-width="3.5" stroke-linejoin="round"`;

// One Christmas outfit per monster shape (see BODIES in game.js), in the same 120×120 box as the
// Halloween costumes.
export function christmasCostume(kind) {
  if (kind === 0) {   // a Santa hat, the tip flopping over to one side
    return { behind: "", front: `<g class="costume" ${INK}>
      <path d="M34 24 Q40 -8 70 -6 Q92 -4 98 16 Q88 6 78 8 Q84 16 86 24Z" fill="#e8312f"/>
      <rect x="28" y="16" width="64" height="14" rx="7" fill="#fff"/>
      <circle cx="98" cy="18" r="8" fill="#fff"/></g>` };
  }
  if (kind === 1) {   // reindeer antlers between the ears, and a shiny red nose
    return { behind: `<g class="costume" stroke="#26314a" stroke-width="9" stroke-linecap="round" fill="none">
      <path d="M50 30 L44 4 M46 14 L34 6 M44 4 L50 -6 M70 30 L76 4 M74 14 L86 6 M76 4 L70 -6"/>
      <path d="M50 30 L44 4 M46 14 L34 6 M44 4 L50 -6 M70 30 L76 4 M74 14 L86 6 M76 4 L70 -6" stroke="#b07a46" stroke-width="5"/></g>`,
      front: `<g class="costume"><circle cx="60" cy="71" r="6" fill="#ff3b3b" stroke="#26314a" stroke-width="2.5"/><circle cx="58" cy="69" r="1.8" fill="#fff"/></g>` };
  }
  if (kind === 2) {   // a Christmas star on the antenna
    return { behind: "", front: `<g class="costume" stroke="#26314a" stroke-width="2.5" stroke-linejoin="round">
      <path d="M71 -8 L74.5 0.5 L83.5 1 L76.5 7 L79 16 L71 11 L63 16 L65.5 7 L58.5 1 L67.5 0.5Z" fill="#ffd84a"/></g>` };
  }
  // an elf hat with a bell on the tip
  return { behind: "", front: `<g class="costume" ${INK}>
    <path d="M36 40 Q44 6 74 -2 Q100 -6 108 14 Q96 8 86 14 Q86 30 86 40Z" fill="#3fae4f"/>
    <rect x="30" y="32" width="62" height="13" rx="6.5" fill="#e8312f"/>
    <circle cx="108" cy="16" r="6.5" fill="#ffd84a"/></g>` };
}

// ---------- the Christmas concert stage ----------
const BULBS = ["#ff5a5f", "#3fae4f", "#ffd84a", "#7cc6ff"];

// A string of fairy lights swagged across the top of the stage: four swags, four bulbs in each.
// The wire stretches to the width of the screen; the bulbs hang from it and blink on the beat.
export function fairyLights(n = 16) {
  const sag = x => 6 + 30 * Math.sin(Math.PI * ((x * 4) % 1));
  const wire = Array.from({ length: 81 }, (_, i) => `${(i / 0.8).toFixed(2)} ${sag(i / 80).toFixed(1)}`).join(" L");
  const bulbs = Array.from({ length: n }, (_, i) => {
    const x = (i + .5) / n;
    return `<i style="left:${(x * 100).toFixed(2)}%;top:${(sag(x) + 2).toFixed(1)}px;--c:${BULBS[i % BULBS.length]}"></i>`;
  }).join("");
  return `<svg viewBox="0 0 100 44" preserveAspectRatio="none"><path d="M${wire}" fill="none" stroke="#26314a" stroke-width="3" vector-effect="non-scaling-stroke"/></svg>${bulbs}`;
}

// A Christmas tree with twinkling lights and a pile of presents, one each side of the stage.
const TREE_BULBS = [[41, 28, "#ff5a5f"], [51, 40, "#ffd84a"], [35, 46, "#7cc6ff"], [55, 58, "#ff5a5f"], [39, 60, "#ffd84a"], [47, 50, "#ff5ad5"], [45, 22, "#7cc6ff"], [29, 64, "#3fd0ff"], [61, 64, "#ffd84a"]];
export const STAGE_TREE = `<svg viewBox="0 0 90 92" aria-hidden="true"><g stroke="#26314a" stroke-width="2" stroke-linejoin="round">
  <path d="M40 66h10v14H40z" fill="#8a5232"/><path d="M45 8 27 32h8L21 50h9L17 68h56L60 50h9L55 32h8z" fill="#3fae4f"/>
  <path class="topper" d="M45 0l2.5 6 6.5.5-5 4.3 1.6 6.4L45 13.8l-5.6 3.4 1.6-6.4-5-4.3 6.5-.5z" fill="#ffd84a"/></g>
  <g stroke="#26314a" stroke-width="1.2">${TREE_BULBS.map(([x, y, c], i) => `<circle class="bulb" cx="${x}" cy="${y}" r="2.8" fill="${c}" style="animation-delay:${(i * -.37).toFixed(2)}s"/>`).join("")}</g>
  <g stroke="#26314a" stroke-width="2" stroke-linejoin="round">
    <rect x="4" y="70" width="24" height="20" rx="2" fill="#e8312f"/><path d="M16 70v20M4 79h24" stroke="#ffd84a" stroke-width="3.5"/>
    <path d="M16 70c-6-7-11-2-6 0m6 0c6-7 11-2 6 0" fill="none" stroke="#ffd84a" stroke-width="2.5"/>
    <rect x="60" y="74" width="26" height="16" rx="2" fill="#7cc6ff"/><path d="M73 74v16" stroke="#3fae4f" stroke-width="3.5"/>
    <path d="M73 74c-5-6-9-1-5 0m5 0c5-6 9-1 5 0" fill="none" stroke="#3fae4f" stroke-width="2.5"/>
    <rect x="34" y="80" width="18" height="10" rx="2" fill="#ffd84a"/><path d="M43 80v10" stroke="#e8312f" stroke-width="3"/></g></svg>`;

// Santa in his sleigh, pulled by three reindeer, flying left to right.
const reindeer = x => `<g stroke-linecap="round">
  <path d="M${x + 12} 50 L${x + 24} 62 M${x + 8} 51 L${x + 17} 66 M${x - 12} 50 L${x - 25} 58 M${x - 8} 51 L${x - 20} 63" stroke="#6b3f22" stroke-width="3.5"/>
  <path d="M${x + 21} 26 L${x + 17} 16 M${x + 18} 20 L${x + 12} 17 M${x + 24} 26 L${x + 27} 15 M${x + 26} 20 L${x + 31} 16" stroke="#6b3f22" stroke-width="2.2"/>
  <path d="M${x + 10} 42 L${x + 20} 31" stroke="#26314a" stroke-width="9"/><path d="M${x + 10} 42 L${x + 20} 31" stroke="#b07a46" stroke-width="5"/>
  <circle cx="${x - 18}" cy="42" r="3.5" fill="#fff" stroke="#26314a" stroke-width="1.5"/>
  <ellipse cx="${x}" cy="46" rx="18" ry="9" fill="#b07a46" stroke="#26314a" stroke-width="2.5"/>
  <ellipse cx="${x + 24}" cy="30" rx="7.5" ry="5.5" fill="#b07a46" stroke="#26314a" stroke-width="2.5"/>
  <circle cx="${x + 25}" cy="28.5" r="1.3" fill="#26314a"/><circle cx="${x + 31}" cy="31" r="2" fill="#26314a"/>
  <path d="M${x - 5} 37.5 V55" stroke="#e8312f" stroke-width="3.5"/><circle cx="${x - 5}" cy="55" r="2.6" fill="#ffd84a" stroke="#26314a" stroke-width="1.2"/></g>`;
export const SLEIGH = `<svg viewBox="0 0 300 90" aria-hidden="true">
  <path d="M80 42 L${140 - 5} 44 M80 42 Q170 38 ${200 - 5} 44 M80 42 Q230 36 ${260 - 5} 44" stroke="#26314a" stroke-width="1.5" fill="none"/>
  ${reindeer(140)}${reindeer(200)}${reindeer(260)}
  <g stroke="#26314a" stroke-width="2.5" stroke-linejoin="round">
    <ellipse cx="22" cy="36" rx="15" ry="14" fill="#b07a46"/><rect x="14" y="16" width="14" height="12" rx="1.5" fill="#3fae4f"/><path d="M21 16v12" stroke="#ffd84a" stroke-width="2.5"/>
    <path d="M45 22 Q51 6 66 11 L65 21 Z" fill="#e8312f"/><circle cx="66" cy="11" r="3.5" fill="#fff"/>
    <path d="M38 62 Q35 34 54 32 Q72 34 70 62Z" fill="#e8312f"/><path d="M60 46 L80 41" stroke="#e8312f" stroke-width="7" stroke-linecap="round"/>
    <circle cx="55" cy="27" r="8" fill="#ffd9b8"/><rect x="44" y="18" width="21" height="6" rx="3" fill="#fff"/>
    <path d="M46 28 Q55 46 64 28 Q55 33 46 28Z" fill="#fff"/>
    <path d="M14 82 H100 Q114 82 112 68" stroke="#ffc83d" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M32 82 V72 M86 82 V72" fill="none"/>
    <path d="M8 40 Q6 74 30 74 H96 Q110 74 110 60 Q110 52 102 54 Q100 62 92 62 H34 Q26 62 26 48 Z" fill="#e8312f"/>
    <path d="M14 67 H96" stroke="#ffc83d" stroke-width="3" fill="none"/></g></svg>`;

// Handbells, one in each hand, for the band member who plays the trumpet the rest of the year.
// Each bell hangs from (0, 0) so it can swing from its handle.
const BELL = `<g class="ring" stroke="#26314a" stroke-width="2.5" stroke-linejoin="round"><rect x="-2.5" y="0" width="5" height="10" rx="2" fill="#a86a32"/>
  <path d="M-9 20 Q-9 8 0 8 Q9 8 9 20 L12 30 H-12 Z" fill="#ffc83d"/><circle cx="0" cy="33" r="3" fill="#ffc83d"/>
  <path d="M-1 9 l-6 -4 M1 9 l6 -4" stroke="#e8312f" stroke-width="3" stroke-linecap="round" fill="none"/></g>`;
export const HANDBELLS = `<svg viewBox="0 0 120 120" aria-hidden="true"><g transform="translate(102 62) rotate(-12)">${BELL}</g><g transform="translate(18 64) rotate(12)">${BELL}</g></svg>`;
