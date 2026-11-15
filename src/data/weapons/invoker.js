import { PLACEHOLDER_BASE } from "./base.js";

export const INVOKER_WEAPONS = {
  staff: {
    id: "staff",
    classId: "invoker",
    element: "fire",
    title: "Посох",
    behavior: "projectile",
    base: { ...PLACEHOLDER_BASE.projectile },
  },
  orb: {
    id: "orb",
    classId: "invoker",
    element: "water",
    title: "Магическая сфера",
    behavior: "projectile",
    base: { ...PLACEHOLDER_BASE.projectile, count: 3 },
  },
  wand: {
    id: "wand",
    classId: "invoker",
    element: "air",
    title: "Жезл",
    behavior: "projectile",
    base: { ...PLACEHOLDER_BASE.projectile },
  },
  mirror: {
    id: "mirror",
    classId: "invoker",
    element: "earth",
    title: "Магическое зеркало",
    // Aura that periodically reflects damage back; reflection comes with #106.
    behavior: "aura",
    base: { ...PLACEHOLDER_BASE.aura },
  },
};
