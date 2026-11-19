import { rollDamage } from "../core/damage.js";
import { applyStatus } from "./statuses.js";
import { ELEMENT_EFFECTS } from "../data/elements.js";

// Единственный путь попадания по врагу: множитель получаемого урона,
// стихия и реакция. Оружие бьёт физикой и element не передаёт: стихийные
// статусы накладывают только навыки (classes.md, elements.md).
export function hitEnemy(ctx, enemy, amount, element = null) {
  if (!ctx?.enemySystem || !enemy || enemy.alive === false || enemy.hp <= 0)
    return 0;
  const scaled = amount * (enemy.damageTakenMult ?? 1);
  const dealt = ctx.enemySystem.damage(enemy, rollDamage(scaled));
  if (dealt > 0 && element) {
    const effect = ELEMENT_EFFECTS[element];
    if (effect?.status && Math.random() < (effect.chance ?? 1)) {
      applyStatus(enemy, effect.status, scaled);
    }
    ctx.reactionSystem?.handleHit(enemy, element, scaled);
  }
  return dealt;
}
