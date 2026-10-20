import { test } from "node:test";
import assert from "node:assert/strict";
import { isHalloween, costume } from "../../src/halloween.js";

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
