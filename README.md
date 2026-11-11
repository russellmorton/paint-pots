# Paint Pots

A colour mixing game for a four-year-old. Tap the red, yellow, blue and white paint jars to pour paint into the bowl. The paint mixes the way real paint does, so yellow and blue make green.

- **Monsters:** each monster wants a colour. Mix it and the monster turns that colour and dances across the screen. Every fifth monster starts a concert with laser lights and a nursery rhyme (Twinkle Twinkle Little Star, Old MacDonald, Mary Had a Little Lamb, Row Your Boat, London Bridge).
- **Free mix:** mix anything; tapping the bowl says the colour's name.
- **At Halloween** (all of October) the table turns to night under an orange moon with bats, and the monsters dress up: a witch's hat, bat wings, a jack-o'-lantern on an antenna, or vampire fangs. The concert becomes a Spooky Monster Concert. The pumpkin button in the top bar turns it on or off on any day and is remembered; `?halloween=1` or `?halloween=0` in the address overrides both.
- **At Christmas** (12 November, the day after Remembrance Day, to 6 January) the table turns to a snowy night with a Christmas tree in the corner, and the monsters dress up: a Santa hat, reindeer antlers with a red nose, a star on the antenna, or an elf hat. The concert becomes a Christmas Monster Concert and plays carols instead of nursery rhymes (Jingle Bells, We Wish You a Merry Christmas, Deck the Halls, Silent Night). The Christmas tree button next to the pumpkin turns it on or off on any day and is remembered (turning one on turns the other off); `?christmas=1` or `?christmas=0` overrides both.

Live at https://paint-pots.vercel.app

## Running it

No build step. It's a static page with plain ES modules.

```sh
npm install
npm start          # http://localhost:4173
```

## Tests

```sh
npm run test:unit  # colour mixing and song data (node:test)
npm run test:e2e   # plays the game in Chromium (Playwright)
npm test           # both
```

## Layout

- `index.html` – markup and styles
- `src/colour.js` – painter's colour mixing (RYB) and the monster colours
- `src/songs.js` – the nursery rhyme and Christmas carol melodies and chords
- `src/halloween.js` – when it's Halloween, and the monsters' costumes
- `src/christmas.js` – when it's Christmas (never at the same time as Halloween), and the monsters' Christmas outfits
- `src/game.js` – everything else: bowl, monsters, dancing, concert, sound

## Deploying

Pushes to `main` deploy to production through Vercel's GitHub integration; pull requests get preview deployments. GitHub Actions runs the tests on every push and pull request. Vercel Web Analytics (`src/analytics.js`) counts visits to the live site, without cookies.

The tunes are traditional nursery rhymes in the public domain.
