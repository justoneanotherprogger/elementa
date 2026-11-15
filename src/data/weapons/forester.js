import { PLACEHOLDER_BASE } from "./base.js";

export const FORESTER_WEAPONS = {
  rifle: {
    id: "rifle",
    classId: "forester",
    element: "fire",
    title: "Ружьё",
    behavior: "projectile",
    base: { ...PLACEHOLDER_BASE.projectile },
  },
  traps: {
    id: "traps",
    classId: "forester",
    element: "water",
    title: "Капканы и ловушки",
    behavior: "zone",
    base: { ...PLACEHOLDER_BASE.zone },
  },
  twin_knives: {
    id: "twin_knives",
    classId: "forester",
    element: "air",
    title: "Два ножа",
    behavior: "melee",
    base: { ...PLACEHOLDER_BASE.melee },
  },
  bow: {
    id: "bow",
    classId: "forester",
    element: "earth",
    title: "Лук с питомцем",
    behavior: "companion",
    base: { ...PLACEHOLDER_BASE.companion },
  },
};
