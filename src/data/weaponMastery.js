import { getWeapon } from "./weapons/index.js";

// Авторские числа на каждый ранг: общей кривой нет. Ранг 1 выдаётся вместе
// с оружием и бонусов не даёт, поэтому его в таблице нет.
export const WEAPON_MASTERY = {
  serp: {
    title: "Владение серпом",
    icon: "🗡",
    stats: [
      { key: "dmg", label: "Урон", format: (value) => `${value}` },
      { key: "cd", label: "Кулдаун", format: (value) => `${value.toFixed(2)} с` },
      { key: "radius", label: "Радиус", format: (value) => `${value}` },
      { key: "angleDeg", label: "Угол", format: (value) => `${value}°` },
    ],
    ranks: [
      { dmg: 10, cd: 0.96, radius: 94, angleDeg: 120 },
      { dmg: 12, cd: 0.92, radius: 98, angleDeg: 120 },
      { dmg: 14, cd: 0.88, radius: 103, angleDeg: 120 },
      { dmg: 17, cd: 0.84, radius: 108, angleDeg: 126 },
      { dmg: 20, cd: 0.8, radius: 114, angleDeg: 126 },
      { dmg: 24, cd: 0.76, radius: 120, angleDeg: 126 },
      { dmg: 28, cd: 0.72, radius: 127, angleDeg: 126 },
      { dmg: 33, cd: 0.68, radius: 134, angleDeg: 132 },
      { dmg: 39, cd: 0.64, radius: 142, angleDeg: 138 },
    ],
  },
  spear: {
    title: "Владение копьём",
    icon: "⚔",
    stats: [
      { key: "dmg", label: "Урон", format: (value) => `${value}` },
      { key: "cd", label: "Кулдаун", format: (value) => `${value.toFixed(2)} с` },
      { key: "radius", label: "Радиус", format: (value) => `${value}` },
      { key: "width", label: "Ширина", format: (value) => `${value}` },
    ],
    ranks: [
      { dmg: 8, cd: 0.77, radius: 146, width: 20 },
      { dmg: 10, cd: 0.74, radius: 152, width: 20 },
      { dmg: 12, cd: 0.71, radius: 159, width: 20 },
      { dmg: 15, cd: 0.68, radius: 166, width: 22 },
      { dmg: 18, cd: 0.65, radius: 174, width: 22 },
      { dmg: 22, cd: 0.62, radius: 182, width: 22 },
      { dmg: 26, cd: 0.59, radius: 191, width: 22 },
      { dmg: 31, cd: 0.56, radius: 200, width: 24 },
      { dmg: 37, cd: 0.53, radius: 210, width: 26 },
    ],
  },
};

export function masteryMaxRank(weaponId) {
  const rows = WEAPON_MASTERY[weaponId]?.ranks;
  return rows ? rows.length + 1 : 1;
}

export function masteryRow(weaponId, rank) {
  const rows = WEAPON_MASTERY[weaponId]?.ranks;
  if (!rows || rank <= 1) return null;
  const index = Math.min(rows.length - 1, Math.floor(rank) - 2);
  return rows[index] ?? null;
}

export function masteryStats(weapon, rank = weapon?.rank ?? 1) {
  return { ...(weapon?.base ?? {}), ...(masteryRow(weapon?.id, rank) ?? {}) };
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
      title: mastery.title,
      icon: mastery.icon,
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
