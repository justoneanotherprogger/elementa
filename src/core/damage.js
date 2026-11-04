export function rollDamage(amount) {
  const base = Math.floor(amount);
  const remainder = amount - base;
  return base + (remainder > 0 && Math.random() < remainder ? 1 : 0);
}
