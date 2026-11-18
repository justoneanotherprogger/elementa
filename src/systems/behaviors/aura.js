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

// Аура бьёт не «всё внутри радиуса», а фронтом расходящейся волны: урон
// получает тот, кого накрыло кольцо. Враг, стоящий внутри и переживший
// проход фронта, второй раз не бьётся до следующей пульсации.
export function createAuraBehavior() {
  const waves = [];

  function activate(ctx, weapon, stats) {
    const position = playerPosition(ctx.player);
    const radius = radiusOf(ctx, stats);
    const width = stats.waveWidth ?? 18;
    // Волна проходит радиус ровно за один кулдаун: чем чаще пульсация,
    // тем быстрее фронт. Ускорение атаки влияет само, через weapon.cd.
    const travel = radius + width / 2;
    const speed =
      stats.waveSpeed ?? travel / Math.max(0.1, weapon.cd ?? stats.cd ?? 1);
    const graphic = new Graphics();
    graphic.zIndex = 1;
    ctx.app.stage.addChild(graphic);
    waves.push({
      graphic,
      x: position.x,
      y: position.y,
      radius,
      speed,
      width,
      r: 0,
      prevR: 0,
      damage: damageOf(ctx, stats),
      color: elementColor(weapon.element),
      hitEnemies: new Set(),
    });
    return true;
  }

  function update(ctx, _weapon, dt) {
    const position = playerPosition(ctx.player);
    for (let i = waves.length - 1; i >= 0; i -= 1) {
      const wave = waves[i];
      wave.x = position.x;
      wave.y = position.y;
      const limit = wave.radius + wave.width / 2;
      wave.prevR = wave.r;
      wave.r = Math.min(limit, wave.r + wave.speed * dt);

      for (const enemy of ctx.enemySystem?.enemies ?? []) {
        if (!enemy || enemy.alive === false || enemy.hp <= 0) continue;
        if (wave.hitEnemies.has(enemy)) continue;
        const center = enemyCenter(enemy);
        const distance = Math.hypot(center.x - wave.x, center.y - wave.y);
        const margin = enemyMargin(enemy);
        if (distance + margin < wave.prevR) continue;
        if (distance - margin > wave.r) continue;
        hitEnemy(ctx, enemy, wave.damage);
        wave.hitEnemies.add(enemy);
      }

      const remaining = Math.max(0, (limit - wave.r) / wave.width);
      wave.graphic.clear();
      wave.graphic.circle(wave.x, wave.y, wave.r).stroke({
        color: wave.color,
        width: wave.width,
        alpha: 0.25 + 0.55 * remaining,
      });

      if (wave.r >= limit) {
        wave.graphic.destroy();
        waves.splice(i, 1);
      }
    }
  }

  function reset() {
    for (const wave of waves) wave.graphic.destroy();
    waves.length = 0;
  }

  return { activate, update, reset };
}
