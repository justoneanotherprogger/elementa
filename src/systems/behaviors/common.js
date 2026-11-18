import { ELEMENTS } from "../../data/elements.js";
import { spriteHalfWidth, spriteHalfHeight } from "../../core/spriteBounds.js";

const ELEMENT_COLORS = Object.fromEntries(
  ELEMENTS.map((element) => [element.id, element.color]),
);
ELEMENT_COLORS.air = ELEMENT_COLORS.wind ?? 0xffffff;

export function elementColor(element) {
  return ELEMENT_COLORS[element] ?? 0xffffff;
}

export function playerPosition(player) {
  if (player?.body) return { x: player.body.x, y: player.body.y };
  return { x: player?.x ?? 0, y: player?.y ?? 0 };
}

export function enemyCenter(enemy) {
  const sprite = enemy?.sprite;
  const x = sprite?.x ?? enemy?.x ?? 0;
  const y = sprite?.y ?? enemy?.y ?? 0;
  const height = sprite?.height ?? 0;
  const anchorY = sprite?.anchor?.y ?? 0.5;
  return { x, y: y - height * (anchorY - 0.5) };
}

export function enemyMargin(enemy) {
  const half = Math.max(
    spriteHalfWidth(enemy?.sprite),
    spriteHalfHeight(enemy?.sprite),
  );
  return Math.max(2, half * 0.35);
}

export function lastDirection(player) {
  const dir = player?.lastMoveDir ?? { x: 0, y: -1 };
  const mag = Math.hypot(dir.x, dir.y) || 1;
  return { x: dir.x / mag, y: dir.y / mag };
}

export function findNearest(ctx, px, py, radius, bodyHalfHeight = 0) {
  let nearest = null;
  for (const enemy of ctx.enemySystem?.enemies ?? []) {
    if (!enemy || enemy.alive === false || enemy.hp <= 0) continue;
    const point = enemyCenter(enemy);
    const dx = point.x - px;
    // Тело героя — вертикальный отрезок высотой в спрайт: обнаружение идёт
    // от головы и стоп, а не от пояса.
    const dy = Math.max(0, Math.abs(point.y - py) - bodyHalfHeight);
    const dist = Math.hypot(dx, dy);
    if (dist <= radius && (!nearest || dist < nearest.dist)) {
      nearest = { enemy, point, dist };
    }
  }
  return nearest;
}

export function damageOf(ctx, stats) {
  return (stats.dmg ?? 0) * (ctx.player?.dmgMult ?? 1);
}

export function radiusOf(ctx, stats) {
  return (stats.radius ?? 0) * (ctx.player?.areaMult ?? 1);
}

export function durationOf(ctx, stats) {
  return (stats.duration ?? 0) * (ctx.player?.durMult ?? 1);
}
