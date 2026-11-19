import { getWeapon } from "./weapons/index.js";
import { MAX_RANK, statsAtRank } from "./progression.js";

// База лежит в конфиге оружия, ранг добавляет проценты от неё. Выбор ключей
// задаёт, куда именно применяется каждый вид бонуса.
export const WEAPON_MASTERY = {
  serp: {
    icon: "🗡",
    keys: { damage: "dmg", cooldown: "cd", area: "radius" },
    stats: [
      { key: "dmg", label: "Урон", format: (value) => `${value}` },
      { key: "cd", label: "Кулдаун", format: (value) => `${value.toFixed(2)} с` },
      { key: "radius", label: "Радиус", format: (value) => `${value}` },
    ],
  },
  spear: {
    icon: "⚔",
    keys: { damage: "dmg", cooldown: "cd", area: "radius" },
    stats: [
      { key: "dmg", label: "Урон", format: (value) => `${value}` },
      { key: "cd", label: "Кулдаун", format: (value) => `${value.toFixed(2)} с` },
      { key: "radius", label: "Радиус", format: (value) => `${value}` },
    ],
  },
  chakram: {
    icon: "🌀",
    keys: { damage: "dmg", cooldown: "cd", area: "length" },
    stats: [
      { key: "dmg", label: "Урон", format: (value) => `${value}` },
      { key: "cd", label: "Кулдаун", format: (value) => `${value.toFixed(2)} с` },
      { key: "length", label: "Дальность", format: (value) => `${value}` },
    ],
  },
  greataxe: {
    icon: "🪓",
    keys: { damage: "dmg", cooldown: "cd", area: "radius" },
    stats: [
      { key: "dmg", label: "Урон", format: (value) => `${value}` },
      { key: "cd", label: "Кулдаун", format: (value) => `${value.toFixed(2)} с` },
      { key: "radius", label: "Радиус", format: (value) => `${value}` },
    ],
  },
};

export function masteryMaxRank(weaponId) {
  return WEAPON_MASTERY[weaponId] ? MAX_RANK : 1;
}

export function masteryStats(weapon, rank = weapon?.rank ?? 1) {
  const keys = WEAPON_MASTERY[weapon?.id]?.keys;
  const base = { ...(weapon?.base ?? {}) };
  return keys ? statsAtRank(base, keys, rank) : base;
}

export function masteryCardsForWeapon(weaponId) {
  const weapon = getWeapon(weaponId);
  const mastery = WEAPON_MASTERY[weaponId];
  if (!weapon || !mastery) return [];
  const maxRank = masteryMaxRank(weaponId);
  return [
    {
      id: `mastery.${weaponId}`,
      kind: "mastery",
      weaponId,
      title: weapon.title,
      caption: "Владение оружием",
      icon: mastery.icon,
      sprite: weapon.sprite,
      maxRank,
      rankOf({ weapons }) {
        const rank = weapons?.masteryOf?.(weaponId) ?? 0;
        // Оружия нет в забеге — карта не предлагается.
        return rank > 0 ? rank : maxRank;
      },
      apply({ weapons }) {
        weapons?.raiseMastery?.(weaponId);
      },
      stats(rank) {
        const stats = masteryStats(weapon, rank);
        return mastery.stats.map((stat) => ({
          key: stat.key,
          label: stat.label,
          text: stat.format(stats[stat.key]),
        }));
      },
    },
  ];
}
