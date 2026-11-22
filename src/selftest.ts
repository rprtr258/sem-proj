// Headless verification of the M1 loop: field sim sanity, shop economy,
// wand casting, wave clear with stars, death/attempt loss, NA1 round-trip.
// Run: bun src/selftest.ts
import {Field, ARENA_W, ARENA_H, MAT_WATER} from "./field.ts";
import {World} from "./world.ts";
import {RunState} from "./wand.ts";
import {Shop} from "./shop.ts";
import {SPELLS, spellById} from "./spells.ts";
import {encodeBuild, decodeBuild} from "./buildcode.ts";

let failures = 0;
function check(cond: boolean, name: string): void {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond)
    failures++;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hasNaN(field: Field): boolean {
  for (const arr of [field.waveField, field.tempField, field.velXField, field.velYField])
    for (const v of arr)
      if (Number.isNaN(v))
        return true;
  return false;
}

// --- 1. field sanity ---
{
  const f = new Field();
  check(f.isSolid({x: -10, y: 5}), "field: left wall solid");
  check(f.isSolid({x: 480, y: 530}), "field: floor solid");
  check(!f.isSolid({x: 480, y: 300}), "field: mid-air free");
  check(f.hasWaterNear({x: 195, y: 505}, 20), "field: water pool present");
  f.heat({x: 195, y: 505}, 20, 300);
  f.tick();
  let steamedNow = 0;
  for (const m of f.materialField)
    if (m === 3)
      steamedNow++;
  check(steamedNow > 0, "field: water boils to steam under heat");
  for (let i = 0; i < 50; i++)
    f.tick();
  check(!hasNaN(f), "field: no NaN after 50 ticks with heat");
}

// --- 2. shop economy ---
{
  const run = new RunState();
  const shop = new Shop(mulberry32(7));
  const g0 = run.gold;
  let bought = false;
  for (let i = 0; i < shop.cards.length && !bought; i++) {
    const card = shop.cards[i];
    if (card.price <= run.gold) {
      bought = shop.buy(i, run);
    }
  }
  check(bought, "shop: bought an affordable card");
  check(run.gold < g0, "shop: gold decreased");
  const soldItem = run.inventory[0];
  if (soldItem) {
    const g1 = run.gold;
    shop.sellInventoryItem(0, run);
    check(run.gold === g1 + Math.round(soldItem.price / 2), "shop: sell refunds 50%");
  }
  const cost0 = shop.rerollCost;
  shop.reroll(run);
  check(shop.rerollCost === cost0 + 2, "shop: reroll cost +2");
}

// --- 3. full loop: buy -> assemble -> fight wave -> win ---
{
  const run = new RunState();
  const shop = new Shop(mulberry32(11));
  // buy the wand card and equip a sphere through inventory
  shop.buy(4, run); // wand card is last
  // equip 4 spheres (as if bought): simulate purchase via gold
  run.gold += 1000;
  for (let s = 0; s < 4; s++)
    run.wands[0].slots[s] = "compression_sphere";
  run.inventory.push({spellId: "compression_sphere", price: 20});

  const world = new World(new Field(), run, 1, mulberry32(3));
  world.player.health = 100000; // focus the test on casting/kills, not dodging
  world.player.maxHealth = 100000;
  let casts = 0;
  let ticks = 0;
  while (!world.outcome && ticks < 8000) {
    world.update();
    ticks++;
    // auto-player: fire the wand sequence at the nearest enemy
    if (world.enemies.length > 0) {
      let best = world.enemies[0], bestD = Infinity;
      for (const e of world.enemies) {
        const c = e.body.center();
        const d = (c.x - world.player.center().x) ** 2 + (c.y - world.player.center().y) ** 2;
        if (d < bestD) { bestD = d; best = e; }
      }
      world.mouse = best.body.center();
      if (world.castNext(world.mouse))
        casts++;
    }
  }
  check(world.outcome?.won === true, `loop: wave 1 cleared in ${ticks} ticks (${casts} casts)`);
  check((world.outcome?.won && world.outcome.stars >= 1) === true, "loop: stars >= 1 awarded");
  check(run.gold > 150 + 1000 - 4 * 20 - 260, "loop: gold grew from kills (or stayed sane)");
  check(!hasNaN(world.field), "loop: field clean after combat");
  check(!world.outcome?.won || run.hpLostThisRound === world.outcome.hpLost, "loop: hp-lost flag consistent");
}

// --- 4. death -> attempt loss path ---
{
  const run = new RunState();
  const world = new World(new Field(), run, 1, mulberry32(5));
  world.player.health = 1;
  let ticks = 0;
  while (!world.outcome && ticks < 6000) {
    world.update();
    ticks++;
  }
  check(world.outcome?.won === false, "death: player dies to the wave");
  check(run.diedThisRound, "death: diedThisRound flagged");
}

// --- 4b. mana + sequential casting ---
{
  const run = new RunState();
  run.wands[0].slots = ["bullet", "laser", "grenade", null];
  const world = new World(new Field(), run, 1, mulberry32(9));
  world.player.health = 1e6;
  world.player.maxHealth = 1e6;
  // drain mana below the laser cost to test the gate
  run.mana = 15;
  const fired: string[] = [];
  fired.push(world.castNext({x: 500, y: 300}) ? "bullet" : "null"); // bullet (10), mana 5
  fired.push(world.castNext({x: 500, y: 300}) ? "laser" : "null"); // laser costs 30 > 5 -> null
  run.mana = 100;
  fired.push(world.castNext({x: 500, y: 300}) ? "laser" : "null"); // sequence resumes at laser
  fired.push(world.castNext({x: 500, y: 300}) ? "grenade" : "null");
  fired.push(world.castNext({x: 500, y: 300}) ? "bullet" : "null"); // wraps to A
  check(JSON.stringify(fired) === JSON.stringify(["bullet", "null", "laser", "grenade", "bullet"]),
    `mana gate + sequential order A->B->C->A (got: ${fired.join(",")})`);
  for (let i = 0; i < 300; i++)
    world.update();
  check(run.mana > 15, "mana regenerates over time");
}

// --- 5. every spell casts without crashing/NaN ---
{
  const run = new RunState();
  const world = new World(new Field(), run, 2, mulberry32(13));
  world.player.health = 1e6;
  world.player.maxHealth = 1e6;
  let ok = true;
  for (let i = 0; i < 400 && world.enemies.length === 0; i++)
    world.update();
  for (const def of SPELLS) {
    for (const target of [{x: 500, y: 300}, {x: 195, y: 505}]) { // mid-air + water pool
      try {
        def.cast(world, world.casterOfPlayer(), target);
      } catch (err) {
        ok = false;
        console.log("  spell error:", def.id, err);
      }
      for (let i = 0; i < 30; i++)
        world.update();
    }
  }
  for (let i = 0; i < 200; i++)
    world.update();
  check(ok && !hasNaN(world.field), "spells: all 11 cast cleanly, no NaN");
}

// --- 6. NA1 build code round-trip ---
{
  const run = new RunState();
  run.wands[0].slots[0] = "compression_sphere";
  run.addWand(6);
  run.wands[1].slots[2] = "grenade";
  run.inventory.push({spellId: "spark", price: 18});
  run.activeWand = 1;
  const code = encodeBuild(run);
  const decoded = decodeBuild(code);
  check(code.startsWith("NA1:"), "NA1: prefix");
  check(decoded !== null &&
    decoded!.wands[0].slots[0] === "compression_sphere" &&
    decoded!.wands[1].slots[2] === "grenade" &&
    decoded!.active === 1 &&
    decoded!.inv.includes("spark"), "NA1: round-trip preserves wands/inventory");
  check(decodeBuild("NA1:garbage!!!") === null, "NA1: rejects garbage");
  check(spellById("spark") !== undefined, "NA1: spell registry lookup");
}

// --- 7. enemy roster: all 6 archetypes appear across the 5 waves ---
{
  const ids = ["spearman", "swarmer", "crossbowman", "flyer", "golem", "mage_operator"];
  const spawned = new Set<string>();
  for (let round = 1; round <= 5; round++) {
    const world = new World(new Field(), new RunState(), round, mulberry32(21 + round));
    world.player.health = 1e6;
    world.player.maxHealth = 1e6;
    for (let i = 0; i < 1500 && !world.outcome; i++) {
      world.update();
      for (const e of world.enemies)
        spawned.add(e.archetype);
    }
  }
  check(ids.every(id => spawned.has(id)), `waves spawn all 6 archetypes (got: ${[...spawned].join(", ")})`);
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURES`);
if (failures > 0)
  process.exit(1);
