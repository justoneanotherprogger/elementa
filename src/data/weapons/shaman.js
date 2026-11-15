import { PLACEHOLDER_BASE } from "./base.js";

export const SHAMAN_WEAPONS = {
  kris: {
    id: "kris",
    classId: "shaman",
    element: "fire",
    title: "Крис-фламберг",
    behavior: "melee",
    base: { ...PLACEHOLDER_BASE.melee },
  },
  drum: {
    id: "drum",
    classId: "shaman",
    element: "water",
    title: "Большой бубен",
    behavior: "aura",
    base: { ...PLACEHOLDER_BASE.aura },
  },
  scepter: {
    id: "scepter",
    classId: "shaman",
    element: "air",
    title: "Ритуальный скипетр",
    behavior: "projectile",
    base: { ...PLACEHOLDER_BASE.projectile },
  },
  golem: {
    id: "golem",
    classId: "shaman",
    element: "earth",
    title: "Каменный голем",
    behavior: "companion",
    base: { ...PLACEHOLDER_BASE.companion },
  },
};
