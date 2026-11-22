import {Field} from "./field.ts";
import {World} from "./world.ts";
import {RunState} from "./wand.ts";
import {Shop} from "./shop.ts";
import {Renderer, GAME_W, GAME_H} from "./renderer.ts";
import {Ui, saveScore, Screen} from "./ui.ts";
import {getLang, setLang} from "./i18n.ts";

const M1_ROUNDS = 5;

function main() {
  const canvas = document.getElementById("game") as HTMLCanvasElement;
  const renderer = new Renderer(canvas);
  let run = new RunState();
  let shop = new Shop();
  let world: World | null = null;
  let screen: Screen = "menu";

  function fit() {
    renderer.fitWindow();
    const scale = renderer.scale;
    canvas.style.width = `${GAME_W * scale}px`;
    canvas.style.height = `${GAME_H * scale}px`;
  }
  window.addEventListener("resize", fit);
  fit();

  const ui = new Ui({
    startRun() {
      showHub();
    },
    startRound() {
      startRound();
    },
    continueToHub() {
      showHub();
    },
    reroll() {
      shop.reroll(run);
      ui.show("hub", {run, shop});
    },
    buy(i) {
      shop.buy(i, run);
      ui.show("hub", {run, shop});
    },
    sellWand(i) {
      shop.sellWand(i, run);
      ui.show("hub", {run, shop});
    },
    activateWand(i) {
      run.activeWand = i;
      ui.show("hub", {run, shop});
    },
    setLang(l) {
      setLang(l);
      ui.show(screen === "runend" ? "menu" : screen, {run, shop, result: lastResult, runend: lastRunend});
    },
    restart() {
      run = new RunState();
      shop = new Shop();
      showMenu();
    },
  });
  let lastResult: {stars: number; gold: number; bonus: boolean} | undefined;
  let lastRunend: {stars: number; cleared: number} | undefined;

  function showMenu() {
    screen = "menu";
    document.documentElement.lang = getLang();
    ui.show("menu");
  }

  function showHub() {
    screen = "hub";
    world = null;
    ui.show("hub", {run, shop});
  }

  function startRound() {
    screen = "splash";
    world = new World(new Field(), run, run.round);
    ui.show("splash", {splash: {round: run.round}});
    const go = () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", go);
      screen = "arena";
      ui.show("arena");
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Enter" || e.code === "Space")
        go();
    };
    window.addEventListener("keydown", onKey);
    // attach on the next tick: the #fight button's own click bubbles up to
    // document and would otherwise skip the splash instantly
    setTimeout(() => document.addEventListener("click", go), 0);
  }

  function finishRound() {
    const outcome = world!.outcome!;
    if (outcome.won) {
      const reward = 50 + (outcome.hpLost ? 0 : 10);
      run.gold += reward;
      run.stars.push(outcome.stars);
      lastResult = {stars: outcome.stars, gold: reward + outcome.goldEarned, bonus: !outcome.hpLost};
      run.round++;
      shop.resetAfterBattle();
      if (run.round > M1_ROUNDS) {
        lastRunend = {stars: run.totalStars(), cleared: run.roundsCleared()};
        saveScore({stars: run.totalStars(), cleared: run.roundsCleared(), date: new Date().toISOString().slice(0, 10)});
        screen = "runend";
        ui.show("runend", {runend: lastRunend});
        return;
      }
      screen = "result";
      ui.show("result", {result: lastResult});
    } else {
      run.attempts--;
      if (run.attempts <= 0) {
        lastRunend = {stars: run.totalStars(), cleared: run.roundsCleared()};
        saveScore({stars: run.totalStars(), cleared: run.roundsCleared(), date: new Date().toISOString().slice(0, 10)});
        screen = "runend";
        ui.show("runend", {runend: lastRunend});
        return;
      }
      screen = "death";
      ui.show("death", {run});
    }
  }

  // --- input ---
  document.addEventListener("keydown", e => {
    if (screen !== "arena" || !world)
      return;
    switch (e.code) {
      case "KeyA": world.player.goLeft(); break;
      case "KeyD": world.player.goRight(); break;
      case "KeyW": world.player.jumpHeld = true; break;
      case "Tab": {
        run.activeWand = (run.activeWand + 1) % run.wands.length;
        e.preventDefault();
        break;
      }
      case "KeyV": world.showVectors = !world.showVectors; break;
    }
    if (["KeyA", "KeyD", "KeyW", "Tab", "Space"].includes(e.code))
      e.preventDefault();
  });
  document.addEventListener("keyup", e => {
    if (!world)
      return;
    if (e.code === "KeyA")
      world.player.stopLeft();
    if (e.code === "KeyD")
      world.player.stopRight();
    if (e.code === "KeyW")
      world.player.jumpHeld = false;
  });

  // LMB fires the wand's next spell in sequence (A -> B -> C -> A ...)
  function castNext() {
    if (world)
      world.castNext(world.mouse);
  }

  canvas.addEventListener("mousemove", e => {
    if (world)
      world.mouse = renderer.toGame(e.clientX, e.clientY, canvas);
  });
  canvas.addEventListener("mousedown", () => {
    if (screen === "arena" && world)
      castNext();
  });
  canvas.addEventListener("contextmenu", e => e.preventDefault());
  canvas.style.cursor = "none";

  // --- loop ---
  let lastTime = 0;
  const FIXED_DT = 20;
  let acc = 0;
  function gameLoop(timestamp: number) {
    const dt = lastTime === 0 ? FIXED_DT : Math.min(timestamp - lastTime, 50);
    lastTime = timestamp;
    if ((screen === "splash" || screen === "arena") && world) {
      acc += dt;
      let steps = 0;
      while (acc >= FIXED_DT && steps < 3) {
        acc -= FIXED_DT;
        steps++;
        if (screen === "arena")
          world.update();
      }
      if (screen === "arena" && world.outcome) {
        finishRound();
      } else {
        renderer.render(world);
      }
    }
    requestAnimationFrame(gameLoop);
  }

  showMenu();
  requestAnimationFrame(gameLoop);
  // debug/testing hook (selftest covers logic headlessly; this exposes live state)
  (window as unknown as Record<string, unknown>).__m1 = {run, shop, getWorld: () => world};
}

document.addEventListener("DOMContentLoaded", main);
