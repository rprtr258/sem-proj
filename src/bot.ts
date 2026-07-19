import {Vec2, add, rectContains, rectTranslated, sub, vec2Normalized} from "./types.ts";
import {Character} from "./character.ts";
import {GameMap} from "./map.ts";
import {World} from "./world.ts";
import {mana_cost} from "./weapon.ts";

enum BotState {
  Attack,
  Flee,
  Walk,
  Stand,
  WaitReload,
}

function isInPlayerBB(playerCoord: Vec2, p: Vec2): boolean {
  return rectContains({...playerCoord, w: 55, h: 95 }, p);
}

export class Bot {
  character: Character;
  private state = BotState.Attack;

  constructor(position: Vec2) {
    this.character = new Character(position, "bot");
  }

  goLeft(): void {
    this.character.stopRight();
    this.character.goLeft();
  }

  goRight(): void {
    this.character.stopLeft();
    this.character.goRight();
  }

  update(w: World): void {
    const map = w.map;
    switch (this.state) {
    case BotState.Attack: {
      if (this.canAttack(map)) {
        if (Math.random() * 10 > 7) {
          const pp = map.getMarkedPoint("player");
          this.character.attack(w, add(pp, {x: 27, y: 40}));
          const weapon = Math.random() * 20;
          if (weapon > 10)
            this.character.changeWeapon();
          if (weapon > 15)
            this.character.changeWeapon();
          this.state = BotState.WaitReload;
        } else {
          const pp = map.getMarkedPoint("player");
          if (pp.x <= this.character.m_coord.x)
            this.goLeft();
          else
            this.goRight();
          if (!map.isFilledRect(rectTranslated(this.character.boundingBox, 0, -60))) {
            this.character.jump(map);
          }
        }
      } else if (this.character.mana < mana_cost[this.character.weaponId]) {
        this.state = BotState.Flee;
      } else if (this.isHeroVisible(map)) {
        const pp = map.getMarkedPoint("player");
        if (pp.x <= this.character.m_coord.x)
          this.goLeft();
        else
          this.goRight();
      } else {
        this.state = BotState.Walk;
      }
      break;
    }

    case BotState.Flee: {
      if (this.character.mana >= Math.min(100, 3 * mana_cost[this.character.weaponId])) {
        this.state = BotState.Attack;
      } else {
        const pp = map.getMarkedPoint("player");
        if (pp.x >= this.character.m_coord.x) this.goLeft();
        else this.goRight();
        if (this.character.m_goingLeft && map.isFilledRect(rectTranslated(this.character.boundingBox, -5, 0))) {
          this.state = BotState.Stand;
        }
        if (this.character.m_goingRight && map.isFilledRect(rectTranslated(this.character.boundingBox, 5, 0))) {
          this.state = BotState.Stand;
        }
      }
      break;
    }

    case BotState.Walk: {
      if (!this.character.m_goingRight && Math.random() * 10 < 5)
        this.goLeft();
      else if (!this.character.m_goingLeft)
        this.goRight();
      if (!map.isFilledRect(rectTranslated(this.character.boundingBox, 0, -60))) {
        this.character.jump(map);
      }
      if (this.canAttack(map)) {
        this.state = BotState.Attack;
      } else {
        if (map.isFilledRect(rectTranslated(this.character.boundingBox, -5, 0))) {
          this.goRight();
        } else if (map.isFilledRect(rectTranslated(this.character.boundingBox, 5, 0))) {
          this.goLeft();
        } else if (Math.floor(Math.random() * 70) === 0) {
          if (this.character.m_goingLeft)
            this.goRight();
          else if (this.character.m_goingRight)
            this.goLeft();
        }
      }
      break;
    }

    case BotState.Stand: {
      this.character.stopLeft();
      this.character.stopRight();
      if (this.character.mana >= 2 * mana_cost[this.character.weaponId]) {
        this.state =
          this.canAttack(map) ? BotState.Attack :
          BotState.Walk;
      }
      break;
    }

    case BotState.WaitReload: {
      this.character.stopLeft();
      this.character.stopRight();
      if (this.character.m_reload === 0) {
        this.state =
          this.canAttack(map) ? BotState.Attack :
          this.character.mana < mana_cost[this.character.weaponId] ? BotState.Flee :
          BotState.Walk
      }
      break;
    }
    }
    this.character.update(map);
  }

  private isHeroVisible(map: GameMap): boolean {
    const pp = map.getMarkedPoint("player");
    const playerCenter = add(pp, {x: 27, y: 47});
    const pos = this.character.getHandPosition();
    const d = sub(playerCenter, pos);
    const len = Math.sqrt(d.x * d.x + d.y * d.y);
    if (len === 0)
      return false;
    const dir = vec2Normalized(d);
    let p = {...pos};
    while (!map.isFilled(p)) {
      p = add(p, dir);
      if (isInPlayerBB(pp, p))
        return true;
    }
    return false;
  }

  private canAttack(map: GameMap): boolean {
    return this.isHeroVisible(map) && this.character.mana >= mana_cost[this.character.weaponId] && this.character.m_reload === 0;
  }
}
