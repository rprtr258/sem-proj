import {Vec2, add, mul, sub, vec2Normalized, rectIntersects} from "./types.ts";
import {Field} from "./field.ts";

// Rarity bands (GDD §7.8): common 15-25, uncommon 40-60, rare 90-120, epic 180-250
export type Rarity = "common" | "uncommon" | "rare" | "epic";

export const RARITY_PRICE: Record<Rarity, [number, number]> = {
  common: [15, 25],
  uncommon: [40, 60],
  rare: [90, 120],
  epic: [180, 250],
};

// Anything that can cast: player or enemy mage-operator
export interface Caster {
  readonly isPlayer: boolean;
  center(): Vec2;
  mirrored: boolean;
}

// The part of World the cast functions use; keeps spells decoupled from the
// world class and the world DOM-free for the headless selftest.
export interface SpellWorld {
  readonly field: Field;
  casterOfPlayer(): Caster;
  enemyViews(): readonly {center(): Vec2; boundingBox: {x: number; y: number; w: number; h: number}}[];
  playerBox(): {x: number; y: number; w: number; h: number};
  spawnProjectile(spec: ProjectileSpec): void;
  addEffect(kind: "vortex" | "pump" | "pulse" | "laserfx", pos: Vec2, ttl: number, radius: number, power: number): void;
  // damage enemies (and optionally the player — FF heat school) in a radius
  damageInRadius(p: Vec2, radius: number, dmg: number, hitPlayer: boolean, knock: number): void;
  random(): number;
}

export type ProjectileSpec = {
  kind: "bullet" | "bolt" | "heatbolt" | "iceshard" | "grenade";
  pos: Vec2;
  vel: Vec2;
  ownerIsPlayer: boolean;
  damage: number;
  ttl: number;
  radius: number; // explosion radius for heatbolt/iceshard/grenade
  heat: number; // heat added at explosion for heatbolt/iceshard
};

export type SpellDef = {
  id: string;
  school: "kinetic" | "heat" | "emitter";
  rarity: Rarity;
  mana: number; // mana cost per cast (old mana system, no per-slot cooldown)
  friendlyFire: boolean; // direct damage also hits the caster's side
  rune: string;
  name: {ru: string; en: string};
  desc: {ru: string; en: string};
  cast: (w: SpellWorld, caster: Caster, target: Vec2) => void;
};

function beamEnd(field: Field, from: Vec2, target: Vec2): {end: Vec2; dir: Vec2} {
  const dir = sub(target, from);
  const len = Math.hypot(dir.x, dir.y);
  const unit = len === 0 ? {x: 1, y: 0} : mul(dir, 1 / len);
  let pos = {...from};
  while (!field.isSolid(pos) && pos.x > 0 && pos.x < 960 && pos.y > 0 && pos.y < 540) {
    pos = add(pos, unit);
  }
  return {end: pos, dir: unit};
}

export const SPELLS: SpellDef[] = [
  {
    id: "compression_sphere",
    school: "kinetic",
    rarity: "common",
    mana: 10,
    friendlyFire: false,
    rune: "О",
    name: {ru: "Сфера сжатия", en: "Compression sphere"},
    desc: {
      ru: "Импульс стягивания в точке курсора: давит врагов к центру и бьёт ударом сжатия.",
      en: "Contracting impulse at the cursor: crushes enemies inward, then slams them.",
    },
    cast: (w, _caster, target) => {
      w.field.blast(target, 60, -1.5, 0, 78);
      w.damageInRadius(target, 42, 12, false, -1.2);
    },
  },
  {
    id: "phase_discharge",
    school: "kinetic",
    rarity: "uncommon",
    mana: 14,
    friendlyFire: false,
    rune: "Ф",
    name: {ru: "Фазовый разряд", en: "Phase discharge"},
    desc: {
      ru: "Три чередующихся импульса стягивания/расталкивания вокруг курсора.",
      en: "Three alternating pull/push pulses around the cursor.",
    },
    cast: (w, _caster, target) => {
      w.addEffect("pulse", {...target}, 36, 54, 3);
    },
  },
  {
    id: "vortex",
    school: "kinetic",
    rarity: "uncommon",
    mana: 16,
    friendlyFire: false,
    rune: "В",
    name: {ru: "Вихрь", en: "Vortex"},
    desc: {
      ru: "Торнадо в точке курсора на ~1.5с: закручивает воздух, поднимает и швыряет врагов.",
      en: "Tornado at the cursor for ~1.5s: spins the air, lifts and tosses enemies.",
    },
    cast: (w, _caster, target) => {
      w.addEffect("vortex", {...target}, 75, 42, 1.8);
    },
  },
  {
    id: "shockwave",
    school: "kinetic",
    rarity: "rare",
    mana: 20,
    friendlyFire: false,
    rune: "У",
    name: {ru: "Ударная волна", en: "Shockwave"},
    desc: {
      ru: "Кольцо давления вокруг мага: отбрасывает и контузит всех рядом.",
      en: "Pressure ring around the mage: knocks back and stuns everything nearby.",
    },
    cast: (w, caster, _target) => {
      const p = caster.center();
      w.field.blast(p, 90, 2.5, 1.5, 120);
      w.damageInRadius(p, 90, 10, false, 2.5);
    },
  },
  {
    id: "spark",
    school: "heat",
    rarity: "common",
    mana: 8,
    friendlyFire: true,
    rune: "И",
    name: {ru: "Искра", en: "Spark"},
    desc: {
      ru: "Разгорячённый сгусток: поджигает воздух в точке попадания (жжёт и вас тоже).",
      en: "Hot bolt: ignites the air at impact (burns you too).",
    },
    cast: (w, caster, target) => {
      const from = caster.center();
      const dir = sub(target, from);
      const len = Math.hypot(dir.x, dir.y) || 1;
      w.spawnProjectile({
        kind: "heatbolt",
        pos: from,
        vel: mul(dir, 10 / len),
        ownerIsPlayer: caster.isPlayer,
        damage: 8,
        ttl: 70,
        radius: 18,
        heat: 45,
      });
    },
  },
  {
    id: "ice_needle",
    school: "heat",
    rarity: "uncommon",
    mana: 12,
    friendlyFire: true,
    rune: "Л",
    name: {ru: "Ледяная игла", en: "Ice needle"},
    desc: {
      ru: "Холодная игла: замораживает воду в лёд-платформы и замедляет врагов.",
      en: "Cold needle: freezes water into ice platforms and chills enemies.",
    },
    cast: (w, caster, target) => {
      const from = caster.center();
      const dir = sub(target, from);
      const len = Math.hypot(dir.x, dir.y) || 1;
      w.spawnProjectile({
        kind: "iceshard",
        pos: from,
        vel: mul(dir, 9 / len),
        ownerIsPlayer: caster.isPlayer,
        damage: 10,
        ttl: 80,
        radius: 24,
        heat: -60,
      });
    },
  },
  {
    id: "heat_pump",
    school: "heat",
    rarity: "rare",
    mana: 18,
    friendlyFire: true,
    rune: "Т",
    name: {ru: "Тепловой насос", en: "Heat pump"},
    desc: {
      ru: "2с качает тепло из зоны у курсора к магу: заморозка местности, жар вокруг вас.",
      en: "For 2s pumps heat from the cursor zone to you: freezes terrain, roasts around you.",
    },
    cast: (w, _caster, target) => {
      w.addEffect("pump", {...target}, 100, 60, 3);
    },
  },
  {
    id: "steam_blast",
    school: "heat",
    rarity: "epic",
    mana: 24,
    friendlyFire: true,
    rune: "П",
    name: {ru: "Паровой взрыв", en: "Steam blast"},
    desc: {
      ru: "Мощнее у воды: мгновенно испаряет её, взрыв пара жжёт ВСЁ вокруг, включая вас.",
      en: "Stronger near water: instantly boils it; the steam blast burns EVERYTHING, you included.",
    },
    cast: (w, _caster, target) => {
      const wet = w.field.hasWaterNear(target, 60);
      const radius = wet ? 90 : 40;
      const dmg = wet ? 30 : 12;
      w.field.heat(target, radius, wet ? 120 : 60);
      w.field.blast(target, radius, wet ? 2.0 : 1.0, wet ? 1.2 : 0.6);
      // FF: пар жжёт всех
      w.damageInRadius(target, radius, dmg, true, 1.5);
    },
  },
  {
    id: "bullet",
    school: "emitter",
    rarity: "common",
    mana: 10,
    friendlyFire: false,
    rune: "П",
    name: {ru: "Пуля", en: "Bullet"},
    desc: {
      ru: "Быстрая пуля по прямой, слегка толкает воздух за собой.",
      en: "Fast bullet in a straight line, lightly pushes the air behind it.",
    },
    cast: (w, caster, target) => {
      const from = caster.center();
      const dir = sub(target, from);
      const len = Math.hypot(dir.x, dir.y) || 1;
      w.spawnProjectile({
        kind: "bullet",
        pos: from,
        vel: mul(dir, 14 / len),
        ownerIsPlayer: caster.isPlayer,
        damage: 30,
        ttl: 90,
        radius: 0,
        heat: 0,
      });
    },
  },
  {
    id: "laser",
    school: "emitter",
    rarity: "uncommon",
    mana: 30,
    friendlyFire: false,
    rune: "Л",
    name: {ru: "Лазер", en: "Laser"},
    desc: {
      ru: "Мгновенный луч по прямой до препятствия, тянет воздух вдоль луча.",
      en: "Instant beam to the first obstacle, drags air along the beam.",
    },
    cast: (w, caster, target) => {
      const from = caster.center();
      const {end, dir} = beamEnd(w.field, from, target);
      for (const e of w.enemyViews()) {
        if (caster.isPlayer && rectIntersects(lineRect(from, end), e.boundingBox)) {
          w.damageInRadius(e.center(), 1, 40, false, 0);
          break;
        }
      }
      // sustained pull channel along the beam
      for (let d = 0; d < Math.hypot(end.x - from.x, end.y - from.y); d += 8) {
        w.field.wake(add(from, mul(dir, d)), dir, -1.5);
      }
      w.addEffect("laserfx", {...end}, 10, 0, 0);
    },
  },
  {
    id: "grenade",
    school: "emitter",
    rarity: "rare",
    mana: 20,
    friendlyFire: false,
    rune: "Г",
    name: {ru: "Граната", en: "Grenade"},
    desc: {
      ru: "Граната по параболе: взрыв с торнадо-импульсом, сильный отброс.",
      en: "Grenade in an arc: explodes with a vortex trail and heavy knockback.",
    },
    cast: (w, caster, target) => {
      const from = caster.center();
      const dir = sub(target, from);
      const len = Math.hypot(dir.x, dir.y) || 1;
      w.spawnProjectile({
        kind: "grenade",
        pos: from,
        vel: {x: dir.x / len * 11, y: dir.y / len * 11 - 3},
        ownerIsPlayer: caster.isPlayer,
        damage: 10,
        ttl: 75,
        radius: 48,
        heat: 0,
      });
    },
  },
];

// bounding box of a segment (for laser-vs-enemy overlap)
export function lineRect(a: Vec2, b: Vec2): {x: number; y: number; w: number; h: number} {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  };
}

export function spellById(id: string): SpellDef | undefined {
  return SPELLS.find(s => s.id === id);
}

// shop generation weights
export const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 0.5,
  uncommon: 0.3,
  rare: 0.15,
  epic: 0.05,
};
