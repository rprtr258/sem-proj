import {Vec2, clamp} from "./types.ts";
import {World} from "./world.ts";
import {
  FIELD_CELL, FIELD_COLS, FIELD_ROWS, FIELD_ORIGIN,
  FIELD_SOLID_THRESHOLD, MAT_WATER, MAT_ICE, MAT_STEAM,
} from "./field.ts";
import {ARCHETYPES} from "./enemies.ts";
import {spellIconImage} from "./icons.ts";
import {t} from "./i18n.ts";

export const GAME_W = 960;
export const GAME_H = 540;

// world -> field grid
function cellIndex(p: Vec2): number {
  const gx = Math.floor((p.x - FIELD_ORIGIN.x) / FIELD_CELL);
  const gy = Math.floor((p.y - FIELD_ORIGIN.y) / FIELD_CELL);
  if (gx < 0 || gx >= FIELD_COLS || gy < 0 || gy >= FIELD_ROWS)
    return -1;
  return gy * FIELD_COLS + gx;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  // field is rasterized per cell into an offscreen buffer (old game style),
  // then scaled up — 4px cells
  private fieldCvs: HTMLCanvasElement;
  private fieldCtx: CanvasRenderingContext2D;
  private fieldImg: ImageData;
  // gameplay pixel scale factor applied via CSS (canvas stays 960x540)
  private viewScale = 1;

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = GAME_W;
    canvas.height = GAME_H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.fieldCvs = document.createElement("canvas");
    this.fieldCvs.width = FIELD_COLS;
    this.fieldCvs.height = FIELD_ROWS;
    this.fieldCtx = this.fieldCvs.getContext("2d")!;
    this.fieldImg = this.fieldCtx.createImageData(FIELD_COLS, FIELD_ROWS);
  }

  fitWindow(): void {
    this.viewScale = Math.min(window.innerWidth / GAME_W, window.innerHeight / GAME_H);
  }

  get scale(): number {
    return this.viewScale;
  }

  // client px -> game px
  toGame(clientX: number, clientY: number, canvas: HTMLCanvasElement): Vec2 {
    const r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) / this.viewScale,
      y: (clientY - r.top) / this.viewScale,
    };
  }

  render(w: World): void {
    // dark backdrop (old game had a bg image; translucent field draws over it)
    this.ctx.fillStyle = "#0e0d14";
    this.ctx.fillRect(0, 0, GAME_W, GAME_H);
    this.drawField(w);
    this.drawEntities(w);
    this.drawHud(w);
  }

  // per-cell field raster, old game palette: opaque gray terrain, translucent
  // blue push / red pull wave, bluish wave-solid; temperature and materials
  // tint on top. Vector overlay drawn in world space afterwards.
  private drawField(w: World): void {
    const d = this.fieldImg.data;
    const wave = w.field.waveField;
    const base = w.field.baseField;
    const temp = w.field.tempField;
    const mat = w.field.materialField;
    for (let i = 0; i < FIELD_COLS * FIELD_ROWS; i++) {
      let r = 0, g = 0, b = 0, a = 0;
      if (base[i] >= FIELD_SOLID_THRESHOLD) {
        r = 0x44; g = 0x44; b = 0x44; a = 255; // static terrain: opaque gray
      } else {
        const wv = wave[i];
        if (wv >= FIELD_SOLID_THRESHOLD) {
          // wave-solid terrain, prototype tint: bluish scaled by density
          const intensity = Math.min(255, 100 + wv * 90);
          a = 200;
          r = intensity * 0.7;
          g = intensity * 0.85;
          b = intensity;
        } else if (wv > 0.02) {
          a = Math.min(220, wv * 300);
          b = Math.min(255, 60 + wv * 160);
          g = Math.min(160, wv * 100);
        } else if (wv < -0.02) {
          a = Math.min(220, -wv * 300);
          r = Math.min(255, -wv * 240);
          g = Math.min(70, -wv * 55);
        }
      }
      const m = mat[i];
      if (m === MAT_WATER) {
        r = 30; g = 90; b = 200; a = 235;
      } else if (m === MAT_ICE) {
        r = 160; g = 210; b = 235; a = 255;
      } else if (m === MAT_STEAM) {
        r = 190; g = 190; b = 200; a = Math.max(a, 140);
      }
      // temperature tint: hot reddens/brightens, cold shifts to blue-white
      const tp = temp[i];
      if (tp > 3) {
        r = Math.min(255, r + tp * 2.5);
        g = Math.min(255, g + tp * 1.2);
        b = Math.min(255, b + tp * 0.5);
        a = Math.min(230, Math.max(a, tp * 3));
      } else if (tp < -3) {
        r = Math.max(0, r + tp * 1.5);
        g = Math.max(0, g + tp * 0.8);
        b = Math.min(255, b - tp * 2.5);
        a = Math.min(230, Math.max(a, -tp * 3));
      }
      const o = i * 4;
      d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = a;
    }
    this.fieldCtx.putImageData(this.fieldImg, 0, 0);
    this.ctx.drawImage(this.fieldCvs, FIELD_ORIGIN.x, FIELD_ORIGIN.y, FIELD_COLS * FIELD_CELL, FIELD_ROWS * FIELD_CELL);

    if (w.showVectors) {
      const velX = w.field.velXField;
      const velY = w.field.velYField;
      const ctx = this.ctx;
      ctx.strokeStyle = "rgba(140, 255, 190, 0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gy = 2; gy < FIELD_ROWS - 2; gy += 4) {
        for (let gx = 2; gx < FIELD_COLS - 2; gx += 4) {
          const idx = gy * FIELD_COLS + gx;
          const vx = velX[idx], vy = velY[idx];
          const mag = Math.hypot(vx, vy);
          if (mag > 0.04) {
            const sx = FIELD_ORIGIN.x + (gx + 0.5) * FIELD_CELL;
            const sy = FIELD_ORIGIN.y + (gy + 0.5) * FIELD_CELL;
            const len = Math.min(10, mag * 16);
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + vx / mag * len, sy + vy / mag * len);
          }
        }
      }
      ctx.stroke();
    }
  }

  private drawEntities(w: World): void {
    const ctx = this.ctx;
    // spell effects under bodies
    for (const fx of w.effects) {
      if (fx.kind === "vortex") {
        ctx.strokeStyle = "rgba(220,220,255,0.7)";
        ctx.lineWidth = 2;
        const a = w.ticks * 0.35;
        for (let arm = 0; arm < 3; arm++) {
          ctx.beginPath();
          for (let s = 0; s < 10; s++) {
            const rr = fx.radius * (1 - s / 10);
            const aa = a + arm * 2.09 + s * 0.5;
            const x = fx.pos.x + Math.cos(aa) * rr;
            const y = fx.pos.y + Math.sin(aa) * rr - s * 1.5;
            s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else if (fx.kind === "pump") {
        ctx.strokeStyle = "rgba(120,200,255,0.8)";
        ctx.beginPath();
        ctx.arc(fx.pos.x, fx.pos.y, fx.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (fx.kind === "pulse") {
        ctx.strokeStyle = "rgba(255,160,80,0.9)";
        ctx.beginPath();
        ctx.arc(fx.pos.x, fx.pos.y, fx.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (fx.kind === "laserfx" && fx.from) {
        ctx.strokeStyle = "rgba(255,80,80,0.9)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(fx.from.x, fx.from.y);
        ctx.lineTo(fx.pos.x, fx.pos.y);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }

    // projectiles
    for (const pr of w.projectiles) {
      ctx.fillStyle =
        pr.kind === "bullet" ? "#f0e0b0" :
        pr.kind === "bolt" ? "#c0c8d8" :
        pr.kind === "heatbolt" ? "#ff9040" :
        pr.kind === "iceshard" ? "#a0d8ff" :
        "#506050"; // grenade
      const size = pr.kind === "grenade" ? 8 : 5;
      ctx.fillRect(pr.pos.x - size / 2, pr.pos.y - size / 2, size, size);
    }

    // enemies
    for (const e of w.enemies) {
      const b = e.body.boundingBox;
      ctx.fillStyle = ARCHETYPES[e.archetype].color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      // hp bar
      const hpFrac = e.body.health / e.body.maxHealth;
      ctx.fillStyle = "#400";
      ctx.fillRect(b.x, b.y - 8, b.w, 4);
      ctx.fillStyle = "#e05050";
      ctx.fillRect(b.x, b.y - 8, b.w * hpFrac, 4);
    }

    // player
    const pb = w.player.boundingBox;
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(pb.x, pb.y, pb.w, pb.h);
    ctx.fillStyle = "#202040";
    ctx.fillRect(pb.x + (w.mouse.x < pb.x + pb.w / 2 ? 8 : pb.w - 20), pb.y + 16, 12, 12);

    // crosshair
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(w.mouse.x, w.mouse.y, 7, 0, Math.PI * 2);
    ctx.moveTo(w.mouse.x - 11, w.mouse.y);
    ctx.lineTo(w.mouse.x - 3, w.mouse.y);
    ctx.moveTo(w.mouse.x + 3, w.mouse.y);
    ctx.lineTo(w.mouse.x + 11, w.mouse.y);
    ctx.stroke();
  }

  private drawHud(w: World): void {
    const ctx = this.ctx;
    const run = w.run;
    // HP / mana / fly stamina panel
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(10, 10, 210, 64);
    ctx.fillStyle = "#333";
    ctx.fillRect(16, 16, 198, 12);
    ctx.fillStyle = "#50c050";
    ctx.fillRect(16, 16, 198 * clamp(w.player.health / w.player.maxHealth, 0, 1), 12);
    // mana (old blue bar)
    ctx.fillStyle = "#333";
    ctx.fillRect(16, 34, 198, 12);
    ctx.fillStyle = "#40a0f0";
    ctx.fillRect(16, 34, 198 * clamp(run.mana / 100, 0, 1), 12);
    // fly stamina (old orange bar)
    ctx.fillStyle = "#333";
    ctx.fillRect(16, 52, 198, 12);
    ctx.fillStyle = "orange";
    ctx.fillRect(16, 52, 198 * clamp(w.player.flyEnergy / 100, 0, 1), 12);

    // wand slots; the highlighted one fires next (spells cast sequentially)
    const wand = run.wands[run.activeWand];
    for (let s = 0; s < wand.slots.length; s++) {
      const x = 10 + s * 40;
      const y = 80;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(x, y, 36, 36);
      const spellId = wand.slots[s];
      if (spellId) {
        const icon = spellIconImage(spellId);
        if (icon.complete && icon.naturalWidth > 0) {
          ctx.drawImage(icon, x + 6, y + 6, 24, 24);
          if (s === wand.cursor) {
            ctx.fillStyle = "rgba(255,224,128,0.18)";
            ctx.fillRect(x + 1, y + 1, 34, 34);
          }
        }
      }
      ctx.strokeStyle = s === wand.cursor ? "#ffe080" : "#666";
      ctx.strokeRect(x + 0.5, y + 0.5, 35, 35);
    }

    // round / attempts / gold
    ctx.font = "14px monospace";
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.fillText(`${t("hub.round")} ${run.round}`, GAME_W - 14, 24);
    ctx.fillText(`${t("hub.attempts")}: ${"●".repeat(run.attempts)}`, GAME_W - 14, 44);
    ctx.fillText(`${t("hub.gold")}: ${run.gold}`, GAME_W - 14, 64);
    ctx.textAlign = "left";

    // tutorial hint on round 1
    if (run.round === 1 && w.ticks < 500) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(GAME_W / 2 - 260, GAME_H - 92, 520, 78);
      ctx.fillStyle = "#ffe080";
      ctx.font = "13px monospace";
      const lines = [t("hint.move"), t("hint.cast"), t("hint.tab"), t("hint.goal")];
      lines.forEach((line, i) => ctx.fillText(line, GAME_W / 2 - 250, GAME_H - 74 + i * 17));
    }
  }
}
