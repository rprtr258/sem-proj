import {RunState, Wand} from "./wand.ts";
import {Shop, ShopCard} from "./shop.ts";
import {spellById} from "./spells.ts";
import {spellIconSvg} from "./icons.ts";
import {encodeBuild, decodeBuild, importPrice} from "./buildcode.ts";
import {t, pick, getLang, setLang, Lang} from "./i18n.ts";

// DOM overlays for the non-arena screens. The canvas stays mounted; ui hides
// it outside the arena. All game actions are delegated via the Handlers below.
export type Handlers = {
  startRun(): void;
  startRound(): void;
  continueToHub(): void;
  reroll(): void;
  buy(i: number): void;
  sellItem(i: number): void;
  sellWand(i: number): void;
  activateWand(i: number): void;
  setLang(l: Lang): void;
  restart(): void;
};

export type Screen = "menu" | "hub" | "splash" | "arena" | "result" | "death" | "runend";

const SCORES_KEY = "noita_autobattler_scores_v1";

export type ScoreEntry = {stars: number; cleared: number; date: string};

export function loadScores(): ScoreEntry[] {
  try {
    return JSON.parse(localStorage.getItem(SCORES_KEY) ?? "[]") as ScoreEntry[];
  } catch {
    return [];
  }
}

export function saveScore(entry: ScoreEntry): void {
  const scores = loadScores();
  scores.push(entry);
  scores.sort((a, b) => b.stars - a.stars || b.cleared - a.cleared);
  localStorage.setItem(SCORES_KEY, JSON.stringify(scores.slice(0, 10)));
}

export class Ui {
  private root: HTMLElement;
  private canvas: HTMLCanvasElement;

  constructor(private h: Handlers) {
    this.root = document.getElementById("ui")!;
    this.canvas = document.getElementById("game") as HTMLCanvasElement;
  }

  show(screen: Screen, data?: {
    run?: RunState;
    shop?: Shop;
    result?: {stars: number; gold: number; bonus: boolean};
    runend?: {stars: number; cleared: number};
    splash?: {round: number};
  }): void {
    // splash/arena keep the canvas visible; splash shows a DOM overlay on top
    const overlay = screen !== "arena";
    this.canvas.style.display = screen === "menu" || screen === "runend" ? "none" : "block";
    this.root.style.display = overlay ? "flex" : "none";
    this.root.innerHTML = "";
    switch (screen) {
      case "menu": this.menu(); break;
      case "hub": this.hub(data!.run!, data!.shop!); break;
      case "splash": this.splash(data!.splash!.round); break;
      case "result": this.result(data!.result!); break;
      case "death": this.death(data!.run!); break;
      case "runend": this.runend(data!.runend!); break;
      case "arena": break;
    }
  }

  private el(html: string): HTMLElement {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.firstElementChild as HTMLElement;
  }

  private langButtons(): string {
    const lang = getLang();
    return `
      <span class="lang">
        <button data-lang="ru" class="${lang === "ru" ? "on" : ""}">RU</button>
        <button data-lang="en" class="${lang === "en" ? "on" : ""}">EN</button>
      </span>`;
  }

  private wireLangs(): void {
    this.root.querySelectorAll("button[data-lang]").forEach(b =>
      b.addEventListener("click", () => this.h.setLang((b as HTMLButtonElement).dataset.lang as Lang)));
  }

  private menu(): void {
    const scores = loadScores().slice(0, 5);
    this.root.appendChild(this.el(`
      <div class="screen menu">
        <h1>${t("menu.title")}</h1>
        <div class="subtitle">${t("menu.subtitle")}</div>
        ${this.langButtons()}
        <button id="start" class="big">${t("menu.start")}</button>
        <div class="scores">
          <div class="scores-title">${t("menu.scores")}</div>
          ${scores.length === 0 ? `<div class="dim">${t("menu.scoresEmpty")}</div>` :
            scores.map(s => `<div>★ ${s.stars} · ${t("runend.cleared")}: ${s.cleared}</div>`).join("")}
        </div>
      </div>`));
    this.wireLangs();
    this.root.querySelector("#start")!.addEventListener("click", () => this.h.startRun());
  }

  private hub(run: RunState, shop: Shop): void {
    this.root.appendChild(this.el(`
      <div class="screen hub">
        <div class="hub-top">
          <span>${t("hub.round")} ${run.round}/5</span>
          <span>${t("hub.attempts")}: ${"●".repeat(run.attempts)}</span>
          <span>${t("hub.gold")}: <b id="gold">${run.gold}</b></span>
          <span>${t("hub.hp")}: ${run.hp}</span>
          ${this.langButtons()}
        </div>
        <div class="tabs">
          <button class="tab on" data-tab="shop">${t("hub.tabShop")}</button>
          <button class="tab" data-tab="assembly">${t("hub.tabAssembly")}</button>
          <button class="tab" data-tab="inventory">${t("hub.tabInventory")}</button>
        </div>
        <div id="tab-shop" class="tabbody"></div>
        <div id="tab-assembly" class="tabbody" style="display:none"></div>
        <div id="tab-inventory" class="tabbody" style="display:none"></div>
        <button id="fight" class="big fight">${t("hub.startRound")}</button>
      </div>`));
    this.wireLangs();
    this.root.querySelector("#fight")!.addEventListener("click", () => this.h.startRound());
    this.root.querySelectorAll(".tab").forEach(b =>
      b.addEventListener("click", () => {
        this.root.querySelectorAll(".tab").forEach(x => x.classList.remove("on"));
        b.classList.add("on");
        this.root.querySelectorAll(".tabbody").forEach(x => (x as HTMLElement).style.display = "none");
        (this.root.querySelector(`#tab-${(b as HTMLElement).dataset.tab}`) as HTMLElement).style.display = "";
      }));
    this.renderShopTab(shop);
    this.renderAssemblyTab(run);
    this.renderInventoryTab(run);
  }

  private tooltipHost(): HTMLElement {
    return document.getElementById("tooltip")!;
  }

  private attachTooltip(el: HTMLElement, html: () => string): void {
    const tip = this.tooltipHost();
    el.addEventListener("mouseenter", () => { tip.innerHTML = html(); tip.style.display = "block"; });
    el.addEventListener("mousemove", e => {
      tip.style.left = `${Math.min(window.innerWidth - 260, e.clientX + 14)}px`;
      tip.style.top = `${e.clientY + 14}px`;
    });
    el.addEventListener("mouseleave", () => { tip.style.display = "none"; });
  }

  private spellTooltipHtml(spellId: string): string {
    const s = spellById(spellId)!;
    return `<b>${pick(s.name)}</b> <span class="dim">[${s.rarity}]</span><br>${pick(s.desc)}<br>` +
      `<span class="dim">${t("tooltip.mana")}: ${s.mana}</span>`;
  }

  private cardHtml(card: ShopCard, i: number): string {
    if (card.sold)
      return `<div class="card sold"><div class="dim">${t("shop.sold")}</div></div>`;
    if (card.kind === "spell") {
      const s = spellById(card.spellId)!;
      return `
        <div class="card" data-buy="${i}">
          ${spellIconSvg(card.spellId)}
          <div class="spellname">${pick(s.name)}</div>
          <div class="dim">[${s.rarity}]</div>
          <div class="price">◉ ${card.price}</div>
          <button class="buy">${t("shop.buy")}</button>
        </div>`;
    }
    return `
      <div class="card wandcard" data-buy="${i}">
        ${spellIconSvg("wand")}
        <div><b>${t("hub.tabAssembly")}</b></div>
        <div>${card.size} ${t("shop.wandSlots")}</div>
        <div class="price">◉ ${card.price}</div>
        <button class="buy">${t("shop.buy")}</button>
      </div>`;
  }

  private renderShopTab(shop: Shop): void {
    const body = this.root.querySelector("#tab-shop")!;
    body.innerHTML = `
      <div class="shoprow">
        ${shop.cards.map((c, i) => this.cardHtml(c, i)).join("")}
        <button id="reroll" class="reroll">${t("shop.reroll")} ◉ ${shop.rerollCost}</button>
      </div>`;
    body.querySelectorAll("[data-buy]").forEach(el => {
      const i = Number((el as HTMLElement).dataset.buy);
      const btn = el.querySelector(".buy")!;
      btn.addEventListener("click", () => this.h.buy(i));
      this.attachTooltip(el as HTMLElement, () => {
        const card = shop.cards[i];
        return card && card.kind === "spell" ? this.spellTooltipHtml(card.spellId) : `${card.size} ${t("shop.wandSlots")}`;
      });
    });
    body.querySelector("#reroll")!.addEventListener("click", () => this.h.reroll());
  }

  private wandHtml(run: RunState, w: Wand, wandIdx: number): string {
    const slots = w.slots.map((spellId, slot) => `
      <div class="slot" data-wand="${wandIdx}" data-slot="${slot}">
        ${spellId ? spellIconSvg(spellId) : ""}
      </div>`).join("");
    return `
      <div class="wand ${wandIdx === run.activeWand ? "active" : ""}">
        <div class="wandhead">
          <span>${t("hub.tabAssembly")} #${wandIdx + 1} (${w.slots.length})</span>
          ${wandIdx === run.activeWand ? `<span class="dim">${t("assembly.active")}</span>` :
            `<button data-activate="${wandIdx}" class="mini">${t("assembly.makeActive")}</button>`}
          ${run.wands.length > 1 ? `<button data-sellwand="${wandIdx}" class="mini">✕ ${t("assembly.sell")}</button>` : ""}
        </div>
        <div class="slots">${slots}</div>
      </div>`;
  }

  private renderAssemblyTab(run: RunState): void {
    const body = this.root.querySelector("#tab-assembly")!;
    body.innerHTML = `
      <div class="assembly">
        <div class="wands">${run.wands.map((w, i) => this.wandHtml(run, w, i)).join("")}</div>
        <div class="invside">
          <div class="dim">${t("assembly.inventory")}</div>
          <div class="invitems">
            ${run.inventory.map((it, i) => `
              <div class="invitem" data-inv="${i}">
                ${spellIconSvg(it.spellId)}
              </div>`).join("")}
          </div>
          <div class="buildcode">
            <textarea id="nacode" placeholder="NA1:..."></textarea>
            <button id="naexport" class="mini">${t("assembly.exportBtn")}</button>
            <button id="naimport" class="mini">${t("assembly.importBtn")}</button>
            <span id="nastatus" class="dim"></span>
          </div>
        </div>
      </div>`;
    body.querySelectorAll("[data-activate]").forEach(b =>
      b.addEventListener("click", () => this.h.activateWand(Number((b as HTMLElement).dataset.activate))));
    body.querySelectorAll("[data-sellwand]").forEach(b =>
      b.addEventListener("click", () => this.h.sellWand(Number((b as HTMLElement).dataset.sellwand))));
    this.wireDragAndDrop(body, run);
    body.querySelector("#naexport")!.addEventListener("click", () => {
      (body.querySelector("#nacode") as HTMLTextAreaElement).value = encodeBuild(run);
    });
    body.querySelector("#naimport")!.addEventListener("click", () => {
      const code = (body.querySelector("#nacode") as HTMLTextAreaElement).value.trim();
      const decoded = decodeBuild(code);
      const status = body.querySelector("#nastatus")!;
      if (!decoded) {
        status.textContent = t("assembly.importBad");
        return;
      }
      status.textContent = "OK";
      run.wands = decoded.wands.map(w => ({slots: [...w.slots], cursor: 0}));
      run.activeWand = decoded.active;
      run.inventory = decoded.inv.map(id => ({spellId: id, price: importPrice(id)}));
      this.refresh(run);
    });
  }

  // pointer-based drag&drop: inventory <-> wand slots
  private wireDragAndDrop(root: Element, run: RunState): void {
    let drag: {spellId: string; from: {kind: "inv"; index: number} | {kind: "slot"; wand: number; slot: number}} | null = null;
    let ghost: HTMLElement | null = null;

    const removeDragged = () => {
      if (!drag)
        return;
      if (drag.from.kind === "inv")
        run.inventory.splice(drag.from.index, 1);
      else
        run.wands[drag.from.wand].slots[drag.from.slot] = null;
    };

    root.querySelectorAll(".invitem").forEach(el => {
      el.addEventListener("pointerdown", ev => {
        const e = ev as PointerEvent;
        const i = Number((el as HTMLElement).dataset.inv);
        drag = {spellId: run.inventory[i].spellId, from: {kind: "inv", index: i}};
        startGhost(e);
      });
      this.attachTooltip(el as HTMLElement, () => this.spellTooltipHtml(run.inventory[Number((el as HTMLElement).dataset.inv)]?.spellId ?? ""));
    });
    root.querySelectorAll(".slot").forEach(el => {
      el.addEventListener("pointerdown", ev => {
        const e = ev as PointerEvent;
        const wi = Number((el as HTMLElement).dataset.wand);
        const si = Number((el as HTMLElement).dataset.slot);
        const id = run.wands[wi].slots[si];
        if (!id)
          return;
        drag = {spellId: id, from: {kind: "slot", wand: wi, slot: si}};
        startGhost(e);
      });
    });

    const startGhost = (e: PointerEvent) => {
      ghost = document.createElement("div");
      ghost.className = "ghost";
      ghost.innerHTML = spellIconSvg(drag!.spellId);
      document.body.appendChild(ghost);
      moveGhost(e);
      e.preventDefault();
    };
    const moveGhost = (ev: Event) => {
      const pe = ev as PointerEvent;
      if (ghost) {
        ghost.style.left = `${pe.clientX - 12}px`;
        ghost.style.top = `${pe.clientY - 12}px`;
      }
    };

    document.addEventListener("pointermove", moveGhost);
    document.addEventListener("pointerup", e => {
      if (!drag)
        return;
      const target = document.elementFromPoint(e.clientX, e.clientY)?.closest(".slot") as HTMLElement | null;
      if (target) {
        const wi = Number(target.dataset.wand);
        const si = Number(target.dataset.slot);
        const old = run.wands[wi].slots[si];
        removeDragged();
        // swapped-out spell returns to inventory
        if (old)
          run.inventory.push({spellId: old, price: 0});
        run.wands[wi].slots[si] = drag.spellId;
      } else if ((e.target as HTMLElement)?.closest(".invitems")) {
        const old = drag.spellId;
        removeDragged();
        run.inventory.push({spellId: old, price: 0});
      }
      ghost?.remove();
      ghost = null;
      drag = null;
      this.refresh(run);
    });
  }

  private renderInventoryTab(run: RunState): void {
    const body = this.root.querySelector("#tab-inventory")!;
    const equipped = new Set(run.wands.flatMap(w => w.slots.filter(s => s)));
    body.innerHTML = `
      <div class="invlist">
        ${run.inventory.length === 0 ? `<div class="dim">${t("inventory.empty")}</div>` : ""}
        ${run.inventory.map((it, i) => {
          const s = spellById(it.spellId)!;
          return `
            <div class="invrow" data-row="${i}">
              ${spellIconSvg(s.id)}
              <span><b>${pick(s.name)}</b> ${equipped.has(it.spellId) ? `<span class="dim">(${t("inventory.equipped")})</span>` : ""}</span>
              <span class="price">◉ ${Math.round(it.price / 2)}</span>
              <button class="sell mini" data-sell="${i}">${t("inventory.sell")}</button>
            </div>`;
        }).join("")}
      </div>`;
    body.querySelectorAll("[data-sell]").forEach(b =>
      b.addEventListener("click", () => this.h.sellItem(Number((b as HTMLElement).dataset.sell))));
    body.querySelectorAll("[data-row]").forEach(el => {
      const it = run.inventory[Number((el as HTMLElement).dataset.row)];
      this.attachTooltip(el as HTMLElement, () => this.spellTooltipHtml(it.spellId));
    });
  }

  // re-render hub tabs after economy changes
  refresh(run: RunState, shop?: Shop): void {
    if (!this.root.querySelector(".hub"))
      return;
    const gold = this.root.querySelector("#gold");
    if (gold)
      gold.textContent = String(run.gold);
    this.renderAssemblyTab(run);
    this.renderInventoryTab(run);
    if (shop)
      this.renderShopTab(shop);
  }

  private splash(round: number): void {
    this.root.appendChild(this.el(`
      <div class="screen splash" style="background:rgba(10,10,16,0.85)">
        <h1>${t("splash.round")} ${round}</h1>
        <div class="subtitle">${t("splash.waveType")}</div>
        <div>${t("splash.goal")}</div>
        <button class="big">${t("splash.go")}</button>
      </div>`));
  }

  private result(r: {stars: number; gold: number; bonus: boolean}): void {
    this.root.appendChild(this.el(`
      <div class="screen">
        <h1>${t("result.victory")}</h1>
        <div class="stars">${"★".repeat(r.stars)}${"☆".repeat(3 - r.stars)}</div>
        <div>${t("result.gold")}: ◉ ${r.gold}</div>
        ${r.bonus ? `<div class="dim">${t("result.noHpBonus")}</div>` : ""}
        <button id="cont" class="big">${t("result.continue")}</button>
      </div>`));
    this.root.querySelector("#cont")!.addEventListener("click", () => this.h.continueToHub());
  }

  private death(run: RunState): void {
    this.root.appendChild(this.el(`
      <div class="screen">
        <h1>${t("death.title")}</h1>
        <div>${t("death.attemptsLeft")}: ${run.attempts}</div>
        <button id="cont" class="big">${t("death.retry")}</button>
      </div>`));
    this.root.querySelector("#cont")!.addEventListener("click", () => this.h.continueToHub());
  }

  private runend(r: {stars: number; cleared: number}): void {
    const scores = loadScores().slice(0, 5);
    this.root.appendChild(this.el(`
      <div class="screen">
        <h1>${t("runend.title")}</h1>
        <div>${t("runend.stars")}: ${"★".repeat(r.stars)}</div>
        <div>${t("runend.cleared")}: ${r.cleared}/5</div>
        <div class="scores">
          <div class="scores-title">${t("menu.scores")}</div>
          ${scores.map(s => `<div>★ ${s.stars} · ${s.cleared}/5</div>`).join("")}
        </div>
        <button id="again" class="big">${t("runend.again")}</button>
      </div>`));
    this.root.querySelector("#again")!.addEventListener("click", () => this.h.restart());
  }
}
