import { PLACEHOLDER_BASE } from "./base.js";

export const TEMPLAR_WEAPONS = {
  flaming_sword: {
    id: "flaming_sword",
    classId: "templar",
    element: "fire",
    title: "Пылающий меч",
    behavior: "melee",
    base: { ...PLACEHOLDER_BASE.melee },
  },
  censer: {
    id: "censer",
    classId: "templar",
    element: "water",
    title: "Кадило",
    behavior: "zone",
    base: { ...PLACEHOLDER_BASE.zone },
  },
  morningstar: {
    id: "morningstar",
    classId: "templar",
    element: "air",
    title: "Моргенштерн",
    behavior: "melee",
    base: { ...PLACEHOLDER_BASE.melee },
  },
  shield: {
    id: "shield",
    classId: "templar",
    element: "earth",
    title: "Щит",
    behavior: "melee",
    base: { ...PLACEHOLDER_BASE.melee },
  },
};
