import {SPELLS} from "./spells.ts";

// mana costs live on spell defs; keep a plain lookup so casting stays
// decoupled from spell cast behavior
const SPELL_MANA: Record<string, number> = {};
for (const s of SPELLS)
  SPELL_MANA[s.id] = s.mana;

// Mana instead of overheat (old Character system): mana 100, regen 0.8/tick
export const MANA_MAX = 100;
export const MANA_REGEN_PER_TICK = 0.8;

export type Wand = {
  slots: (string | null)[];
  cursor: number; // next spell to cast; wands fire spells sequentially
};

export type InventoryItem = {
  spellId: string;
  price: number; // rolled shop price; sell price is 50%
};

export const WAND_PRICE: Record<number, number> = {4: 60, 6: 140, 8: 260};

// tier price for any slot count: the table covers 4/6/8, beyond that +120
// per extra +2 slots (10 → 380, 12 → 500, …)
export function wandPrice(size: number): number {
  return WAND_PRICE[size] ?? WAND_PRICE[8] + 120 * ((size - 8) / 2);
}

// Everything that persists across a run: economy, roster, attempts, score.
// Lives outside the combat World so shop/assembly screens can edit it while
// no arena exists.
export class RunState {
  gold = 150;
  attempts = 3;
  round = 1; // rounds are 1..5; incremented after each victory
  hp = 100;
  mana = MANA_MAX;
  activeWand = 0;
  wands: Wand[] = [{slots: [null, null, null, null], cursor: 0}];
  inventory: {spellId: string; price: number}[] = [];
  // global slot count: raised by the shop expand card, inherited by every
  // newly bought wand
  wandSlots = 4;

  stars: number[] = []; // per round, 1..3
  hpLostThisRound = false;
  diedThisRound = false;

  addWand(): void {
    this.wands.push({slots: Array(this.wandSlots).fill(null), cursor: 0});
  }

  get activeWandObj(): Wand {
    return this.wands[this.activeWand];
  }

  tickMana(): void {
    this.mana = Math.min(MANA_MAX, this.mana + MANA_REGEN_PER_TICK);
  }

  resetCombatState(): void {
    this.mana = MANA_MAX;
    this.hp = 100;
    this.hpLostThisRound = false;
    this.diedThisRound = false;
  }

  // take the next spell from the wand's sequence: slots fire in order,
  // A -> B -> C -> A ..., empty slots are skipped without spending mana.
  // Returns {spellId, slot} or null when out of mana / wand is empty.
  castNext(wandIdx: number): {spellId: string; slot: number} | null {
    const wand = this.wands[wandIdx];
    for (let i = 0; i < wand.slots.length; i++) {
      const slot = (wand.cursor + i) % wand.slots.length;
      const spellId = wand.slots[slot];
      if (!spellId)
        continue;
      const cost = SPELL_MANA[spellId] ?? 10;
      if (this.mana < cost)
        return null;
      this.mana -= cost;
      wand.cursor = (slot + 1) % wand.slots.length;
      return {spellId, slot};
    }
    return null;
  }

  totalStars(): number {
    return this.stars.reduce((a, b) => a + b, 0);
  }

  roundsCleared(): number {
    return this.stars.filter(s => s > 0).length;
  }
}
