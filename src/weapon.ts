import {Vec2} from "./types.ts";
import {Projectile} from "./projectile.ts";
import {World} from "./world.ts";

export type Weapon = {
  m_damage: number,
  m_mana: number,
  shoot(
    mouseCoord: Vec2,
    playerCoord: Vec2,
    w: World,
  ): Projectile,
}
