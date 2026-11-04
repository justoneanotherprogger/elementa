import { STATUSES, STATUS_BY_ELEMENT } from "../data/elements.js";
import { rollDamage } from "../core/damage.js";

export function applyStatus(enemy, element, sourceDmg = 0) {
  if (!enemy) return false;
  const statusId = STATUS_BY_ELEMENT[element];
  if (!statusId) return false;
  const status = STATUSES[statusId];
  if (!status) return false;
  if (!enemy.statuses) enemy.statuses = new Map();

  const hadDifferent = [...enemy.statuses.keys()].some((id) => id !== statusId);
  enemy.statuses.set(statusId, {
    id: statusId,
    element,
    remaining: status.duration,
    sourceDmg,
  });
  return hadDifferent;
}

export function updateStatuses(enemySystem, dt) {
  const enemies = enemySystem?.enemies ?? [];
  for (const enemy of enemies) {
    if (!enemy.statuses) enemy.statuses = new Map();

    for (const [statusId, entry] of [...enemy.statuses.entries()]) {
      entry.remaining -= dt;
      const status = STATUSES[statusId];
      if (status?.dps) enemy.hp -= rollDamage(status.dps * dt);
      if (entry.remaining <= 0) enemy.statuses.delete(statusId);
    }

    enemy.reactCd = Math.max(0, (enemy.reactCd ?? 0) - dt);

    let speedMult = 1;
    let attackPowerMult = 1;
    let damageTakenMult = 1;
    for (const statusId of enemy.statuses.keys()) {
      const status = STATUSES[statusId];
      if (status?.speedMult !== null) speedMult *= status.speedMult;
      if (status?.attackPowerMult !== null) attackPowerMult *= status.attackPowerMult;
      if (status?.damageTakenMult !== null) damageTakenMult *= status.damageTakenMult;
    }

    if (enemy.baseSpeed !== null) enemy.speed = enemy.baseSpeed * speedMult;
    enemy.damageMult = attackPowerMult;
    enemy.damageTakenMult = damageTakenMult;
  }
}
