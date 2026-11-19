export const FIREBALL = {
  id: "fireball",
  name: "Огненный шар",
  element: "fire",
  icon: "🔥",
  delivery: "projectile",
  activation: "cooldown",
  targeting: "nearest",
  range: 320,
  projectileSpeed: 360,
  hitRadius: 12,
  color: 0xff7043,
  // Базовые числа: ранги добавляют проценты через progression.js.
  damage: 8,
  cooldown: 2.0,
};
