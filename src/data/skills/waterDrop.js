export const WATER_DROP = {
  id: "water_drop",
  name: "Капля воды",
  element: "water",
  icon: "💧",
  delivery: "projectile",
  activation: "cooldown",
  targeting: "nearest",
  range: 320,
  projectileSpeed: 460,
  hitRadius: 10,
  color: 0x4fc3f7,
  // Базовые числа: ранги добавляют проценты через progression.js.
  damage: 5,
  cooldown: 1.2,
};
