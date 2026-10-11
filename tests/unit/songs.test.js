import { test } from "node:test";
import assert from "node:assert/strict";
import { SONGS, CHORD } from "../../src/songs.js";

test("there are five different nursery rhymes", () => {
  assert.equal(SONGS.length, 5);
  assert.equal(new Set(SONGS.map(s => s.name)).size, 5);
});

for (const song of SONGS) {
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
      assert.ok(Number.isInteger(m) && m >= 60 && m <= 88, `note ${m}`);
      assert.ok(len > 0 && len <= 4, `length ${len}`);
    }
  });

  test(`${song.name}: the concert lasts under a minute`, () => {
    const seconds = song.chords.length * song.bar * song.reps * 60 / song.bpm;
    assert.ok(seconds > 8 && seconds < 60, `${seconds.toFixed(1)}s`);
  });
}
