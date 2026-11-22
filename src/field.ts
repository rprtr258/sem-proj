import {Rect, Vec2, rect} from "./types.ts";

// GDD M1 arena: 160×90 cells at 6px = 960×540px playable, plus a margin ring
export const ARENA_W = 960;
export const ARENA_H = 540;

// static terrain: the density field is the only collision geometry, so the
// walls and platforms live here as base density. Water pools sit on the floor
// (steam-blast / ice-needle couplings need a liquid to interact with).
const TERRAIN: readonly Rect[] = [
  rect({x: -24, y: -24}, 1008, 24),   // top wall
  rect({x: -24, y:   0}, 24, 564),    // left wall
  rect({x: 960, y:   0}, 24, 564),    // right wall
  rect({x: -24, y: 516}, 1008, 24),   // floor
  rect({x:  60, y: 396}, 280, 16),    // left platform
  rect({x: 620, y: 396}, 280, 16),    // right platform
  rect({x: 390, y: 210}, 180, 20),    // top platform
  rect({x: 468, y: 380}, 24, 136),    // central pillar (jumpable: 136px < ~171px jump)
];

// water pools on the floor, in px
const WATER_POOLS: readonly Rect[] = [
  rect({x: 150, y: 500}, 90, 16),
  rect({x: 720, y: 500}, 90, 16),
];

// Field covers the whole playable area plus a margin
export const FIELD_ORIGIN = {x: -24, y: -24};
export const FIELD_CELL = 4;
export const FIELD_COLS = 252; // -24..984 px
export const FIELD_ROWS = 147; // -24..564 px
// waves with density above this behave as temporary solid terrain
export const FIELD_SOLID_THRESHOLD = 0.55;

export const MAT_NONE = 0;
export const MAT_WATER = 1;
export const MAT_ICE = 2;
export const MAT_STEAM = 3;

const WAVE_DAMPING = 0.985;
const WAVE_EDGE_DAMPING = 0.5;
const WIND_DAMPING = 0.94;
const PRESSURE_FORCE = 0.45; // how hard the density gradient accelerates the wind
const WAVE_MOMENTUM = 3.0; // how hard moving density drags the air along its travel direction
const WIND_MAX = 3.0; // cells/tick

// Coupled scalar wave field (pressure) and vector field (wind), ported from
// prototype.html. Wind blows from high pressure to low pressure and is also
// dragged along by traveling wave fronts; solid cells (static geometry or
// dense waves) have zero wind and block movement.
export class Field {
  private baseDensity: Float32Array;
  private waveCurr: Float32Array;
  private wavePrev: Float32Array;
  private totalDensity: Float32Array;
  private velX: Float32Array;
  private velY: Float32Array;
  private nextVelX: Float32Array;
  private nextVelY: Float32Array;
  private temp: Float32Array;
  private tempScratch: Float32Array;
  private material: Uint8Array;

  constructor() {
    const size = FIELD_COLS * FIELD_ROWS;
    this.baseDensity = new Float32Array(size);
    this.waveCurr = new Float32Array(size);
    this.wavePrev = new Float32Array(size);
    this.totalDensity = new Float32Array(size);
    this.velX = new Float32Array(size);
    this.velY = new Float32Array(size);
    this.nextVelX = new Float32Array(size);
    this.nextVelY = new Float32Array(size);
    this.temp = new Float32Array(size);
    this.tempScratch = new Float32Array(size);
    this.material = new Uint8Array(size);

    for (const r of TERRAIN) {
      const x0 = Math.max(0, Math.floor((r.x - FIELD_ORIGIN.x) / FIELD_CELL));
      const x1 = Math.min(FIELD_COLS - 1, Math.ceil((r.x + r.w - FIELD_ORIGIN.x) / FIELD_CELL) - 1);
      const y0 = Math.max(0, Math.floor((r.y - FIELD_ORIGIN.y) / FIELD_CELL));
      const y1 = Math.min(FIELD_ROWS - 1, Math.ceil((r.y + r.h - FIELD_ORIGIN.y) / FIELD_CELL) - 1);
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++)
          this.baseDensity[y * FIELD_COLS + x] = 1;
    }
    // tick() never touches border cells; seed them so solidity holds there too
    this.totalDensity.set(this.baseDensity);
    for (const pool of WATER_POOLS)
      this.fillMaterial(pool, MAT_WATER);
  }

  get waveField(): Float32Array { return this.waveCurr; }
  get baseField(): Float32Array { return this.baseDensity; }
  get velXField(): Float32Array { return this.velX; }
  get velYField(): Float32Array { return this.velY; }
  get tempField(): Float32Array { return this.temp; }
  get materialField(): Uint8Array { return this.material; }

  private fillMaterial(r: Rect, mat: number): void {
    const x0 = Math.max(1, Math.floor((r.x - FIELD_ORIGIN.x) / FIELD_CELL));
    const x1 = Math.min(FIELD_COLS - 2, Math.ceil((r.x + r.w - FIELD_ORIGIN.x) / FIELD_CELL) - 1);
    const y0 = Math.max(1, Math.floor((r.y - FIELD_ORIGIN.y) / FIELD_CELL));
    const y1 = Math.min(FIELD_ROWS - 2, Math.ceil((r.y + r.h - FIELD_ORIGIN.y) / FIELD_CELL) - 1);
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++)
        this.material[y * FIELD_COLS + x] = mat;
  }

  // world px -> cell index, -1 when outside the grid
  private cell(p: Vec2): number {
    const gx = Math.floor((p.x - FIELD_ORIGIN.x) / FIELD_CELL);
    const gy = Math.floor((p.y - FIELD_ORIGIN.y) / FIELD_CELL);
    if (gx < 1 || gx >= FIELD_COLS - 1 || gy < 1 || gy >= FIELD_ROWS - 1)
      return -1;
    return gy * FIELD_COLS + gx;
  }

  // wind at a world point, in cells/tick
  velocityAt(p: Vec2): Vec2 {
    const idx = this.cell(p);
    if (idx < 0)
      return {x: 0, y: 0};
    return {x: this.velX[idx], y: this.velY[idx]};
  }

  // average wind over a body area (characters are pushed by gusts)
  velocityInRect(r: Rect): Vec2 {
    let vx = 0, vy = 0, n = 0;
    for (let y = r.y; y <= r.y + r.h; y += 8) {
      for (let x = r.x; x <= r.x + r.w; x += 8) {
        const v = this.velocityAt({x, y});
        vx += v.x;
        vy += v.y;
        n++;
      }
    }
    n = n || 1;
    return {x: vx / n, y: vy / n};
  }

  // add a radial wave at a world point; strength > 0 pushes away, < 0 pulls in
  disturb(p: Vec2, radiusPx: number, strength: number): void {
    const gx = Math.floor((p.x - FIELD_ORIGIN.x) / FIELD_CELL);
    const gy = Math.floor((p.y - FIELD_ORIGIN.y) / FIELD_CELL);
    const radius = Math.round(radiusPx / FIELD_CELL);
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        const nx = gx + x, ny = gy + y;
        if (nx <= 1 || nx >= FIELD_COLS - 2 || ny <= 1 || ny >= FIELD_ROWS - 2)
          continue;
        const dist = Math.hypot(x, y);
        if (dist <= radius)
          this.waveCurr[ny * FIELD_COLS + nx] += strength * Math.cos(dist / radius * Math.PI / 2);
      }
    }
  }

  // stir the air at a world point; v is the stirring velocity in cells/tick
  wake(p: Vec2, v: Vec2, strength: number): void {
    const idx = this.cell(p);
    if (idx < 0)
      return;
    this.velX[idx] += v.x * strength;
    this.velY[idx] += v.y * strength;
  }

  // explosion: instant radial wind kick plus a density wave. wind > 0 shoves
  // away, < 0 drags in. A wave-only blast sloshes in and out (net ~zero push),
  // so the kick carries the knockback and the wave carries visuals/terrain.
  // windRadius may exceed radius: the gust reaches farther than the dense core
  blast(p: Vec2, radiusPx: number, wind: number, wave: number, windRadiusPx = radiusPx): void {
    const gx = Math.floor((p.x - FIELD_ORIGIN.x) / FIELD_CELL);
    const gy = Math.floor((p.y - FIELD_ORIGIN.y) / FIELD_CELL);
    const radius = Math.max(1, Math.round(radiusPx / FIELD_CELL));
    const windRadius = Math.max(radius, Math.round(windRadiusPx / FIELD_CELL));
    for (let y = -windRadius; y <= windRadius; y++) {
      for (let x = -windRadius; x <= windRadius; x++) {
        const nx = gx + x, ny = gy + y;
        if (nx <= 1 || nx >= FIELD_COLS - 2 || ny <= 1 || ny >= FIELD_ROWS - 2)
          continue;
        const dist = Math.hypot(x, y);
        if (dist > windRadius)
          continue;
        const idx = ny * FIELD_COLS + nx;
        if (dist <= radius) {
          const falloff = Math.cos(dist / radius * Math.PI / 2);
          // wavePrev gets the same value so the blob decays in place like a
          // pressure dome instead of sloshing back (slosh would cancel the kick)
          this.waveCurr[idx] += wave * falloff;
          this.wavePrev[idx] += wave * falloff;
        }
        if (dist > 0) {
          const falloff = Math.cos(dist / windRadius * Math.PI / 2);
          this.velX[idx] += x / dist * wind * falloff;
          this.velY[idx] += y / dist * wind * falloff;
        }
      }
    }
  }

  // rotational stir ported from prototype.html applyVortex: perpendicular
  // swirl with linear falloff plus a slight upward lift (tornado updraft)
  vortex(p: Vec2, radiusPx: number, strength: number): void {
    const gx = Math.floor((p.x - FIELD_ORIGIN.x) / FIELD_CELL);
    const gy = Math.floor((p.y - FIELD_ORIGIN.y) / FIELD_CELL);
    const radius = Math.max(1, Math.round(radiusPx / FIELD_CELL));
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        const nx = gx + x, ny = gy + y;
        if (nx <= 1 || nx >= FIELD_COLS - 2 || ny <= 1 || ny >= FIELD_ROWS - 2)
          continue;
        const dist = Math.hypot(x, y);
        if (dist > 0.1 && dist <= radius) {
          const falloff = 1 - dist / radius;
          const idx = ny * FIELD_COLS + nx;
          this.velX[idx] += (-y / dist) * strength * falloff;
          this.velY[idx] += (x / dist) * strength * falloff - 0.15 * falloff;
        }
      }
    }
  }

  isSolidRect(r: Rect): boolean {
    const x0 = Math.max(0, Math.floor((r.x - FIELD_ORIGIN.x) / FIELD_CELL));
    const x1 = Math.min(FIELD_COLS - 1, Math.floor((r.x + r.w - FIELD_ORIGIN.x) / FIELD_CELL));
    const y0 = Math.max(0, Math.floor((r.y - FIELD_ORIGIN.y) / FIELD_CELL));
    const y1 = Math.min(FIELD_ROWS - 1, Math.floor((r.y + r.h - FIELD_ORIGIN.y) / FIELD_CELL));
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const idx = y * FIELD_COLS + x;
        // ice is a solid material on top of the density field
        if (this.material[idx] === MAT_ICE)
          return true;
        if (this.totalDensity[idx] >= FIELD_SOLID_THRESHOLD)
          return true;
      }
    return false;
  }

  // point query for raycasts (laser aim, enemy line-of-sight)
  isSolid(p: Vec2): boolean {
    const gx = Math.floor((p.x - FIELD_ORIGIN.x) / FIELD_CELL);
    const gy = Math.floor((p.y - FIELD_ORIGIN.y) / FIELD_CELL);
    if (gx < 0 || gx >= FIELD_COLS || gy < 0 || gy >= FIELD_ROWS)
      return false;
    const idx = gy * FIELD_COLS + gx;
    if (this.material[idx] === MAT_ICE)
      return true;
    return this.totalDensity[idx] >= FIELD_SOLID_THRESHOLD;
  }

  // add heat at a world point (negative amount chills); spread over the radius
  heat(p: Vec2, radiusPx: number, amount: number): void {
    const gx = Math.floor((p.x - FIELD_ORIGIN.x) / FIELD_CELL);
    const gy = Math.floor((p.y - FIELD_ORIGIN.y) / FIELD_CELL);
    const radius = Math.max(1, Math.round(radiusPx / FIELD_CELL));
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        const dist = Math.hypot(x, y);
        if (dist > radius)
          continue;
        const idx = (gy + y) * FIELD_COLS + gx + x;
        if (gy + y <= 0 || gy + y >= FIELD_ROWS - 1 || gx + x <= 0 || gx + x >= FIELD_COLS - 1)
          continue;
        this.temp[idx] += amount * Math.cos(dist / radius * Math.PI / 2);
      }
    }
  }

  temperatureAt(p: Vec2): number {
    const idx = this.cell(p);
    return idx < 0 ? 0 : this.temp[idx];
  }

  // average temperature over a body area (FF heat damage samples this)
  temperatureInRect(r: Rect): number {
    let t = 0, n = 0;
    for (let y = r.y; y <= r.y + r.h; y += FIELD_CELL) {
      for (let x = r.x; x <= r.x + r.w; x += FIELD_CELL) {
        t += this.temperatureAt({x, y});
        n++;
      }
    }
    return n === 0 ? 0 : t / n;
  }

  // any water or ice within radius? (steam_blast strength check)
  hasWaterNear(p: Vec2, radiusPx: number): boolean {
    const gx = Math.floor((p.x - FIELD_ORIGIN.x) / FIELD_CELL);
    const gy = Math.floor((p.y - FIELD_ORIGIN.y) / FIELD_CELL);
    const radius = Math.max(1, Math.round(radiusPx / FIELD_CELL));
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        const nx = gx + x, ny = gy + y;
        if (nx < 0 || nx >= FIELD_COLS || ny < 0 || ny >= FIELD_ROWS)
          continue;
        const mat = this.material[ny * FIELD_COLS + nx];
        if (mat === MAT_WATER || mat === MAT_ICE)
          return true;
      }
    }
    return false;
  }

  // golem wall-breaking: remove static terrain cells in a radius
  carve(p: Vec2, radiusPx: number): void {
    const gx = Math.floor((p.x - FIELD_ORIGIN.x) / FIELD_CELL);
    const gy = Math.floor((p.y - FIELD_ORIGIN.y) / FIELD_CELL);
    const radius = Math.max(1, Math.round(radiusPx / FIELD_CELL));
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        const nx = gx + x, ny = gy + y;
        if (nx <= 1 || nx >= FIELD_COLS - 2 || ny <= 1 || ny >= FIELD_ROWS - 2)
          continue; // never carve the outer arena walls
        const idx = ny * FIELD_COLS + nx;
        this.baseDensity[idx] = 0;
        this.totalDensity[idx] = 0;
      }
    }
  }

  tick(): void {
    // wave step: discrete 2d wave equation over the dynamic density
    for (let y = 1; y < FIELD_ROWS - 1; y++) {
      for (let x = 1; x < FIELD_COLS - 1; x++) {
        const idx = y * FIELD_COLS + x;
        const neighbors =
          this.waveCurr[idx - 1] +
          this.waveCurr[idx + 1] +
          this.waveCurr[idx - FIELD_COLS] +
          this.waveCurr[idx + FIELD_COLS];

        let nextVal = (neighbors * 0.5 - this.wavePrev[idx]) * WAVE_DAMPING;
        if (x <= 2 || x >= FIELD_COLS - 3 || y <= 2 || y >= FIELD_ROWS - 3)
          nextVal *= WAVE_EDGE_DAMPING;

        this.wavePrev[idx] = nextVal;
        this.totalDensity[idx] = this.baseDensity[idx] + nextVal;
      }
    }

    for (let i = 0; i < this.waveCurr.length; i++) {
      const temp = this.waveCurr[i];
      this.waveCurr[i] = this.wavePrev[i];
      this.wavePrev[i] = temp;
    }

    // wind step: accelerate along -grad(density), diffuse, damp, clamp
    for (let y = 1; y < FIELD_ROWS - 1; y++) {
      for (let x = 1; x < FIELD_COLS - 1; x++) {
        const idx = y * FIELD_COLS + x;
        if (this.totalDensity[idx] >= FIELD_SOLID_THRESHOLD) {
          this.nextVelX[idx] = 0;
          this.nextVelY[idx] = 0;
          continue;
        }
        const gradX = (this.waveCurr[idx + 1] - this.waveCurr[idx - 1]) * 0.5;
        const gradY = (this.waveCurr[idx + FIELD_COLS] - this.waveCurr[idx - FIELD_COLS]) * 0.5;
        // moving density produces wind: -d(u)/dt · grad(u) is the momentum
        // flux of a traveling front (always along travel direction); a standing
        // oscillation has zero net flux, so this can't slosh back
        const flow = (this.waveCurr[idx] - this.wavePrev[idx]) * WAVE_MOMENTUM;
        const avgVx = (this.velX[idx] * 2 + this.velX[idx - 1] + this.velX[idx + 1] + this.velX[idx - FIELD_COLS] + this.velX[idx + FIELD_COLS]) / 6;
        const avgVy = (this.velY[idx] * 2 + this.velY[idx - 1] + this.velY[idx + 1] + this.velY[idx - FIELD_COLS] + this.velY[idx + FIELD_COLS]) / 6;
        let vx = (avgVx - gradX * PRESSURE_FORCE - gradX * flow) * WIND_DAMPING;
        let vy = (avgVy - gradY * PRESSURE_FORCE - gradY * flow) * WIND_DAMPING;
        const speed = Math.hypot(vx, vy);
        if (speed > WIND_MAX) {
          vx = vx / speed * WIND_MAX;
          vy = vy / speed * WIND_MAX;
        }
        this.nextVelX[idx] = vx;
        this.nextVelY[idx] = vy;
      }
    }

    for (let i = 0; i < this.velX.length; i++) {
      this.velX[i] = this.nextVelX[i];
      this.velY[i] = this.nextVelY[i];
    }

    this.tickTemperature();
  }

  // temperature: a passive scalar advected by the wind, diffused, then coupled
  // to materials: water boils to steam above +100, freezes to solid ice below
  // 0, steam dissipates when it cools. Decays toward ambient 0.
  private tickTemperature(): void {
    const cols = FIELD_COLS, rows = FIELD_ROWS;
    // semi-Lagrangian advection: sample upstream along the wind
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        const idx = y * cols + x;
        const sx = x - this.velX[idx];
        const sy = y - this.velY[idx];
        this.tempScratch[idx] = this.sampleBilinear(this.temp, sx, sy);
      }
    }
    // diffusion box blur + decay toward ambient
    const diffuse = 0.18, decay = 0.997;
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        const idx = y * cols + x;
        const avg = (this.tempScratch[idx] * 2 + this.tempScratch[idx - 1] + this.tempScratch[idx + 1] +
          this.tempScratch[idx - cols] + this.tempScratch[idx + cols]) / 6;
        this.temp[idx] = avg * decay;
      }
    }

    // material couplings + steam rise, bottom-up so risen cells don't chain
    for (let y = rows - 2; y >= 1; y--) {
      for (let x = 1; x < cols - 1; x++) {
        const idx = y * cols + x;
        const t = this.temp[idx];
        const mat = this.material[idx];
        if (mat === MAT_WATER && t > 100) {
          this.material[idx] = MAT_STEAM;
          this.temp[idx] -= 60; // latent heat of vaporization
          this.velY[idx] = Math.min(this.velY[idx], -1.2); // steam updraft
        } else if (mat === MAT_WATER && t < 0) {
          this.material[idx] = MAT_ICE;
        } else if (mat === MAT_ICE && t > 10) {
          this.material[idx] = MAT_WATER;
        } else if (mat === MAT_STEAM) {
          if (t < 60) {
            this.material[idx] = MAT_NONE; // steam dissipates
          } else {
            const above = idx - cols;
            if (this.material[above] === MAT_NONE) {
              // hot air rises: swap up with slight horizontal jitter
              this.material[above] = MAT_STEAM;
              this.material[idx] = MAT_NONE;
            }
          }
        }
      }
    }
  }

  private sampleBilinear(arr: Float32Array, cx: number, cy: number): number {
    const x0 = Math.max(1, Math.min(FIELD_COLS - 2, Math.floor(cx)));
    const y0 = Math.max(1, Math.min(FIELD_ROWS - 2, Math.floor(cy)));
    const x1 = x0 + 1, y1 = y0 + 1;
    const fx = Math.min(1, Math.max(0, cx - x0));
    const fy = Math.min(1, Math.max(0, cy - y0));
    const a = arr[y0 * FIELD_COLS + x0] * (1 - fx) + arr[y0 * FIELD_COLS + x1] * fx;
    const b = arr[y1 * FIELD_COLS + x0] * (1 - fx) + arr[y1 * FIELD_COLS + x1] * fx;
    return a * (1 - fy) + b * fy;
  }
}
