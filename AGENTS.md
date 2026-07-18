# sem-proj

2D platformer fighting game — player vs bot, with spells (bullet / laser / grenade), health, mana, and score.

## Tech stack
- **Runtime:** Bun
- **Language:** TypeScript (strict, ESNext modules)
- **Bundler:** `bun build --target browser`
- **Type checker:** `tsc --noEmit`
- **Linting / formatting:** none configured (keep clean yourself)

## Commands
| Command | What it does |
|---------|-------------|
| `bun run typecheck` | Type-check with tsc |
| `bun run build` | Bundle `src/main.ts` → `dist/` |
| `bun run start` | Start dev server on port 8080, blocking, never run |
| `bun run dev` | typecheck → build → start (watch mode), blocking, never run |

## Project structure

```
src/      — source code
img/      — assets (sprites, backgrounds, icons)
```

## Data flow
1. `main.ts` runs the game loop (`requestAnimationFrame`) with a fixed 20ms tick.
2. `World.update()` is called each tick:
   - Handles pending weapon attacks (mouse held → `player.attack()`).
   - Deletes queued entities.
   - Resolves bullet/laser/grenade hits against the opposing character's bounding box.
   - Advances projectile positions (bullets in a straight line, grenades with gravity).
   - Updates player movement, then marks player position for the bot.
   - Updates bot AI state machine.
   - Checks death/respawn.
3. `Renderer.render()` draws everything (background, platforms, characters, projectiles, crosshair, HUD).

## ECS-like patterns
Entities are numeric IDs. Components are `Map<Entity, T>`:

Weapon types: `0` = bullet (instant travel), `1` = laser (line-of-sight), `2` = grenade (parabolic arc, AOE).

## Conventions
- **Naming:** snake_case everywhere
- **Imports:** `.ts` extensions required
- **Helpers in types.ts:** `add`, `sub`, `mul`, `vec2Normalized`, `vec2Dist`, `rect`, `rectContains`, `rectIntersects`.
- **No external libs** beyond `typescript` and `@types/bun`. Keep it simple.
- **Make surgical changes.** Don't refactor adjacent code unless it's directly related to the task. If your change creates dead code (unused variables/imports), clean those up — but don't touch pre-existing dead code unless asked.
- **TypeScript strict mode** is on — avoid `any`, prefer explicit types.
