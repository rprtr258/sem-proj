// UI strings, RU default with EN switch (GDD §7.9). Spell names/descriptions
// live in their defs as {ru, en} pairs — this dict is for UI chrome only.
export type Lang = "ru" | "en";

const STRINGS = {
  "menu.title": {ru: "MAGNUM OPUS", en: "MAGNUM OPUS"},
  "menu.subtitle": {ru: "полевой автобаттлер — M1", en: "field autobattler — M1"},
  "menu.start": {ru: "Начать ран", en: "Start run"},
  "menu.language": {ru: "Язык", en: "Language"},
  "menu.scores": {ru: "Лучшие раны", en: "Best runs"},
  "menu.scoresEmpty": {ru: "Пока пусто", en: "Nothing yet"},

  "hub.round": {ru: "Раунд", en: "Round"},
  "hub.attempts": {ru: "Попытки", en: "Attempts"},
  "hub.gold": {ru: "Золото", en: "Gold"},
  "hub.hp": {ru: "Здоровье", en: "Health"},
  "hub.tabShop": {ru: "Магазин", en: "Shop"},
  "hub.tabAssembly": {ru: "Сборка", en: "Assembly"},
  "hub.tabInventory": {ru: "Инвентарь", en: "Inventory"},
  "hub.startRound": {ru: "В бой ▶", en: "Fight ▶"},

  "shop.reroll": {ru: "Переброс", en: "Reroll"},
  "shop.buy": {ru: "Купить", en: "Buy"},
  "shop.sold": {ru: "Продано", en: "Sold"},
  "shop.wandSlots": {ru: "слотов", en: "slots"},
  "shop.spellCount": {ru: "Заклинания", en: "Spells"},

  "assembly.wands": {ru: "Жезлы", en: "Wands"},
  "assembly.active": {ru: "активный", en: "active"},
  "assembly.makeActive": {ru: "сделать активным", en: "make active"},
  "assembly.sell": {ru: "Продать жезл", en: "Sell wand"},
  "assembly.inventory": {ru: "Инвентарь (перетащите в слот)", en: "Inventory (drag into a slot)"},
  "assembly.export": {ru: "Код билда", en: "Build code"},
  "assembly.exportBtn": {ru: "Экспорт", en: "Export"},
  "assembly.importBtn": {ru: "Импорт", en: "Import"},
  "assembly.importBad": {ru: "Неверный код билда", en: "Invalid build code"},

  "inventory.empty": {ru: "Пусто — купите заклинания в магазине", en: "Empty — buy spells in the shop"},
  "inventory.sell": {ru: "Продать", en: "Sell"},
  "inventory.equipped": {ru: "экипировано", en: "equipped"},

  "tooltip.mana": {ru: "мана", en: "mana"},
  "tooltip.damage": {ru: "урон", en: "damage"},

  "splash.round": {ru: "Раунд", en: "Round"},
  "splash.waveType": {ru: "Волна мобов", en: "Mob wave"},
  "splash.goal": {ru: "Цель: уничтожить всех врагов", en: "Goal: destroy all enemies"},
  "splash.go": {ru: "В бой! (Enter)", en: "Fight! (Enter)"},

  "result.victory": {ru: "Волна зачищена!", en: "Wave cleared!"},
  "result.stars": {ru: "Звёзды", en: "Stars"},
  "result.gold": {ru: "Золото за волну", en: "Wave gold"},
  "result.noHpBonus": {ru: "+10 — не потерял ни единого HP", en: "+10 — took no damage"},
  "result.continue": {ru: "Продолжить (Enter)", en: "Continue (Enter)"},

  "death.title": {ru: "Вы пали", en: "You fell"},
  "death.attemptsLeft": {ru: "Осталось попыток", en: "Attempts left"},
  "death.retry": {ru: "Ещё раз (Enter)", en: "Try again (Enter)"},

  "runend.title": {ru: "Ран завершён", en: "Run over"},
  "runend.stars": {ru: "Сумма звёзд", en: "Total stars"},
  "runend.best": {ru: "Лучший раунд", en: "Best round"},
  "runend.cleared": {ru: "Раундов пройдено", en: "Rounds cleared"},
  "runend.again": {ru: "Новый ран (Enter)", en: "New run (Enter)"},

  "hint.move": {ru: "WASD — движение, W — полёт (оранжевая шкала — выносливость)", en: "WASD — move, W — fly (orange bar — stamina)"},
  "hint.cast": {ru: "ЛКМ — каст: заклинания жезла срабатывают по очереди (мышь — прицел)", en: "LMB — cast: wand spells fire in sequence (mouse aims)"},
  "hint.tab": {ru: "Tab — сменить жезл, V — векторы ветра", en: "Tab — switch wand, V — wind vectors"},
  "hint.goal": {ru: "Уничтожьте всех врагов. Огонь жжёт и вас!", en: "Destroy all enemies. Fire burns you too!"},
} as const;

export type StringKey = keyof typeof STRINGS;

let lang: Lang = "ru";
// localStorage is browser-only; headless selftest runs without it
if (typeof localStorage !== "undefined") {
  const saved = localStorage.getItem("nab_lang");
  if (saved === "ru" || saved === "en")
    lang = saved;
}

export function getLang(): Lang {
  return lang;
}

export function setLang(l: Lang): void {
  lang = l;
  if (typeof localStorage !== "undefined")
    localStorage.setItem("nab_lang", l);
}

export function t(key: StringKey): string {
  return STRINGS[key][lang];
}

export function pick(pair: {ru: string; en: string}): string {
  return pair[lang];
}
