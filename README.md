# sem-proj

A 2D platformer fighting game — player vs bot with spells, health, mana, and score.

## Quick start
```bash
bun install
bun run build   # bundle src/main.ts → dist/
bun run start   # dev server on http://localhost:8080
```

## How to play
| Key | Action |
|-----|--------|
| A/D | Move left/right |
| W | Jump |
| Tab | Switch weapon |
| Mouse | Aim + hold to fire |

Score a kill by reducing the opponent's health to zero. Both characters regenerate health and mana over time.

## Weapons
| Weapon | Mana cost | Reload (ticks) | Damage | Behavior |
|--------|-----------|----------------|--------|----------|
| Bullet | 10 | 5 | 30 | Instant straight-line travel. |
| Laser | 30 | 10 | 20 | Line-of-sight, hits first target in path. |
| Grenade | 20 | 7 | 10 (scaled by distance) | Parabolic arc, AOE explosion on impact. |
