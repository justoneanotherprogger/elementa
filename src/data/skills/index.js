import { FIREBALL } from "./fireball.js";
import { WATER_DROP } from "./waterDrop.js";

export const SKILLS = {
  fireball: FIREBALL,
  water_drop: WATER_DROP,
};

export function skillsForElement(element) {
  return Object.values(SKILLS).filter((skill) => skill.element === element);
}
