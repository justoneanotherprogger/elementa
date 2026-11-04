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
    element: "water",
    duration: 5,
    dps: 0,
    attackPowerMult: 1,
    speedMult: 0.5,
    damageTakenMult: 1.5,
    icon: "💧",
  },
};

export const STATUS_BY_ELEMENT = {
  fire: "burn",
  water: "wet",
};

export const REACTIONS = {
  "fire+water": {
    id: "steam",
    title: "Пар",
    damageMultiplier: 1,
  },
};

export function getStatusByElement(element) {
  const statusId = STATUS_BY_ELEMENT[element];
  if (!statusId) return null;
  return STATUSES[statusId] ?? null;
}

export function getReactionKey(a, b) {
  return [a, b].sort().join("+");
}
