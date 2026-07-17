import {Vec2, vec2Cross, add, sub, rectContains, vec2Normalized, newEntity} from "./types.ts";
import {Projectile} from "./projectile.ts";
import {Character} from "./character.ts";
import {GameMap} from "./map.ts";
import {Weapon} from "./weapon.ts";
import {World} from "./world.ts";

export type ComponentLaser = {
  pos: Vec2,
  dir: Vec2,
};

function intersect(c: ComponentLaser, b1: Vec2, b2: Vec2): boolean {
  const v1 = vec2Cross(c.dir, sub(b1, c.pos));
  const v2 = vec2Cross(c.dir, sub(b2, c.pos));
  if (v1 * v2 > 0)
    return false;

  const edge = sub(b2, b1);
  const v3 = vec2Cross(edge, sub(c.pos, b1));
  const v4 = vec2Cross(edge, add(c.pos, sub(c.dir, b1)));
  if (v3 * v4 > 0)
    return false;

  return true;
}

export function Laser(damage: number): Projectile {
  const eid = newEntity();
  let m_active = true;
  let m_lifetime = 20;

  return {
    eid,
    affect(w: World, character: Character): void {
      if (!m_active)
        return;

      const c = w.component_laser.get(eid)!;
      const bb = character.boundingBox;
      if (
        intersect(c, bb, add(bb, {x: bb.w, y: 0})) ||
        intersect(c, add(bb, {x: bb.w, y: bb.h}), add(bb, {x: bb.w, y: 0})) ||
        intersect(c, add(bb, {x: bb.w, y: bb.h}), add(bb, {x: 0, y: bb.h})) ||
        intersect(c, bb, add(bb, {x: 0, y: bb.h}))
      ) {
        m_active = false;
        character.hit(damage);
      }
    },
    update(): boolean {
      m_lifetime--;
      return m_lifetime === 0;
    },
  };
}

function calcEnd(mouseCoord: Vec2, playerCoord: Vec2, map: GameMap): Vec2 {
  const d = sub(mouseCoord, playerCoord);
  const dir = vec2Normalized(d);
  let pos = {...playerCoord};
  while (!map.isFilled(pos) && inScreen(pos)) {
    pos = add(pos, dir);
  }
  return pos;
}

function inScreen(p: Vec2): boolean {
  return rectContains({x: -200, y: -200, w: 640+200, h: 480+200}, p);
}

export const LaserGun: Weapon = {
  m_damage: 10,
  m_mana: 45,
  shoot(
    mouseCoord: Vec2,
    playerCoord: Vec2,
    w: World,
  ): Projectile {
    const end = calcEnd(mouseCoord, playerCoord, w.map);
    const dir = sub(end, playerCoord);
    const p = Laser(20);
    w.component_laser.set(p.eid, {pos: playerCoord, dir});
    return p;
  },
};
