import {Entity, ID, rect, Vec2} from "./types.ts";
import {GameMap} from "./map.ts";
import {Bot} from "./bot.ts";
import {Projectile} from "./projectile.ts";
import {Character} from "./character.ts";
import {ComponentLaser} from "./laser.ts";
import {ComponentGrenade} from "./grenade.ts";
import {ComponentBullet} from "./bullet.ts";

const player_spawn: Vec2 = {x: 140, y: 0};
const bot_spawn: Vec2 = {x: 500, y: 0};

export class World {
  player: Character;
  bot: Bot;
  map: GameMap;
  private isKeyPressed = new Set<string>();
  projectiles: Projectile[] = [];
  component_owner_id: Map<Entity, ID> = new Map();
  component_laser: Map<Entity, ComponentLaser> = new Map();
  component_grenade: Map<Entity, ComponentGrenade> = new Map();
  component_bullet: Map<Entity, ComponentBullet> = new Map();

  constructor() {
    this.map = new GameMap(
      rect({x: -40, y:   0}, 20, 480),  // left wall
      rect({x: 660, y:   0}, 20, 480),  // right wall
      rect({x: -40, y: 460}, 680, 20),  // bottom wall
      rect({x: -20, y: 274}, 188, 10),  // left platform
      rect({x: 473, y: 274}, 187, 10),  // right platform
      rect({x: 256, y: 113}, 128, 20),  // top platform
      rect({x: 310, y: 132}, 20, 150),  // central platform
    );
    this.player = new Character(player_spawn, "player", p => this.addProjectile(p, "player"));
    this.bot = new Bot(bot_spawn, p => this.addProjectile(p, "bot"));
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

  click(mouseX: number, mouseY: number): void {
    this.player?.attack(this, {x: mouseX, y: mouseY});
  }

  addProjectile(projectile: Projectile, owner_id: ID): void {
    this.projectiles.push(projectile);
    this.component_owner_id.set(projectile.eid, owner_id);
  }

  update(): void {
    for (const projectile of this.projectiles) {
      switch (this.component_owner_id.get(projectile.eid)) {
        case "player": projectile.affect(this, this.bot.character); break;
        case "bot":    projectile.affect(this, this.player); break;
      }
    }

    const deleteList: number[] = this.projectiles
      .entries()
      .filter(([_, creature]) => creature.update(this))
      .map(([i, _]) => i)
      .toArray();
    for (let i = deleteList.length - 1; i >= 0; i--) {
      const eid = this.projectiles[deleteList[i]].eid;
      this.component_owner_id.delete(eid);
      this.component_laser.delete(eid);
      this.component_grenade.delete(eid);
      this.component_bullet.delete(eid);
      this.projectiles.splice(deleteList[i], 1);
    }

    this.player.update(this.map);
    this.map.setMarkedPoint("player", this.player.m_coord);
    this.bot.update(this);
    if (this.player.health <= 0.2 || this.bot.character.health <= 0.2) {
      if (this.player.health <= 0.2)
        this.bot.character.addKill();
      else
        this.player.addKill();
      this.player.respawn(player_spawn);
      this.bot.character.respawn(bot_spawn);
    }
  }
}
