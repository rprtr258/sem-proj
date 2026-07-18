import {
  Vec2, add, mul, sub, vec2Dist, vec2Normalized,
  rect, rectContains, rectIntersects,
  Entity, newEntity, ID,
} from "./types.ts";
import {GameMap} from "./map.ts";
import {Bot} from "./bot.ts";
import {Character} from "./character.ts";
import {
  WeaponType, ComponentWeapon, damage,
  ComponentBullet,
  calcEnd, ComponentLaser, intersect,
  ComponentGrenade,
} from "./weapon.ts";

const player_spawn: Vec2 = {x: 140, y: 50};
const bot_spawn: Vec2 = {x: 500, y: 50};

export class World {
  map: GameMap;

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
    this.player = new Character(player_spawn, "player");
    this.bot = new Bot(bot_spawn);
  }

  keyPressEvent(key: string): void {
    if (this.isKeyPressed.has(key)) return;
    this.isKeyPressed.add(key);
    switch (key) {
      case "KeyA": this.player?.goLeft();       break;
      case "KeyD": this.player?.goRight();      break;
      case "KeyW": this.player?.jump(this.map); break;
      case "Tab":  this.player?.changeWeapon(); break;
    }
  }

  keyReleaseEvent(key: string): void {
    this.isKeyPressed.delete(key);
    switch (key) {
      case "KeyA": this.player?.stopLeft();  break;
      case "KeyD": this.player?.stopRight(); break;
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
      }
    }

    // bullets
    {
      for (const [eid, c] of this.component_bullet) {
        c.pos = add(c.pos, c.dir);
        if (
          c.pos.x < -200 || c.pos.x > 640+200 ||
          c.pos.y < -200 || c.pos.y > 480+200 ||
          this.map.isFilledRect(rect(c.pos, 1, 1))
        ) {
          this.component_delete.add(eid);
        }
      }
    }

    // lasers
    {
      for (const [eid, c] of this.component_laser) {
        const c = this.component_laser.get(eid)!;
        c.lifetime--;
        if (c.lifetime === 0)
          this.component_delete.add(eid);
      }
    }

    // grenades
    {
      for (const [eid, c] of this.component_grenade) {
        if (!c.exploding)
          c.speed.y += 1;

        c.pos = add(c.pos, c.speed);

        const bb = rect(c.pos, 30, 30);
        if ((c.pos.x < -200 || c.pos.x > 640+200 || c.pos.y < -200 || c.pos.y > 480+200 || this.map.isFilledRect(bb)) && c.counter === -1) {
          c.pos = sub(c.pos, c.speed);
          c.speed = mul(c.speed, 0.01);
          let tries = 1000;
          const sz = 30;
          while (!this.map.isFilledRect(rect(add(add(c.pos, c.speed), { x: 15 - sz / 2, y: 15 - sz / 2 }), sz, sz))) {
            c.pos = add(c.pos, c.speed);
            tries--;
            if (tries === 0)
              continue;
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
          this.component_laser.set(eid, {
            pos: c.pos,
            dir: sub(calcEnd(c.target, c.pos, this.map), c.pos),
            active: true,
            lifetime: 20,
          });
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

    this.player.update(this.map);
    this.map.setMarkedPoint("player", this.player.m_coord);
    this.bot.update(this);
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
}
