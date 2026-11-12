# Japan games pack checklist

**Created:** November 11, 2026  
**Updated:** November 11, 2026  
**Source:** User-provided _Japan-Pack-Build-Prompts.md_ and _Japanese games and rules_.

This checklist tracks the ten entries in the Japan pack. Gomoku is playable and shared with
Japan; Go already had a coming-soon entry and is now shared with Japan. The other eight
unregistered titles now have coming-soon catalog entries and rules-book placeholders. A game
is checked off only after its rules, interface, registry/rules-book entry, required tests, and
applicable integration work are complete.

## Preparation

- [x] Review the Japan pack prompts and identify the nine new games plus existing Gomoku.
- [x] Record the required dependency order and cross-cutting integration work.
- [x] Add Japan to the nation list and tag existing Gomoku for both China and Japan.
- [x] Register the Japan-pack titles in the catalog and rules book; keep unimplemented games coming soon.
- [x] Link the Japan pack checklist from the game catalog and README.

## Game checklist

### Gomoku (existing; shared with China and Japan)

- [x] Tag the existing game with `china` and `japan`.
- [x] Confirm both nation filters include it in registry tests and browser checks.
- [ ] Keep its current rules, component, AI, tests, and rules-book entry working.

### Renju

- [x] Add a Japan coming-soon catalog entry and rules-book placeholder.
- [ ] Extract reusable grid-line helpers and keep Gomoku behavior unchanged.
- [ ] Implement 15×15 rules, Black forbidden-move validation, and rules tests.
- [ ] Add AI that never selects a forbidden Black move.
- [ ] Add the responsive game UI, per-game option, rules-book content, and Japan registry entry.
- [ ] Verify engine contract, AI legality, and integration tests.

### Shogi and Minishogi

- [x] Add a Japan coming-soon Shogi catalog entry and rules-book placeholder.
- [ ] Implement standard and mini board data, movement, captures, promotion, and drops.
- [ ] Enforce check, nifu, pawn-drop mate, repetition, impasse, and move-cap rules.
- [ ] Add deterministic hashing, Worker AI, notation, and rules tests.
- [ ] Add the responsive game UI, variant/piece options, rules-book content, and Japan registry entry.
- [ ] Verify contract tests, random playout termination, AI limits, and integration.

### Go

- [x] Tag the existing coming-soon Go entry for China and Japan.
- [ ] Implement 9×9 and 13×13 rules, captures, suicide, positional superko, passing, and area scoring.
- [ ] Add scoring, finish-playout helper, opening data, MCTS policy, and rules tests.
- [ ] Add the responsive game UI, rules-book content, and shared China/Japan registry entry.
- [ ] Benchmark move application and AI throughput; verify contracts, termination, and Worker limits.

### Koi-Koi

- [x] Add a Japan coming-soon catalog entry and rules-book placeholder.
- [ ] Add and verify a reusable Hanafuda deck/data module using a documented source.
- [ ] Implement the round phases, captures, yaku, koi-koi/shobu decisions, and hidden observations.
- [ ] Add rules tests, AI, game UI, rules-book content, and Japan registry entry.
- [ ] Verify seeded determinism, hidden-information boundaries, and game termination.

### Ban-Sugoroku

- [x] Add a Japan coming-soon catalog entry and rules-book placeholder.
- [ ] Implement modern backgammon-family rules, dice, legal moves, scoring, and match lengths.
- [ ] Add tests for bar entry, hits, dice restrictions, bearing off, and scoring.
- [ ] Add AI, responsive accessible board, rules-book content, and Japan registry entry.
- [ ] Verify hidden-engine contract, seeded determinism, and termination.

### E-Sugoroku (Tokaido)

- [x] Add a Japan coming-soon catalog entry and rules-book placeholder.
- [ ] Define the station/effect board as validated data.
- [ ] Implement dice, chained effects, exact finish/bounce-back, turn skips, and rankings.
- [ ] Add seeded rules tests and a 2–4 player game UI with accessible SVG board.
- [ ] Add rules-book content, Japan registry entry, casual stats/points, and original-art attribution.
- [ ] Verify effect chains, determinism, and bounded playouts.

### Karuta and Uta-garuta

- [x] Add a Japan coming-soon catalog entry and rules-book placeholder.
- [ ] Obtain and vet the poem source file and the licence for any English glosses.
- [ ] Add the poem build script, kimariji data, and uniqueness tests; use explicit placeholders until source is available.
- [ ] Implement deterministic competitive and casual modes, CPU timing, and rules tests.
- [ ] Add accessible game UI, rules-book content, original card styling, and Japan registry entry.
- [ ] Verify fixed-step determinism, CPU behavior, and replay constraints.

### Ohajiki

- [x] Add a Japan coming-soon catalog entry and rules-book placeholder.
- [ ] Implement integer-only physics and deterministic solo/duel rules.
- [ ] Add seeded physics/rules tests and replay validation hooks.
- [ ] Add the responsive game UI, rules-book content, original glass-piece styling, and Japan registry entry.
- [ ] Verify solo/duel scoring, fouls, determinism, and replay consistency.

### Fukuwarai

- [x] Add a Japan coming-soon catalog entry and rules-book placeholder.
- [ ] Add the `toy` game type and participation-only stats/points with a daily cap.
- [ ] Create original face-part SVG data and pure placement/wobble rules.
- [ ] Add Blindfold, Free Play, Daily Face, Director, and keyboard-accessible Guide modes.
- [ ] Add local PNG export and a capped local gallery; do not upload faces.
- [ ] Add rules-book content, Japan registry entry, component tests, and migration tests.

## Shared engine, app, and release integration

- [ ] Add generic MCTS and additive alpha-beta hashing/node-limit/quiescence options.
- [ ] Support per-game search kinds/limits in the Worker without breaking existing engines.
- [ ] Add the shared expert-entitlement check and Japanese per-game settings.
- [ ] Update game groups, rules registry, stats schemas/migrations, points, and existing-data migrations.
- [ ] Update Supabase/Worker allowlists and plausibility validation where supported by the current app.
- [ ] Add cosmetics and achievement seed data; keep unsupported online features explicitly inactive.
- [ ] Add asset/source/licence documentation for every data or original-art source used.
- [ ] Run game-family contracts, seeded tournaments, `npm run check`, and production build.
- [ ] Complete keyboard, screen-reader, mobile viewport, and offline checks for the Japan pack.

## Dependency order and notes

1. Shared engine hardening (MCTS/search limits) precedes Renju, Shogi, and Go.
2. Hidden-information foundations precede Koi-Koi, Ban-Sugoroku, and E-Sugoroku.
3. Fixed-step arcade foundations precede Karuta and Ohajiki.
4. Fukuwarai is independent of the game engines, but needs the new `toy` registry/stat path.
5. Pack-wide stats, points, backend, cosmetics, and online integration follows game implementation.

The attached build prompts reference existing hidden-information and arcade cores, but this
repository currently only has the hidden-engine interface (not a seeded RNG/hidden-game runner)
and has no arcade simulation core. Confirm and add the needed foundations before marking dependent
games complete. The Karuta poem source is described as a separately supplied file and was not
included with the attachments; do not invent poem text or use unverified translations.
