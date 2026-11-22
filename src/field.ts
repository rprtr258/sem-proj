import {Rect, Vec2, rect} from "./types.ts";

// static terrain: the density field is the only collision geometry, so the
// walls and platforms live here as base density
const TERRAIN: readonly Rect[] = [
  rect({x: -40, y:   0}, 20, 480),  // left wall
  rect({x: 660, y:   0}, 20, 480),  // right wall
  rect({x: -40, y: 460}, 680, 20),  // bottom wall
  rect({x: -20, y: 274}, 188, 10),  // left platform
  rect({x: 473, y: 274}, 187, 10),  // right platform
  rect({x: 256, y: 113}, 128, 20),  // top platform
  rect({x: 310, y: 132}, 20, 150),  // central platform
];

// Field covers the whole playable area plus a margin
export const FIELD_ORIGIN = {x: -40, y: 0};
export const FIELD_CELL = 4;
export const FIELD_COLS = 180; // -40..680 px
export const FIELD_ROWS = 120; // 0..480 px
// waves with density above this behave as temporary solid terrain
export const FIELD_SOLID_THRESHOLD = 0.55;

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

    for (const r of TERRAIN) {
      const x0 = Math.max(0, Math.floor((r.x - FIELD_ORIGIN.x) / FIELD_CELL));
      const x1 = Math.min(FIELD_COLS - 1, Math.floor((r.x + r.w - FIELD_ORIGIN.x) / FIELD_CELL));
      const y0 = Math.max(0, Math.floor((r.y - FIELD_ORIGIN.y) / FIELD_CELL));
      const y1 = Math.min(FIELD_ROWS - 1, Math.floor((r.y + r.h - FIELD_ORIGIN.y) / FIELD_CELL));
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++)
          this.baseDensity[y * FIELD_COLS + x] = 1;
    }
    // tick() never touches border cells; seed them so solidity holds there too
    this.totalDensity.set(this.baseDensity);
  }

  get waveField(): Float32Array { return this.waveCurr; }
  get baseField(): Float32Array { return this.baseDensity; }
  get velXField(): Float32Array { return this.velX; }
  get velYField(): Float32Array { return this.velY; }

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
      for (let x = x0; x <= x1; x++)
        if (this.totalDensity[y * FIELD_COLS + x] >= FIELD_SOLID_THRESHOLD)
          return true;
    return false;
  }

  // point query for raycasts (laser aim, bot line-of-sight)
  isSolid(p: Vec2): boolean {
    const gx = Math.floor((p.x - FIELD_ORIGIN.x) / FIELD_CELL);
    const gy = Math.floor((p.y - FIELD_ORIGIN.y) / FIELD_CELL);
    if (gx < 0 || gx >= FIELD_COLS || gy < 0 || gy >= FIELD_ROWS)
      return false;
    return this.totalDensity[gy * FIELD_COLS + gx] >= FIELD_SOLID_THRESHOLD;
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
  }
}
