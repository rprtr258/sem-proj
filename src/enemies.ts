import {Vec2, mul, sub, rectIntersects} from "./types.ts";
import {Body} from "./body.ts";
import {Field} from "./field.ts";
import {ProjectileSpec} from "./spells.ts";

// Enemy archetypes (GDD §7.7). Stats are первичные (pre-playtest) numbers.
export type ArchetypeId = "spearman" | "swarmer" | "crossbowman" | "flyer" | "golem" | "mage_operator";

export type ArchetypeDef = {
  id: ArchetypeId;
  name: {ru: string; en: string};
  color: string;
  hp: number;
  speed: number; // px/tick
  body: Vec2; // px
  flying: boolean;
  meleeDamage: number;
  meleeCooldown: number;
  attackRange: number; // contact damage window
  gold: number;
  heatDamageMult: number; // golem takes double from T-shock
  ranged: null | {damage: number; cooldown: number; speed: number; kind: ProjectileSpec["kind"]};
  // how the AI behaves each tick
  update: (ctx: EnemyCtx, e: Enemy, def: ArchetypeDef) => void;
};

export type Enemy = {
  archetype: ArchetypeId;
  hp: number;
  body: Body;
  meleeCd: number;
  rangedCd: number;
  state: "idle" | "windup" | "lunge";
  stateTicks: number;
  lungeDir: number;
  climbDir: -1 | 0 | 1; // committed slide direction while under a ledge
  climbTicks: number; // time left before flipping the slide direction
};

export const ARCHETYPES: Record<ArchetypeId, ArchetypeDef> = {
  spearman: {
    id: "spearman",
    name: {ru: "Копейщик", en: "Spearman"},
    color: "#d08050",
    hp: 30,
    speed: 3.2,
    body: {x: 48, y: 84},
    flying: false,
    meleeDamage: 10,
    meleeCooldown: 60,
    attackRange: 70,
    gold: 8,
    heatDamageMult: 1,
    ranged: null,
    update: (ctx, e, def) => {
      const to = sub(ctx.player.center(), e.body.center());
        if (e.state === "windup") {
        if (--e.stateTicks <= 0) {
          e.state = "lunge";
          e.stateTicks = 16;
          e.lungeDir = Math.sign(to.x) || 1;
        }
        return;
      }
      if (e.state === "lunge") {
        e.body.goingLeft = e.lungeDir < 0;
        e.body.goingRight = e.lungeDir > 0;
        if (--e.stateTicks <= 0) {
          e.state = "idle";
          e.body.goingLeft = false;
          e.body.goingRight = false;
        }
        return;
      }
      const dist = Math.hypot(to.x, to.y);
      if (dist < def.attackRange && e.meleeCd <= 0) {
        e.state = "windup";
        e.stateTicks = 20;
      } else {
        e.body.goingLeft = to.x < 0;
        e.body.goingRight = to.x > 0;
        if (ctx.blockedAhead(e))
          ctx.jump(e);
        // player above at all: climb toward them (jump + committed slide)
        if (to.y < -4)
          climbToward(ctx, e, to);
        else
          e.climbDir = 0;
      }
    },
  },
  swarmer: {
    id: "swarmer",
    name: {ru: "Роевик", en: "Swarmer"},
    color: "#e0d060",
    hp: 10,
    speed: 5,
    body: {x: 30, y: 54},
    flying: false,
    meleeDamage: 4,
    meleeCooldown: 45,
    attackRange: 40,
    gold: 3,
    heatDamageMult: 1,
    ranged: null,
    update: (ctx, e, def) => {
      const to = sub(ctx.player.center(), e.body.center());
      e.body.goingLeft = to.x < 0;
      e.body.goingRight = to.x > 0;
      if (ctx.blockedAhead(e))
        ctx.jump(e);
      if (to.y < -4)
        climbToward(ctx, e, to);
      else
        e.climbDir = 0;
    },
  },
  crossbowman: {
    id: "crossbowman",
    name: {ru: "Арбалетчик", en: "Crossbowman"},
    color: "#70a0e0",
    hp: 25,
    speed: 3,
    body: {x: 48, y: 84},
    flying: false,
    meleeDamage: 5,
    meleeCooldown: 70,
    attackRange: 60,
    gold: 10,
    heatDamageMult: 1,
    ranged: {damage: 8, cooldown: 90, speed: 9, kind: "bolt"},
    update: (ctx, e, def) => {
      const to = sub(ctx.player.center(), e.body.center());
      const dist = Math.hypot(to.x, to.y);
      // keep mid range: back off when close, approach when far
      if (dist < 150) {
        e.body.goingLeft = to.x > 0;
        e.body.goingRight = to.x < 0;
      } else if (dist > 360 || !ctx.lineOfSight(e)) {
        e.body.goingLeft = to.x < 0;
        e.body.goingRight = to.x > 0;
      } else {
        e.body.goingLeft = false;
        e.body.goingRight = false;
      }
      if (ctx.blockedAhead(e))
        ctx.jump(e);
      if (e.rangedCd <= 0 && ctx.lineOfSight(e) && dist < 420) {
        ctx.shoot(e, mul(sub(ctx.player.center(), e.body.center()), 1 / (dist || 1)), def);
      }
    },
  },
  flyer: {
    id: "flyer",
    name: {ru: "Летун", en: "Flyer"},
    color: "#80e0d0",
    hp: 15,
    speed: 4.5,
    body: {x: 42, y: 42},
    flying: true,
    meleeDamage: 8,
    meleeCooldown: 60,
    attackRange: 55,
    gold: 6,
    heatDamageMult: 1,
    ranged: null,
    update: (ctx, e, def) => {
      // hover above the player, dive when close
      const to = sub(ctx.player.center(), e.body.center());
      const target = {x: to.x, y: to.y - 90};
      const dist = Math.hypot(to.x, to.y);
      if (dist < 130) {
        e.body.flyVelocity = mul(to, def.speed / (dist || 1));
      } else {
        const len = Math.hypot(target.x, target.y) || 1;
        e.body.flyVelocity = mul(target, def.speed / len);
      }
    },
  },
  golem: {
    id: "golem",
    name: {ru: "Голем", en: "Golem"},
    color: "#909098",
    hp: 90,
    speed: 1.6,
    body: {x: 72, y: 108},
    flying: false,
    meleeDamage: 20,
    meleeCooldown: 90,
    attackRange: 80,
    gold: 25,
    heatDamageMult: 2, // vulnerable to T-shock
    ranged: null,
    update: (ctx, e, def) => {
      const to = sub(ctx.player.center(), e.body.center());
      e.body.goingLeft = to.x < 0;
      e.body.goingRight = to.x > 0;
      // never jumps: digs through terrain instead
      if (ctx.blockedAhead(e))
        ctx.dig(e);
    },
  },
  mage_operator: {
    id: "mage_operator",
    name: {ru: "Маг-оператор", en: "Mage operator"},
    color: "#c070e0",
    hp: 22,
    speed: 2.8,
    body: {x: 48, y: 84},
    flying: false,
    meleeDamage: 4,
    meleeCooldown: 70,
    attackRange: 60,
    gold: 12,
    heatDamageMult: 1,
    ranged: {damage: 6, cooldown: 120, speed: 8, kind: "heatbolt"},
    update: (ctx, e, def) => {
      const to = sub(ctx.player.center(), e.body.center());
      const dist = Math.hypot(to.x, to.y);
      if (dist < 200) {
        e.body.goingLeft = to.x > 0;
        e.body.goingRight = to.x < 0;
      } else if (dist > 380 || !ctx.lineOfSight(e)) {
        e.body.goingLeft = to.x < 0;
        e.body.goingRight = to.x > 0;
      } else {
        e.body.goingLeft = false;
        e.body.goingRight = false;
      }
      if (ctx.blockedAhead(e))
        ctx.jump(e);
      if (e.rangedCd <= 0 && ctx.lineOfSight(e) && dist < 440) {
        ctx.shoot(e, mul(sub(ctx.player.center(), e.body.center()), 1 / (dist || 1)), def);
      }
    },
  },
};

// enemy round scaling (GDD §7.7): hp ×(1+0.15(n−1)), damage ×(1+0.10(n−1))
export function hpScale(round: number): number {
  return 1 + 0.15 * (round - 1);
}
export function dmgScale(round: number): number {
  return 1 + 0.10 * (round - 1);
}

// helpers the archetype AI closures call, wired to World
export type EnemyCtx = {
  player: Body;
  field: Field;
  random(): number;
  blockedAhead(e: Enemy): boolean;
  columnFree(e: Enemy, dir: -1 | 1): boolean;
  lineOfSight(e: Enemy): boolean;
  jump(e: Enemy): void;
  dig(e: Enemy): void;
  shoot(e: Enemy, dir: Vec2, def: ArchetypeDef): void;
};

// walk toward the player, jump when under them, slide out from under ledges.
// Under a wide ledge both side columns stay blocked, so the slide direction is
// committed and held until that column frees (left tried first, then right) —
// otherwise the enemy oscillates around the target's x and never escapes.
function climbToward(ctx: EnemyCtx, e: Enemy, to: Vec2): void {
  ctx.jump(e);
  const dir: -1 | 1 = to.x < 0 ? -1 : 1;
  if (e.climbDir === 0) {
    if (ctx.columnFree(e, dir))
      return; // clear above: plain jump is enough
    e.climbDir = ctx.columnFree(e, -1) ? -1 : ctx.columnFree(e, 1) ? 1 : -1;
    e.climbTicks = 60;
  }
  if (e.climbDir === -1) {
    e.body.goingLeft = true;
    e.body.goingRight = false;
    if (ctx.columnFree(e, -1))
      e.climbDir = 0;
    else if (--e.climbTicks <= 0) {
      e.climbDir = 1;
      e.climbTicks = 240;
    }
  } else {
    e.body.goingLeft = false;
    e.body.goingRight = true;
    if (ctx.columnFree(e, 1))
      e.climbDir = 0;
  }
}

// Waves for the 5 M1 rounds; packs spawn with a delay, enemy count per pack.
export type WavePack = {
  delayTicks: number;
  spawn: {archetype: ArchetypeId; count: number; point: number}[];
};

// R1: tutorial — three spearmen from the right
const R1: WavePack[] = [
  {delayTicks: 0, spawn: [{archetype: "spearman", count: 3, point: 1}]},
];
// R2: swarm pressure
const R2: WavePack[] = [
  {delayTicks: 0, spawn: [{archetype: "swarmer", count: 5, point: 1}]},
  {delayTicks: 240, spawn: [{archetype: "spearman", count: 2, point: 0}]},
];
// R3: ranged + swarm
const R3: WavePack[] = [
  {delayTicks: 0, spawn: [{archetype: "crossbowman", count: 2, point: 2}]},
  {delayTicks: 180, spawn: [{archetype: "swarmer", count: 4, point: 1}]},
];
// R4: flyers harass while ranged cover
const R4: WavePack[] = [
  {delayTicks: 0, spawn: [{archetype: "flyer", count: 3, point: 3}]},
  {delayTicks: 240, spawn: [
    {archetype: "crossbowman", count: 2, point: 2},
    {archetype: "spearman", count: 2, point: 0},
  ]},
];
// R5: mini-boss — golems breaking in under mage fire
const R5: WavePack[] = [
  {delayTicks: 0, spawn: [{archetype: "golem", count: 2, point: 1}]},
  {delayTicks: 180, spawn: [{archetype: "mage_operator", count: 2, point: 2}]},
  {delayTicks: 360, spawn: [{archetype: "swarmer", count: 6, point: 0}]},
];

export const WAVES: WavePack[][] = [R1, R2, R3, R4, R5];

// spawn points (px), used round-robin by pack definitions
export const SPAWN_POINTS: Vec2[] = [
  {x: 30, y: 440}, // left floor
  {x: 900, y: 440}, // right floor
  {x: 700, y: 380}, // right platform
  {x: 480, y: 180}, // top platform
];

export function makeEnemy(archetype: ArchetypeId, round: number, pos: Vec2): Enemy {
  const def = ARCHETYPES[archetype];
  const hp = Math.round(def.hp * hpScale(round));
  const body = new Body({...pos}, def.body, hp, def.flying);
  return {
    archetype,
    hp,
    body,
    meleeCd: 30,
    rangedCd: 60,
    state: "idle",
    stateTicks: 0,
    lungeDir: 0,
    climbDir: 0,
    climbTicks: 0,
  };
}

// contact damage check shared by all grounded enemies
export function touchesPlayer(e: Enemy, playerBox: {x: number; y: number; w: number; h: number}): boolean {
  return rectIntersects(e.body.boundingBox, playerBox);
}
