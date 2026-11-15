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
    // Dolls chase enemies on their own and bite them.
    behavior: "companion",
    base: { ...PLACEHOLDER_BASE.companion },
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
    // Damage zones spawn under enemies for a while.
    behavior: "zone",
    base: { ...PLACEHOLDER_BASE.projectile },
  },
};
