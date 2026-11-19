const STUN_CHANCE = 0.2;
const STUN_DURATION = 0.45;

export const STONE_BOULDER = {
  id: "stone_boulder",
  name: "Каменная глыба",
  element: "earth",
  icon: "🪨",
  delivery: "projectile",
  activation: "cooldown",
  targeting: "nearest",
  range: 300,
  projectileSpeed: 320,
  hitRadius: 16,
  color: 0xb98b4a,
  // Эффект не меняется рангом: его прокачка придёт с мета-прогрессией.
  stunChance: STUN_CHANCE,
  stunDuration: STUN_DURATION,
  effectText: () =>
    `Оглушение ${Math.round(STUN_CHANCE * 100)}% · ${STUN_DURATION.toFixed(2)} с`,
  ranks: [
    { damage: 7, cooldown: 2.6 },
    { damage: 8, cooldown: 2.5 },
    { damage: 10, cooldown: 2.4 },
    { damage: 12, cooldown: 2.3 },
    { damage: 15, cooldown: 2.2 },
    { damage: 18, cooldown: 2.1 },
    { damage: 22, cooldown: 2.0 },
    { damage: 26, cooldown: 1.9 },
    { damage: 31, cooldown: 1.8 },
    { damage: 37, cooldown: 1.7 },
  ],
};
