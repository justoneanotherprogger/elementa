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
// пробивать несколько врагов. Возвращающийся вариант долетает до точки
// прицеливания, тормозит, разворачивается к герою и исчезает в нём.
export function createProjectileBehavior() {
  const shots = [];

  function activate(ctx, weapon, stats) {
    const position = playerPosition(ctx.player);
    const searchRadius = stats.range ?? stats.length ?? 600;
    const target = findNearest(ctx, position.x, position.y, searchRadius);
    const fallback = lastDirection(ctx.player);
    let baseAngle = Math.atan2(fallback.y, fallback.x);
    let targetDistance = stats.length ?? 600;
    if (target) {
      baseAngle = Math.atan2(
        target.point.y - position.y,
        target.point.x - position.x,
      );
      targetDistance = Math.hypot(
        target.point.x - position.x,
        target.point.y - position.y,
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
    const returning = stats.returns === true;
    const returnSpeed = stats.returnSpeed ?? speed;
    const returnAccel = stats.returnAccel ?? returnSpeed * 3;
    const spin = stats.spin ?? (returning ? 14 : 0);

    for (let i = 0; i < count; i += 1) {
      const angle = baseAngle + (i - (count - 1) / 2) * spread;
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      const graphic = new Graphics();
      if (returning) {
        const ring = Math.max(6, hitRadius * 0.85);
        graphic
          .moveTo(-ring, 0)
          .lineTo(ring, 0)
          .moveTo(0, -ring)
          .lineTo(0, ring)
          .stroke({ width: 2, color, alpha: 0.55 });
        graphic
          .circle(0, 0, ring)
          .stroke({ width: 3, color, alpha: 0.95 });
        graphic.circle(0, 0, Math.max(2, hitRadius * 0.15)).fill({
          color: 0xffffff,
          alpha: 0.9,
        });
      } else {
        graphic
          .circle(0, 0, Math.max(4, hitRadius * 0.4))
          .fill({ color, alpha: 0.25 });
        graphic
          .circle(0, 0, Math.max(2, hitRadius * 0.2))
          .fill({ color: 0xffffff, alpha: 0.9 });
      }
      graphic.x = position.x;
      graphic.y = position.y;
      ctx.app.stage.addChild(graphic);

      shots.push({
        graphic,
        x: position.x,
        y: position.y,
        prevX: position.x,
        prevY: position.y,
        dirX,
        dirY,
        speed,
        maxRange,
        traveled: 0,
        hitRadius,
        amount,
        maxHits: pierce + 1,
        hitEnemies: new Set(),
        exhausted: false,
        returning,
        returnSpeed,
        returnAccel,
        spin,
        phase: "out",
        targetX: position.x + dirX * targetDistance,
        targetY: position.y + dirY * targetDistance,
        outDistance: Math.max(1, targetDistance),
      });
    }
    return true;
  }

  function removeShot(index) {
    const shot = shots[index];
    shot.graphic.destroy();
    shots.splice(index, 1);
  }

  function moveOut(shot, dt) {
    const dx = shot.targetX - shot.x;
    const dy = shot.targetY - shot.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 4) {
      shot.phase = "back";
      shot.speed = 0;
      shot.hitEnemies.clear();
      shot.exhausted = false;
      return;
    }
    // Плавное торможение на подлёте: шакрам не проскакивает точку цели.
    const slowdownRange = Math.max(40, Math.min(140, shot.outDistance * 0.3));
    const slowdown = Math.max(0.12, Math.min(1, distance / slowdownRange));
    const step = shot.speed * dt * slowdown;
    shot.x += (dx / distance) * step;
    shot.y += (dy / distance) * step;
    shot.traveled += step;
  }

  function moveBack(ctx, shot, dt) {
    const position = playerPosition(ctx.player);
    const dx = position.x - shot.x;
    const dy = position.y - shot.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 18) return true;
    shot.speed = Math.min(
      shot.returnSpeed,
      shot.speed + shot.returnAccel * dt,
    );
    const step = Math.max(shot.speed, 90) * dt;
    shot.x += (dx / distance) * step;
    shot.y += (dy / distance) * step;
    return false;
  }

  function update(ctx, _weapon, dt) {
    for (let i = shots.length - 1; i >= 0; i -= 1) {
      const shot = shots[i];
      shot.prevX = shot.x;
      shot.prevY = shot.y;

      if (shot.returning && shot.phase === "back") {
        if (moveBack(ctx, shot, dt)) {
          removeShot(i);
          continue;
        }
      } else if (shot.returning) {
        moveOut(shot, dt);
      } else {
        const step = shot.speed * dt;
        shot.x += shot.dirX * step;
        shot.y += shot.dirY * step;
        shot.traveled += step;
      }

      shot.graphic.x = shot.x;
      shot.graphic.y = shot.y;
      if (shot.spin) shot.graphic.rotation += dt * shot.spin;

      if (!shot.exhausted) {
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
            if (shot.hitEnemies.size >= shot.maxHits) {
              if (shot.returning) shot.exhausted = true;
              break;
            }
          }
        }
      }

      if (shot.returning) continue;
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
