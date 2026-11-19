import { FIREBALL } from "./fireball.js";
import { WATER_DROP } from "./waterDrop.js";
import { WIND_BLADE } from "./windBlade.js";
import { STONE_BOULDER } from "./stoneBoulder.js";

export const SKILLS = {
  fireball: FIREBALL,
  water_drop: WATER_DROP,
  wind_blade: WIND_BLADE,
  stone_boulder: STONE_BOULDER,
};

export function skillsForElement(element) {
  return Object.values(SKILLS).filter((skill) => skill.element === element);
}
