import {Rect, Vec2, rect, rectContains, rectIntersects} from "./types";

export class GameMap {
  private m_rects: Rect[];
  private m_markedPoints: Map<string, Vec2> = new Map();

  constructor() {
    this.m_rects = [
      rect({x: -40, y:   0}, 20, 480),  // left wall
      rect({x: 660, y:   0}, 20, 480),  // right wall
      rect({x: -40, y: 460}, 680, 20),  // bottom wall
      rect({x: -20, y: 274}, 188, 10),  // left platform
      rect({x: 473, y: 274}, 187, 10),  // right platform
      rect({x: 256, y: 113}, 128, 20),  // top platform
      rect({x: 310, y: 132}, 20, 150),  // central platform
    ];
  }

  get rects(): readonly Rect[] {
    return this.m_rects;
  }

  isFilled(p: Vec2): boolean {
    return this.m_rects.some(w => rectContains(w, p));
  }

  isFilledRect(r: Rect): boolean {
    return this.m_rects.some(w => rectIntersects(r, w));
  }

  setMarkedPoint(name: string, p: Vec2): void {
    this.m_markedPoints.set(name, p);
  }

  getMarkedPoint(name: string): Vec2 {
    const p = this.m_markedPoints.get(name);
    if (!p)
      throw new Error(`marked point "${name}" not found`);
    return p;
  }
}
