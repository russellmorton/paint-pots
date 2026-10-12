# Paint Pots

A colour mixing game for a four-year-old. Tap the red, yellow, blue and white paint jars to pour paint into the bowl. The paint mixes the way real paint does, so yellow and blue make green.

- **Monsters:** each monster wants a colour. Mix it and the monster turns that colour and dances across the screen. Every fifth monster starts a concert with laser lights and a nursery rhyme (Twinkle Twinkle Little Star, Old MacDonald, Mary Had a Little Lamb, Row Your Boat, London Bridge).
- **Free mix:** mix anything; tapping the bowl says the colour's name.

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
- `src/songs.js` – the nursery rhyme melodies and chords
- `src/game.js` – everything else: bowl, monsters, dancing, concert, sound

## Deploying

Pushes to `main` deploy to production through Vercel's GitHub integration; pull requests get preview deployments. GitHub Actions runs the tests on every push and pull request. Vercel Web Analytics (`src/analytics.js`) counts visits to the live site, without cookies.

The tunes are traditional nursery rhymes in the public domain.
