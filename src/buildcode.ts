import {RunState, Wand} from "./wand.ts";
import {spellById} from "./spells.ts";

// NA1 build code (GDD §7.9): "NA1:" + base64(JSON) describing wands, slots
// and inventory so a run can be shared/re-entered.
type NA1 = {
  v: 1;
  active: number;
  wands: {slots: (string | null)[]}[];
  inv: string[];
};

function toBase64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes)
    bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromBase64(s: string): string {
  const bin = atob(s);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeBuild(run: RunState): string {
  const data: NA1 = {
    v: 1,
    active: run.activeWand,
    wands: run.wands.map(w => ({slots: [...w.slots]})),
    inv: [...run.inventory],
  };
  return "NA1:" + toBase64(JSON.stringify(data));
}

// replace the run's roster on success; return null on malformed input
export function decodeBuild(code: string): {active: number; wands: Wand[]; inv: string[]} | null {
  try {
    if (!code.startsWith("NA1:"))
      return null;
    const data = JSON.parse(fromBase64(code.slice(4))) as NA1;
    if (data.v !== 1 || !Array.isArray(data.wands) || data.wands.length === 0)
      return null;
    const wands: Wand[] = [];
    for (const w of data.wands) {
      if (!Array.isArray(w.slots) || w.slots.length < 1 || w.slots.length > 8)
        return null;
      const slots = w.slots.map(id => (id === null || spellById(id) ? id : null));
      wands.push({slots, cursor: 0});
    }
    const inv = data.inv.filter(id => spellById(id));
    const active = data.active >= 0 && data.active < wands.length ? data.active : 0;
    return {active, wands, inv};
  } catch {
    return null;
  }
}
