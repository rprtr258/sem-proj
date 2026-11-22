export type ID = "player" | "bot";

export function sign(x: number): number {
  return x > 0 ? 1 : x < 0 ? -1 : 0;
}

export function radiansToDegrees(r: number): number {
  return r * 180 / Math.PI;
}

export function clamp(v: number, mn: number, mx: number): number {
  return Math.max(mn, Math.min(mx, v));
}

export type Vec2 = {
  x: number,
  y: number,
};

export function mul(v: Vec2, c: number): Vec2 {
  return {x: v.x * c, y: v.y * c};
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return {x: a.x + b.x, y: a.y + b.y};
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return {x: a.x - b.x, y: a.y - b.y};
}

export function vec2Normalized(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  return len === 0 ? { x: 0, y: 0 } : { x: v.x / len, y: v.y / len };
}

export function vec2Cross(a: Vec2, b: Vec2): number {
  return a.x * b.y - a.y * b.x;
}

export function vec2Dist(a: Vec2, b: Vec2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export type Rect = {
  x: number,
  y: number,
  w: number,
  h: number,
};

export function rect(p: Vec2, w: number, h: number): Rect {
  return {x: p.x, y: p.y, w, h};
}

export function rectContains(r: Rect, p: Vec2): boolean {
  return p.x >= r.x &&
         p.x <= r.x + r.w &&
         p.y >= r.y &&
         p.y <= r.y + r.h;
}

export function rectIntersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function rectTranslated(r: Rect, dx: number, dy: number): Rect {
  return { x: r.x + dx, y: r.y + dy, w: r.w, h: r.h };
}

export type Entity = number;
let entityId = 0;

export function newEntity(): Entity {
  entityId++;
  return entityId;
}
