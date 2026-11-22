import {Vec2, Rect, sign, rect, rectTranslated, clamp, add, mul} from "./types.ts";
import {Field, ARENA_W, ARENA_H} from "./field.ts";

// wind (cells/tick) -> px/tick drift applied to the body; same ratio as the
// old game at 4px cells
const WIND_DRIFT = 0.8;
// px/tick spent digging out when a wave solidifies around the body
const UNBURY_STEP = 1;

// Shared physics for the player and all enemies, ported from the old
// Character class. Flyers skip gravity and terrain collision entirely
// (archetype "Летун ignores рельеф") and are clamped to the arena.
export class Body {
  coord: Vec2;
  vspeed = 0;
  health: number;
  maxHealth: number;
  boundingBox: Rect;
  jumpHeld = false;
  goingLeft = false;
  goingRight = false;
  flying = false;
  // flying bodies move toward this velocity each tick (px/tick)
  flyVelocity: Vec2 = {x: 0, y: 0};
  knockback: Vec2 = {x: 0, y: 0};
  mirrored = false;
  onGround = false;
  // chill debuff: 0..1 multiplier on walk speed, recovers over time
  chill = 0;
  // fly stamina (old Character.fly_energy): drains while hovering, restores
  // fast on the ground
  flyEnergy = 100;

  constructor(position: Vec2, size: Vec2, health: number, flying = false) {
    this.coord = {...position};
    this.health = health;
    this.maxHealth = health;
    this.boundingBox = rect(position, size.x, size.y);
    this.flying = flying;
  }

  goLeft(): void { this.goingLeft = true; }
  stopLeft(): void { this.goingLeft = false; }
  goRight(): void { this.goingRight = true; }
  stopRight(): void { this.goingRight = false; }

  hit(value: number): void {
    this.health = Math.max(0, this.health - value);
  }

  applyKnockback(v: Vec2): void {
    this.knockback = {x: this.knockback.x + v.x, y: this.knockback.y + v.y};
  }

  get dead(): boolean {
    return this.health <= 0;
  }

  update(field: Field): void {
    if (this.flying) {
      this.updateFlying();
      return;
    }

    this.chill = Math.max(0, this.chill - 0.004);
    const speed = 7 * (1 - this.chill * 0.6);

    // sustained hover while held, gated by fly stamina (old Character rules)
    const FLY_WASTE = 1.5;
    if (this.jumpHeld && this.flyEnergy > FLY_WASTE) {
      this.vspeed = 18;
      this.flyEnergy -= FLY_WASTE;
    }
    if (!this.jumpHeld) {
      if (field.isSolidRect(rectTranslated(this.boundingBox, 0, 1)))
        this.flyEnergy = Math.min(100, this.flyEnergy + 20); // restore fast on ground
      else if (this.vspeed <= 10)
        this.flyEnergy = Math.min(100, this.flyEnergy + 0.5); // slowly while falling
    }
    this.vspeed = Math.max(this.vspeed - 1, 0);

    const wind = field.velocityInRect(this.boundingBox);

    if (this.goingLeft !== this.goingRight) {
      if (this.goingLeft)
        this.moveHorizontal(field, -speed);
      if (this.goingRight)
        this.moveHorizontal(field, speed);
    }
    // gusts push the body even while standing
    this.moveHorizontal(field, wind.x * WIND_DRIFT);
    this.onGround = field.isSolidRect(rectTranslated(this.boundingBox, 0, 1));
    this.moveVertical(field, (10 - this.vspeed) + wind.y * WIND_DRIFT + this.knockback.y);
    this.moveHorizontal(field, this.knockback.x);
    this.knockback = {x: this.knockback.x * 0.8, y: this.knockback.y * 0.8};
    // a wave can solidify engulfing the body; dig upward until free
    let unbury = 12;
    while (unbury-- > 0 && field.isSolidRect(this.boundingBox)) {
      this.coord.y -= UNBURY_STEP;
      this.boundingBox.y -= UNBURY_STEP;
    }
    this.clampToArena();
  }

  private updateFlying(): void {
    this.chill = Math.max(0, this.chill - 0.004);
    this.coord.x = clamp(this.coord.x + this.flyVelocity.x, 0, ARENA_W - this.boundingBox.w);
    this.coord.y = clamp(this.coord.y + this.flyVelocity.y, 0, ARENA_H - this.boundingBox.h);
    this.boundingBox.x = this.coord.x;
    this.boundingBox.y = this.coord.y;
    this.knockback = {x: this.knockback.x * 0.8, y: this.knockback.y * 0.8};
  }

  private clampToArena(): void {
    this.coord.x = clamp(this.coord.x, 0, ARENA_W - this.boundingBox.w);
    this.coord.y = clamp(this.coord.y, -24, ARENA_H - this.boundingBox.h);
    this.boundingBox.x = this.coord.x;
    this.boundingBox.y = this.coord.y;
  }

  private moveHorizontal(field: Field, speed: number): void {
    let dx = speed;
    const delta = sign(speed);
    let newRect = rectTranslated(this.boundingBox, dx, 0);
    // retreat toward the start when blocked, never past it
    while (field.isSolidRect(newRect) && dx !== 0) {
      dx = delta > 0 ? Math.max(0, dx - 1) : Math.min(0, dx + 1);
      newRect = rectTranslated(this.boundingBox, dx, 0);
    }
    if (dx === 0)
      return;
    this.coord.x += dx;
    this.boundingBox.x += dx;
  }

  private moveVertical(field: Field, speed: number): void {
    let dy = speed;
    const delta = sign(speed);
    let newRect = rectTranslated(this.boundingBox, 0, dy);
    while (field.isSolidRect(newRect) && dy !== 0) {
      dy = delta > 0 ? Math.max(0, dy - 1) : Math.min(0, dy + 1);
      newRect = rectTranslated(this.boundingBox, 0, dy);
      this.vspeed = 0;
    }
    if (dy === 0)
      return;
    this.coord.y += dy;
    this.boundingBox.y += dy;
  }

  center(): Vec2 {
    return {x: this.boundingBox.x + this.boundingBox.w / 2, y: this.boundingBox.y + this.boundingBox.h / 2};
  }
}
