import {ID, Vec2, vec2Cross, add, sub, rectContains, vec2Normalized} from "./types.ts";
import {Field} from "./field.ts";

export type ComponentBullet = {
  pos: Vec2,
  dir: Vec2,
};

export type ComponentLaser = {
  pos: Vec2,
  dir: Vec2,
  active: boolean,
  lifetime: number,
};

export function intersect(c: ComponentLaser, b1: Vec2, b2: Vec2): boolean {
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

export function calcEnd(mouseCoord: Vec2, playerCoord: Vec2, field: Field): Vec2 {
  const d = sub(mouseCoord, playerCoord);
  const dir = vec2Normalized(d);
  let pos = {...playerCoord};
  while (!field.isSolid(pos) && inScreen(pos)) {
    pos = add(pos, dir);
  }
  return pos;
}

function inScreen(p: Vec2): boolean {
  return rectContains({x: -200, y: -200, w: 640+200, h: 480+200}, p);
}

export type ComponentGrenade = {
  pos: Vec2,
  speed: Vec2,
  counter: number,
  exploding: boolean,
};

export enum WeaponType {
  Bullet,
  Laser,
  Grenade,
}

export type ComponentWeapon = {
  type: WeaponType,
  mana: number,
  owner_id: ID,
  pos: Vec2,
  target: Vec2,
};

export const damage: Record<WeaponType, number> = {
  [WeaponType.Bullet]: 30,
  [WeaponType.Laser]: 40,
  [WeaponType.Grenade]: 10,
};

export const mana_cost: Record<WeaponType, number> = {
  [WeaponType.Bullet]: 10,
  [WeaponType.Laser]: 30,
  [WeaponType.Grenade]: 20,
};

export const reload: Record<WeaponType, number> = {
  [WeaponType.Bullet]: 5,
  [WeaponType.Laser]: 10,
  [WeaponType.Grenade]: 7,
};

// weapon field effects on impact/explosion: a density dome (dense cores become
// temporary solid terrain), an ambient wind kick that deflects projectiles, and
// a direct knockback impulse on characters. wind/wave/knock > 0 push away,
// < 0 pull in; radii in px. windRadius is how far the gust/knock reaches.
// knock is scaled by FIELD_CELL in world.weaponBlast (px/tick impulse, decays 0.8/tick)
// vortex spins the wind around the impact (0 = off), scaled like the prototype's
// vortexPower (grenade: impact radius +3 cells and power x1.5, tornado-style)
export const field_impact: Record<WeaponType, {radius: number, windRadius: number, wind: number, wave: number, vortexRadius: number, vortex: number}> = {
  [WeaponType.Bullet]: {radius: 24, windRadius: 36, wind: 0.8, wave: 0.5, vortexRadius: 0, vortex: 0},
  [WeaponType.Laser]: {radius: 28, windRadius: 48, wind: -1.2, wave: -1.5, vortexRadius: 0, vortex: 0},
  [WeaponType.Grenade]: {radius: 48, windRadius: 120, wind: 1.5, wave: 1.2, vortexRadius: 72, vortex: 2.7},
};

// laser sustains a pull channel along the beam while it is active
export const field_beam = {radius: 12, power: -1.5, step: 8};
