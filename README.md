# Last Hit Kingdom

A 2–4 player fantasy territory conquest dice board game. There is no money: troops pay for monster attacks, upgrades, passage damage, invasions, survival releases, and victory tempo.

## Starter application note

The requested GitHub starter clone was blocked in this environment by a `CONNECT tunnel failed, response 403` error. This repository therefore contains a vanilla starter-compatible scaffold using the requested file names and responsibilities: `index.html`, `sw.js`, `manifest.json`, `js/app-config.js`, `js/devtools.js`, `js/storage.js`, `js/net.js`, `js/audio.js`, `js/palettes.js`, `audio-preview.html`, `scripts/simulate.mjs`, and `tools/gen-icons.js`.

## Initial APP_ID and namespace

- `APP_ID`: `last-hit-kingdom`
- Game name: `Last Hit Kingdom`
- Firebase namespace plan: write rooms under `apps/last-hit-kingdom/rooms/{roomId}` and merge `database.rules.snippet.json` into the shared Firebase rules instead of replacing the whole ruleset.

## Reused starter-compatible files

- `sw.js`: network-first service worker with versioned cache cleanup.
- `index.html`: mobile-friendly PWA entry point and service worker registration.
- `js/app-config.js`: app id, display name, version, Firebase namespace, and feature flags.
- `js/devtools.js`: version badge, five-tap reset, and error overlay.
- `js/storage.js`: version-tagged local state helpers.
- `js/net.js`: namespace helpers, undefined sanitization, and `seq` acceptance guard.
- `js/audio.js` and `js/palettes.js`: audio API and fantasy boardgame palette placeholders.
- `scripts/simulate.mjs`: 2–4 player automated rule-engine simulation.
- `tools/gen-icons.js`: PWA icon generator placeholder.

## Rules engine location and UI separation

Rules live under `js/game/rules/` and are called through `js/game/state/reducer.js`. UI rendering in `js/ui.js` only reads state and dispatches high-level actions; it does not contain combat, support, passage, invasion, boss, trait, or victory calculations.

## Implemented local prototype

- 2–4 local players.
- Fixed square-loop board with four lines, gates, war councils, prison, events, capital, and boss tile.
- Dice movement with capital and boss pass effects.
- Monster HP persistence and last-hit territory ownership.
- Territory levels 1–3 through upgrades.
- Passage damage, adjacent support, invasion requirements, and invasion capture.
- Territory release/refund and elimination helper.
- Capital supply, job assignment, level-up helper.
- Shared trait offer, reroll helper, and acquisition removal from the shared pool.
- Elimination, line conquest, and boss kill victory checks.
- Rule-based AI and simulation stats.

## Not yet implemented / TODO

- Full online Firebase room lifecycle and authentication.
- Human choice dialogs for exact troop assignment and release selection.
- Gate, war council, prison, and event tile effects beyond state placeholders.
- Rich animation and generated production audio.
- Full job-specific ability list and expanded trait balancing.
- Playtest-driven balance pass.

## Run

```bash
npm test
npm run simulate
python3 -m http.server 8000
```

Then open `http://localhost:8000`.
