import { PLACEHOLDER_BASE } from "./base.js";

export const NECROMANCER_WEAPONS = {
  great_scythe: {
    id: "great_scythe",
    classId: "necromancer",
    element: "fire",
    title: "Большая коса",
    behavior: "melee",
    base: { ...PLACEHOLDER_BASE.melee },
  },
  cursed_dolls: {
    id: "cursed_dolls",
    classId: "necromancer",
    element: "water",
    title: "Проклятые куклы",
    behavior: "aura",
    base: { ...PLACEHOLDER_BASE.aura },
  },
  soul_lantern: {
    id: "soul_lantern",
    classId: "necromancer",
    element: "air",
    title: "Фонарь-ловушка для душ",
    behavior: "zone",
    base: { ...PLACEHOLDER_BASE.zone },
  },
  grimoire: {
    id: "grimoire",
    classId: "necromancer",
    element: "earth",
    title: "Запретный гримуар",
    behavior: "projectile",
    base: { ...PLACEHOLDER_BASE.projectile },
  },
};
