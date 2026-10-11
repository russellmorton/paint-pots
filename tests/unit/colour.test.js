import { test } from "node:test";
import assert from "node:assert/strict";
import { C, mix, dist, css, recipe, TARGETS, nameOf, MAX, MATCH } from "../../src/colour.js";

const close = (a, b, eps = 1e-9) => assert.ok(dist(a, b) < eps, `${a} != ${b}`);

test("an empty bowl has no colour", () => {
  assert.equal(mix(recipe({})), null);
});

test("a single primary comes out as itself", () => {
  close(mix(recipe({ r: 1 })), C.R);
  close(mix(recipe({ y: 3 })), C.Y);
  close(mix(recipe({ b: 2 })), C.B);
});

test("primaries mix like paint, not like light", () => {
  close(mix(recipe({ r: 1, y: 1 })), C.RY);
  close(mix(recipe({ y: 1, b: 1 })), C.YB);
  close(mix(recipe({ r: 1, b: 1 })), C.RB);
  const [r, g, b] = mix(recipe({ y: 1, b: 1 }));
  assert.ok(g > r && g > b, "yellow + blue should be green");
});

test("only the ratio matters, not the number of drops", () => {
  close(mix(recipe({ r: 1, y: 2 })), mix(recipe({ r: 3, y: 6 })));
  close(mix(recipe({ b: 1, w: 1 })), mix(recipe({ b: 4, w: 4 })));
});

test("white lightens towards white", () => {
  const pink = mix(recipe({ r: 1, w: 1 }));
  const red = mix(recipe({ r: 1 }));
  for (let i = 0; i < 3; i++) assert.ok(pink[i] >= red[i]);
});

test("every monster colour can be made within the bowl's capacity", () => {
  for (const t of TARGETS) {
    const drops = Object.values(t.rec).reduce((a, n) => a + n, 0);
    assert.ok(drops <= MAX, t.name);
    assert.ok(dist(mix(recipe(t.rec)), t.rgb) < MATCH, t.name);
  }
});

test("no monster colour can be matched with a single paint", () => {
  for (const t of TARGETS) for (const k of ["r", "y", "b", "w"]) {
    assert.ok(dist(mix(recipe({ [k]: 1 })), t.rgb) >= MATCH, `${t.name} matched by ${k}`);
  }
});

test("monster colours are far enough apart that one mix can't match two", () => {
  for (const a of TARGETS) for (const b of TARGETS) {
    if (a !== b) assert.ok(dist(a.rgb, b.rgb) > 2 * MATCH, `${a.name} vs ${b.name}`);
  }
});

test("a close-enough ratio still counts, a lopsided one doesn't", () => {
  const orange = TARGETS.find(t => t.name === "orange").rgb;
  assert.ok(dist(mix(recipe({ r: 4, y: 3 })), orange) < MATCH);
  assert.ok(dist(mix(recipe({ r: 2, y: 1 })), orange) >= MATCH);
});

test("free mix names colours a child would recognise", () => {
  assert.equal(nameOf(mix(recipe({ r: 1 }))), "red");
  assert.equal(nameOf(mix(recipe({ y: 1, b: 1 }))), "green");
  assert.equal(nameOf(mix(recipe({ r: 1, b: 1 }))), "purple");
  assert.equal(nameOf(mix(recipe({ r: 1, w: 1 }))), "pink");
  assert.equal(nameOf(mix(recipe({ r: 1, y: 1, b: 1 }))), "brown");
  for (const t of TARGETS) assert.equal(nameOf(t.rgb), t.name);
});

test("css() writes an rgb() colour", () => {
  assert.equal(css([1, 0.5, 0]), "rgb(255,128,0)");
});
