import { hitEnemy } from "../combat.js";
import {
  damageOf,
  durationOf,
  elementColor,
  findNearest,
  lastDirection,
  playerPosition,
  radiusOf,
} from "./common.js";

// Зона живёт в systems/zones.js: пул, время жизни и тики — там. Поведение
// только решает, где её поставить и чем она бьёт.
export function createZoneBehavior() {
  function activate(ctx, weapon, stats) {
    if (!ctx.zoneSystem) return false;
    const position = playerPosition(ctx.player);
    const radius = radiusOf(ctx, stats);
    const target = findNearest(ctx, position.x, position.y, radius * 1.15);
    const fallback = lastDirection(ctx.player);
    const x = target ? target.point.x : position.x + fallback.x * radius * 0.6;
    const y = target ? target.point.y : position.y + fallback.y * radius * 0.6;

    return ctx.zoneSystem.spawnZone({
      x,
      y,
      radius,
      duration: durationOf(ctx, stats) || 3,
      dps: damageOf(ctx, stats),
      color: elementColor(weapon.element),
      onHit: (enemy, amount) => hitEnemy(ctx, enemy, amount),
    });
  }

  return { activate, reset() {} };
}
