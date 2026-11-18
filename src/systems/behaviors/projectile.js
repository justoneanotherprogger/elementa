import { Graphics } from "pixi.js";
import { hitEnemy } from "../combat.js";
import {
  damageOf,
  elementColor,
  enemyCenter,
  enemyMargin,
  findNearest,
  lastDirection,
  playerPosition,
} from "./common.js";

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq <= 0.0001) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// Снаряд летит по прямой, проверяет весь пройденный за кадр отрезок и умеет
// пробивать несколько врагов. Скорость не даёт ему проскочить сквозь цель.
export function createProjectileBehavior() {
  const shots = [];

  function activate(ctx, weapon, stats) {
    const position = playerPosition(ctx.player);
    const searchRadius = stats.range ?? stats.length ?? 600;
    const target = findNearest(ctx, position.x, position.y, searchRadius);
    const fallback = lastDirection(ctx.player);
    let baseAngle = Math.atan2(fallback.y, fallback.x);
    if (target) {
      baseAngle = Math.atan2(
        target.point.y - position.y,
        target.point.x - position.x,
      );
    }

    const count = Math.max(1, Math.round(stats.count ?? 1));
    const speed = stats.speed ?? 520;
    const maxRange = stats.length ?? 600;
    const hitRadius = stats.radius ?? 8;
    const pierce = Math.max(0, Math.round(stats.pierce ?? 0));
    const amount = damageOf(ctx, stats);
    const color = elementColor(weapon.element);
    const spread = 0.12;

    for (let i = 0; i < count; i += 1) {
      const angle = baseAngle + (i - (count - 1) / 2) * spread;
      const graphic = new Graphics();
      graphic
        .circle(0, 0, Math.max(4, hitRadius * 0.4))
        .fill({ color, alpha: 0.25 });
      graphic
        .circle(0, 0, Math.max(2, hitRadius * 0.2))
        .fill({ color: 0xffffff, alpha: 0.9 });
      graphic.x = position.x;
      graphic.y = position.y;
      ctx.app.stage.addChild(graphic);

      shots.push({
        graphic,
        x: position.x,
        y: position.y,
        prevX: position.x,
        prevY: position.y,
        dirX: Math.cos(angle),
        dirY: Math.sin(angle),
        speed,
        maxRange,
        traveled: 0,
        hitRadius,
        amount,
        maxHits: pierce + 1,
        hitEnemies: new Set(),
      });
    }
    return true;
  }

  function removeShot(index) {
    const shot = shots[index];
    shot.graphic.destroy();
    shots.splice(index, 1);
  }

  function update(ctx, _weapon, dt) {
    for (let i = shots.length - 1; i >= 0; i -= 1) {
      const shot = shots[i];
      shot.prevX = shot.x;
      shot.prevY = shot.y;
      const step = shot.speed * dt;
      shot.x += shot.dirX * step;
      shot.y += shot.dirY * step;
      shot.traveled += step;
      shot.graphic.x = shot.x;
      shot.graphic.y = shot.y;

      for (const enemy of ctx.enemySystem?.enemies ?? []) {
        if (!enemy || enemy.alive === false || enemy.hp <= 0) continue;
        if (shot.hitEnemies.has(enemy)) continue;
        const center = enemyCenter(enemy);
        const distance = distanceToSegment(
          center.x,
          center.y,
          shot.prevX,
          shot.prevY,
          shot.x,
          shot.y,
        );
        if (distance <= shot.hitRadius + enemyMargin(enemy)) {
          hitEnemy(ctx, enemy, shot.amount);
          shot.hitEnemies.add(enemy);
          if (shot.hitEnemies.size >= shot.maxHits) break;
        }
      }

      if (
        shot.hitEnemies.size >= shot.maxHits ||
        shot.traveled >= shot.maxRange
      ) {
        removeShot(i);
      }
    }
  }

  function reset() {
    for (const shot of shots) shot.graphic.destroy();
    shots.length = 0;
  }

  return { activate, update, reset };
}
