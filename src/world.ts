import {Vec2, add, mul, sub, rect, rectIntersects, clamp} from "./types.ts";
import {Field} from "./field.ts";
import {Body} from "./body.ts";
import {RunState} from "./wand.ts";
import {SPELLS, SpellWorld, Caster, ProjectileSpec} from "./spells.ts";
import {
  ARCHETYPES, ArchetypeId, Enemy, EnemyCtx,
  WAVES, SPAWN_POINTS, makeEnemy, touchesPlayer,
} from "./enemies.ts";

export type Outcome =
  | {won: true; stars: number; goldEarned: number; hpLost: boolean; died: boolean}
  | {won: false};

export type Projectile = ProjectileSpec & {ttlLeft: number};

export type Effect = {
  kind: "vortex" | "pump" | "pulse" | "laserfx";
  pos: Vec2;
  ttl: number;
  radius: number;
  power: number;
  from?: Vec2; // laser beam start
};

// FF heat thresholds (GDD §7.1: средовое T бьёт мага так же, как врагов)
const HEAT_DMG_THRESHOLD = 20;
const COLD_DMG_THRESHOLD = -10;
const HEAT_DPS = 0.02; // per tick per degree above threshold
const COLD_DPS = 0.015;

const PLAYER_SPAWN: Vec2 = {x: 60, y: 380};

export class World implements SpellWorld {
  field: Field;
  run: RunState;
  round: number;
  player: Body;
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  effects: Effect[] = [];
  outcome: Outcome | null = null;
  mouse: Vec2 = {x: 480, y: 270};
  showVectors = true; // wind vector overlay, on by default like the old game
  goldEarned = 0;
  ticks = 0;
  private rng: () => number;
  private packs: {delayTicks: number; spawn: {archetype: ArchetypeId; count: number; point: number}[]}[] = [];
  private playerCaster: Caster;

  constructor(field: Field, run: RunState, round: number, rng: () => number = Math.random) {
    this.field = field;
    this.run = run;
    this.round = round;
    this.rng = rng;
    this.player = new Body({...PLAYER_SPAWN}, {x: 48, y: 84}, run.hp);
    this.playerCaster = {
      isPlayer: true,
      center: () => this.player.center(),
      mirrored: false,
    };
    for (const pack of WAVES[Math.min(round, WAVES.length) - 1])
      this.packs.push({...pack});
  }

  casterOfPlayer(): Caster {
    return this.playerCaster;
  }

  // enemy views for spell targeting; spell damage routes through damageInRadius
  enemyViews(): readonly {center(): Vec2; boundingBox: {x: number; y: number; w: number; h: number}}[] {
    return this.enemies.map(e => ({center: () => e.body.center(), boundingBox: e.body.boundingBox}));
  }

  playerBox(): {x: number; y: number; w: number; h: number} {
    return this.player.boundingBox;
  }

  random(): number {
    return this.rng();
  }

  // fires the wand's next spell in sequence (A -> B -> C -> A ...)
  castNext(target: Vec2): boolean {
    const next = this.run.castNext(this.run.activeWand);
    if (!next)
      return false;
    const def = SPELLS.find(s => s.id === next.spellId);
    if (!def)
      return false;
    def.cast(this, this.playerCaster, target);
    return true;
  }

  update(): void {
    if (this.outcome)
      return;
    this.ticks++;
    this.run.tickMana();
    this.spawnPacks();
    this.updatePlayer();
    for (const e of this.enemies)
      this.updateEnemy(e);
    this.enemies = this.enemies.filter(e => !e.body.dead);
    this.updateProjectiles();
    this.updateEffects();
    this.heatFieldDamage();
    if (this.player.dead) {
      this.run.diedThisRound = true;
      this.outcome = {won: false};
      return;
    }
    if (this.packs.length === 0 && this.enemies.length === 0) {
      const stars = !this.run.diedThisRound ? (!this.run.hpLostThisRound ? 3 : 2) : 1;
      this.outcome = {won: true, stars, goldEarned: this.goldEarned, hpLost: this.run.hpLostThisRound, died: this.run.diedThisRound};
    }
  }

  private spawnPacks(): void {
    for (const pack of this.packs)
      pack.delayTicks--;
    this.packs = this.packs.filter(pack => {
      if (pack.delayTicks > 0)
        return true;
      for (const s of pack.spawn) {
        const base = SPAWN_POINTS[s.point];
        for (let i = 0; i < s.count; i++) {
          const jitter = {x: this.rng() * 120 - 60, y: 0};
          const pos = ARCHETYPES[s.archetype].flying
            ? {x: 200 + this.rng() * 560, y: 60 + this.rng() * 120}
            : {x: clamp(base.x + this.rng() * 80 - 40, 10, 930), y: base.y};
          this.enemies.push(makeEnemy(s.archetype, this.round, add(pos, jitter)));
        }
      }
      return false;
    });
  }

  private updatePlayer(): void {
    this.player.update(this.field);
  }

  private updateEnemy(e: Enemy): void {
    const def = ARCHETYPES[e.archetype];
    if (e.meleeCd > 0)
      e.meleeCd--;
    if (e.rangedCd > 0)
      e.rangedCd--;
    const ctx: EnemyCtx = {
      player: this.player,
      field: this.field,
      random: this.rng,
      blockedAhead: en => this.blockedAhead(en),
      columnFree: (en, dir) => this.columnFree(en, dir),
      lineOfSight: en => this.lineOfSight(en),
      jump: en => { en.body.jumpHeld = true; },
      dig: en => {
        const dir = en.body.goingLeft ? -1 : en.body.goingRight ? 1 : Math.sign(this.player.center().x - en.body.center().x);
        this.field.carve(add(en.body.center(), {x: dir * en.body.boundingBox.w, y: 0}), 10);
      },
      shoot: (en, dir, d) => {
        const r = d.ranged!;
        en.rangedCd = r.cooldown;
        const from = en.body.center();
        this.spawnProjectile({
          kind: r.kind,
          pos: from,
          vel: mul(dir, r.speed),
          ownerIsPlayer: false,
          damage: Math.round(r.damage * (1 + 0.10 * (this.round - 1))),
          ttl: 90,
          radius: r.kind === "heatbolt" ? 18 : 0,
          heat: r.kind === "heatbolt" ? 30 : 0,
        });
      },
    };
    e.body.jumpHeld = false; // AI re-sets it below while it wants to climb
    def.update(ctx, e, def);
    e.body.update(this.field);
    // contact damage (all archetypes)
    if (e.meleeCd <= 0 && touchesPlayer(e, this.player.boundingBox)) {
      e.meleeCd = def.meleeCooldown;
      this.damagePlayer(Math.round(def.meleeDamage * (1 + 0.10 * (this.round - 1))));
      const dir = sub(this.player.center(), e.body.center());
      this.player.applyKnockback(mul(dir, 0.3));
    }
  }

  private blockedAhead(e: Enemy): boolean {
    const dir = e.body.goingLeft ? -1 : e.body.goingRight ? 1 : 0;
    if (dir === 0)
      return false;
    const b = e.body.boundingBox;
    return this.field.isSolidRect(rect({x: b.x + (dir > 0 ? b.w : -4), y: b.y + b.h / 2}, 4, b.h / 2));
  }

  // is the vertical column beside the body clear from its head to the sky?
  private columnFree(e: Enemy, dir: -1 | 1): boolean {
    const b = e.body.boundingBox;
    return !this.field.isSolidRect(rect({x: b.x + (dir > 0 ? b.w : -b.w), y: 0}, b.w, b.y + b.h));
  }

  private lineOfSight(e: Enemy): boolean {
    const from = e.body.center();
    const to = this.player.center();
    const d = sub(to, from);
    const len = Math.hypot(d.x, d.y);
    if (len === 0)
      return true;
    const unit = mul(d, 1 / len);
    let p = {...from};
    while (Math.hypot(p.x - to.x, p.y - to.y) > 8) {
      p = add(p, mul(unit, 4));
      if (this.field.isSolid(p))
        return false;
    }
    return true;
  }

  damageInRadius(p: Vec2, radius: number, dmg: number, hitPlayer: boolean, knock: number): void {
    for (const e of this.enemies) {
      const c = e.body.center();
      if (Math.hypot(c.x - p.x, c.y - p.y) <= radius) {
        e.body.hit(dmg);
        if (e.body.dead) {
          const def = ARCHETYPES[e.archetype];
          this.run.gold += def.gold;
          this.goldEarned += def.gold;
        }
        if (knock !== 0) {
          const dir = sub(c, p);
          const len = Math.hypot(dir.x, dir.y) || 1;
          e.body.applyKnockback(mul(dir, knock / len));
        }
      }
    }
    if (hitPlayer) {
      const c = this.player.center();
      if (Math.hypot(c.x - p.x, c.y - p.y) <= radius) {
        this.damagePlayer(dmg);
        if (knock !== 0) {
          const dir = sub(c, p);
          const len = Math.hypot(dir.x, dir.y) || 1;
          this.player.applyKnockback(mul(dir, knock / len));
        }
      }
    }
  }

  private damagePlayer(dmg: number): void {
    this.run.hpLostThisRound = true;
    this.player.hit(dmg);
  }

  spawnProjectile(spec: ProjectileSpec): void {
    this.projectiles.push({...spec, ttlLeft: spec.ttl});
  }

  addEffect(kind: Effect["kind"], pos: Vec2, ttl: number, radius: number, power: number, from?: Vec2): void {
    this.effects.push({kind, pos, ttl, radius, power, from});
  }

  private updateProjectiles(): void {
    for (const pr of this.projectiles) {
      pr.ttlLeft--;
      if (pr.kind === "grenade") {
        pr.vel.y += 0.4;
        // tornado trail along the flight path (old grenade behavior)
        this.field.vortex(pr.pos, 42, 0.45);
      }
      if (pr.kind === "bullet") {
        const len = Math.hypot(pr.vel.x, pr.vel.y) || 1;
        this.field.wake(pr.pos, mul(pr.vel, 1 / len), 0.2);
      }
      pr.pos = add(pr.pos, pr.vel);
      const hitBody = this.projectileHitsBody(pr);
      const hitWall = this.field.isSolid(pr.pos);
      if (!hitBody && !hitWall && pr.ttlLeft > 0)
        continue;
      switch (pr.kind) {
        case "bullet":
          this.field.blast(pr.pos, 24, 0.8, 0.5, 36);
          this.damageInRadius(pr.pos, 6, pr.damage, false, 0.4);
          break;
        case "bolt":
          if (hitBody === "player")
            this.damagePlayer(pr.damage);
          break;
        case "heatbolt":
          this.field.heat(pr.pos, pr.radius, pr.heat);
          this.field.blast(pr.pos, pr.radius, 0.5, 0.3, 24);
          this.damageInRadius(pr.pos, pr.radius, pr.damage, false, 0.5);
          break;
        case "iceshard":
          this.field.heat(pr.pos, pr.radius, pr.heat);
          this.damageInRadius(pr.pos, pr.radius, pr.damage, false, 0.5);
          for (const e of this.enemies) {
            const c = e.body.center();
            if (Math.hypot(c.x - pr.pos.x, c.y - pr.pos.y) <= pr.radius)
              e.body.chill = Math.min(1, e.body.chill + 0.7);
          }
          break;
        case "grenade":
          this.field.blast(pr.pos, pr.radius, 1.5, 1.2, 120);
          this.damageInRadius(pr.pos, pr.radius, pr.damage, false, 2.0);
          break;
      }
      pr.ttlLeft = 0;
    }
    this.projectiles = this.projectiles.filter(p => p.ttlLeft > 0);
  }

  private projectileHitsBody(pr: Projectile): "player" | "enemy" | null {
    const r = rect({x: pr.pos.x - 3, y: pr.pos.y - 3}, 6, 6);
    if (pr.ownerIsPlayer) {
      for (const e of this.enemies) {
        if (e.body.dead)
          continue;
        if (rectIntersects(r, e.body.boundingBox))
          return "enemy";
      }
      return null;
    }
    if (rectIntersects(r, this.player.boundingBox))
      return "player";
    return null;
  }

  private updateEffects(): void {
    for (const fx of this.effects) {
      fx.ttl--;
      switch (fx.kind) {
        case "vortex":
          this.field.vortex(fx.pos, fx.radius, fx.power);
          for (const e of this.enemies) {
            const c = e.body.center();
            if (Math.hypot(c.x - fx.pos.x, c.y - fx.pos.y) <= fx.radius * 1.2)
              e.body.hit(0.15);
          }
          break;
        case "pump":
          this.field.heat(fx.pos, fx.radius, -fx.power);
          this.field.heat(this.player.center(), 24, fx.power * 0.6);
          break;
        case "pulse": {
          const phase = Math.floor((fx.ttl % 36) / 12);
          const pull = phase % 2 === 0 ? -1 : 1;
          this.field.blast(fx.pos, fx.radius, pull * 1.5, 0, 60);
          this.damageInRadius(fx.pos, fx.radius, 6, false, pull * 1.0);
          break;
        }
        case "laserfx":
          break; // visual only
      }
    }
    this.effects = this.effects.filter(fx => fx.ttl > 0);
  }

  private heatFieldDamage(): void {
    const sample = (body: Body, mult: number) => {
      const t = this.field.temperatureInRect(body.boundingBox);
      if (t > HEAT_DMG_THRESHOLD)
        body.hit((t - HEAT_DMG_THRESHOLD) * HEAT_DPS * mult);
      if (t < COLD_DMG_THRESHOLD) {
        body.hit((COLD_DMG_THRESHOLD - t) * COLD_DPS * mult);
        body.chill = Math.min(1, body.chill + 0.02);
      }
    };
    sample(this.player, 1);
    for (const e of [...this.enemies]) {
      const before = e.body.dead;
      sample(e.body, ARCHETYPES[e.archetype].heatDamageMult);
      if (!before && e.body.dead) {
        const def = ARCHETYPES[e.archetype];
        this.run.gold += def.gold;
        this.goldEarned += def.gold;
      }
    }
  }
}
