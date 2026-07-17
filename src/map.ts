import {Rect, Vec2, rectContains, rectIntersects} from "./types";

export class GameMap {
  private m_rects: Rect[];
  private m_markedPoints: Map<string, Vec2> = new Map();

  constructor(...rects: Rect[]) {
    this.m_rects = rects;
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
