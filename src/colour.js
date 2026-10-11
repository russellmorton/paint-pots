// Painter's colour mixing shared by the game and the tests.
export const C = {
  W: [1, 1, 1],
  R: [.88, .08, .2],
  Y: [1, .86, .1],
  B: [.1, .35, .85],
  RY: [1, .5, .05],
  RB: [.48, .16, .62],
  YB: [.2, .68, .24],
  RYB: [.45, .27, .13],
};
export function ryb(r, y, b) {
  const out = [0, 0, 0];
  const w = [
    [(1-r)*(1-y)*(1-b), C.W], [r*(1-y)*(1-b), C.R], [(1-r)*y*(1-b), C.Y], [(1-r)*(1-y)*b, C.B],
    [r*y*(1-b), C.RY], [r*(1-y)*b, C.RB], [(1-r)*y*b, C.YB], [r*y*b, C.RYB],
  ];
  for (const [k, c] of w) for (let i = 0; i < 3; i++) out[i] += k * c[i];
  return out;
}
export function mix(d) {
  const t = d.r + d.y + d.b + d.w;
  if (!t) return null;
  const m = Math.max(d.r, d.y, d.b);
  const base = m ? ryb(d.r / m, d.y / m, d.b / m) : [.99, .99, .97];
  const k = d.w / t;
  return base.map(v => v + (1 - v) * k * (m ? 1 : 0));
}
export const dist = (a, b) => Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2]);
export const css = c => `rgb(${c.map(v => Math.round(v * 255)).join(",")})`;
export const recipe = o => ({ r: 0, y: 0, b: 0, w: 0, ...o });

export const PAINT = { r: mix(recipe({r:1})), y: mix(recipe({y:1})), b: mix(recipe({b:1})), w: [.99,.99,.97] };
export const PAINT_NAME = { r: "red", y: "yellow", b: "blue", w: "white" };

export const TARGETS = [
  { name: "orange", rec: { r: 1, y: 1 } },
  { name: "green", rec: { y: 1, b: 1 } },
  { name: "purple", rec: { r: 1, b: 1 } },
  { name: "pink", rec: { r: 1, w: 1 } },
  { name: "light blue", rec: { b: 1, w: 1 } },
  { name: "brown", rec: { r: 1, y: 1, b: 1 } },
].map(t => ({ ...t, rgb: mix(recipe(t.rec)) }));

export const NAMED = [
  ["red", {r:1}], ["yellow", {y:1}], ["blue", {b:1}], ["white", {w:1}],
  ["orange", {r:1,y:1}], ["green", {y:1,b:1}], ["purple", {r:1,b:1}], ["brown", {r:1,y:1,b:1}],
  ["pink", {r:1,w:1}], ["light blue", {b:1,w:1}], ["light green", {y:1,b:1,w:1}],
  ["lilac", {r:1,b:1,w:1}], ["peach", {r:1,y:1,w:1}], ["cream", {y:1,w:1}],
  ["red orange", {r:2,y:1}], ["yellow orange", {r:1,y:2}], ["lime", {y:2,b:1}],
  ["teal", {y:1,b:2}], ["magenta", {r:2,b:1}], ["violet", {r:1,b:2}],
  ["dark brown", {r:1,y:1,b:2}], ["grey", {r:1,y:1,b:1,w:2}],
].map(([n, r]) => [n, mix(recipe(r))]);
export const nameOf = c => NAMED.reduce((best, [n, v]) => { const d = dist(c, v); return d < best.d ? { n, d } : best; }, { n: "", d: 9 }).n;

export const MAX = 12, MATCH = 0.12;
