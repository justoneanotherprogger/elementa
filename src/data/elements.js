export const ELEMENTS = [
  { id: "fire", color: 0xff5722 },
  { id: "water", color: 0x2196f3 },
  { id: "wind", color: 0x8bc34a },
  { id: "earth", color: 0x795548 },
  { id: "none", color: 0x9e9e9e },
];

export const STATUSES = {
  burn: {
    id: "burn",
    title: "Горение",
    element: "fire",
    duration: 5,
    dps: 10,
    attackPowerMult: 0.5,
    speedMult: 1.5,
    damageTakenMult: 1,
    icon: "🔥",
  },
  wet: {
    id: "wet",
    title: "Мокрый",
    element: "water",
    duration: 5,
    dps: 0,
    attackPowerMult: 1,
    speedMult: 0.5,
    damageTakenMult: 1.5,
    icon: "💧",
  },
  stun: {
    id: "stun",
    title: "Оглушение",
    element: "earth",
    duration: 0.45,
    dps: 0,
    icon: "💫",
  },
};

// Идентичность стихии на попадании: всё, кроме ветра, — статусы. У ветра
// статуса нет по документам: только сдвиг по направлению атаки.
export const ELEMENT_EFFECTS = {
  fire: { status: "burn", chance: 1 },
  water: { status: "wet", chance: 1 },
  earth: { status: "stun", chance: 0.2 },
  air: { knockback: 300 },
};

export const REACTIONS = {
  "fire+water": {
    id: "steam",
    title: "Пар",
    damageMultiplier: 1,
  },
};

export function getReactionKey(a, b) {
  return [a, b].sort().join("+");
}
