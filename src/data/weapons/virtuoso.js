import { PLACEHOLDER_BASE } from "./base.js";

export const VIRTUOSO_WEAPONS = {
  torches: {
    id: "torches",
    classId: "virtuoso",
    element: "fire",
    title: "Огненные факелы",
    behavior: "melee",
    base: { ...PLACEHOLDER_BASE.melee },
  },
  brush: {
    id: "brush",
    classId: "virtuoso",
    element: "water",
    title: "Кисть",
    behavior: "zone",
    base: { ...PLACEHOLDER_BASE.zone },
  },
  harp: {
    id: "harp",
    classId: "virtuoso",
    element: "air",
    title: "Арфа",
    behavior: "projectile",
    base: { ...PLACEHOLDER_BASE.projectile },
  },
  statues: {
    id: "statues",
    classId: "virtuoso",
    element: "earth",
    title: "Статуи",
    behavior: "companion",
    base: { ...PLACEHOLDER_BASE.companion },
  },
};
