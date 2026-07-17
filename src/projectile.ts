import {Character} from "./character.ts";
import {Entity} from "./types.ts";
import {World} from "./world.ts";

export type Projectile = {
  eid: Entity,
  update(w: World): boolean,
  affect(w: World, character: Character): void,
};
