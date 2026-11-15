import { PLACEHOLDER_BASE } from "./base.js";

export const ACTOR_WEAPONS = {
  pyrotechnics: {
    id: "pyrotechnics",
    classId: "actor",
    element: "fire",
    title: "Пиротехника",
    // Projectile that leaves short damage zones where it lands; zones come with #106.
    behavior: "projectile",
    base: { ...PLACEHOLDER_BASE.projectile },
  },
  poison_knives: {
    id: "poison_knives",
    classId: "actor",
    element: "water",
    title: "Метательные ядовитые ножи",
    behavior: "projectile",
    base: { ...PLACEHOLDER_BASE.projectile },
  },
  whip: {
    id: "whip",
    classId: "actor",
    element: "air",
    title: "Хлыст",
    behavior: "melee",
    base: { ...PLACEHOLDER_BASE.melee },
  },
  maul: {
    id: "maul",
    classId: "actor",
    element: "earth",
    title: "Тяжёлый молот",
    behavior: "melee",
    base: { ...PLACEHOLDER_BASE.melee },
  },
};
