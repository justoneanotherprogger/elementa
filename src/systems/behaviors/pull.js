import { Graphics } from "pixi.js";
import { hitEnemy } from "../combat.js";
import {
  damageOf,
  elementColor,
  enemyCenter,
  enemyMargin,
  playerPosition,
  radiusOf,
} from "./common.js";

// Притягивание действует, пока идёт окно. Силу враг получает в свой кадр
// движения: системы не переставляют его позицию напрямую, иначе спрайт
// отставал бы от тела.
export function createPullBehavior() {
  let timer = 0;
  let radius = 0;
  let force = 0;
  let amount = 0;
  let color = 0xffffff;
  let graphic = null;

  function ensureGraphic(ctx) {
    if (graphic) return graphic;
    graphic = new Graphics();
    ctx.app.stage.addChild(graphic);
    return graphic;
  }

  function activate(ctx, weapon, stats) {
    const position = playerPosition(ctx.player);
    radius = radiusOf(ctx, stats);
    force = stats.force ?? 340;
    timer = stats.duration ?? 0.7;
    amount = damageOf(ctx, stats);
    color = elementColor(weapon.element);

    for (const enemy of ctx.enemySystem?.enemies ?? []) {
      if (!enemy || enemy.alive === false || enemy.hp <= 0) continue;
      const center = enemyCenter(enemy);
      if (
        Math.hypot(center.x - position.x, center.y - position.y) <=
        radius + enemyMargin(enemy)
      ) {
        hitEnemy(ctx, enemy, amount);
      }
    }
    return true;
  }

  function update(ctx, _weapon, dt) {
    if (timer <= 0) {
      if (graphic) {
        ctx.app.stage.removeChild(graphic);
        graphic.destroy();
        graphic = null;
      }
      return;
    }

    timer = Math.max(0, timer - dt);
    const position = playerPosition(ctx.player);
    const layer = ensureGraphic(ctx);
    layer.clear();
    layer
      .circle(position.x, position.y, radius)
      .stroke({ color: color, width: 2, alpha: 0.35 });

    for (const enemy of ctx.enemySystem?.enemies ?? []) {
      if (!enemy || enemy.alive === false || enemy.hp <= 0) continue;
      const center = enemyCenter(enemy);
      const dx = position.x - center.x;
      const dy = position.y - center.y;
      const distance = Math.hypot(dx, dy);
      if (distance > radius || distance < 1) continue;
      enemy.pushX = (enemy.pushX ?? 0) + (dx / distance) * force;
      enemy.pushY = (enemy.pushY ?? 0) + (dy / distance) * force;
      layer.moveTo(center.x, center.y).lineTo(position.x, position.y).stroke({
        color: color,
        width: 1,
        alpha: 0.18,
      });
    }

    if (timer <= 0) {
      layer.clear();
    }
  }

  function reset() {
    timer = 0;
    if (graphic) {
      graphic.destroy();
      graphic = null;
    }
  }

  return { activate, update, reset };
}
