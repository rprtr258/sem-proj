import {SPELLS, Rarity, RARITY_PRICE, RARITY_WEIGHT} from "./spells.ts";
import {RunState, WAND_PRICE} from "./wand.ts";

export type ShopCard =
  | {kind: "spell"; spellId: string; price: number; sold: boolean}
  | {kind: "wand"; size: number; price: number; sold: boolean};

const SPELL_COUNT = 4;
export const REROLL_BASE = 10;
export const REROLL_STEP = 2;

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

// One shop page: 4 spell cards + 1 wand card. Reroll cost 10, +2 per repeat,
// resets after each battle (GDD §7.8).
export class Shop {
  cards: ShopCard[] = [];
  rerollCost = REROLL_BASE;
  rerolls = 0;

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
    // wand card: mostly 4-slot, sometimes 6, rarely 8
    const wr = this.rng();
    const size = wr < 0.6 ? 4 : wr < 0.9 ? 6 : 8;
    cards.push({kind: "wand", size, price: WAND_PRICE[size], sold: false});
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

  buy(i: number, run: RunState): boolean {
    const card = this.cards[i];
    if (!card || card.sold || run.gold < card.price)
      return false;
    if (card.kind === "spell") {
      run.gold -= card.price;
      run.inventory.push({spellId: card.spellId, price: card.price});
    } else {
      run.gold -= card.price;
      run.addWand(card.size);
    }
    card.sold = true;
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
    run.gold += Math.round(WAND_PRICE[size] / 2);
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
