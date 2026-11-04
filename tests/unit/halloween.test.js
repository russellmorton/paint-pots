import { test } from "node:test";
import assert from "node:assert/strict";
import { isHalloween, costume } from "../../src/halloween.js";
import { isChristmas, seasons, christmasCostume } from "../../src/christmas.js";

test("Halloween is all of October, and the address can switch it on or off", () => {
  assert.equal(isHalloween(new Date(2026, 9, 1)), true);
  assert.equal(isHalloween(new Date(2026, 9, 31, 23, 59)), true);
  assert.equal(isHalloween(new Date(2026, 8, 30)), false);
  assert.equal(isHalloween(new Date(2026, 10, 1)), false);
  assert.equal(isHalloween(new Date(2026, 3, 2), "?halloween=1"), true);
  assert.equal(isHalloween(new Date(2026, 9, 20), "?halloween=0"), false);
  assert.equal(isHalloween(new Date(2026, 9, 20), "?halloween=maybe"), true);
});

test("the pumpkin switch beats the date, and the address beats the switch", () => {
  assert.equal(isHalloween(new Date(2026, 4, 1), "", true), true);
  assert.equal(isHalloween(new Date(2026, 9, 20), "", false), false);
  assert.equal(isHalloween(new Date(2026, 4, 1), "?halloween=0", true), false);
});

test("every monster shape has a costume", () => {
  for (const kind of [0, 1, 2, 3]) for (const happy of [false, true]) {
    const { behind, front } = costume(kind, happy);
    assert.match(behind + front, /class="costume"/, `kind ${kind}`);
  }
});

test("Christmas is 1 December to 6 January; the switch beats the date and the address beats both", () => {
  for (const d of [new Date(2026, 11, 1), new Date(2026, 11, 25), new Date(2027, 0, 6, 23, 59)]) assert.equal(isChristmas(d), true, d);
  for (const d of [new Date(2026, 10, 30), new Date(2027, 0, 7)]) assert.equal(isChristmas(d), false, d);
  assert.equal(isChristmas(new Date(2026, 4, 1), "", true), true);
  assert.equal(isChristmas(new Date(2026, 11, 20), "?christmas=0", true), false);
});

test("Halloween and Christmas are never on together: the one asked for wins", () => {
  const may = new Date(2026, 4, 1), oct = new Date(2026, 9, 20), dec = new Date(2026, 11, 20);
  assert.deepEqual(seasons(oct), { halloween: true, christmas: false });
  assert.deepEqual(seasons(dec), { halloween: false, christmas: true });
  assert.deepEqual(seasons(oct, "", { christmas: true }), { halloween: false, christmas: true });
  assert.deepEqual(seasons(dec, "", { halloween: true }), { halloween: true, christmas: false });
  assert.deepEqual(seasons(may, "?halloween=1&christmas=1"), { halloween: false, christmas: true });
});

test("every monster shape has a Christmas outfit", () => {
  for (const kind of [0, 1, 2, 3]) {
    const { behind, front } = christmasCostume(kind);
    assert.match(behind + front, /class="costume"/, `kind ${kind}`);
  }
});
