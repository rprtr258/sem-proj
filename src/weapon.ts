import {ID, Vec2, vec2Cross, add, sub, rectContains, vec2Normalized} from "./types.ts";
import {GameMap} from "./map.ts";

export type ComponentBullet = {
  pos: Vec2,
  dir: Vec2,
};

export const BULLET_DAMAGE = 30;

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

export function calcEnd(mouseCoord: Vec2, playerCoord: Vec2, map: GameMap): Vec2 {
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

export const LASER_DAMAGE = 20;

export type ComponentGrenade = {
  pos: Vec2,
  speed: Vec2,
  counter: number,
  exploding: boolean,
};

export const GRENADE_DAMAGE = 10;

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
