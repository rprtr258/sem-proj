import {SPELLS, Rarity, RARITY_PRICE, RARITY_WEIGHT} from "./spells.ts";
import {RunState, wandPrice} from "./wand.ts";

export type ShopCard =
  | {kind: "spell"; spellId: string; price: number; sold: boolean}
  // wand/expand cards carry no state: buyable repeatedly, their prices are
  // computed from run state at render/buy time, so they update immediately
  | {kind: "wand"}
  | {kind: "expand"};

const SPELL_COUNT = 4;
export const REROLL_BASE = 10;
export const REROLL_STEP = 2;
export const WAND_STEP = 20; // wand price rise per wand bought in the run

function rollRarity(rng: () => number): Rarity {
  const r = rng();
  let acc = 0;
  for (const [rar, w] of Object.entries(RARITY_WEIGHT) as [Rarity, number][]) {
    acc += w;
    if (r < acc)
      return rar;
  }
  return "common";
}

function priceIn(band: [number, number], rng: () => number): number {
  return Math.round(band[0] + rng() * (band[1] - band[0]));
}

// One shop page: 4 spell cards + wand card + expand-slots card. Reroll cost
// 10, +2 per repeat, resets after each battle; reroll re-rolls the spell
// cards only (GDD §7.8).
export class Shop {
  cards: ShopCard[] = [];
  rerollCost = REROLL_BASE;
  rerolls = 0;
  wandsBought = 0; // wand price step counter; lives for the whole run

  constructor(private rng: () => number = Math.random) {
    this.generate();
  }

  generate(): void {
    const pool = [...SPELLS];
    const cards: ShopCard[] = [];
    while (cards.length < SPELL_COUNT && pool.length > 0) {
      const rarity = rollRarity(this.rng);
      const candidates = pool.filter(s => s.rarity === rarity);
      const fallback = candidates.length > 0 ? candidates : pool;
      const idx = Math.floor(this.rng() * fallback.length);
      const spell = fallback[idx];
      pool.splice(pool.indexOf(spell), 1);
      cards.push({kind: "spell", spellId: spell.id, price: priceIn(RARITY_PRICE[spell.rarity], this.rng), sold: false});
    }
    // wand and expand cards are permanent fixtures, not rolled offers
    cards.push({kind: "wand"});
    cards.push({kind: "expand"});
    this.cards = cards;
  }

  reroll(run: RunState): boolean {
    if (run.gold < this.rerollCost)
      return false;
    run.gold -= this.rerollCost;
    this.rerolls++;
    this.rerollCost = REROLL_BASE + REROLL_STEP * this.rerolls;
    this.generate();
    return true;
  }

  // prices are derived, never stored, so a purchase re-prices every card at
  // once; wand escalation persists for the whole run
  cardPrice(card: ShopCard, run: RunState): number {
    if (card.kind === "wand")
      return wandPrice(run.wandSlots) + WAND_STEP * this.wandsBought;
    if (card.kind === "expand")
      return wandPrice(run.wandSlots + 2);
    return card.price;
  }

  buy(i: number, run: RunState): boolean {
    const card = this.cards[i];
    if (!card)
      return false;
    if (card.kind === "spell" && card.sold)
      return false;
    const price = this.cardPrice(card, run);
    if (run.gold < price)
      return false;
    run.gold -= price;
    if (card.kind === "spell") {
      run.inventory.push({spellId: card.spellId, price: card.price});
      card.sold = true;
    } else if (card.kind === "wand") {
      run.addWand();
      this.wandsBought++;
    } else {
      run.wandSlots += 2;
      for (const w of run.wands)
        w.slots.push(null, null);
    }
    return true;
  }

  sellInventoryItem(index: number, run: RunState): boolean {
    const item = run.inventory[index];
    if (!item)
      return false;
    run.gold += Math.round(item.price / 2);
    run.inventory.splice(index, 1);
    return true;
  }

  sellWand(wandIdx: number, run: RunState): boolean {
    // at least one wand must remain
    if (run.wands.length <= 1 || wandIdx < 0 || wandIdx >= run.wands.length)
      return false;
    const size = run.wands[wandIdx].slots.length;
    run.gold += Math.round(wandPrice(size) / 2);
    // spells unequip back to inventory
    for (const slot of run.wands[wandIdx].slots)
      if (slot)
        run.inventory.push({spellId: slot, price: 0});
    run.wands.splice(wandIdx, 1);
    if (run.activeWand >= run.wands.length)
      run.activeWand = 0;
    return true;
  }

  resetAfterBattle(): void {
    this.rerolls = 0;
    this.rerollCost = REROLL_BASE;
  }
}
