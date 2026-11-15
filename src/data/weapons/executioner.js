import { PLACEHOLDER_BASE } from "./base.js";

export const EXECUTIONER_WEAPONS = {
  serp: {
    id: "serp",
    classId: "executioner",
    element: "fire",
    title: "Серп",
    behavior: "melee",
    // `kind` is what systems/weapons.js renders today; #106 replaces it with behavior modules.
    base: { dmg: 8, cd: 1, radius: 90, angleDeg: 120, kind: "slash" },
  },
  spear: {
    id: "spear",
    classId: "executioner",
    element: "water",
    title: "Копьё",
    behavior: "melee",
    base: { dmg: 6, cd: 0.8, radius: 140, width: 20, kind: "thrust" },
  },
  chakram: {
    id: "chakram",
    classId: "executioner",
    element: "air",
    title: "Шакрам",
    behavior: "projectile",
    base: { ...PLACEHOLDER_BASE.projectile },
  },
  greataxe: {
    id: "greataxe",
    classId: "executioner",
    element: "earth",
    title: "Двуручный топор",
    behavior: "melee",
    base: { ...PLACEHOLDER_BASE.melee },
  },
};
