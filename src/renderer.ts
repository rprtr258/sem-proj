import {add, mul, sub, Rect, Vec2} from "./types.ts";
import {Character} from "./character.ts";
import {World} from "./world.ts";
import {FIELD_CELL, FIELD_COLS, FIELD_ORIGIN, FIELD_ROWS, FIELD_SOLID_THRESHOLD} from "./field.ts";

const GAME_W = 640;
const GAME_H = 480;

type AnimDef = {
  rect: Rect,
  count: number,
  rate: number,
};

class SpriteAnim<K extends string> {
  private image: HTMLImageElement;
  private anims: Record<K, AnimDef>;
  private currentAnim: K;
  private frame = 0;
  private elapsed = 0;

  constructor(image: HTMLImageElement, anims: Record<K, AnimDef>, currentAnim: K) {
    this.image = image;
    this.anims = anims;
    this.currentAnim = currentAnim;
  }

  jumpTo(name: K): void {
    if (this.currentAnim === name)
      return;
    this.currentAnim = name;
    this.frame = 0;
    this.elapsed = 0;
  }

  update(dt: number): void {
    const a = this.anims[this.currentAnim];
    this.elapsed += dt;
    const fd = 1000 / a.rate;
    while (this.elapsed >= fd) {
      this.elapsed -= fd;
      this.frame = (this.frame + 1) % a.count;
    }
  }

  draw(ctx: CanvasRenderingContext2D, r: Rect, mirrored: boolean): void {
    const a = this.anims[this.currentAnim];
    const sx = a.rect.x + this.frame * a.rect.w;
    ctx.save();
    if (mirrored) {
      ctx.translate(r.x + r.w, r.y);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(r.x, r.y);
    }
    ctx.drawImage(this.image, sx, a.rect.y, a.rect.w, a.rect.h, 0, 0, r.w, r.h);
    ctx.restore();
  }
}

const assets = [
  "back", "player_sheet", "ai_sheet",
  "bullet", "grenade", "explosion",
  "aim", "hp", "mana", "spells",
];

const cameraSpeed = 10;

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private scale = 1;
  private o: Vec2 = {x: 0, y: 0};
  private camera: Vec2 = mul({x: GAME_W, y: GAME_H}, 1/2);

  private images: Record<string, HTMLImageElement> = {};
  private playerAnim: SpriteAnim<"standing" | "running" | "jumping" | "attack"> | null = null;
  private botAnim: SpriteAnim<"standing" | "running" | "jumping" | "attack"> | null = null;
  private loadedCount = 0;
  private totalImages = 0;
  private onReadyCb: (() => void);

  private fieldCvs: HTMLCanvasElement;
  private fieldCtx: CanvasRenderingContext2D;
  private fieldImg: ImageData;
  private fieldBuf: Uint32Array;

  constructor(ctx: CanvasRenderingContext2D, cb: () => void) {
    this.ctx = ctx;
    this.onReadyCb = cb;

    this.fieldCvs = document.createElement("canvas");
    this.fieldCvs.width = FIELD_COLS;
    this.fieldCvs.height = FIELD_ROWS;
    this.fieldCtx = this.fieldCvs.getContext("2d")!;
    this.fieldImg = this.fieldCtx.createImageData(FIELD_COLS, FIELD_ROWS);
    this.fieldBuf = new Uint32Array(this.fieldImg.data.buffer);
  }

  loadAssets(): void {
    this.totalImages = assets.length;
    this.images = Object.fromEntries(assets.map(src => {
      const img = new Image();
      img.onload = img.onerror = () => {
        this.loadedCount++;
        if (this.loadedCount >= this.totalImages) {
          this.setupAnims();
          this.onReadyCb();
        }
      };
      img.src = `img/${src}.png`;
      return [src, img];
    }));
  }

  private setupAnims(): void {
    const ps = this.images["player_sheet"];
    const as = this.images["ai_sheet"];

    this.playerAnim = new SpriteAnim<"standing" | "running" | "jumping" | "attack">(ps, {
      "standing": {rect: {x: 0, y: 0,   w: 55, h:  96}, count: 16, rate: 10},
      "running":  {rect: {x: 0, y: 96,  w: 54, h:  93}, count: 10, rate: 10},
      "jumping":  {rect: {x: 0, y: 189, w: 61, h: 104}, count:  9, rate: 10},
      "attack":   {rect: {x: 0, y: 293, w: 55, h:  96}, count: 10, rate: 20},
    }, "standing");

    this.botAnim = new SpriteAnim<"standing" | "running" | "jumping" | "attack">(as, {
      "standing": {rect: {x: 0, y: 0,   w: 64, h: 79}, count:  6, rate: 10},
      "running":  {rect: {x: 0, y: 79,  w: 55, h: 77}, count:  8, rate: 10},
      "jumping":  {rect: {x: 0, y: 156, w: 62, h: 76}, count:  7, rate: 10},
      "attack":   {rect: {x: 0, y: 232, w: 64, h: 81}, count: 20, rate: 20},
    }, "standing");
  }

  updateAnim(dt: number, char: Character, charAnim: SpriteAnim<"standing" | "running" | "jumping" | "attack">): void {
    charAnim.jumpTo(
      char.inAir ? "jumping" :
      char.going && !char.inAir ? "running" :
      !char.going && !char.inAir && !char.attacking ? "standing" :
      "attack"
    );
    charAnim.update(dt);
  }

  render(dt: number, w: World): void {
    const player = w.player;
    const bot = w.bot.character;

    this.updateAnim(dt, player, this.playerAnim!);
    this.updateAnim(dt, bot, this.botAnim!);

    const ctx = this.ctx;
    const {width: W, height: H} = ctx.canvas;

    this.scale = Math.min(W / GAME_W, H / GAME_H);
    this.o = mul({x: W - GAME_W * this.scale, y: H - GAME_H * this.scale}, 1 / 2);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const target = add(player, mul({x: player.boundingBox.w, y: player.boundingBox.h}, 1/2));
    this.camera = add(this.camera, mul(sub(target, this.camera), 1/cameraSpeed));

    ctx.save();
    ctx.translate(this.o.x, this.o.y);
    ctx.scale(this.scale, this.scale);
    ctx.translate(this.cameraOffset.x, this.cameraOffset.y);

    // background
    const bg = this.images["back"];
    ctx.drawImage(bg, 0, 0, GAME_W, GAME_H);

    this.drawField(ctx, w);

    // characters
    this.playerAnim?.draw(ctx, {x: player.x, y: player.y, w: 55, h: 95}, player.mirrored);
    this.drawHUD(ctx, player);

    this.botAnim?.draw(ctx, {x: bot.x, y: bot.y, w: 55, h: 80}, bot.mirrored);
    this.drawHUD(ctx, bot);

    // lasers
    {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 6;
      for (const {pos, dir} of w.component_laser.values()) {
        const finish = add(pos, dir);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(finish.x, finish.y);
        ctx.stroke();
      }
    }

    // grenades
    {
      const ex = this.images["explosion"];
      const gi = this.images["grenade"];
      for (const {pos, counter, exploding} of w.component_grenade.values()) {
        const frame = counter < 0 ? 0 : 18 - counter;
        if (exploding) {
          const fw = 256, fh = 256, cols = 9;
          const fx = (frame % cols) * fw;
          const fy = Math.floor(frame / cols) * fh;
          ctx.drawImage(ex, fx, fy, fw, fh, pos.x - 100, pos.y - 150, 200, 200);
        } else {
          ctx.drawImage(gi, pos.x, pos.y, 30, 30);
        }
      }
    }

    // bullets
    {
      for (const {pos, dir} of w.component_bullet.values()) {
        ctx.save();
        ctx.translate(pos.x + 8, pos.y + 8);
        ctx.rotate(Math.PI + Math.atan2(dir.y, dir.x));
        ctx.drawImage(this.images["bullet"], -8, -8, 16, 16);
        ctx.restore();
      }
    }

    ctx.drawImage(this.images["aim"], w.mouseCoord.x - 16, w.mouseCoord.y - 16, 32, 32);

    ctx.restore();

    // debug
    ctx.font = "14px monospace";
    ctx.lineWidth = 0.4;
    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";
    {
      const owners = Object.values(w.component_owner_id).reduce((acc, s) => acc + s.size, 0);
      for (const [i, [line, stat]] of [
        ["bullet", w.component_bullet.size],
        ["delete", w.component_delete.size],
        ["grenade", w.component_grenade.size],
        ["laser", w.component_laser.size],
        ["owner_id", owners],
        ["weapon", w.component_weapon.size],
        ["total",
          w.component_bullet.size+
          w.component_delete.size+
          w.component_grenade.size+
          w.component_laser.size+
          owners+
          w.component_weapon.size
        ],
      ].entries()) {
        const text = `${line}: ${stat}`;
        ctx.fillText(text, 0, 20 + i * 20);
        ctx.strokeText(text, 0, 20 + i * 20);
      }
    }
  }

  // wave field tint (blue = push, red = pull, dense = solid terrain) and
  // wind vector arrows (prototype-style, toggled with V, on by default)
  private drawField(ctx: CanvasRenderingContext2D, w: World): void {
    const wave = w.field.waveField;
    const base = w.field.baseField;
    const buf = this.fieldBuf;
    for (let i = 0; i < buf.length; i++) {
      if (base[i] >= FIELD_SOLID_THRESHOLD) {
        buf[i] = 0xff444444; // static terrain: opaque gray
        continue;
      }
      const wv = wave[i];
      let r = 0, g = 0, b = 0, a = 0;
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
      buf[i] = ((a | 0) << 24) | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0);
    }
    this.fieldCtx.putImageData(this.fieldImg, 0, 0);
    ctx.drawImage(this.fieldCvs, FIELD_ORIGIN.x, FIELD_ORIGIN.y, FIELD_COLS * FIELD_CELL, FIELD_ROWS * FIELD_CELL);

    if (w.showVectors) {
      const velX = w.field.velXField;
      const velY = w.field.velYField;
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

  private drawHUD(ctx: CanvasRenderingContext2D, c: Character): void {
    const HUD_W = 252;
    const HUD_H = 17;
    const hp = Math.max(c.health, 0);
    const mana = Math.max(c.mana, 0);
    const barOffset = -(100 - c.boundingBox.w) / 2;

    ctx.drawImage(this.images["hp"],   0, 0, HUD_W/100*hp,   HUD_H, c.x + barOffset, c.y-30,      hp,      8);
    ctx.drawImage(this.images["mana"], 0, 0, HUD_W/100*mana, HUD_H, c.x + barOffset, c.y-30 + 10, mana,    8);
    ctx.fillStyle = "orange";
    ctx.fillRect(c.x + barOffset, c.y-30 + 20, c.fly_energy, 8);

    const sw = 17, sh = 28;
    ctx.drawImage(this.images["spells"], c.weaponId * sw, 0, sw, sh, c.x - 43, c.y - 35, sw, sh);

    // Score text - positioned like QML: (90, -27) relative to character
    ctx.font = "bold 14px monospace";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#AAAAAA";
    ctx.fillStyle = "white";
    ctx.strokeText(`${c.score}`, c.x + 90, c.y - 15);
    ctx.fillText(`${c.score}`, c.x + 90, c.y - 15);
  }

  private get cameraOffset(): Vec2 {
    return sub(mul({x: GAME_W, y: GAME_H}, 1/2), this.camera);
  }

  gameToScreen(p: Vec2): Vec2 {
    return add(mul(add(p, this.cameraOffset), this.scale), this.o);
  }

  screenToGame(p: Vec2): Vec2 {
    return sub(mul(sub(p, this.o), 1 / this.scale), this.cameraOffset);
  }
}
