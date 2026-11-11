import { test } from "node:test";
import assert from "node:assert/strict";
import { SONGS, CAROLS, CHORD } from "../../src/songs.js";

test("there are five different nursery rhymes", () => {
  assert.equal(SONGS.length, 5);
  assert.equal(new Set(SONGS.map(s => s.name)).size, 5);
});

test("there are four different Christmas carols, none of them a nursery rhyme", () => {
  assert.equal(CAROLS.length, 4);
  assert.equal(new Set([...SONGS, ...CAROLS].map(s => s.name)).size, 9);
});

for (const song of [...SONGS, ...CAROLS]) {
  test(`${song.name}: the melody fills its bars exactly`, () => {
    const beats = song.melody.reduce((a, [, len]) => a + len, 0);
    assert.ok(Math.abs(beats - song.chords.length * song.bar) < 1e-9, `${beats} beats for ${song.chords.length} bars`);
  });

  test(`${song.name}: chords are ones the band knows and divide each bar evenly`, () => {
    for (const bar of song.chords) {
      const parts = bar.split(" ");
      for (const c of parts) assert.ok(CHORD[c], `unknown chord ${c}`);
      assert.equal(song.bar % parts.length, 0, `"${bar}" doesn't split a ${song.bar}-beat bar`);
    }
  });

  test(`${song.name}: notes are in a singable range with sensible lengths`, () => {
    for (const [m, len] of song.melody) {
      assert.ok(m === 0 || (Number.isInteger(m) && m >= 60 && m <= 88), `note ${m}`);   // 0 is a rest
      assert.ok(len > 0 && len <= 4, `length ${len}`);
    }
    assert.ok(song.melody.filter(([m]) => m).length > song.melody.length * .9, "mostly notes, not rests");
  });

  test(`${song.name}: the concert lasts under a minute`, () => {
    const seconds = song.chords.length * song.bar * song.reps * 60 / song.bpm;
    assert.ok(seconds > 8 && seconds < 60, `${seconds.toFixed(1)}s`);
  });
}

test("every chord is a triad plus a low bass note", () => {
  for (const [name, [a, b, c, bass]] of Object.entries(CHORD)) {
    assert.ok(a < b && b < c && c - a <= 12, `${name} voicing`);
    assert.ok(bass <= a - 12, `${name} bass`);
  }
});
