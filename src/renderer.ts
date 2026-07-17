import {add, mul, sub, Rect, Vec2} from "./types.ts";
import {Character} from "./character.ts";
import {World} from "./world.ts";

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

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private scale = 1;
  private o: Vec2 = {x: 0, y: 0};

  private images: Record<string, HTMLImageElement> = {};
  private playerAnim: SpriteAnim<"standing" | "running" | "jumping" | "attack"> | null = null;
  private botAnim: SpriteAnim<"standing" | "running" | "jumping" | "attack"> | null = null;
  private loadedCount = 0;
  private totalImages = 0;
  private onReadyCb: (() => void);

  constructor(ctx: CanvasRenderingContext2D, cb: () => void) {
    this.ctx = ctx;
    this.onReadyCb = cb;
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

  render(dt: number, w: World, m: Vec2): void {
    const map = w.map;
    const player = w.player;
    const bot = w.bot.character;
    const projectiles = w.projectiles;

    this.updateAnim(dt, player, this.playerAnim!);
    this.updateAnim(dt, bot, this.botAnim!);

    const ctx = this.ctx;
    const {width: W, height: H} = ctx.canvas;

    this.scale = Math.min(W / GAME_W, H / GAME_H);
    this.o = mul({x: W - GAME_W * this.scale, y: H - GAME_H * this.scale}, 1 / 2);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(this.o.x, this.o.y);
    ctx.scale(this.scale, this.scale);

    // background
    const bg = this.images["back"];
    ctx.drawImage(bg, 0, 0, GAME_W, GAME_H);

    // map platforms
    ctx.fillStyle = "#444";
    for (const r of map.rects)
      ctx.fillRect(r.x, r.y, r.w, r.h);

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
      for (const {pos, counter: m_dieCounter, exploding} of w.component_grenade.values()) {
        const frame = m_dieCounter < 0 ? 0 : 18 - m_dieCounter;
        if (exploding) {
          const fw = 256, fh = 256, cols = 9;
          const fx = (frame % cols) * fw;
          const fy = Math.floor(frame / cols) * fh;
          ctx.drawImage(ex, fx, fy, fw, fh, pos.x - 100, pos.y - 100, 200, 200);
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

    ctx.drawImage(this.images["aim"], m.x - 16, m.y - 16, 32, 32);
    ctx.restore();
  }

  private drawHUD(ctx: CanvasRenderingContext2D, c: Character): void {
    const HUD_W = 252;
    const HUD_H = 17;
    const hp = Math.max(c.health, 0);
    const mana = Math.max(c.mana, 0);
    const barOffset = -(100 - c.boundingBox.w) / 2;

    ctx.drawImage(this.images["hp"],   0, 0, HUD_W/100*hp,   HUD_H, c.x + barOffset, c.y-30,      hp,   8);
    ctx.drawImage(this.images["mana"], 0, 0, HUD_W/100*mana, HUD_H, c.x + barOffset, c.y-30 + 10, mana, 8);

    const sw = 17, sh = 28;
    ctx.drawImage(this.images["spells"], c.weaponId * sw, 0, sw, sh, c.x - 40, c.y - 35, sw, sh);

    // Score text - positioned like QML: (90, -27) relative to character
    ctx.font = "bold 14px monospace";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#AAAAAA";
    ctx.fillStyle = "white";
    ctx.strokeText(`${c.score}`, c.x + 90, c.y - 12);
    ctx.fillText(`${c.score}`, c.x + 90, c.y - 12);
  }

  gameToScreen(p: Vec2): Vec2 {
    return add(mul(p, this.scale), this.o);
  }

  screenToGame(p: Vec2): Vec2 {
    return mul(sub(p, this.o), 1 / this.scale);
  }
}
