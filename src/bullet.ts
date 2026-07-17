import {Vec2, rect, vec2Normalized, rectContains, sub, mul, add, newEntity} from "./types.ts";
import {Projectile} from "./projectile.ts";
import {Character} from "./character.ts";
import {Weapon} from "./weapon.ts";
import {World} from "./world.ts";

export type ComponentBullet = {
  pos: Vec2,
  dir: Vec2,
};

export function Bullet(damage: number): Projectile {
  const eid = newEntity();
  let m_hit = false;

  return {
    eid,
    affect(w: World, character: Character): void {
      const c = w.component_bullet.get(eid)!;
      const bb = character.boundingBox;
      if (rectContains(bb, c.pos)) {
        character.hit(damage);
        m_hit = true;
      }
    },
    update(w: World): boolean {
      if (m_hit)
        return true;

      const c = w.component_bullet.get(eid)!;
      c.pos = add(c.pos, c.dir);
      return (
        c.pos.x < -200 || c.pos.x > 640+200 ||
        c.pos.y < -200 || c.pos.y > 480+200 ||
        w.map.isFilledRect(rect(c.pos, 1, 1))
      );
    },
  };
}

export const Gun: Weapon = {
  m_damage: 10,
  m_mana: 35,
  shoot(
    mouseCoord: Vec2,
    playerCoord: Vec2,
    w: World,
  ): Projectile {
    const p = Bullet(30);
    const direction = sub(mouseCoord, playerCoord);
    const n = vec2Normalized(direction);
    w.component_bullet.set(p.eid, {pos: playerCoord, dir: mul(n, 20)});
    return p;
  },
};
