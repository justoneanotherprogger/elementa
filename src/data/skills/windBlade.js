const KNOCKBACK = 300;

export const WIND_BLADE = {
  id: "wind_blade",
  name: "Клинок ветра",
  element: "air",
  icon: "🌬",
  delivery: "projectile",
  activation: "cooldown",
  targeting: "nearest",
  range: 330,
  projectileSpeed: 520,
  hitRadius: 14,
  color: 0x8bc34a,
  // Эффект не меняется рангом: его прокачка придёт с мета-прогрессией.
  knockback: KNOCKBACK,
  effectText: () => `Отталкивание ${KNOCKBACK}`,
  ranks: [
    { damage: 4, cooldown: 1.8 },
    { damage: 5, cooldown: 1.75 },
    { damage: 6, cooldown: 1.7 },
    { damage: 7, cooldown: 1.65 },
    { damage: 9, cooldown: 1.6 },
    { damage: 11, cooldown: 1.55 },
    { damage: 13, cooldown: 1.5 },
    { damage: 16, cooldown: 1.45 },
    { damage: 19, cooldown: 1.4 },
    { damage: 23, cooldown: 1.3 },
  ],
};
