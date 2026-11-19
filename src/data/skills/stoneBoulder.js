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
  // Базовые числа: ранги добавляют проценты через progression.js.
  damage: 7,
  cooldown: 2.6,
};
