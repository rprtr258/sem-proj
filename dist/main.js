// src/types.ts
function sign(x) {
  return x > 0 ? 1 : x < 0 ? -1 : 0;
}
function clamp(v, mn, mx) {
  return Math.max(mn, Math.min(mx, v));
}
function mul(v, c) {
  return { x: v.x * c, y: v.y * c };
}
function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}
function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}
function rect(p, w, h) {
  return { x: p.x, y: p.y, w, h };
}
function rectIntersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function rectTranslated(r, dx, dy) {
  return { x: r.x + dx, y: r.y + dy, w: r.w, h: r.h };
}

// src/field.ts
var ARENA_W = 960;
var ARENA_H = 540;
var TERRAIN = [
  rect({ x: -24, y: -24 }, 1008, 24),
  rect({ x: -24, y: 0 }, 24, 564),
  rect({ x: 960, y: 0 }, 24, 564),
  rect({ x: -24, y: 516 }, 1008, 24),
  rect({ x: 60, y: 396 }, 280, 16),
  rect({ x: 620, y: 396 }, 280, 16),
  rect({ x: 390, y: 210 }, 180, 20),
  rect({ x: 468, y: 380 }, 24, 136)
];
var WATER_POOLS = [
  rect({ x: 150, y: 500 }, 90, 16),
  rect({ x: 720, y: 500 }, 90, 16)
];
var FIELD_ORIGIN = { x: -24, y: -24 };
var FIELD_CELL = 4;
var FIELD_COLS = 252;
var FIELD_ROWS = 147;
var FIELD_SOLID_THRESHOLD = 0.55;
var MAT_NONE = 0;
var MAT_WATER = 1;
var MAT_ICE = 2;
var MAT_STEAM = 3;
var WAVE_DAMPING = 0.985;
var WAVE_EDGE_DAMPING = 0.5;
var WIND_DAMPING = 0.94;
var PRESSURE_FORCE = 0.45;
var WAVE_MOMENTUM = 3;
var WIND_MAX = 3;

class Field {
  baseDensity;
  waveCurr;
  wavePrev;
  totalDensity;
  velX;
  velY;
  nextVelX;
  nextVelY;
  temp;
  tempScratch;
  material;
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
      for (let y = y0;y <= y1; y++)
        for (let x = x0;x <= x1; x++)
          this.baseDensity[y * FIELD_COLS + x] = 1;
    }
    this.totalDensity.set(this.baseDensity);
    for (const pool of WATER_POOLS)
      this.fillMaterial(pool, MAT_WATER);
  }
  get waveField() {
    return this.waveCurr;
  }
  get baseField() {
    return this.baseDensity;
  }
  get velXField() {
    return this.velX;
  }
  get velYField() {
    return this.velY;
  }
  get tempField() {
    return this.temp;
  }
  get materialField() {
    return this.material;
  }
  fillMaterial(r, mat) {
    const x0 = Math.max(1, Math.floor((r.x - FIELD_ORIGIN.x) / FIELD_CELL));
    const x1 = Math.min(FIELD_COLS - 2, Math.ceil((r.x + r.w - FIELD_ORIGIN.x) / FIELD_CELL) - 1);
    const y0 = Math.max(1, Math.floor((r.y - FIELD_ORIGIN.y) / FIELD_CELL));
    const y1 = Math.min(FIELD_ROWS - 2, Math.ceil((r.y + r.h - FIELD_ORIGIN.y) / FIELD_CELL) - 1);
    for (let y = y0;y <= y1; y++)
      for (let x = x0;x <= x1; x++)
        this.material[y * FIELD_COLS + x] = mat;
  }
  cell(p) {
    const gx = Math.floor((p.x - FIELD_ORIGIN.x) / FIELD_CELL);
    const gy = Math.floor((p.y - FIELD_ORIGIN.y) / FIELD_CELL);
    if (gx < 1 || gx >= FIELD_COLS - 1 || gy < 1 || gy >= FIELD_ROWS - 1)
      return -1;
    return gy * FIELD_COLS + gx;
  }
  velocityAt(p) {
    const idx = this.cell(p);
    if (idx < 0)
      return { x: 0, y: 0 };
    return { x: this.velX[idx], y: this.velY[idx] };
  }
  velocityInRect(r) {
    let vx = 0, vy = 0, n = 0;
    for (let y = r.y;y <= r.y + r.h; y += 8) {
      for (let x = r.x;x <= r.x + r.w; x += 8) {
        const v = this.velocityAt({ x, y });
        vx += v.x;
        vy += v.y;
        n++;
      }
    }
    n = n || 1;
    return { x: vx / n, y: vy / n };
  }
  disturb(p, radiusPx, strength) {
    const gx = Math.floor((p.x - FIELD_ORIGIN.x) / FIELD_CELL);
    const gy = Math.floor((p.y - FIELD_ORIGIN.y) / FIELD_CELL);
    const radius = Math.round(radiusPx / FIELD_CELL);
    for (let y = -radius;y <= radius; y++) {
      for (let x = -radius;x <= radius; x++) {
        const nx = gx + x, ny = gy + y;
        if (nx <= 1 || nx >= FIELD_COLS - 2 || ny <= 1 || ny >= FIELD_ROWS - 2)
          continue;
        const dist = Math.hypot(x, y);
        if (dist <= radius)
          this.waveCurr[ny * FIELD_COLS + nx] += strength * Math.cos(dist / radius * Math.PI / 2);
      }
    }
  }
  wake(p, v, strength) {
    const idx = this.cell(p);
    if (idx < 0)
      return;
    this.velX[idx] += v.x * strength;
    this.velY[idx] += v.y * strength;
  }
  blast(p, radiusPx, wind, wave, windRadiusPx = radiusPx) {
    const gx = Math.floor((p.x - FIELD_ORIGIN.x) / FIELD_CELL);
    const gy = Math.floor((p.y - FIELD_ORIGIN.y) / FIELD_CELL);
    const radius = Math.max(1, Math.round(radiusPx / FIELD_CELL));
    const windRadius = Math.max(radius, Math.round(windRadiusPx / FIELD_CELL));
    for (let y = -windRadius;y <= windRadius; y++) {
      for (let x = -windRadius;x <= windRadius; x++) {
        const nx = gx + x, ny = gy + y;
        if (nx <= 1 || nx >= FIELD_COLS - 2 || ny <= 1 || ny >= FIELD_ROWS - 2)
          continue;
        const dist = Math.hypot(x, y);
        if (dist > windRadius)
          continue;
        const idx = ny * FIELD_COLS + nx;
        if (dist <= radius) {
          const falloff = Math.cos(dist / radius * Math.PI / 2);
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
  vortex(p, radiusPx, strength) {
    const gx = Math.floor((p.x - FIELD_ORIGIN.x) / FIELD_CELL);
    const gy = Math.floor((p.y - FIELD_ORIGIN.y) / FIELD_CELL);
    const radius = Math.max(1, Math.round(radiusPx / FIELD_CELL));
    for (let y = -radius;y <= radius; y++) {
      for (let x = -radius;x <= radius; x++) {
        const nx = gx + x, ny = gy + y;
        if (nx <= 1 || nx >= FIELD_COLS - 2 || ny <= 1 || ny >= FIELD_ROWS - 2)
          continue;
        const dist = Math.hypot(x, y);
        if (dist > 0.1 && dist <= radius) {
          const falloff = 1 - dist / radius;
          const idx = ny * FIELD_COLS + nx;
          this.velX[idx] += -y / dist * strength * falloff;
          this.velY[idx] += x / dist * strength * falloff - 0.15 * falloff;
        }
      }
    }
  }
  isSolidRect(r) {
    const x0 = Math.max(0, Math.floor((r.x - FIELD_ORIGIN.x) / FIELD_CELL));
    const x1 = Math.min(FIELD_COLS - 1, Math.floor((r.x + r.w - FIELD_ORIGIN.x) / FIELD_CELL));
    const y0 = Math.max(0, Math.floor((r.y - FIELD_ORIGIN.y) / FIELD_CELL));
    const y1 = Math.min(FIELD_ROWS - 1, Math.floor((r.y + r.h - FIELD_ORIGIN.y) / FIELD_CELL));
    for (let y = y0;y <= y1; y++)
      for (let x = x0;x <= x1; x++) {
        const idx = y * FIELD_COLS + x;
        if (this.material[idx] === MAT_ICE)
          return true;
        if (this.totalDensity[idx] >= FIELD_SOLID_THRESHOLD)
          return true;
      }
    return false;
  }
  isSolid(p) {
    const gx = Math.floor((p.x - FIELD_ORIGIN.x) / FIELD_CELL);
    const gy = Math.floor((p.y - FIELD_ORIGIN.y) / FIELD_CELL);
    if (gx < 0 || gx >= FIELD_COLS || gy < 0 || gy >= FIELD_ROWS)
      return false;
    const idx = gy * FIELD_COLS + gx;
    if (this.material[idx] === MAT_ICE)
      return true;
    return this.totalDensity[idx] >= FIELD_SOLID_THRESHOLD;
  }
  heat(p, radiusPx, amount) {
    const gx = Math.floor((p.x - FIELD_ORIGIN.x) / FIELD_CELL);
    const gy = Math.floor((p.y - FIELD_ORIGIN.y) / FIELD_CELL);
    const radius = Math.max(1, Math.round(radiusPx / FIELD_CELL));
    for (let y = -radius;y <= radius; y++) {
      for (let x = -radius;x <= radius; x++) {
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
  temperatureAt(p) {
    const idx = this.cell(p);
    return idx < 0 ? 0 : this.temp[idx];
  }
  temperatureInRect(r) {
    let t = 0, n = 0;
    for (let y = r.y;y <= r.y + r.h; y += FIELD_CELL) {
      for (let x = r.x;x <= r.x + r.w; x += FIELD_CELL) {
        t += this.temperatureAt({ x, y });
        n++;
      }
    }
    return n === 0 ? 0 : t / n;
  }
  hasWaterNear(p, radiusPx) {
    const gx = Math.floor((p.x - FIELD_ORIGIN.x) / FIELD_CELL);
    const gy = Math.floor((p.y - FIELD_ORIGIN.y) / FIELD_CELL);
    const radius = Math.max(1, Math.round(radiusPx / FIELD_CELL));
    for (let y = -radius;y <= radius; y++) {
      for (let x = -radius;x <= radius; x++) {
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
  carve(p, radiusPx) {
    const gx = Math.floor((p.x - FIELD_ORIGIN.x) / FIELD_CELL);
    const gy = Math.floor((p.y - FIELD_ORIGIN.y) / FIELD_CELL);
    const radius = Math.max(1, Math.round(radiusPx / FIELD_CELL));
    for (let y = -radius;y <= radius; y++) {
      for (let x = -radius;x <= radius; x++) {
        const nx = gx + x, ny = gy + y;
        if (nx <= 1 || nx >= FIELD_COLS - 2 || ny <= 1 || ny >= FIELD_ROWS - 2)
          continue;
        const idx = ny * FIELD_COLS + nx;
        this.baseDensity[idx] = 0;
        this.totalDensity[idx] = 0;
      }
    }
  }
  tick() {
    for (let y = 1;y < FIELD_ROWS - 1; y++) {
      for (let x = 1;x < FIELD_COLS - 1; x++) {
        const idx = y * FIELD_COLS + x;
        const neighbors = this.waveCurr[idx - 1] + this.waveCurr[idx + 1] + this.waveCurr[idx - FIELD_COLS] + this.waveCurr[idx + FIELD_COLS];
        let nextVal = (neighbors * 0.5 - this.wavePrev[idx]) * WAVE_DAMPING;
        if (x <= 2 || x >= FIELD_COLS - 3 || y <= 2 || y >= FIELD_ROWS - 3)
          nextVal *= WAVE_EDGE_DAMPING;
        this.wavePrev[idx] = nextVal;
        this.totalDensity[idx] = this.baseDensity[idx] + nextVal;
      }
    }
    for (let i = 0;i < this.waveCurr.length; i++) {
      const temp = this.waveCurr[i];
      this.waveCurr[i] = this.wavePrev[i];
      this.wavePrev[i] = temp;
    }
    for (let y = 1;y < FIELD_ROWS - 1; y++) {
      for (let x = 1;x < FIELD_COLS - 1; x++) {
        const idx = y * FIELD_COLS + x;
        if (this.totalDensity[idx] >= FIELD_SOLID_THRESHOLD) {
          this.nextVelX[idx] = 0;
          this.nextVelY[idx] = 0;
          continue;
        }
        const gradX = (this.waveCurr[idx + 1] - this.waveCurr[idx - 1]) * 0.5;
        const gradY = (this.waveCurr[idx + FIELD_COLS] - this.waveCurr[idx - FIELD_COLS]) * 0.5;
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
    for (let i = 0;i < this.velX.length; i++) {
      this.velX[i] = this.nextVelX[i];
      this.velY[i] = this.nextVelY[i];
    }
    this.tickTemperature();
  }
  tickTemperature() {
    const cols = FIELD_COLS, rows = FIELD_ROWS;
    for (let y = 1;y < rows - 1; y++) {
      for (let x = 1;x < cols - 1; x++) {
        const idx = y * cols + x;
        const sx = x - this.velX[idx];
        const sy = y - this.velY[idx];
        this.tempScratch[idx] = this.sampleBilinear(this.temp, sx, sy);
      }
    }
    const diffuse = 0.18, decay = 0.997;
    for (let y = 1;y < rows - 1; y++) {
      for (let x = 1;x < cols - 1; x++) {
        const idx = y * cols + x;
        const avg = (this.tempScratch[idx] * 2 + this.tempScratch[idx - 1] + this.tempScratch[idx + 1] + this.tempScratch[idx - cols] + this.tempScratch[idx + cols]) / 6;
        this.temp[idx] = avg * decay;
      }
    }
    for (let y = rows - 2;y >= 1; y--) {
      for (let x = 1;x < cols - 1; x++) {
        const idx = y * cols + x;
        const t = this.temp[idx];
        const mat = this.material[idx];
        if (mat === MAT_WATER && t > 100) {
          this.material[idx] = MAT_STEAM;
          this.temp[idx] -= 60;
          this.velY[idx] = Math.min(this.velY[idx], -1.2);
        } else if (mat === MAT_WATER && t < 0) {
          this.material[idx] = MAT_ICE;
        } else if (mat === MAT_ICE && t > 10) {
          this.material[idx] = MAT_WATER;
        } else if (mat === MAT_STEAM) {
          if (t < 60) {
            this.material[idx] = MAT_NONE;
          } else {
            const above = idx - cols;
            if (this.material[above] === MAT_NONE) {
              this.material[above] = MAT_STEAM;
              this.material[idx] = MAT_NONE;
            }
          }
        }
      }
    }
  }
  sampleBilinear(arr, cx, cy) {
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

// src/body.ts
var WIND_DRIFT = 0.8;
var UNBURY_STEP = 1;

class Body {
  coord;
  vspeed = 0;
  health;
  maxHealth;
  boundingBox;
  jumpHeld = false;
  goingLeft = false;
  goingRight = false;
  flying = false;
  flyVelocity = { x: 0, y: 0 };
  knockback = { x: 0, y: 0 };
  mirrored = false;
  onGround = false;
  chill = 0;
  flyEnergy = 100;
  constructor(position, size, health, flying = false) {
    this.coord = { ...position };
    this.health = health;
    this.maxHealth = health;
    this.boundingBox = rect(position, size.x, size.y);
    this.flying = flying;
  }
  goLeft() {
    this.goingLeft = true;
  }
  stopLeft() {
    this.goingLeft = false;
  }
  goRight() {
    this.goingRight = true;
  }
  stopRight() {
    this.goingRight = false;
  }
  hit(value) {
    this.health = Math.max(0, this.health - value);
  }
  applyKnockback(v) {
    this.knockback = { x: this.knockback.x + v.x, y: this.knockback.y + v.y };
  }
  get dead() {
    return this.health <= 0;
  }
  update(field) {
    if (this.flying) {
      this.updateFlying();
      return;
    }
    this.chill = Math.max(0, this.chill - 0.004);
    const speed = 7 * (1 - this.chill * 0.6);
    const FLY_WASTE = 1.5;
    if (this.jumpHeld && this.flyEnergy > FLY_WASTE) {
      this.vspeed = 18;
      this.flyEnergy -= FLY_WASTE;
    }
    if (!this.jumpHeld) {
      if (field.isSolidRect(rectTranslated(this.boundingBox, 0, 1)))
        this.flyEnergy = Math.min(100, this.flyEnergy + 20);
      else if (this.vspeed <= 10)
        this.flyEnergy = Math.min(100, this.flyEnergy + 0.5);
    }
    this.vspeed = Math.max(this.vspeed - 1, 0);
    const wind = field.velocityInRect(this.boundingBox);
    if (this.goingLeft !== this.goingRight) {
      if (this.goingLeft)
        this.moveHorizontal(field, -speed);
      if (this.goingRight)
        this.moveHorizontal(field, speed);
    }
    this.moveHorizontal(field, wind.x * WIND_DRIFT);
    this.onGround = field.isSolidRect(rectTranslated(this.boundingBox, 0, 1));
    this.moveVertical(field, 10 - this.vspeed + wind.y * WIND_DRIFT + this.knockback.y);
    this.moveHorizontal(field, this.knockback.x);
    this.knockback = { x: this.knockback.x * 0.8, y: this.knockback.y * 0.8 };
    let unbury = 12;
    while (unbury-- > 0 && field.isSolidRect(this.boundingBox)) {
      this.coord.y -= UNBURY_STEP;
      this.boundingBox.y -= UNBURY_STEP;
    }
    this.clampToArena();
  }
  updateFlying() {
    this.chill = Math.max(0, this.chill - 0.004);
    this.coord.x = clamp(this.coord.x + this.flyVelocity.x, 0, ARENA_W - this.boundingBox.w);
    this.coord.y = clamp(this.coord.y + this.flyVelocity.y, 0, ARENA_H - this.boundingBox.h);
    this.boundingBox.x = this.coord.x;
    this.boundingBox.y = this.coord.y;
    this.knockback = { x: this.knockback.x * 0.8, y: this.knockback.y * 0.8 };
  }
  clampToArena() {
    this.coord.x = clamp(this.coord.x, 0, ARENA_W - this.boundingBox.w);
    this.coord.y = clamp(this.coord.y, -24, ARENA_H - this.boundingBox.h);
    this.boundingBox.x = this.coord.x;
    this.boundingBox.y = this.coord.y;
  }
  moveHorizontal(field, speed) {
    let dx = speed;
    const delta = sign(speed);
    let newRect = rectTranslated(this.boundingBox, dx, 0);
    while (field.isSolidRect(newRect) && dx !== 0) {
      dx = delta > 0 ? Math.max(0, dx - 1) : Math.min(0, dx + 1);
      newRect = rectTranslated(this.boundingBox, dx, 0);
    }
    if (dx === 0)
      return;
    this.coord.x += dx;
    this.boundingBox.x += dx;
  }
  moveVertical(field, speed) {
    let dy = speed;
    const delta = sign(speed);
    let newRect = rectTranslated(this.boundingBox, 0, dy);
    while (field.isSolidRect(newRect) && dy !== 0) {
      dy = delta > 0 ? Math.max(0, dy - 1) : Math.min(0, dy + 1);
      newRect = rectTranslated(this.boundingBox, 0, dy);
      this.vspeed = 0;
    }
    if (dy === 0)
      return;
    this.coord.y += dy;
    this.boundingBox.y += dy;
  }
  center() {
    return { x: this.boundingBox.x + this.boundingBox.w / 2, y: this.boundingBox.y + this.boundingBox.h / 2 };
  }
}

// src/spells.ts
var RARITY_PRICE = {
  common: [15, 25],
  uncommon: [40, 60],
  rare: [90, 120],
  epic: [180, 250]
};
function beamEnd(field, from, target) {
  const dir = sub(target, from);
  const len = Math.hypot(dir.x, dir.y);
  const unit = len === 0 ? { x: 1, y: 0 } : mul(dir, 1 / len);
  let pos = { ...from };
  while (!field.isSolid(pos) && pos.x > 0 && pos.x < 960 && pos.y > 0 && pos.y < 540) {
    pos = add(pos, unit);
  }
  return { end: pos, dir: unit };
}
var SPELLS = [
  {
    id: "compression_sphere",
    school: "kinetic",
    rarity: "common",
    mana: 10,
    friendlyFire: false,
    name: { ru: "Сфера сжатия", en: "Compression sphere" },
    desc: {
      ru: "Импульс стягивания в точке курсора: давит врагов к центру и бьёт ударом сжатия.",
      en: "Contracting impulse at the cursor: crushes enemies inward, then slams them."
    },
    cast: (w, _caster, target) => {
      w.field.blast(target, 60, -1.5, 0, 78);
      w.damageInRadius(target, 42, 12, false, -1.2);
    }
  },
  {
    id: "phase_discharge",
    school: "kinetic",
    rarity: "uncommon",
    mana: 14,
    friendlyFire: false,
    name: { ru: "Фазовый разряд", en: "Phase discharge" },
    desc: {
      ru: "Три чередующихся импульса стягивания/расталкивания вокруг курсора.",
      en: "Three alternating pull/push pulses around the cursor."
    },
    cast: (w, _caster, target) => {
      w.addEffect("pulse", { ...target }, 36, 54, 3);
    }
  },
  {
    id: "vortex",
    school: "kinetic",
    rarity: "uncommon",
    mana: 16,
    friendlyFire: false,
    name: { ru: "Вихрь", en: "Vortex" },
    desc: {
      ru: "Торнадо в точке курсора на ~1.5с: закручивает воздух, поднимает и швыряет врагов.",
      en: "Tornado at the cursor for ~1.5s: spins the air, lifts and tosses enemies."
    },
    cast: (w, _caster, target) => {
      w.addEffect("vortex", { ...target }, 75, 42, 1.8);
    }
  },
  {
    id: "shockwave",
    school: "kinetic",
    rarity: "rare",
    mana: 20,
    friendlyFire: false,
    name: { ru: "Ударная волна", en: "Shockwave" },
    desc: {
      ru: "Кольцо давления вокруг мага: отбрасывает и контузит всех рядом.",
      en: "Pressure ring around the mage: knocks back and stuns everything nearby."
    },
    cast: (w, caster, _target) => {
      const p = caster.center();
      w.field.blast(p, 90, 2.5, 1.5, 120);
      w.damageInRadius(p, 90, 10, false, 2.5);
    }
  },
  {
    id: "spark",
    school: "heat",
    rarity: "common",
    mana: 8,
    friendlyFire: true,
    name: { ru: "Искра", en: "Spark" },
    desc: {
      ru: "Разгорячённый сгусток: поджигает воздух в точке попадания (жжёт и вас тоже).",
      en: "Hot bolt: ignites the air at impact (burns you too)."
    },
    cast: (w, caster, target) => {
      const from = caster.center();
      const dir = sub(target, from);
      const len = Math.hypot(dir.x, dir.y) || 1;
      w.spawnProjectile({
        kind: "heatbolt",
        pos: from,
        vel: mul(dir, 10 / len),
        ownerIsPlayer: caster.isPlayer,
        damage: 8,
        ttl: 70,
        radius: 18,
        heat: 45
      });
    }
  },
  {
    id: "ice_needle",
    school: "heat",
    rarity: "uncommon",
    mana: 12,
    friendlyFire: true,
    name: { ru: "Ледяная игла", en: "Ice needle" },
    desc: {
      ru: "Холодная игла: замораживает воду в лёд-платформы и замедляет врагов.",
      en: "Cold needle: freezes water into ice platforms and chills enemies."
    },
    cast: (w, caster, target) => {
      const from = caster.center();
      const dir = sub(target, from);
      const len = Math.hypot(dir.x, dir.y) || 1;
      w.spawnProjectile({
        kind: "iceshard",
        pos: from,
        vel: mul(dir, 9 / len),
        ownerIsPlayer: caster.isPlayer,
        damage: 10,
        ttl: 80,
        radius: 24,
        heat: -60
      });
    }
  },
  {
    id: "heat_pump",
    school: "heat",
    rarity: "rare",
    mana: 18,
    friendlyFire: true,
    name: { ru: "Тепловой насос", en: "Heat pump" },
    desc: {
      ru: "2с качает тепло из зоны у курсора к магу: заморозка местности, жар вокруг вас.",
      en: "For 2s pumps heat from the cursor zone to you: freezes terrain, roasts around you."
    },
    cast: (w, _caster, target) => {
      w.addEffect("pump", { ...target }, 100, 60, 3);
    }
  },
  {
    id: "steam_blast",
    school: "heat",
    rarity: "epic",
    mana: 24,
    friendlyFire: true,
    name: { ru: "Паровой взрыв", en: "Steam blast" },
    desc: {
      ru: "Мощнее у воды: мгновенно испаряет её, взрыв пара жжёт ВСЁ вокруг, включая вас.",
      en: "Stronger near water: instantly boils it; the steam blast burns EVERYTHING, you included."
    },
    cast: (w, _caster, target) => {
      const wet = w.field.hasWaterNear(target, 60);
      const radius = wet ? 90 : 40;
      const dmg = wet ? 30 : 12;
      w.field.heat(target, radius, wet ? 120 : 60);
      w.field.blast(target, radius, wet ? 2 : 1, wet ? 1.2 : 0.6);
      w.damageInRadius(target, radius, dmg, true, 1.5);
    }
  },
  {
    id: "bullet",
    school: "emitter",
    rarity: "common",
    mana: 10,
    friendlyFire: false,
    name: { ru: "Пуля", en: "Bullet" },
    desc: {
      ru: "Быстрая пуля по прямой, слегка толкает воздух за собой.",
      en: "Fast bullet in a straight line, lightly pushes the air behind it."
    },
    cast: (w, caster, target) => {
      const from = caster.center();
      const dir = sub(target, from);
      const len = Math.hypot(dir.x, dir.y) || 1;
      w.spawnProjectile({
        kind: "bullet",
        pos: from,
        vel: mul(dir, 14 / len),
        ownerIsPlayer: caster.isPlayer,
        damage: 30,
        ttl: 90,
        radius: 0,
        heat: 0
      });
    }
  },
  {
    id: "laser",
    school: "emitter",
    rarity: "uncommon",
    mana: 30,
    friendlyFire: false,
    name: { ru: "Лазер", en: "Laser" },
    desc: {
      ru: "Мгновенный луч по прямой до препятствия, тянет воздух вдоль луча.",
      en: "Instant beam to the first obstacle, drags air along the beam."
    },
    cast: (w, caster, target) => {
      const from = caster.center();
      const { end, dir } = beamEnd(w.field, from, target);
      for (const e of w.enemyViews()) {
        if (caster.isPlayer && rectIntersects(lineRect(from, end), e.boundingBox)) {
          w.damageInRadius(e.center(), 1, 40, false, 0);
          break;
        }
      }
      for (let d = 0;d < Math.hypot(end.x - from.x, end.y - from.y); d += 8) {
        w.field.wake(add(from, mul(dir, d)), dir, -1.5);
      }
      w.addEffect("laserfx", { ...end }, 10, 0, 0);
    }
  },
  {
    id: "grenade",
    school: "emitter",
    rarity: "rare",
    mana: 20,
    friendlyFire: false,
    name: { ru: "Граната", en: "Grenade" },
    desc: {
      ru: "Граната по параболе: взрыв с торнадо-импульсом, сильный отброс.",
      en: "Grenade in an arc: explodes with a vortex trail and heavy knockback."
    },
    cast: (w, caster, target) => {
      const from = caster.center();
      const dir = sub(target, from);
      const len = Math.hypot(dir.x, dir.y) || 1;
      w.spawnProjectile({
        kind: "grenade",
        pos: from,
        vel: { x: dir.x / len * 11, y: dir.y / len * 11 - 3 },
        ownerIsPlayer: caster.isPlayer,
        damage: 10,
        ttl: 75,
        radius: 48,
        heat: 0
      });
    }
  }
];
function lineRect(a, b) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y)
  };
}
function spellById(id) {
  return SPELLS.find((s) => s.id === id);
}
var RARITY_WEIGHT = {
  common: 0.5,
  uncommon: 0.3,
  rare: 0.15,
  epic: 0.05
};

// src/enemies.ts
var ARCHETYPES = {
  spearman: {
    id: "spearman",
    name: { ru: "Копейщик", en: "Spearman" },
    color: "#d08050",
    hp: 30,
    speed: 3.2,
    body: { x: 48, y: 84 },
    flying: false,
    meleeDamage: 10,
    meleeCooldown: 60,
    attackRange: 70,
    gold: 8,
    heatDamageMult: 1,
    ranged: null,
    update: (ctx, e, def) => {
      const to = sub(ctx.player.center(), e.body.center());
      if (e.state === "windup") {
        if (--e.stateTicks <= 0) {
          e.state = "lunge";
          e.stateTicks = 16;
          e.lungeDir = Math.sign(to.x) || 1;
        }
        return;
      }
      if (e.state === "lunge") {
        e.body.goingLeft = e.lungeDir < 0;
        e.body.goingRight = e.lungeDir > 0;
        if (--e.stateTicks <= 0) {
          e.state = "idle";
          e.body.goingLeft = false;
          e.body.goingRight = false;
        }
        return;
      }
      const dist = Math.hypot(to.x, to.y);
      if (dist < def.attackRange && e.meleeCd <= 0) {
        e.state = "windup";
        e.stateTicks = 20;
      } else {
        e.body.goingLeft = to.x < 0;
        e.body.goingRight = to.x > 0;
        if (ctx.blockedAhead(e))
          ctx.jump(e);
        if (to.y < -4)
          climbToward(ctx, e, to);
        else
          e.climbDir = 0;
      }
    }
  },
  swarmer: {
    id: "swarmer",
    name: { ru: "Роевик", en: "Swarmer" },
    color: "#e0d060",
    hp: 10,
    speed: 5,
    body: { x: 30, y: 54 },
    flying: false,
    meleeDamage: 4,
    meleeCooldown: 45,
    attackRange: 40,
    gold: 3,
    heatDamageMult: 1,
    ranged: null,
    update: (ctx, e, def) => {
      const to = sub(ctx.player.center(), e.body.center());
      e.body.goingLeft = to.x < 0;
      e.body.goingRight = to.x > 0;
      if (ctx.blockedAhead(e))
        ctx.jump(e);
      if (to.y < -4)
        climbToward(ctx, e, to);
      else
        e.climbDir = 0;
    }
  },
  crossbowman: {
    id: "crossbowman",
    name: { ru: "Арбалетчик", en: "Crossbowman" },
    color: "#70a0e0",
    hp: 25,
    speed: 3,
    body: { x: 48, y: 84 },
    flying: false,
    meleeDamage: 5,
    meleeCooldown: 70,
    attackRange: 60,
    gold: 10,
    heatDamageMult: 1,
    ranged: { damage: 8, cooldown: 90, speed: 9, kind: "bolt" },
    update: (ctx, e, def) => {
      const to = sub(ctx.player.center(), e.body.center());
      const dist = Math.hypot(to.x, to.y);
      if (dist < 150) {
        e.body.goingLeft = to.x > 0;
        e.body.goingRight = to.x < 0;
      } else if (dist > 360 || !ctx.lineOfSight(e)) {
        e.body.goingLeft = to.x < 0;
        e.body.goingRight = to.x > 0;
      } else {
        e.body.goingLeft = false;
        e.body.goingRight = false;
      }
      if (ctx.blockedAhead(e))
        ctx.jump(e);
      if (e.rangedCd <= 0 && ctx.lineOfSight(e) && dist < 420) {
        ctx.shoot(e, mul(sub(ctx.player.center(), e.body.center()), 1 / (dist || 1)), def);
      }
    }
  },
  flyer: {
    id: "flyer",
    name: { ru: "Летун", en: "Flyer" },
    color: "#80e0d0",
    hp: 15,
    speed: 4.5,
    body: { x: 42, y: 42 },
    flying: true,
    meleeDamage: 8,
    meleeCooldown: 60,
    attackRange: 55,
    gold: 6,
    heatDamageMult: 1,
    ranged: null,
    update: (ctx, e, def) => {
      const to = sub(ctx.player.center(), e.body.center());
      const target = { x: to.x, y: to.y - 90 };
      const dist = Math.hypot(to.x, to.y);
      if (dist < 130) {
        e.body.flyVelocity = mul(to, def.speed / (dist || 1));
      } else {
        const len = Math.hypot(target.x, target.y) || 1;
        e.body.flyVelocity = mul(target, def.speed / len);
      }
    }
  },
  golem: {
    id: "golem",
    name: { ru: "Голем", en: "Golem" },
    color: "#909098",
    hp: 90,
    speed: 1.6,
    body: { x: 72, y: 108 },
    flying: false,
    meleeDamage: 20,
    meleeCooldown: 90,
    attackRange: 80,
    gold: 25,
    heatDamageMult: 2,
    ranged: null,
    update: (ctx, e, def) => {
      const to = sub(ctx.player.center(), e.body.center());
      e.body.goingLeft = to.x < 0;
      e.body.goingRight = to.x > 0;
      if (ctx.blockedAhead(e))
        ctx.dig(e);
    }
  },
  mage_operator: {
    id: "mage_operator",
    name: { ru: "Маг-оператор", en: "Mage operator" },
    color: "#c070e0",
    hp: 22,
    speed: 2.8,
    body: { x: 48, y: 84 },
    flying: false,
    meleeDamage: 4,
    meleeCooldown: 70,
    attackRange: 60,
    gold: 12,
    heatDamageMult: 1,
    ranged: { damage: 6, cooldown: 120, speed: 8, kind: "heatbolt" },
    update: (ctx, e, def) => {
      const to = sub(ctx.player.center(), e.body.center());
      const dist = Math.hypot(to.x, to.y);
      if (dist < 200) {
        e.body.goingLeft = to.x > 0;
        e.body.goingRight = to.x < 0;
      } else if (dist > 380 || !ctx.lineOfSight(e)) {
        e.body.goingLeft = to.x < 0;
        e.body.goingRight = to.x > 0;
      } else {
        e.body.goingLeft = false;
        e.body.goingRight = false;
      }
      if (ctx.blockedAhead(e))
        ctx.jump(e);
      if (e.rangedCd <= 0 && ctx.lineOfSight(e) && dist < 440) {
        ctx.shoot(e, mul(sub(ctx.player.center(), e.body.center()), 1 / (dist || 1)), def);
      }
    }
  }
};
function hpScale(round) {
  return 1 + 0.15 * (round - 1);
}
function climbToward(ctx, e, to) {
  ctx.jump(e);
  const dir = to.x < 0 ? -1 : 1;
  if (e.climbDir === 0) {
    if (ctx.columnFree(e, dir))
      return;
    e.climbDir = ctx.columnFree(e, -1) ? -1 : ctx.columnFree(e, 1) ? 1 : -1;
    e.climbTicks = 60;
  }
  if (e.climbDir === -1) {
    e.body.goingLeft = true;
    e.body.goingRight = false;
    if (ctx.columnFree(e, -1))
      e.climbDir = 0;
    else if (--e.climbTicks <= 0) {
      e.climbDir = 1;
      e.climbTicks = 240;
    }
  } else {
    e.body.goingLeft = false;
    e.body.goingRight = true;
    if (ctx.columnFree(e, 1))
      e.climbDir = 0;
  }
}
var R1 = [
  { delayTicks: 0, spawn: [{ archetype: "spearman", count: 3, point: 1 }] }
];
var R2 = [
  { delayTicks: 0, spawn: [{ archetype: "swarmer", count: 5, point: 1 }] },
  { delayTicks: 240, spawn: [{ archetype: "spearman", count: 2, point: 0 }] }
];
var R3 = [
  { delayTicks: 0, spawn: [{ archetype: "crossbowman", count: 2, point: 2 }] },
  { delayTicks: 180, spawn: [{ archetype: "swarmer", count: 4, point: 1 }] }
];
var R4 = [
  { delayTicks: 0, spawn: [{ archetype: "flyer", count: 3, point: 3 }] },
  { delayTicks: 240, spawn: [
    { archetype: "crossbowman", count: 2, point: 2 },
    { archetype: "spearman", count: 2, point: 0 }
  ] }
];
var R5 = [
  { delayTicks: 0, spawn: [{ archetype: "golem", count: 2, point: 1 }] },
  { delayTicks: 180, spawn: [{ archetype: "mage_operator", count: 2, point: 2 }] },
  { delayTicks: 360, spawn: [{ archetype: "swarmer", count: 6, point: 0 }] }
];
var WAVES = [R1, R2, R3, R4, R5];
var SPAWN_POINTS = [
  { x: 30, y: 440 },
  { x: 900, y: 440 },
  { x: 700, y: 380 },
  { x: 480, y: 180 }
];
function makeEnemy(archetype, round, pos) {
  const def = ARCHETYPES[archetype];
  const hp = Math.round(def.hp * hpScale(round));
  const body = new Body({ ...pos }, def.body, hp, def.flying);
  return {
    archetype,
    hp,
    body,
    meleeCd: 30,
    rangedCd: 60,
    state: "idle",
    stateTicks: 0,
    lungeDir: 0,
    climbDir: 0,
    climbTicks: 0
  };
}
function touchesPlayer(e, playerBox) {
  return rectIntersects(e.body.boundingBox, playerBox);
}

// src/world.ts
var HEAT_DMG_THRESHOLD = 20;
var COLD_DMG_THRESHOLD = -10;
var HEAT_DPS = 0.02;
var COLD_DPS = 0.015;
var PLAYER_SPAWN = { x: 60, y: 380 };

class World {
  field;
  run;
  round;
  player;
  enemies = [];
  projectiles = [];
  effects = [];
  outcome = null;
  mouse = { x: 480, y: 270 };
  showVectors = true;
  goldEarned = 0;
  ticks = 0;
  rng;
  packs = [];
  playerCaster;
  constructor(field, run, round, rng = Math.random) {
    this.field = field;
    this.run = run;
    this.round = round;
    this.rng = rng;
    this.player = new Body({ ...PLAYER_SPAWN }, { x: 48, y: 84 }, run.hp);
    this.playerCaster = {
      isPlayer: true,
      center: () => this.player.center(),
      mirrored: false
    };
    for (const pack of WAVES[Math.min(round, WAVES.length) - 1])
      this.packs.push({ ...pack });
  }
  casterOfPlayer() {
    return this.playerCaster;
  }
  enemyViews() {
    return this.enemies.map((e) => ({ center: () => e.body.center(), boundingBox: e.body.boundingBox }));
  }
  playerBox() {
    return this.player.boundingBox;
  }
  random() {
    return this.rng();
  }
  castNext(target) {
    const next = this.run.castNext(this.run.activeWand);
    if (!next)
      return false;
    const def = SPELLS.find((s) => s.id === next.spellId);
    if (!def)
      return false;
    def.cast(this, this.playerCaster, target);
    return true;
  }
  update() {
    if (this.outcome)
      return;
    this.ticks++;
    this.run.tickMana();
    this.spawnPacks();
    this.updatePlayer();
    for (const e of this.enemies)
      this.updateEnemy(e);
    this.enemies = this.enemies.filter((e) => !e.body.dead);
    this.updateProjectiles();
    this.updateEffects();
    this.heatFieldDamage();
    if (this.player.dead) {
      this.run.diedThisRound = true;
      this.outcome = { won: false };
      return;
    }
    if (this.packs.length === 0 && this.enemies.length === 0) {
      const stars = !this.run.diedThisRound ? !this.run.hpLostThisRound ? 3 : 2 : 1;
      this.outcome = { won: true, stars, goldEarned: this.goldEarned, hpLost: this.run.hpLostThisRound, died: this.run.diedThisRound };
    }
  }
  spawnPacks() {
    for (const pack of this.packs)
      pack.delayTicks--;
    this.packs = this.packs.filter((pack) => {
      if (pack.delayTicks > 0)
        return true;
      for (const s of pack.spawn) {
        const base = SPAWN_POINTS[s.point];
        for (let i = 0;i < s.count; i++) {
          const jitter = { x: this.rng() * 120 - 60, y: 0 };
          const pos = ARCHETYPES[s.archetype].flying ? { x: 200 + this.rng() * 560, y: 60 + this.rng() * 120 } : { x: clamp(base.x + this.rng() * 80 - 40, 10, 930), y: base.y };
          this.enemies.push(makeEnemy(s.archetype, this.round, add(pos, jitter)));
        }
      }
      return false;
    });
  }
  updatePlayer() {
    this.player.update(this.field);
  }
  updateEnemy(e) {
    const def = ARCHETYPES[e.archetype];
    if (e.meleeCd > 0)
      e.meleeCd--;
    if (e.rangedCd > 0)
      e.rangedCd--;
    const ctx = {
      player: this.player,
      field: this.field,
      random: this.rng,
      blockedAhead: (en) => this.blockedAhead(en),
      columnFree: (en, dir) => this.columnFree(en, dir),
      lineOfSight: (en) => this.lineOfSight(en),
      jump: (en) => {
        en.body.jumpHeld = true;
      },
      dig: (en) => {
        const dir = en.body.goingLeft ? -1 : en.body.goingRight ? 1 : Math.sign(this.player.center().x - en.body.center().x);
        this.field.carve(add(en.body.center(), { x: dir * en.body.boundingBox.w, y: 0 }), 10);
      },
      shoot: (en, dir, d) => {
        const r = d.ranged;
        en.rangedCd = r.cooldown;
        const from = en.body.center();
        this.spawnProjectile({
          kind: r.kind,
          pos: from,
          vel: mul(dir, r.speed),
          ownerIsPlayer: false,
          damage: Math.round(r.damage * (1 + 0.1 * (this.round - 1))),
          ttl: 90,
          radius: r.kind === "heatbolt" ? 18 : 0,
          heat: r.kind === "heatbolt" ? 30 : 0
        });
      }
    };
    e.body.jumpHeld = false;
    def.update(ctx, e, def);
    e.body.update(this.field);
    if (e.meleeCd <= 0 && touchesPlayer(e, this.player.boundingBox)) {
      e.meleeCd = def.meleeCooldown;
      this.damagePlayer(Math.round(def.meleeDamage * (1 + 0.1 * (this.round - 1))));
      const dir = sub(this.player.center(), e.body.center());
      this.player.applyKnockback(mul(dir, 0.3));
    }
  }
  blockedAhead(e) {
    const dir = e.body.goingLeft ? -1 : e.body.goingRight ? 1 : 0;
    if (dir === 0)
      return false;
    const b = e.body.boundingBox;
    return this.field.isSolidRect(rect({ x: b.x + (dir > 0 ? b.w : -4), y: b.y + b.h / 2 }, 4, b.h / 2));
  }
  columnFree(e, dir) {
    const b = e.body.boundingBox;
    return !this.field.isSolidRect(rect({ x: b.x + (dir > 0 ? b.w : -b.w), y: 0 }, b.w, b.y + b.h));
  }
  lineOfSight(e) {
    const from = e.body.center();
    const to = this.player.center();
    const d = sub(to, from);
    const len = Math.hypot(d.x, d.y);
    if (len === 0)
      return true;
    const unit = mul(d, 1 / len);
    let p = { ...from };
    while (Math.hypot(p.x - to.x, p.y - to.y) > 8) {
      p = add(p, mul(unit, 4));
      if (this.field.isSolid(p))
        return false;
    }
    return true;
  }
  damageInRadius(p, radius, dmg, hitPlayer, knock) {
    for (const e of this.enemies) {
      const c = e.body.center();
      if (Math.hypot(c.x - p.x, c.y - p.y) <= radius) {
        e.body.hit(dmg);
        if (e.body.dead) {
          const def = ARCHETYPES[e.archetype];
          this.run.gold += def.gold;
          this.goldEarned += def.gold;
        }
        if (knock !== 0) {
          const dir = sub(c, p);
          const len = Math.hypot(dir.x, dir.y) || 1;
          e.body.applyKnockback(mul(dir, knock / len));
        }
      }
    }
    if (hitPlayer) {
      const c = this.player.center();
      if (Math.hypot(c.x - p.x, c.y - p.y) <= radius) {
        this.damagePlayer(dmg);
        if (knock !== 0) {
          const dir = sub(c, p);
          const len = Math.hypot(dir.x, dir.y) || 1;
          this.player.applyKnockback(mul(dir, knock / len));
        }
      }
    }
  }
  damagePlayer(dmg) {
    this.run.hpLostThisRound = true;
    this.player.hit(dmg);
  }
  spawnProjectile(spec) {
    this.projectiles.push({ ...spec, ttlLeft: spec.ttl });
  }
  addEffect(kind, pos, ttl, radius, power, from) {
    this.effects.push({ kind, pos, ttl, radius, power, from });
  }
  updateProjectiles() {
    for (const pr of this.projectiles) {
      pr.ttlLeft--;
      if (pr.kind === "grenade") {
        pr.vel.y += 0.4;
        this.field.vortex(pr.pos, 42, 0.45);
      }
      if (pr.kind === "bullet") {
        const len = Math.hypot(pr.vel.x, pr.vel.y) || 1;
        this.field.wake(pr.pos, mul(pr.vel, 1 / len), 0.2);
      }
      pr.pos = add(pr.pos, pr.vel);
      const hitBody = this.projectileHitsBody(pr);
      const hitWall = this.field.isSolid(pr.pos);
      if (!hitBody && !hitWall && pr.ttlLeft > 0)
        continue;
      switch (pr.kind) {
        case "bullet":
          this.field.blast(pr.pos, 24, 0.8, 0.5, 36);
          this.damageInRadius(pr.pos, 6, pr.damage, false, 0.4);
          break;
        case "bolt":
          if (hitBody === "player")
            this.damagePlayer(pr.damage);
          break;
        case "heatbolt":
          this.field.heat(pr.pos, pr.radius, pr.heat);
          this.field.blast(pr.pos, pr.radius, 0.5, 0.3, 24);
          this.damageInRadius(pr.pos, pr.radius, pr.damage, false, 0.5);
          break;
        case "iceshard":
          this.field.heat(pr.pos, pr.radius, pr.heat);
          this.damageInRadius(pr.pos, pr.radius, pr.damage, false, 0.5);
          for (const e of this.enemies) {
            const c = e.body.center();
            if (Math.hypot(c.x - pr.pos.x, c.y - pr.pos.y) <= pr.radius)
              e.body.chill = Math.min(1, e.body.chill + 0.7);
          }
          break;
        case "grenade":
          this.field.blast(pr.pos, pr.radius, 1.5, 1.2, 120);
          this.damageInRadius(pr.pos, pr.radius, pr.damage, false, 2);
          break;
      }
      pr.ttlLeft = 0;
    }
    this.projectiles = this.projectiles.filter((p) => p.ttlLeft > 0);
  }
  projectileHitsBody(pr) {
    const r = rect({ x: pr.pos.x - 3, y: pr.pos.y - 3 }, 6, 6);
    if (pr.ownerIsPlayer) {
      for (const e of this.enemies) {
        if (e.body.dead)
          continue;
        if (rectIntersects(r, e.body.boundingBox))
          return "enemy";
      }
      return null;
    }
    if (rectIntersects(r, this.player.boundingBox))
      return "player";
    return null;
  }
  updateEffects() {
    for (const fx of this.effects) {
      fx.ttl--;
      switch (fx.kind) {
        case "vortex":
          this.field.vortex(fx.pos, fx.radius, fx.power);
          for (const e of this.enemies) {
            const c = e.body.center();
            if (Math.hypot(c.x - fx.pos.x, c.y - fx.pos.y) <= fx.radius * 1.2)
              e.body.hit(0.15);
          }
          break;
        case "pump":
          this.field.heat(fx.pos, fx.radius, -fx.power);
          this.field.heat(this.player.center(), 24, fx.power * 0.6);
          break;
        case "pulse": {
          const phase = Math.floor(fx.ttl % 36 / 12);
          const pull = phase % 2 === 0 ? -1 : 1;
          this.field.blast(fx.pos, fx.radius, pull * 1.5, 0, 60);
          this.damageInRadius(fx.pos, fx.radius, 6, false, pull * 1);
          break;
        }
        case "laserfx":
          break;
      }
    }
    this.effects = this.effects.filter((fx) => fx.ttl > 0);
  }
  heatFieldDamage() {
    const sample = (body, mult) => {
      const t = this.field.temperatureInRect(body.boundingBox);
      if (t > HEAT_DMG_THRESHOLD)
        body.hit((t - HEAT_DMG_THRESHOLD) * HEAT_DPS * mult);
      if (t < COLD_DMG_THRESHOLD) {
        body.hit((COLD_DMG_THRESHOLD - t) * COLD_DPS * mult);
        body.chill = Math.min(1, body.chill + 0.02);
      }
    };
    sample(this.player, 1);
    for (const e of [...this.enemies]) {
      const before = e.body.dead;
      sample(e.body, ARCHETYPES[e.archetype].heatDamageMult);
      if (!before && e.body.dead) {
        const def = ARCHETYPES[e.archetype];
        this.run.gold += def.gold;
        this.goldEarned += def.gold;
      }
    }
  }
}

// src/wand.ts
var SPELL_MANA = {};
for (const s of SPELLS)
  SPELL_MANA[s.id] = s.mana;
var MANA_MAX = 100;
var MANA_REGEN_PER_TICK = 0.8;
var WAND_PRICE = { 4: 60, 6: 140, 8: 260 };
function wandPrice(size) {
  return WAND_PRICE[size] ?? WAND_PRICE[8] + 120 * ((size - 8) / 2);
}

class RunState {
  gold = 150;
  attempts = 3;
  round = 1;
  hp = 100;
  mana = MANA_MAX;
  activeWand = 0;
  wands = [{ slots: [null, null, null, null], cursor: 0 }];
  inventory = [];
  wandSlots = 4;
  stars = [];
  hpLostThisRound = false;
  diedThisRound = false;
  addWand() {
    this.wands.push({ slots: Array(this.wandSlots).fill(null), cursor: 0 });
  }
  get activeWandObj() {
    return this.wands[this.activeWand];
  }
  tickMana() {
    this.mana = Math.min(MANA_MAX, this.mana + MANA_REGEN_PER_TICK);
  }
  resetCombatState() {
    this.mana = MANA_MAX;
    this.hp = 100;
    this.hpLostThisRound = false;
    this.diedThisRound = false;
  }
  castNext(wandIdx) {
    const wand = this.wands[wandIdx];
    for (let i = 0;i < wand.slots.length; i++) {
      const slot = (wand.cursor + i) % wand.slots.length;
      const spellId = wand.slots[slot];
      if (!spellId)
        continue;
      const cost = SPELL_MANA[spellId] ?? 10;
      if (this.mana < cost)
        return null;
      this.mana -= cost;
      wand.cursor = (slot + 1) % wand.slots.length;
      return { spellId, slot };
    }
    return null;
  }
  totalStars() {
    return this.stars.reduce((a, b) => a + b, 0);
  }
  roundsCleared() {
    return this.stars.filter((s) => s > 0).length;
  }
}

// src/shop.ts
var SPELL_COUNT = 4;
var REROLL_BASE = 10;
var REROLL_STEP = 2;
var WAND_STEP = 20;
function rollRarity(rng) {
  const r = rng();
  let acc = 0;
  for (const [rar, w] of Object.entries(RARITY_WEIGHT)) {
    acc += w;
    if (r < acc)
      return rar;
  }
  return "common";
}
function priceIn(band, rng) {
  return Math.round(band[0] + rng() * (band[1] - band[0]));
}

class Shop {
  rng;
  cards = [];
  rerollCost = REROLL_BASE;
  rerolls = 0;
  wandsBought = 0;
  constructor(rng = Math.random) {
    this.rng = rng;
    this.generate();
  }
  generate() {
    const pool = [...SPELLS];
    const cards = [];
    while (cards.length < SPELL_COUNT && pool.length > 0) {
      const rarity = rollRarity(this.rng);
      const candidates = pool.filter((s) => s.rarity === rarity);
      const fallback = candidates.length > 0 ? candidates : pool;
      const idx = Math.floor(this.rng() * fallback.length);
      const spell = fallback[idx];
      pool.splice(pool.indexOf(spell), 1);
      cards.push({ kind: "spell", spellId: spell.id, price: priceIn(RARITY_PRICE[spell.rarity], this.rng), sold: false });
    }
    cards.push({ kind: "wand" });
    cards.push({ kind: "expand" });
    this.cards = cards;
  }
  reroll(run) {
    if (run.gold < this.rerollCost)
      return false;
    run.gold -= this.rerollCost;
    this.rerolls++;
    this.rerollCost = REROLL_BASE + REROLL_STEP * this.rerolls;
    this.generate();
    return true;
  }
  cardPrice(card, run) {
    if (card.kind === "wand")
      return wandPrice(run.wandSlots) + WAND_STEP * this.wandsBought;
    if (card.kind === "expand")
      return wandPrice(run.wandSlots + 2);
    return card.price;
  }
  buy(i, run) {
    const card = this.cards[i];
    if (!card)
      return false;
    if (card.kind === "spell" && card.sold)
      return false;
    const price = this.cardPrice(card, run);
    if (run.gold < price)
      return false;
    run.gold -= price;
    if (card.kind === "spell") {
      run.inventory.push(card.spellId);
      card.sold = true;
    } else if (card.kind === "wand") {
      run.addWand();
      this.wandsBought++;
    } else {
      run.wandSlots += 2;
      for (const w of run.wands)
        w.slots.push(null, null);
    }
    return true;
  }
  sellWand(wandIdx, run) {
    if (run.wands.length <= 1 || wandIdx < 0 || wandIdx >= run.wands.length)
      return false;
    const size = run.wands[wandIdx].slots.length;
    run.gold += Math.round(wandPrice(size) / 2);
    for (const slot of run.wands[wandIdx].slots)
      if (slot)
        run.inventory.push(slot);
    run.wands.splice(wandIdx, 1);
    if (run.activeWand >= run.wands.length)
      run.activeWand = 0;
    return true;
  }
  resetAfterBattle() {
    this.rerolls = 0;
    this.rerollCost = REROLL_BASE;
  }
}

// src/icons.ts
var STROKE = `fill="none" stroke="#cfc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
var ICONS = {
  compression_sphere: `
    <circle cx="12" cy="12" r="4.5" ${STROKE}/>
    <path d="M12 2.6v3" ${STROKE}/><path d="M9.9 3.5 12 5.6l2.1-2.1" ${STROKE}/>
    <path d="M12 21.4v-3" ${STROKE}/><path d="M9.9 20.5 12 18.4l2.1 2.1" ${STROKE}/>
    <path d="M2.6 12h3" ${STROKE}/><path d="M3.5 9.9 5.6 12l-2.1 2.1" ${STROKE}/>
    <path d="M21.4 12h-3" ${STROKE}/><path d="M20.5 9.9 18.4 12l2.1 2.1" ${STROKE}/>`,
  phase_discharge: `
    <path d="M3 5.5h4l2-2.4 2 4.8 2-2.4h8" ${STROKE}/>
    <path d="M3 12h4l2-2.4 2 4.8 2-2.4h8" ${STROKE}/>
    <path d="M3 18.5h4l2-2.4 2 4.8 2-2.4h8" ${STROKE}/>`,
  vortex: `
    <path d="M4 5c3.5 1.4 12.5 1.4 16 0" ${STROKE}/>
    <path d="M6.5 9.7c3 1.2 8 1.2 11 0" ${STROKE}/>
    <path d="M9 14.2c2 .9 4 .9 6 0" ${STROKE}/>
    <path d="M11 18.5h2" ${STROKE}/>`,
  shockwave: `
    <circle cx="12" cy="12" r="1.6" fill="#cfc" stroke="none"/>
    <circle cx="12" cy="12" r="5.2" ${STROKE}/>
    <circle cx="12" cy="12" r="8.8" stroke-dasharray="3.4 3.4" ${STROKE}/>`,
  spark: `
    <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" ${STROKE}/>`,
  ice_needle: `
    <path d="M12 3v18" ${STROKE}/>
    <path d="M4.2 7.5l15.6 9" ${STROKE}/>
    <path d="M4.2 16.5l15.6-9" ${STROKE}/>
    <path d="M9.8 5.4 12 7.5l2.2-2.1" ${STROKE}/>
    <path d="M9.8 18.6 12 16.5l2.2 2.1" ${STROKE}/>`,
  heat_pump: `
    <path d="M21.5 4.5V10h-5.5" ${STROKE}/>
    <path d="M2.5 19.5V14h5.5" ${STROKE}/>
    <path d="M4.2 9.2a8.2 8.2 0 0 1 13.6-3L21.5 10" ${STROKE}/>
    <path d="M19.8 14.8a8.2 8.2 0 0 1-13.6 3L2.5 14" ${STROKE}/>
    <path d="M12 8.5c1.3 2-1.7 2.8-1.7 4.8a2.7 2.7 0 0 0 5.4 0c0-1.1-.5-2-1.2-2.6.1.9-.5 1.5-1.1 1.5.5-1.2-.3-2.5-1.4-3.7z" ${STROKE}/>`,
  steam_blast: `
    <path d="M12 2.2v2.4" ${STROKE}/>
    <path d="M7.6 3.6l1.2 2" ${STROKE}/>
    <path d="M16.4 3.6l-1.2 2" ${STROKE}/>
    <path d="M17.5 20.5H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 0 1 0 9z" ${STROKE}/>`,
  bullet: `
    <path d="M13.5 8.5H5a1.5 1.5 0 0 0-1.5 1.5v4A1.5 1.5 0 0 0 5 15.5h8.5" ${STROKE}/>
    <path d="M13.5 8.5v7" ${STROKE}/>
    <path d="M13.5 8.5c3 0 5.7 1.4 7.3 3.5-1.6 2.1-4.3 3.5-7.3 3.5" ${STROKE}/>`,
  laser: `
    <rect x="2.5" y="10" width="2.5" height="4" ${STROKE}/>
    <path d="M5 10.8 17.5 11.7" ${STROKE}/>
    <path d="M5 13.2 17.5 12.3" ${STROKE}/>
    <circle cx="18" cy="12" r="1" fill="#cfc" stroke="none"/>
    <path d="M20.2 12h2.3" ${STROKE}/>
    <path d="M19.8 9.7l1.7-1.4" ${STROKE}/>
    <path d="M19.8 14.3l1.7 1.4" ${STROKE}/>`,
  grenade: `
    <rect x="6.5" y="8.5" width="11" height="12" rx="4" ${STROKE}/>
    <path d="M12 8.5v12" ${STROKE}/>
    <path d="M6.5 14.5h11" ${STROKE}/>
    <rect x="10.25" y="5.5" width="3.5" height="3" ${STROKE}/>
    <path d="M13.9 6.2 16.6 4.9" ${STROKE}/>
    <circle cx="18.2" cy="4.4" r="1.7" ${STROKE}/>`,
  wand: `
    <path d="M3.5 20.5 13.5 10.5" ${STROKE}/>
    <path d="M17 3.2v7.6" ${STROKE}/>
    <path d="M13.2 7h7.6" ${STROKE}/>
    <path d="M20.9 10.4v2.2" ${STROKE}/>
    <path d="M19.8 11.5h2.2" ${STROKE}/>
    <path d="M13.6 1.3v1.8" ${STROKE}/>
    <path d="M12.7 2.2h1.8" ${STROKE}/>`
};
function spellIconSvg(id) {
  const inner = ICONS[id] ?? "";
  return `<svg xmlns="http://www.w3.org/2000/svg" class="spellicon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">${inner}</svg>`;
}
var imgCache = new Map;
function spellIconImage(id) {
  let img = imgCache.get(id);
  if (!img) {
    img = new Image;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(spellIconSvg(id))}`;
    imgCache.set(id, img);
  }
  return img;
}

// src/i18n.ts
var STRINGS = {
  "menu.title": { ru: "MAGNUM OPUS", en: "MAGNUM OPUS" },
  "menu.subtitle": { ru: "полевой автобаттлер — M1", en: "field autobattler — M1" },
  "menu.start": { ru: "Начать ран", en: "Start run" },
  "menu.language": { ru: "Язык", en: "Language" },
  "menu.scores": { ru: "Лучшие раны", en: "Best runs" },
  "menu.scoresEmpty": { ru: "Пока пусто", en: "Nothing yet" },
  "hub.round": { ru: "Раунд", en: "Round" },
  "hub.attempts": { ru: "Попытки", en: "Attempts" },
  "hub.gold": { ru: "Золото", en: "Gold" },
  "hub.hp": { ru: "Здоровье", en: "Health" },
  "hub.tabShop": { ru: "Магазин", en: "Shop" },
  "hub.tabAssembly": { ru: "Сборка", en: "Assembly" },
  "hub.tabInventory": { ru: "Инвентарь", en: "Inventory" },
  "hub.startRound": { ru: "В бой ▶", en: "Fight ▶" },
  "shop.reroll": { ru: "Переброс", en: "Reroll" },
  "shop.buy": { ru: "Купить", en: "Buy" },
  "shop.sold": { ru: "Продано", en: "Sold" },
  "shop.wandSlots": { ru: "слотов", en: "slots" },
  "shop.expand": { ru: "Расширить жезлы", en: "Expand wands" },
  "shop.expandDesc": { ru: "+2 слота всем жезлам; новые жезлы тоже получат их", en: "+2 slots on all wands; new wands get them too" },
  "shop.spellCount": { ru: "Заклинания", en: "Spells" },
  "assembly.wands": { ru: "Жезлы", en: "Wands" },
  "assembly.active": { ru: "активный", en: "active" },
  "assembly.makeActive": { ru: "сделать активным", en: "make active" },
  "assembly.sell": { ru: "Продать жезл", en: "Sell wand" },
  "assembly.inventory": { ru: "Инвентарь (перетащите в слот)", en: "Inventory (drag into a slot)" },
  "assembly.export": { ru: "Код билда", en: "Build code" },
  "assembly.exportBtn": { ru: "Экспорт", en: "Export" },
  "assembly.importBtn": { ru: "Импорт", en: "Import" },
  "assembly.importBad": { ru: "Неверный код билда", en: "Invalid build code" },
  "inventory.empty": { ru: "Пусто — купите заклинания в магазине", en: "Empty — buy spells in the shop" },
  "inventory.equipped": { ru: "экипировано", en: "equipped" },
  "tooltip.mana": { ru: "мана", en: "mana" },
  "tooltip.damage": { ru: "урон", en: "damage" },
  "splash.round": { ru: "Раунд", en: "Round" },
  "splash.waveType": { ru: "Волна мобов", en: "Mob wave" },
  "splash.goal": { ru: "Цель: уничтожить всех врагов", en: "Goal: destroy all enemies" },
  "splash.go": { ru: "В бой! (Enter)", en: "Fight! (Enter)" },
  "result.victory": { ru: "Волна зачищена!", en: "Wave cleared!" },
  "result.stars": { ru: "Звёзды", en: "Stars" },
  "result.gold": { ru: "Золото за волну", en: "Wave gold" },
  "result.noHpBonus": { ru: "+10 — не потерял ни единого HP", en: "+10 — took no damage" },
  "result.continue": { ru: "Продолжить (Enter)", en: "Continue (Enter)" },
  "death.title": { ru: "Вы пали", en: "You fell" },
  "death.attemptsLeft": { ru: "Осталось попыток", en: "Attempts left" },
  "death.retry": { ru: "Ещё раз (Enter)", en: "Try again (Enter)" },
  "runend.title": { ru: "Ран завершён", en: "Run over" },
  "runend.stars": { ru: "Сумма звёзд", en: "Total stars" },
  "runend.best": { ru: "Лучший раунд", en: "Best round" },
  "runend.cleared": { ru: "Раундов пройдено", en: "Rounds cleared" },
  "runend.again": { ru: "Новый ран (Enter)", en: "New run (Enter)" },
  "hint.move": { ru: "WASD — движение, W — полёт (оранжевая шкала — выносливость)", en: "WASD — move, W — fly (orange bar — stamina)" },
  "hint.cast": { ru: "ЛКМ — каст: заклинания жезла срабатывают по очереди (мышь — прицел)", en: "LMB — cast: wand spells fire in sequence (mouse aims)" },
  "hint.tab": { ru: "Tab — сменить жезл, V — векторы ветра", en: "Tab — switch wand, V — wind vectors" },
  "hint.goal": { ru: "Уничтожьте всех врагов. Огонь жжёт и вас!", en: "Destroy all enemies. Fire burns you too!" }
};
var lang = "ru";
if (typeof localStorage !== "undefined") {
  const saved = localStorage.getItem("nab_lang");
  if (saved === "ru" || saved === "en")
    lang = saved;
}
function getLang() {
  return lang;
}
function setLang(l) {
  lang = l;
  if (typeof localStorage !== "undefined")
    localStorage.setItem("nab_lang", l);
}
function t(key) {
  return STRINGS[key][lang];
}
function pick(pair) {
  return pair[lang];
}

// src/renderer.ts
var GAME_W = 960;
var GAME_H = 540;
class Renderer {
  ctx;
  fieldCvs;
  fieldCtx;
  fieldImg;
  viewScale = 1;
  constructor(canvas) {
    canvas.width = GAME_W;
    canvas.height = GAME_H;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.fieldCvs = document.createElement("canvas");
    this.fieldCvs.width = FIELD_COLS;
    this.fieldCvs.height = FIELD_ROWS;
    this.fieldCtx = this.fieldCvs.getContext("2d");
    this.fieldImg = this.fieldCtx.createImageData(FIELD_COLS, FIELD_ROWS);
  }
  fitWindow() {
    this.viewScale = Math.min(window.innerWidth / GAME_W, window.innerHeight / GAME_H);
  }
  get scale() {
    return this.viewScale;
  }
  toGame(clientX, clientY, canvas) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) / this.viewScale,
      y: (clientY - r.top) / this.viewScale
    };
  }
  render(w) {
    this.ctx.fillStyle = "#0e0d14";
    this.ctx.fillRect(0, 0, GAME_W, GAME_H);
    this.drawField(w);
    this.drawEntities(w);
    this.drawHud(w);
  }
  drawField(w) {
    const d = this.fieldImg.data;
    const wave = w.field.waveField;
    const base = w.field.baseField;
    const temp = w.field.tempField;
    const mat = w.field.materialField;
    for (let i = 0;i < FIELD_COLS * FIELD_ROWS; i++) {
      let r = 0, g = 0, b = 0, a = 0;
      if (base[i] >= FIELD_SOLID_THRESHOLD) {
        r = 68;
        g = 68;
        b = 68;
        a = 255;
      } else {
        const wv = wave[i];
        if (wv >= FIELD_SOLID_THRESHOLD) {
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
        r = 30;
        g = 90;
        b = 200;
        a = 235;
      } else if (m === MAT_ICE) {
        r = 160;
        g = 210;
        b = 235;
        a = 255;
      } else if (m === MAT_STEAM) {
        r = 190;
        g = 190;
        b = 200;
        a = Math.max(a, 140);
      }
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
      d[o] = r;
      d[o + 1] = g;
      d[o + 2] = b;
      d[o + 3] = a;
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
      for (let gy = 2;gy < FIELD_ROWS - 2; gy += 4) {
        for (let gx = 2;gx < FIELD_COLS - 2; gx += 4) {
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
  drawEntities(w) {
    const ctx = this.ctx;
    for (const fx of w.effects) {
      if (fx.kind === "vortex") {
        ctx.strokeStyle = "rgba(220,220,255,0.7)";
        ctx.lineWidth = 2;
        const a = w.ticks * 0.35;
        for (let arm = 0;arm < 3; arm++) {
          ctx.beginPath();
          for (let s = 0;s < 10; s++) {
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
    for (const pr of w.projectiles) {
      ctx.fillStyle = pr.kind === "bullet" ? "#f0e0b0" : pr.kind === "bolt" ? "#c0c8d8" : pr.kind === "heatbolt" ? "#ff9040" : pr.kind === "iceshard" ? "#a0d8ff" : "#506050";
      const size = pr.kind === "grenade" ? 8 : 5;
      ctx.fillRect(pr.pos.x - size / 2, pr.pos.y - size / 2, size, size);
    }
    for (const e of w.enemies) {
      const b = e.body.boundingBox;
      ctx.fillStyle = ARCHETYPES[e.archetype].color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      const hpFrac = e.body.health / e.body.maxHealth;
      ctx.fillStyle = "#400";
      ctx.fillRect(b.x, b.y - 8, b.w, 4);
      ctx.fillStyle = "#e05050";
      ctx.fillRect(b.x, b.y - 8, b.w * hpFrac, 4);
    }
    const pb = w.player.boundingBox;
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(pb.x, pb.y, pb.w, pb.h);
    ctx.fillStyle = "#202040";
    ctx.fillRect(pb.x + (w.mouse.x < pb.x + pb.w / 2 ? 8 : pb.w - 20), pb.y + 16, 12, 12);
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(w.mouse.x, w.mouse.y, 7, 0, Math.PI * 2);
    ctx.moveTo(w.mouse.x - 11, w.mouse.y);
    ctx.lineTo(w.mouse.x - 3, w.mouse.y);
    ctx.moveTo(w.mouse.x + 3, w.mouse.y);
    ctx.lineTo(w.mouse.x + 11, w.mouse.y);
    ctx.stroke();
  }
  drawHud(w) {
    const ctx = this.ctx;
    const run = w.run;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(10, 10, 210, 64);
    ctx.fillStyle = "#333";
    ctx.fillRect(16, 16, 198, 12);
    ctx.fillStyle = "#50c050";
    ctx.fillRect(16, 16, 198 * clamp(w.player.health / w.player.maxHealth, 0, 1), 12);
    ctx.fillStyle = "#333";
    ctx.fillRect(16, 34, 198, 12);
    ctx.fillStyle = "#40a0f0";
    ctx.fillRect(16, 34, 198 * clamp(run.mana / 100, 0, 1), 12);
    ctx.fillStyle = "#333";
    ctx.fillRect(16, 52, 198, 12);
    ctx.fillStyle = "orange";
    ctx.fillRect(16, 52, 198 * clamp(w.player.flyEnergy / 100, 0, 1), 12);
    const wand = run.wands[run.activeWand];
    for (let s = 0;s < wand.slots.length; s++) {
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
    ctx.font = "14px monospace";
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.fillText(`${t("hub.round")} ${run.round}`, GAME_W - 14, 24);
    ctx.fillText(`${t("hub.attempts")}: ${"●".repeat(run.attempts)}`, GAME_W - 14, 44);
    ctx.fillText(`${t("hub.gold")}: ${run.gold}`, GAME_W - 14, 64);
    ctx.textAlign = "left";
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

// src/buildcode.ts
function toBase64(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes)
    bin += String.fromCharCode(b);
  return btoa(bin);
}
function fromBase64(s) {
  const bin = atob(s);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function encodeBuild(run) {
  const data = {
    v: 1,
    active: run.activeWand,
    wands: run.wands.map((w) => ({ slots: [...w.slots] })),
    inv: [...run.inventory]
  };
  return "NA1:" + toBase64(JSON.stringify(data));
}
function decodeBuild(code) {
  try {
    if (!code.startsWith("NA1:"))
      return null;
    const data = JSON.parse(fromBase64(code.slice(4)));
    if (data.v !== 1 || !Array.isArray(data.wands) || data.wands.length === 0)
      return null;
    const wands = [];
    for (const w of data.wands) {
      if (!Array.isArray(w.slots) || w.slots.length < 1 || w.slots.length > 8)
        return null;
      const slots = w.slots.map((id) => id === null || spellById(id) ? id : null);
      wands.push({ slots, cursor: 0 });
    }
    const inv = data.inv.filter((id) => spellById(id));
    const active = data.active >= 0 && data.active < wands.length ? data.active : 0;
    return { active, wands, inv };
  } catch {
    return null;
  }
}

// src/ui.ts
var SCORES_KEY = "noita_autobattler_scores_v1";
function loadScores() {
  try {
    return JSON.parse(localStorage.getItem(SCORES_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function saveScore(entry) {
  const scores = loadScores();
  scores.push(entry);
  scores.sort((a, b) => b.stars - a.stars || b.cleared - a.cleared);
  localStorage.setItem(SCORES_KEY, JSON.stringify(scores.slice(0, 10)));
}

class Ui {
  h;
  root;
  canvas;
  constructor(h) {
    this.h = h;
    this.root = document.getElementById("ui");
    this.canvas = document.getElementById("game");
  }
  show(screen, data) {
    const overlay = screen !== "arena";
    this.canvas.style.display = screen === "menu" || screen === "runend" ? "none" : "block";
    this.root.style.display = overlay ? "flex" : "none";
    this.root.innerHTML = "";
    switch (screen) {
      case "menu":
        this.menu();
        break;
      case "hub":
        this.hub(data.run, data.shop);
        break;
      case "splash":
        this.splash(data.splash.round);
        break;
      case "result":
        this.result(data.result);
        break;
      case "death":
        this.death(data.run);
        break;
      case "runend":
        this.runend(data.runend);
        break;
      case "arena":
        break;
    }
  }
  el(html) {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.firstElementChild;
  }
  langButtons() {
    const lang = getLang();
    return `
      <span class="lang">
        <button data-lang="ru" class="${lang === "ru" ? "on" : ""}">RU</button>
        <button data-lang="en" class="${lang === "en" ? "on" : ""}">EN</button>
      </span>`;
  }
  wireLangs() {
    this.root.querySelectorAll("button[data-lang]").forEach((b) => b.addEventListener("click", () => this.h.setLang(b.dataset.lang)));
  }
  menu() {
    const scores = loadScores().slice(0, 5);
    this.root.appendChild(this.el(`
      <div class="screen menu">
        <h1>${t("menu.title")}</h1>
        <div class="subtitle">${t("menu.subtitle")}</div>
        ${this.langButtons()}
        <button id="start" class="big">${t("menu.start")}</button>
        <div class="scores">
          <div class="scores-title">${t("menu.scores")}</div>
          ${scores.length === 0 ? `<div class="dim">${t("menu.scoresEmpty")}</div>` : scores.map((s) => `<div>★ ${s.stars} · ${t("runend.cleared")}: ${s.cleared}</div>`).join("")}
        </div>
      </div>`));
    this.wireLangs();
    this.root.querySelector("#start").addEventListener("click", () => this.h.startRun());
  }
  hub(run, shop) {
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
    this.root.querySelector("#fight").addEventListener("click", () => this.h.startRound());
    this.root.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => {
      this.root.querySelectorAll(".tab").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      this.root.querySelectorAll(".tabbody").forEach((x) => x.style.display = "none");
      this.root.querySelector(`#tab-${b.dataset.tab}`).style.display = "";
    }));
    this.renderShopTab(run, shop);
    this.renderAssemblyTab(run);
    this.renderInventoryTab(run);
  }
  tooltipHost() {
    return document.getElementById("tooltip");
  }
  attachTooltip(el, html) {
    const tip = this.tooltipHost();
    el.addEventListener("mouseenter", () => {
      tip.innerHTML = html();
      tip.style.display = "block";
    });
    el.addEventListener("mousemove", (e) => {
      tip.style.left = `${Math.min(window.innerWidth - 260, e.clientX + 14)}px`;
      tip.style.top = `${e.clientY + 14}px`;
    });
    el.addEventListener("mouseleave", () => {
      tip.style.display = "none";
    });
  }
  spellTooltipHtml(spellId) {
    const s = spellById(spellId);
    return `<b>${pick(s.name)}</b> <span class="dim">[${s.rarity}]</span><br>${pick(s.desc)}<br>` + `<span class="dim">${t("tooltip.mana")}: ${s.mana}</span>`;
  }
  cardHtml(run, shop, card, i) {
    if (card.kind === "spell") {
      if (card.sold)
        return `<div class="card sold"><div class="dim">${t("shop.sold")}</div></div>`;
      const s = spellById(card.spellId);
      return `
        <div class="card" data-buy="${i}">
          ${spellIconSvg(card.spellId)}
          <div class="spellname">${pick(s.name)}</div>
          <div class="dim">[${s.rarity}]</div>
          <div class="price">◉ ${card.price}</div>
          <button class="buy">${t("shop.buy")}</button>
        </div>`;
    }
    if (card.kind === "wand")
      return `
        <div class="card wandcard" data-buy="${i}">
          ${spellIconSvg("wand")}
          <div><b>${t("hub.tabAssembly")}</b></div>
          <div>${run.wandSlots} ${t("shop.wandSlots")}</div>
          <div class="price">◉ ${shop.cardPrice(card, run)}</div>
          <button class="buy">${t("shop.buy")}</button>
        </div>`;
    return `
      <div class="card wandcard" data-buy="${i}">
        ${spellIconSvg("wand")}
        <div><b>${t("shop.expand")}</b></div>
        <div>+2 ${t("shop.wandSlots")}</div>
        <div class="price">◉ ${shop.cardPrice(card, run)}</div>
        <button class="buy">${t("shop.buy")}</button>
      </div>`;
  }
  renderShopTab(run, shop) {
    const body = this.root.querySelector("#tab-shop");
    const byIndex = shop.cards.map((c, i) => ({ c, i }));
    const spellCards = byIndex.filter(({ c }) => c.kind === "spell");
    const fixtureCards = byIndex.filter(({ c }) => c.kind !== "spell");
    body.innerHTML = `
      <div class="shoprow">
        ${spellCards.map(({ c, i }) => this.cardHtml(run, shop, c, i)).join("")}
        <button id="reroll" class="reroll">${t("shop.reroll")} ◉ ${shop.rerollCost}</button>
      </div>
      <div class="shoprow">
        ${fixtureCards.map(({ c, i }) => this.cardHtml(run, shop, c, i)).join("")}
      </div>`;
    body.querySelectorAll("[data-buy]").forEach((el) => {
      const i = Number(el.dataset.buy);
      const btn = el.querySelector(".buy");
      btn.addEventListener("click", () => this.h.buy(i));
      this.attachTooltip(el, () => {
        const card = shop.cards[i];
        if (!card)
          return "";
        if (card.kind === "spell")
          return this.spellTooltipHtml(card.spellId);
        if (card.kind === "wand")
          return `${run.wandSlots} ${t("shop.wandSlots")}`;
        return t("shop.expandDesc");
      });
    });
    body.querySelector("#reroll").addEventListener("click", () => this.h.reroll());
  }
  wandHtml(run, w, wandIdx) {
    const slots = w.slots.map((spellId, slot) => `
      <div class="slot" data-wand="${wandIdx}" data-slot="${slot}">
        ${spellId ? spellIconSvg(spellId) : ""}
      </div>`).join("");
    return `
      <div class="wand ${wandIdx === run.activeWand ? "active" : ""}">
        <div class="wandhead">
          <span>${t("hub.tabAssembly")} #${wandIdx + 1} (${w.slots.length})</span>
          ${wandIdx === run.activeWand ? `<span class="dim">${t("assembly.active")}</span>` : `<button data-activate="${wandIdx}" class="mini">${t("assembly.makeActive")}</button>`}
          ${run.wands.length > 1 ? `<button data-sellwand="${wandIdx}" class="mini">✕ ${t("assembly.sell")}</button>` : ""}
        </div>
        <div class="slots">${slots}</div>
      </div>`;
  }
  renderAssemblyTab(run) {
    const body = this.root.querySelector("#tab-assembly");
    body.innerHTML = `
      <div class="assembly">
        <div class="wands">${run.wands.map((w, i) => this.wandHtml(run, w, i)).join("")}</div>
        <div class="invside">
          <div class="dim">${t("assembly.inventory")}</div>
          <div class="invitems">
            ${run.inventory.map((id, i) => `
              <div class="invitem" data-inv="${i}">
                ${spellIconSvg(id)}
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
    body.querySelectorAll("[data-activate]").forEach((b) => b.addEventListener("click", () => this.h.activateWand(Number(b.dataset.activate))));
    body.querySelectorAll("[data-sellwand]").forEach((b) => b.addEventListener("click", () => this.h.sellWand(Number(b.dataset.sellwand))));
    this.wireDragAndDrop(body, run);
    body.querySelector("#naexport").addEventListener("click", () => {
      body.querySelector("#nacode").value = encodeBuild(run);
    });
    body.querySelector("#naimport").addEventListener("click", () => {
      const code = body.querySelector("#nacode").value.trim();
      const decoded = decodeBuild(code);
      const status = body.querySelector("#nastatus");
      if (!decoded) {
        status.textContent = t("assembly.importBad");
        return;
      }
      status.textContent = "OK";
      run.wands = decoded.wands.map((w) => ({ slots: [...w.slots], cursor: 0 }));
      run.activeWand = decoded.active;
      run.inventory = decoded.inv;
      this.refresh(run);
    });
  }
  wireDragAndDrop(root, run) {
    let drag = null;
    let ghost = null;
    const removeDragged = () => {
      if (!drag)
        return;
      if (drag.from.kind === "inv")
        run.inventory.splice(drag.from.index, 1);
      else
        run.wands[drag.from.wand].slots[drag.from.slot] = null;
    };
    root.querySelectorAll(".invitem").forEach((el) => {
      el.addEventListener("pointerdown", (ev) => {
        const e = ev;
        const i = Number(el.dataset.inv);
        drag = { spellId: run.inventory[i], from: { kind: "inv", index: i } };
        startGhost(e);
      });
      this.attachTooltip(el, () => this.spellTooltipHtml(run.inventory[Number(el.dataset.inv)] ?? ""));
    });
    root.querySelectorAll(".slot").forEach((el) => {
      el.addEventListener("pointerdown", (ev) => {
        const e = ev;
        const wi = Number(el.dataset.wand);
        const si = Number(el.dataset.slot);
        const id = run.wands[wi].slots[si];
        if (!id)
          return;
        drag = { spellId: id, from: { kind: "slot", wand: wi, slot: si } };
        startGhost(e);
      });
    });
    const startGhost = (e) => {
      ghost = document.createElement("div");
      ghost.className = "ghost";
      ghost.innerHTML = spellIconSvg(drag.spellId);
      document.body.appendChild(ghost);
      moveGhost(e);
      e.preventDefault();
    };
    const moveGhost = (ev) => {
      const pe = ev;
      if (ghost) {
        ghost.style.left = `${pe.clientX - 12}px`;
        ghost.style.top = `${pe.clientY - 12}px`;
      }
    };
    document.addEventListener("pointermove", moveGhost);
    document.addEventListener("pointerup", (e) => {
      if (!drag)
        return;
      const target = document.elementFromPoint(e.clientX, e.clientY)?.closest(".slot");
      if (target) {
        const wi = Number(target.dataset.wand);
        const si = Number(target.dataset.slot);
        const old = run.wands[wi].slots[si];
        removeDragged();
        if (old)
          run.inventory.push(old);
        run.wands[wi].slots[si] = drag.spellId;
      } else if (e.target?.closest(".invitems")) {
        const old = drag.spellId;
        removeDragged();
        run.inventory.push(old);
      }
      ghost?.remove();
      ghost = null;
      drag = null;
      this.refresh(run);
    });
  }
  renderInventoryTab(run) {
    const body = this.root.querySelector("#tab-inventory");
    const equipped = new Set(run.wands.flatMap((w) => w.slots.filter((s) => s)));
    body.innerHTML = `
      <div class="invlist">
        ${run.inventory.length === 0 ? `<div class="dim">${t("inventory.empty")}</div>` : ""}
        ${run.inventory.map((id, i) => {
      const s = spellById(id);
      return `
            <div class="invrow" data-row="${i}">
              ${spellIconSvg(s.id)}
              <span><b>${pick(s.name)}</b> ${equipped.has(id) ? `<span class="dim">(${t("inventory.equipped")})</span>` : ""}</span>
            </div>`;
    }).join("")}
      </div>`;
    body.querySelectorAll("[data-row]").forEach((el) => {
      const id = run.inventory[Number(el.dataset.row)];
      this.attachTooltip(el, () => this.spellTooltipHtml(id));
    });
  }
  refresh(run, shop) {
    if (!this.root.querySelector(".hub"))
      return;
    const gold = this.root.querySelector("#gold");
    if (gold)
      gold.textContent = String(run.gold);
    this.renderAssemblyTab(run);
    this.renderInventoryTab(run);
    if (shop)
      this.renderShopTab(run, shop);
  }
  splash(round) {
    this.root.appendChild(this.el(`
      <div class="screen splash" style="background:rgba(10,10,16,0.85)">
        <h1>${t("splash.round")} ${round}</h1>
        <div class="subtitle">${t("splash.waveType")}</div>
        <div>${t("splash.goal")}</div>
        <button class="big">${t("splash.go")}</button>
      </div>`));
  }
  result(r) {
    this.root.appendChild(this.el(`
      <div class="screen">
        <h1>${t("result.victory")}</h1>
        <div class="stars">${"★".repeat(r.stars)}${"☆".repeat(3 - r.stars)}</div>
        <div>${t("result.gold")}: ◉ ${r.gold}</div>
        ${r.bonus ? `<div class="dim">${t("result.noHpBonus")}</div>` : ""}
        <button id="cont" class="big">${t("result.continue")}</button>
      </div>`));
    this.root.querySelector("#cont").addEventListener("click", () => this.h.continueToHub());
  }
  death(run) {
    this.root.appendChild(this.el(`
      <div class="screen">
        <h1>${t("death.title")}</h1>
        <div>${t("death.attemptsLeft")}: ${run.attempts}</div>
        <button id="cont" class="big">${t("death.retry")}</button>
      </div>`));
    this.root.querySelector("#cont").addEventListener("click", () => this.h.continueToHub());
  }
  runend(r) {
    const scores = loadScores().slice(0, 5);
    this.root.appendChild(this.el(`
      <div class="screen">
        <h1>${t("runend.title")}</h1>
        <div>${t("runend.stars")}: ${"★".repeat(r.stars)}</div>
        <div>${t("runend.cleared")}: ${r.cleared}/5</div>
        <div class="scores">
          <div class="scores-title">${t("menu.scores")}</div>
          ${scores.map((s) => `<div>★ ${s.stars} · ${s.cleared}/5</div>`).join("")}
        </div>
        <button id="again" class="big">${t("runend.again")}</button>
      </div>`));
    this.root.querySelector("#again").addEventListener("click", () => this.h.restart());
  }
}

// src/main.ts
var M1_ROUNDS = 5;
function main() {
  const canvas = document.getElementById("game");
  const renderer = new Renderer(canvas);
  let run = new RunState;
  let shop = new Shop;
  let world = null;
  let screen = "menu";
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
      ui.show("hub", { run, shop });
    },
    buy(i) {
      shop.buy(i, run);
      ui.show("hub", { run, shop });
    },
    sellWand(i) {
      shop.sellWand(i, run);
      ui.show("hub", { run, shop });
    },
    activateWand(i) {
      run.activeWand = i;
      ui.show("hub", { run, shop });
    },
    setLang(l) {
      setLang(l);
      ui.show(screen === "runend" ? "menu" : screen, { run, shop, result: lastResult, runend: lastRunend });
    },
    restart() {
      run = new RunState;
      shop = new Shop;
      showMenu();
    }
  });
  let lastResult;
  let lastRunend;
  function showMenu() {
    screen = "menu";
    document.documentElement.lang = getLang();
    ui.show("menu");
  }
  function showHub() {
    screen = "hub";
    world = null;
    ui.show("hub", { run, shop });
  }
  function startRound() {
    screen = "splash";
    world = new World(new Field, run, run.round);
    ui.show("splash", { splash: { round: run.round } });
    const go = () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", go);
      screen = "arena";
      ui.show("arena");
    };
    const onKey = (e) => {
      if (e.code === "Enter" || e.code === "Space")
        go();
    };
    window.addEventListener("keydown", onKey);
    setTimeout(() => document.addEventListener("click", go), 0);
  }
  function finishRound() {
    const outcome = world.outcome;
    if (outcome.won) {
      const reward = 50 + (outcome.hpLost ? 0 : 10);
      run.gold += reward;
      run.stars.push(outcome.stars);
      lastResult = { stars: outcome.stars, gold: reward + outcome.goldEarned, bonus: !outcome.hpLost };
      run.round++;
      shop.resetAfterBattle();
      if (run.round > M1_ROUNDS) {
        lastRunend = { stars: run.totalStars(), cleared: run.roundsCleared() };
        saveScore({ stars: run.totalStars(), cleared: run.roundsCleared(), date: new Date().toISOString().slice(0, 10) });
        screen = "runend";
        ui.show("runend", { runend: lastRunend });
        return;
      }
      screen = "result";
      ui.show("result", { result: lastResult });
    } else {
      run.attempts--;
      if (run.attempts <= 0) {
        lastRunend = { stars: run.totalStars(), cleared: run.roundsCleared() };
        saveScore({ stars: run.totalStars(), cleared: run.roundsCleared(), date: new Date().toISOString().slice(0, 10) });
        screen = "runend";
        ui.show("runend", { runend: lastRunend });
        return;
      }
      screen = "death";
      ui.show("death", { run });
    }
  }
  document.addEventListener("keydown", (e) => {
    if (screen !== "arena" || !world)
      return;
    switch (e.code) {
      case "KeyA":
        world.player.goLeft();
        break;
      case "KeyD":
        world.player.goRight();
        break;
      case "KeyW":
        world.player.jumpHeld = true;
        break;
      case "Tab": {
        run.activeWand = (run.activeWand + 1) % run.wands.length;
        e.preventDefault();
        break;
      }
      case "KeyV":
        world.showVectors = !world.showVectors;
        break;
    }
    if (["KeyA", "KeyD", "KeyW", "Tab", "Space"].includes(e.code))
      e.preventDefault();
  });
  document.addEventListener("keyup", (e) => {
    if (!world)
      return;
    if (e.code === "KeyA")
      world.player.stopLeft();
    if (e.code === "KeyD")
      world.player.stopRight();
    if (e.code === "KeyW")
      world.player.jumpHeld = false;
  });
  function castNext() {
    if (world)
      world.castNext(world.mouse);
  }
  canvas.addEventListener("mousemove", (e) => {
    if (world)
      world.mouse = renderer.toGame(e.clientX, e.clientY, canvas);
  });
  canvas.addEventListener("mousedown", () => {
    if (screen === "arena" && world)
      castNext();
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.style.cursor = "none";
  let lastTime = 0;
  const FIXED_DT = 20;
  let acc = 0;
  function gameLoop(timestamp) {
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
  window.__m1 = { run, shop, getWorld: () => world };
}
document.addEventListener("DOMContentLoaded", main);
