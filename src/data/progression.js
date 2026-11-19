// Шаги улучшений в процентах от базового значения стата. Урон растёт
// каждый ранг, кулдаун и область действия чередуются. Сумма процентов
// применяется к базе один раз: при росте базы бонусы не теряют силу.
export const RANK_STEPS = [
  { damage: 15, cooldown: -5 },
  { damage: 5, area: 15 },
  { damage: 10, cooldown: -10 },
  { damage: 5, area: 10 },
  { damage: 15, cooldown: -5 },
  { damage: 5, area: 15 },
  { damage: 10, cooldown: -10 },
  { damage: 5, area: 5 },
  { damage: 15, cooldown: -5 },
];

export const MAX_RANK = RANK_STEPS.length + 1;

export function statsAtRank(base, keys, rank) {
  const result = { ...base };
  const totals = {};
  const count = Math.max(0, Math.min(RANK_STEPS.length, Math.floor(rank) - 1));
  for (let i = 0; i < count; i += 1) {
    for (const [kind, percent] of Object.entries(RANK_STEPS[i])) {
      totals[kind] = (totals[kind] ?? 0) + percent;
    }
  }
  for (const [kind, percent] of Object.entries(totals)) {
    const key = keys[kind];
    if (!key || typeof base[key] !== "number") continue;
    const value = base[key] * (1 + percent / 100);
    if (key === "cd" || key === "cooldown") {
      result[key] = Math.max(0.1, Math.round(value * 100) / 100);
    } else if (key === "dmg" || key === "damage") {
      result[key] = Math.round(value * 100) / 100;
    } else {
      result[key] = Math.round(value);
    }
  }
  return result;
}

const SKILL_KEYS = {
  damage: "damage",
  cooldown: "cooldown",
  area: "hitRadius",
};

export function skillStats(skill, rank) {
  return statsAtRank(
    {
      damage: skill.damage,
      cooldown: skill.cooldown,
      hitRadius: skill.hitRadius,
    },
    SKILL_KEYS,
    rank,
  );
}
