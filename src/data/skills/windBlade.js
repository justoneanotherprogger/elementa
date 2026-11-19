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
  // Базовые числа: ранги добавляют проценты через progression.js.
  damage: 4,
  cooldown: 1.8,
};
