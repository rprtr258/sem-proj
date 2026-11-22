import {
  Vec2, add, mul, sub, vec2Dist, vec2Normalized,
  rect, rectContains, rectIntersects,
  Rect, SolidProvider,
  Entity, newEntity, ID,
} from "./types.ts";
import {GameMap} from "./map.ts";
import {Bot} from "./bot.ts";
import {Character} from "./character.ts";
import {Field, FIELD_CELL} from "./field.ts";
import {
  WeaponType, ComponentWeapon, damage,
  ComponentBullet,
  calcEnd, ComponentLaser, intersect,
  ComponentGrenade,
  field_impact, field_beam,
} from "./weapon.ts";

const player_spawn: Vec2 = {x: 140, y: 50};
const bot_spawn: Vec2 = {x: 500, y: 50};

// px/tick of drift a projectile gains per cell/tick of wind flow
const WIND_CARRY = 0.08 * FIELD_CELL;
// projectile aerodynamic wake strength
const field_wake = 0.2;
// bullet leaves a light push trail behind it
const BULLET_TRAIL = {radius: 8, power: 0.2};
// grenade spins the air along its flight path (prototype tornado trail:
// radius 7 cells, power * 0.25, at 6px cells)
const GRENADE_VORTEX_TRAIL = {radius: 42, strength: 0.45};

export class World {
  map: GameMap;
  field: Field;
  // static geometry composed with temporary wave-solids
  solid: SolidProvider;
  showVectors = true;

  private isKeyPressed = new Set<string>();
  mousePressed = false;
  mouseCoord: Vec2 = {x: 320, y: 240};

  player: Character;
  bot: Bot;
  component_owner_id: Record<ID, Set<Entity>> = {"bot": new Set(), "player": new Set()};
  component_laser: Map<Entity, ComponentLaser> = new Map();
  component_grenade: Map<Entity, ComponentGrenade> = new Map();
  component_bullet: Map<Entity, ComponentBullet> = new Map();
  component_delete: Set<Entity> = new Set();
  component_weapon: Map<Entity, ComponentWeapon> = new Map();

  constructor() {
    this.map = new GameMap();
    this.field = new Field(this.map.rects);
    this.solid = {
      isFilledRect: (r: Rect) => this.map.isFilledRect(r) || this.field.isSolidRect(r),
    };
    this.player = new Character(player_spawn, "player");
    this.bot = new Bot(bot_spawn);
  }

  keyPressEvent(key: string): void {
    if (this.isKeyPressed.has(key))
      return;
    this.isKeyPressed.add(key);
    switch (key) {
      case "KeyA": this.player.goLeft();       break;
      case "KeyD": this.player.goRight();      break;
      case "Tab":  this.player.changeWeapon(); break;
      case "KeyV": this.showVectors = !this.showVectors; break;
    }
  }

  keyReleaseEvent(key: string): void {
    this.isKeyPressed.delete(key);
    switch (key) {
      case "KeyA": this.player.stopLeft();  break;
      case "KeyD": this.player.stopRight(); break;
    }
  }

  mouse_pressed(v: Vec2): void {
    this.mousePressed = true;
    this.mouseCoord = v;
  }

  mouse_moved(v: Vec2): void {
    this.mouseCoord = v;
  }

  mouse_released(): void {
    this.mousePressed = false;
  }

  update(): void {
    this.player.holding_jump = this.isKeyPressed.has("KeyW");
    if (this.mousePressed) {
      this.player.attack(this, this.mouseCoord);
    }

    // delete entities
    {
      for (const eid of this.component_delete) {
        for (const s of Object.values(this.component_owner_id))
          s.delete(eid);
        this.component_bullet.delete(eid);
        this.component_laser.delete(eid);
        this.component_grenade.delete(eid);
        this.component_weapon.delete(eid);
      }
      this.component_delete.clear();
    }

    for (const [eid, c] of this.component_bullet) {
      const character = this.component_owner_id["player"].has(eid) ? this.bot.character : this.player;
      const bb = character.boundingBox;
      if (rectContains(bb, c.pos)) {
        character.hit(damage[WeaponType.Bullet]);
        // knockback gust centered on the impact
        this.weaponBlast(c.pos, WeaponType.Bullet);
        this.component_delete.add(eid);
      }
    }
    for (const [eid, c] of this.component_laser) {
      const character = this.component_owner_id["player"].has(eid) ? this.bot.character : this.player;
      if (!c.active)
        continue;

      const bb = character.boundingBox;
      if (
        intersect(c, bb, add(bb, {x: bb.w, y: 0})) ||
        intersect(c, add(bb, {x: bb.w, y: bb.h}), add(bb, {x: bb.w, y: 0})) ||
        intersect(c, add(bb, {x: bb.w, y: bb.h}), add(bb, {x: 0, y: bb.h})) ||
        intersect(c, bb, add(bb, {x: 0, y: bb.h}))
      ) {
        c.active = false;
        character.hit(damage[WeaponType.Laser]);
        // the discharge yanks the air toward the victim
        this.weaponBlast(add(bb, mul({x: bb.w, y: bb.h}, 1/2)), WeaponType.Laser);
      }
    }
    for (const [eid, c] of this.component_grenade) {
      const character = this.component_owner_id["player"].has(eid) ? this.bot.character : this.player;
      if (c.counter === 17) {
        const dist = vec2Dist(c.pos, add(character.boundingBox, mul({
          x: character.boundingBox.w,
          y: character.boundingBox.h,
        }, 1/2)));
        character.hit(Math.sqrt(Math.max(0, 200 * 200 - dist * dist)) * damage[WeaponType.Grenade] / 100);
        // blast shoves everything away from the explosion
        this.weaponBlast(c.pos, WeaponType.Grenade);
      }
    }

    // bullets
    {
      for (const [eid, c] of this.component_bullet) {
        c.dir = add(c.dir, mul(this.field.velocityAt(c.pos), WIND_CARRY));
        this.field.wake(c.pos, mul(c.dir, 1 / FIELD_CELL), field_wake);
        this.field.disturb(c.pos, BULLET_TRAIL.radius, BULLET_TRAIL.power);
        c.pos = add(c.pos, c.dir);
        if (
          c.pos.x < -200 || c.pos.x > 640+200 ||
          c.pos.y < -200 || c.pos.y > 480+200 ||
          this.solid.isFilledRect(rect(c.pos, 1, 1))
        ) {
          if (!this.component_delete.has(eid))
            this.weaponBlast(c.pos, WeaponType.Bullet);
          this.component_delete.add(eid);
        }
      }
    }

    // lasers
    {
      for (const [eid, c] of this.component_laser) {
        if (c.active)
          this.disturbBeam(c.pos, c.dir);
        c.lifetime--;
        if (c.lifetime === 0)
          this.component_delete.add(eid);
      }
    }

    // grenades
    {
      for (const [eid, c] of this.component_grenade) {
        if (!c.exploding) {
          c.speed = add(c.speed, mul(this.field.velocityAt(c.pos), WIND_CARRY));
          this.field.wake(c.pos, mul(c.speed, 1 / FIELD_CELL), field_wake);
          this.field.vortex(c.pos, GRENADE_VORTEX_TRAIL.radius, GRENADE_VORTEX_TRAIL.strength);
          c.speed.y += 1;
        }

        c.pos = add(c.pos, c.speed);

        const bb = rect(c.pos, 30, 30);
        if ((c.pos.x < -200 || c.pos.x > 640+200 || c.pos.y < -200 || c.pos.y > 480+200 || this.solid.isFilledRect(bb)) && c.counter === -1) {
          c.pos = sub(c.pos, c.speed);
          c.speed = mul(c.speed, 0.01);
          let tries = 1000;
          const sz = 30;
          while (tries > 0 && !this.solid.isFilledRect(rect(add(add(c.pos, c.speed), { x: 15 - sz / 2, y: 15 - sz / 2 }), sz, sz))) {
            c.pos = add(c.pos, c.speed);
            tries--;
          }
          c.counter = 18;
          c.speed = { x: 0, y: 0 };
          c.exploding = true;
          continue;
        }

        if (c.counter === -1) {
          const character = this.component_owner_id["player"].has(eid) ? this.bot.character : this.player;
          if (rectIntersects(bb, character.boundingBox)) {
            c.counter = 18;
            c.speed = { x: 0, y: 0 };
            c.exploding = true;
            continue;
          }
        }

        if (c.counter > -1) {
          c.counter--;
        }
        if (c.counter === 0)
          this.component_delete.add(eid);
      }
    }

    for (const [wid, c] of this.component_weapon) {
      switch (c.type) {
        case WeaponType.Bullet: {
          const dir = sub(c.target, c.pos);
          const eid = newEntity();
          const angle = Math.atan2(dir.y, dir.x) + Math.random() * 0.5 - 0.25;
          this.component_bullet.set(eid, {
            pos: c.pos,
            dir: mul({x: Math.cos(angle), y: Math.sin(angle)}, 20),
          });
          this.component_owner_id[c.owner_id].add(eid);
        } break;
        case WeaponType.Laser: {
          const eid = newEntity();
          const dir = sub(calcEnd(c.target, c.pos, this.map), c.pos);
          this.component_laser.set(eid, {
            pos: c.pos,
            dir: dir,
            active: true,
            lifetime: 20,
          });
          this.disturbBeam(c.pos, dir);
          this.component_owner_id[c.owner_id].add(eid);
        } break;
        case WeaponType.Grenade: {
          const eid = newEntity();
          const direction = vec2Normalized(sub(c.target, c.pos));
          this.component_grenade.set(eid, {
            pos: c.pos,
            counter: -1,
            exploding: false,
            speed: mul(direction, 25),
          });
          this.component_owner_id[c.owner_id].add(eid);
        } break;
      }
      this.component_delete.add(wid);
    }

    this.field.tick();

    this.player.update(this.solid, this.field);
    this.map.setMarkedPoint("player", this.player.m_coord);
    this.bot.update(this);
    // characters that leave the world (flying over a side wall and falling
    // out) return to their initial position
    if (this.outOfWorld(this.player)) this.player.respawn(player_spawn);
    if (this.outOfWorld(this.bot.character)) this.bot.character.respawn(bot_spawn);
    if (this.player.health <= 0.2 || this.bot.character.health <= 0.2) {
      (this.player.health <= 0.2 ? this.bot.character : this.player).addKill();

      // clear all projectiles on death
      for (const s of Object.values(this.component_owner_id))
        s.clear();
      this.component_bullet.clear();
      this.component_laser.clear();
      this.component_grenade.clear();

      this.player.respawn(player_spawn);
      this.bot.character.respawn(bot_spawn);
    }
  }

  // outside the walls (or below the floor) — there is no way back in
  private outOfWorld(c: Character): boolean {
    return c.m_coord.x < -60 || c.m_coord.x > 690 || c.m_coord.y > 500;
  }

  // pull the air toward the beam line while it burns
  private disturbBeam(pos: Vec2, dir: Vec2): void {
    const dirNorm = vec2Normalized(dir);
    const len = vec2Dist(pos, add(pos, dir));
    for (let d = 0; d <= len; d += field_beam.step)
      this.field.disturb(add(pos, mul(dirNorm, d)), field_beam.radius, field_beam.power);
  }

  private weaponBlast(p: Vec2, type: WeaponType): void {
    const fi = field_impact[type];
    this.field.blast(p, fi.radius, fi.wind, fi.wave, fi.windRadius);
    if (fi.vortex !== 0)
      this.field.vortex(p, fi.vortexRadius, fi.vortex);
    // the field channel alone decays too fast to sell the hit (and a solid
    // dome absorbs its own kick), so bodies in the gust radius get a direct
    // decaying impulse; affects both fighters — the thrower included
    for (const c of [this.player, this.bot.character]) {
      const center = add(c.boundingBox, mul({x: c.boundingBox.w, y: c.boundingBox.h}, 1/2));
      const d = vec2Dist(p, center);
      if (d < fi.windRadius && d > 1) {
        const dir = vec2Normalized(sub(center, p));
        const falloff = Math.cos(Math.min(1, d / fi.windRadius) * Math.PI / 2);
        c.applyKnockback(mul(dir, fi.wind * FIELD_CELL * falloff));
      }
    }
  }
}
