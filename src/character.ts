import {Vec2, Rect, sign, rect, rectTranslated, clamp, ID, add, newEntity} from "./types.ts";
import {GameMap} from "./map.ts";
import {WeaponType, mana_cost, reload} from "./weapon.ts";
import {World} from "./world.ts";

export class Character {
  protected m_id: ID;
  m_coord: Vec2 = { x: 0, y: 0 };
  protected m_vspeed = 0;
  health = 100;
  mana = 100;
  score = 0;
  m_reload = 0;
  boundingBox: Rect = { x: 0, y: 0, w: 55, h: 90 };
  weaponId: WeaponType;
  m_goingLeft = false;
  m_goingRight = false;
  mirrored = false;
  inAir = true;

  constructor(position: Vec2, id: ID) {
    this.m_coord = {...position};
    this.boundingBox = rect(position, 55, 90);
    this.weaponId = WeaponType.Bullet;
    this.m_id = id;
  }

  // alias for m_coord so world/renderer can read position
  get x(): number { return this.m_coord.x; }
  get y(): number { return this.m_coord.y; }

  goLeft(): void { this.m_goingLeft = true; }
  stopLeft(): void { this.m_goingLeft = false; }
  goRight(): void { this.m_goingRight = true; }
  stopRight(): void { this.m_goingRight = false; }

  jump(map: GameMap): void {
    if (map.isFilledRect(rectTranslated(this.boundingBox, 0, 1)))
      this.m_vspeed = 30;
  }

  changeWeapon(): void {
    this.weaponId = (this.weaponId + 1) % 3 as WeaponType;
  }

  attack(w: World, p: Vec2): void {
    const mana = mana_cost[this.weaponId];
    if (this.m_reload === 0 && this.mana >= mana) {
      this.m_reload = reload[this.weaponId];
      this.mana -= mana;
      const hand = this.getHandPosition();
      w.component_weapon.set(newEntity(), {
        type: this.weaponId,
        mana: mana,
        owner_id: this.m_id,
        pos: hand,
        target: p,
      });
    }
  }

  hit(value: number): void {
    this.health = Math.max(0, this.health - value);
  }

  respawn(p: Vec2): void {
    this.m_coord = {...p};
    this.boundingBox = rect(p, 55, 90);
    this.health = 100;
    this.mana = 100;
    this.m_goingLeft = this.m_goingRight = false;
    this.m_vspeed = 0;
    this.m_reload = 0;
    this.mirrored = false;
  }

  get id(): ID { return this.m_id; }
  addKill(): void { this.score++; }

  update(map: GameMap): void {
    this.health = clamp(this.health + 0.2, 0, 100);
    this.mana = clamp(this.mana + 0.8, 0, 100);
    this.m_vspeed = Math.max(this.m_vspeed - 1, 0);
    this.m_reload = Math.max(this.m_reload - 1, 0);

    if (this.m_goingLeft !== this.m_goingRight) {
      if (this.m_goingLeft) {
        if (!this.mirrored)
          this.flipSprite();
        this.moveHorizontal(map, -5);
      }
      if (this.m_goingRight) {
        if (this.mirrored)
          this.flipSprite();
        this.moveHorizontal(map, 5);
      }
    }
    this.inAir = !map.isFilledRect(rectTranslated(this.boundingBox, 0, 1));
    this.moveVertical(map, 10 - this.m_vspeed);
  }

  protected flipSprite(): void {
    this.mirrored = !this.mirrored;
  }

  protected moveHorizontal(map: GameMap, speed: number): void {
    let dx = speed;
    const delta = sign(speed);
    let newRect = rectTranslated(this.boundingBox, dx, 0);
    while (map.isFilledRect(newRect) && dx !== 0) {
      dx -= delta;
      newRect = rectTranslated(newRect, -delta, 0);
    }
    if (dx === 0)
      return;
    this.m_coord.x += dx;
    this.boundingBox.x += dx;
  }

  protected moveVertical(map: GameMap, speed: number): void {
    let dy = speed;
    const delta = sign(speed);
    let newRect = rectTranslated(this.boundingBox, 0, dy);
    while (map.isFilledRect(newRect) && dy !== 0) {
      dy -= delta;
      newRect = rectTranslated(newRect, 0, -delta);
      this.m_vspeed = 0;
    }
    if (dy === 0)
      return;
    this.inAir = true;
    this.m_coord.y += dy;
    this.boundingBox.y += dy;
  }

  getHandPosition(): Vec2 {
    const o = {x: 8, y: 25};
    return add(this.m_coord, {x: this.mirrored ? o.x : 55 - o.x, y: o.y});
  }

  get going(): boolean {
    return this.m_goingLeft !== this.m_goingRight;
  }

  get attacking(): boolean {
    return this.m_reload !== 0;
  }
}
