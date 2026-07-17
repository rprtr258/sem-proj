import {Vec2, add, mul, newEntity, rect, sub, vec2Dist} from "./types.ts";
import {Projectile} from "./projectile.ts";
import {Character} from "./character.ts";
import {GameMap} from "./map.ts";
import {Weapon} from "./weapon.ts";
import {World} from "./world.ts";

export type ComponentGrenade = {
  pos: Vec2,
  counter: number,
  exploding: boolean,
};

export function Grenade(direction: Vec2, damage: number): Projectile {
  const eid = newEntity();
  let m_speed = { x: direction.x / 17, y: direction.y / 12 };

  return {
    eid,
    affect(w: World, character: Character): void {
      const c = w.component_grenade.get(eid)!;
      if (c.counter === 17) {
        const dist = vec2Dist(c.pos, add(character.boundingBox, mul({
          x: character.boundingBox.w,
          y: character.boundingBox.h,
        }, 1/2)));
        character.hit(Math.sqrt(Math.max(0, 200 * 200 - dist * dist)) * damage / 100);
      }
    },
    update(w: World): boolean {
      const c = w.component_grenade.get(eid)!;

      if (!c.exploding)
        m_speed.y += 1;

      c.pos = add(c.pos, m_speed);

      const bb = rect(c.pos, 30, 30);
      if ((c.pos.x < -200 || c.pos.x > 640+200 || c.pos.y < -200 || c.pos.y > 480+200 || w.map.isFilledRect(bb)) && c.counter === -1) {
        c.pos = sub(c.pos, m_speed);
        m_speed = mul(m_speed, 0.01);
        let tries = 1000;
        const sz = 30;
        while (!w.map.isFilledRect(rect(add(add(c.pos, m_speed), { x: 15 - sz / 2, y: 15 - sz / 2 }), sz, sz))) {
          c.pos = add(c.pos, m_speed);
          tries--;
          if (tries === 0)
            break;
        }
        c.counter = 18;
        m_speed = { x: 0, y: 0 };
        c.exploding = true;
        return false;
      }

      if (c.counter > -1) {
        c.counter--;
      }
      return c.counter === 0;
    },
  };
}

export const GrenadeGun: Weapon = {
  m_damage: 10,
  m_mana: 40,
  shoot(
    mouseCoord: Vec2,
    playerCoord: Vec2,
    w: World,
  ): Projectile {
    const p = Grenade(sub(mouseCoord, playerCoord), this.m_damage);
    w.component_grenade.set(p.eid, {pos: playerCoord, counter: -1, exploding: false});
    return p;
  },
};