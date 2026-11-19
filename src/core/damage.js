export function rollDamage(amount) {
  const base = Math.floor(amount);
  const remainder = amount - base;
  return base + (remainder > 0 && Math.random() < remainder ? 1 : 0);
}

// Карточка показывает возможные значения урона без шанса: 9.2 -> "9-10".
export function damageRangeText(amount) {
  const value = Number(amount) || 0;
  const low = Math.floor(value);
  return value > low ? `${low}-${low + 1}` : `${low}`;
}
