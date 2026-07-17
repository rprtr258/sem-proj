import {mul, Vec2} from "./types";
import {World} from "./world";
import {Renderer} from "./renderer";
import {Bullet} from "./bullet";
import {Laser} from "./laser";
import {Grenade} from "./grenade";

function main() {
  const cvs = document.getElementById("game") as HTMLCanvasElement;

  function resize() {
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  const ctx = cvs.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  const renderer = new Renderer(ctx, () => requestAnimationFrame(gameLoop));
  const world = new World();
  let mouseGame: Vec2 = mul({x: 640, y: 480}, 1/2);

  // --- input ---
  document.addEventListener("keydown", e => {
    world.keyPressEvent(e.code);
    if (["KeyA", "KeyD", "KeyW", "Tab"].includes(e.code))
      e.preventDefault();
  });
  document.addEventListener("keyup", e => {
    world.keyReleaseEvent(e.code);
  });

  cvs.addEventListener("mousemove", e => {
    const r = cvs.getBoundingClientRect();
    mouseGame = renderer.screenToGame({x: e.clientX - r.left, y: e.clientY - r.top});
  });

  cvs.addEventListener("mousedown", e => {
    const r = cvs.getBoundingClientRect();
    const g = renderer.screenToGame({x: e.clientX - r.left, y: e.clientY - r.top});
    world.click(g.x, g.y);
  });

  cvs.addEventListener("contextmenu", e => e.preventDefault());
  cvs.style.cursor = "none";

  // --- game loop ---
  let lastTime = 0;
  const FIXED_DT = 20;
  function gameLoop(timestamp: number) {
    const dt = lastTime === 0 ? FIXED_DT : Math.min(timestamp - lastTime, 50);
    lastTime = timestamp;

    world.update();
    renderer.render(dt, world, mouseGame);

    requestAnimationFrame(gameLoop);
  }

  renderer.loadAssets();
}

document.addEventListener("DOMContentLoaded", main);
