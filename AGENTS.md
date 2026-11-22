# sem-proj

Noita-like field-simulation semi-auto battler (working title MAGNUM OPUS; M1 implemented):
spells are disturbances of continuous physical fields (density wave, wind, temperature),
PvE waves, run economy (gold, shop, wand assembly), 5 rounds, 3 attempts.
Design doc (GDD): `~/pr/notes/projects/noita-autobattler-gdd.md` — code comments reference
its sections (§7.x); keep both in sync when changing design-level numbers.

## Tech stack
- **Runtime:** Bun
- **Language:** TypeScript (strict, ESNext modules)
- **Bundler:** `bun build --target browser`
- **Type checker:** `tsc --noEmit`
- **Rendering:** Canvas2D 960×540, fixed 20ms tick, rAF render; hub screens are DOM overlays
- **Linting / formatting:** none configured (keep clean yourself)

## Commands
| Command | What it does |
|---------|-------------|
| `bun run typecheck` | Type-check with tsc |
| `bun run build` | Bundle `src/main.ts` → `dist/` |
| `bun run start` | Dev server on :8080 with watch + auto-reload (SSE), blocking, never run |
| `bun run dev` | typecheck → start, blocking, never run |
| `bun src/selftest.ts` | Headless checks (field sim, shop, casting, waves, NA1 round-trip); exits 1 on failure — run after sim/economy changes |

## Project structure

```
src/
  main.ts      — screens (menu → hub → splash → arena → result/death → runend), input, game loop
  field.ts     — the simulation: density wave + wind + temperature on a 4px grid (252×147,
                 terrain = base density cells, carve); materials: water/ice/steam
  world.ts     — combat: wave spawns, player/enemy updates, projectiles, effects
                 (vortex/pump/pulse), heat/cold damage, win/lose + stars
  body.ts      — shared physics for player & enemies: walk/fly (stamina), wind push,
                 knockback, dig-out of solidified waves
  enemies.ts   — 6 archetypes (plain type + makeEnemy factory), wave compositions R1–R5,
                 spawn points, round scaling
  spells.ts    — 11 spell defs: school, rarity, mana cost, cast behavior
  wand.ts      — RunState (persists across combat): gold, attempts, mana, wands, inventory,
                 stars; castNext = sequential casting (A→B→C→A, empty slots skipped)
  shop.ts      — shop page: 4 rolled spell cards + permanent wand/expand cards; reroll
                 re-rolls spells only; prices derived, never stored
  ui.ts        — DOM overlay screens: hub tabs, shop, assembly (drag&drop), NA1 import/export
  renderer.ts  — canvas draw: field tints + wind vector overlay (V), terrain, bodies,
                 projectiles, effects, crosshair, HUD (HP/mana/stamina/wand slots)
  icons.ts     — hand-drawn SVG rune per spell (shared by DOM and canvas HUD)
  i18n.ts      — RU (default) / EN UI strings; spell names/descs are {ru,en} in their defs
  buildcode.ts — NA1 build code export/import ("NA1:" + base64 JSON)
  selftest.ts  — headless PASS/FAIL checks
  types.ts     — Vec2/Rect helpers; Entity/newEntity helper exists but is currently unused
img/           — legacy sprites from the old M0 game; not referenced by current code
```

Architecture: plain classes (`World`, `Field`, `Body`, `RunState`, `Shop`, `Renderer`)
+ factory types — no ECS yet; the numeric-Entity helper in `types.ts` is a leftover seed
for a future refactor.

## Arena tick (20ms)

1. `main.ts` runs `World.update()` only on the arena screen; mouse aims, LMB casts the
   next spell of the active wand, Tab switches wand, V toggles the wind-vector overlay.
2. `World.update()`:
   - `run.tickMana()` (+0.8/tick), spawns wave packs by delay.
   - Player and enemies: `Body` physics — wind push (×0.8), collisions against the
     density field, contact/ranged AI (golems dig, flyers hover, ranged keep distance).
   - Projectiles: bullet straight (+ air wake), grenade arc + vortex trail, enemy
     bolts/heatbolts/iceshards.
   - Effects tick the field (vortex/pump/pulse) and damage in radius.
   - Heat/cold damage from the temperature field — the player burns too (heat school
     is friendly-fire by design).
   - Win = all packs spawned and enemies dead → stars (died?1 : hpLost?2 : 3).
     Lose = player dead → attempt −1, retry the same round (no hub in between).
3. `Renderer.render()` draws the field, terrain, bodies, projectiles, effects,
   crosshair and HUD.

## Conventions
- **Naming:** camelCase for functions/variables, PascalCase for classes/types,
  SCREAMING_SNAKE for module constants.
- **Imports:** `.ts` extensions required
- **Helpers in types.ts:** `sign`, `clamp`, `add`, `sub`, `mul`, `vec2Normalized`,
  `vec2Dist`, `rect`, `rectContains`, `rectIntersects`, `rectTranslated`.
- **User-facing strings** go through `i18n.ts` keys or `{ru, en}` pairs in spell defs —
  no hardcoded text.
- **No external libs** beyond `typescript` and `@types/bun`. Keep it simple.
- **Make surgical changes.** Don't refactor adjacent code unless it's directly related to the task. If your change creates dead code (unused variables/imports), clean those up — but don't touch pre-existing dead code unless asked.
- **TypeScript strict mode** is on — avoid `any`, prefer explicit types.
