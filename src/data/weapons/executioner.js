export const EXECUTIONER_WEAPONS = {
  serp: {
    id: "serp",
    classId: "executioner",
    element: "fire",
    title: "Серп",
    sprite: "assets/weapons/pix_weap_executioner_fire.png",
    behavior: "melee",
    // `kind` is what systems/weapons.js renders today; #106 replaces it with behavior modules.
    base: { dmg: 8, cd: 1, radius: 90, angleDeg: 120, kind: "slash" },
  },
  spear: {
    id: "spear",
    classId: "executioner",
    element: "water",
    title: "Копьё",
    sprite: "assets/weapons/pix_weap_executioner_water.png",
    behavior: "melee",
    base: { dmg: 6, cd: 0.8, radius: 140, width: 20, kind: "thrust" },
  },
  chakram: {
    id: "chakram",
    classId: "executioner",
    element: "air",
    title: "Шакрам",
    sprite: "assets/weapons/pix_weap_executioner_air.png",
    behavior: "projectile",
    // Летит к точке прицеливания, тормозит, возвращается к герою и тает в нём.
    base: {
      dmg: 5,
      cd: 1.1,
      radius: 22,
      speed: 620,
      length: 420,
      pierce: 1,
      count: 1,
      returns: true,
      returnSpeed: 780,
      spin: 18,
    },
  },
  greataxe: {
    id: "greataxe",
    classId: "executioner",
    element: "earth",
    title: "Двуручный топор",
    sprite: "assets/weapons/pix_weap_executioner_earth.png",
    behavior: "melee",
    // Вентилятор с одной лопастью: оборот за кулдаун, удар по дуге лопасти.
    base: { dmg: 17, cd: 4, radius: 108, kind: "spin", bladeDeg: 45 },
  },
};
