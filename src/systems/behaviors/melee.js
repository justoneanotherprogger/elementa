import { Graphics } from "pixi.js";
import { spriteHalfWidth, spriteHalfHeight } from "../../core/spriteBounds.js";
import { hitEnemy } from "../combat.js";
import {
  damageOf,
  enemyMargin,
  findNearest,
  lastDirection,
  playerPosition,
  radiusOf,
} from "./common.js";

// Наведение шире радиуса удара: оружие поворачивается к врагу чуть за пределами
// досягаемости и обозначает намерение, даже если удар его не достанет.
const TARGET_RADIUS_MULT = 1.15;

function angleDelta(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

function enemyCorners(enemy) {
  const halfWidth = spriteHalfWidth(enemy.sprite);
  const halfHeight = spriteHalfHeight(enemy.sprite);
  return [
    { x: enemy.x - halfWidth, y: enemy.y - halfHeight },
    { x: enemy.x + halfWidth, y: enemy.y - halfHeight },
    { x: enemy.x - halfWidth, y: enemy.y + halfHeight },
    { x: enemy.x + halfWidth, y: enemy.y + halfHeight },
    { x: enemy.x, y: enemy.y },
  ];
}

function arcPoints(cx, cy, radius, start, end, steps) {
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const angle = start + ((end - start) * i) / steps;
    points.push(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  return points;
}

// Сектор и полоса — две геометрии одного примитива. Новая форма удара
// добавляется здесь, диспетчер оружия о ней не знает.
export function createMeleeBehavior() {
  const swings = [];

  function damageSector(ctx, swing, amount) {
    const baseAngle = Math.atan2(swing.dirY, swing.dirX);
    for (const enemy of ctx.enemySystem?.enemies ?? []) {
      if (!enemy || enemy.alive === false || enemy.hp <= 0) continue;
      if (swing.hitEnemies.has(enemy)) continue;

      let hit = false;
      const margin = enemyMargin(enemy);
      for (const corner of enemyCorners(enemy)) {
        const dx = corner.x - swing.originX;
        const dy = corner.y - swing.originY;
        const dist = Math.hypot(dx, dy);
        if (dist > swing.radius + margin) continue;
        const deviation = Math.abs(angleDelta(Math.atan2(dy, dx), baseAngle));
        if (deviation <= swing.halfAngle + 0.18) {
          hit = true;
          break;
        }
      }
      if (hit) {
        hitEnemy(ctx, enemy, amount);
        swing.hitEnemies.add(enemy);
      }
    }
  }

  function damageStrip(ctx, swing, amount) {
    for (const enemy of ctx.enemySystem?.enemies ?? []) {
      if (!enemy || enemy.alive === false || enemy.hp <= 0) continue;
      if (swing.hitEnemies.has(enemy)) continue;

      const margin = enemyMargin(enemy);
      let hit = false;
      for (const corner of enemyCorners(enemy)) {
        const dx = corner.x - swing.originX;
        const dy = corner.y - swing.originY;
        const projection = dx * swing.dirX + dy * swing.dirY;
        if (projection < 0 || projection > swing.radius + margin) continue;
        const perpendicular = Math.abs(dx * swing.dirY - dy * swing.dirX);
        if (perpendicular <= swing.halfWidth + margin) {
          hit = true;
          break;
        }
      }
      if (hit) {
        hitEnemy(ctx, enemy, amount);
        swing.hitEnemies.add(enemy);
      }
    }
  }

  function spawnSlash(ctx, px, py, angle, radius, halfAngle, amount, duration = 0.34) {
    const scale = duration / 0.34;
    const start = angle - halfAngle;
    const end = angle + halfAngle;
    const graphic = new Graphics();
    graphic.moveTo(0, 0);
    graphic.lineTo(radius * Math.cos(start), radius * Math.sin(start));
    graphic.arc(0, 0, radius, start, end);
    graphic.closePath();
    graphic.fill({ color: 0xff7043, alpha: 0.18 });
    ctx.app.stage.addChild(graphic);
    const swing = {
      kind: "slash",
      graphic,
      age: 0,
      life: duration,
      damageStart: 0.13 * scale,
      damageEnd: 0.3 * scale,
      rate: scale,
      originX: px,
      originY: py,
      dirX: Math.cos(angle),
      dirY: Math.sin(angle),
      radius,
      halfAngle,
      amount,
      hitEnemies: new Set(),
    };
    swings.push(swing);
    return swing;
  }

  // Лопасть — тот же взмах серпа, но с бесконечной жизнью: направление
  // поворачивается каждый кадр, а попадания чистятся раз за оборот.
  function spinSpeed(weapon, stats) {
    return (Math.PI * 2) / Math.max(0.2, weapon?.cd ?? stats.cd ?? 1);
  }

  function spawnSpin(ctx, weapon, stats, radius, amount) {
    const position = playerPosition(ctx.player);
    const fallback = lastDirection(ctx.player);
    const angle = Math.atan2(fallback.y, fallback.x);
    const spin = spawnSlash(
      ctx,
      position.x,
      position.y,
      angle,
      radius,
      ((stats.bladeDeg ?? 100) * Math.PI) / 360,
      amount,
    );
    spin.kind = "spin";
    spin.angle = angle;
    spin.age = 0.12;
    spin.life = Infinity;
    spin.speed = spinSpeed(weapon, stats);
    spin.spun = 0;
    return spin;
  }

  function spawnThrust(ctx, px, py, angle, radius, halfWidth, amount) {
    const graphic = new Graphics();
    const tipLength = 10;
    graphic
      .rect(0, -halfWidth, radius, halfWidth * 2)
      .fill({ color: 0x2196f3, alpha: 0.12 });
    graphic.moveTo(radius, -halfWidth * 0.75);
    graphic.lineTo(radius + tipLength, 0);
    graphic.lineTo(radius, halfWidth * 0.75);
    graphic.closePath();
    graphic.fill({ color: 0x2196f3, alpha: 0.28 });
    ctx.app.stage.addChild(graphic);
    swings.push({
      kind: "thrust",
      graphic,
      age: 0,
      life: 0.32,
      damageStart: 0.1,
      damageEnd: 0.28,
      originX: px,
      originY: py,
      dirX: Math.cos(angle),
      dirY: Math.sin(angle),
      radius,
      halfWidth,
      amount,
      hitEnemies: new Set(),
    });
  }

  function activate(ctx, weapon, stats) {
    const position = playerPosition(ctx.player);
    const radius = radiusOf(ctx, stats);
    const amount = damageOf(ctx, stats);
    const kind = stats.kind ?? "slash";

    if (kind === "spin") {
      const spin = swings.find((entry) => entry.kind === "spin");
      if (spin) {
        spin.speed = spinSpeed(weapon, stats);
        spin.radius = radius;
        spin.halfAngle = ((stats.bladeDeg ?? 100) * Math.PI) / 360;
        spin.amount = amount;
      } else {
        spawnSpin(ctx, weapon, stats, radius, amount);
      }
      return true;
    }

    const bodyHalfHeight = spriteHalfHeight(ctx.player.body);
    const best = findNearest(
      ctx,
      position.x,
      position.y,
      radius * TARGET_RADIUS_MULT,
      bodyHalfHeight,
    );

    let dirX;
    let dirY;
    if (best) {
      const dx = best.point.x - position.x;
      const dy = best.point.y - position.y;
      const dist = Math.hypot(dx, dy) || 1;
      dirX = dx / dist;
      dirY = dy / dist;
    } else {
      const fallback = lastDirection(ctx.player);
      dirX = fallback.x;
      dirY = fallback.y;
    }

    const angle = Math.atan2(dirY, dirX);
    if (kind === "thrust") {
      spawnThrust(
        ctx,
        position.x,
        position.y,
        angle,
        radius,
        (stats.width ?? 20) / 2,
        amount,
      );
    } else {
      const halfAngle = ((stats.angleDeg ?? 120) * Math.PI) / 180 / 2;
      const duration = stats.durationFromCd
        ? Math.max(0.34, weapon?.cd ?? stats.cd ?? 1)
        : 0.34;
      spawnSlash(
        ctx,
        position.x,
        position.y,
        angle,
        radius,
        halfAngle,
        amount,
        duration,
      );
    }
    return true;
  }

  function renderSlash(swing) {
    const origin = { x: swing.originX, y: swing.originY };
    swing.graphic.clear();
    const specs = [
      {
        spanMult: 1.0,
        rInMul: 0.4,
        rOutMul: 1.1,
        color: 0x2e6fd0,
        core: null,
        life: 0.21,
        delay: 0.0,
        alpha: 0.45,
      },
      {
        spanMult: 0.99,
        rInMul: 0.44,
        rOutMul: 1.02,
        color: 0x7fc4ff,
        core: 0xeaf6ff,
        life: 0.19,
        delay: 0.022,
        alpha: 0.9,
      },
      {
        spanMult: 0.92,
        rInMul: 0.58,
        rOutMul: 0.94,
        color: 0x7fc4ff,
        core: 0xffffff,
        life: 0.16,
        delay: 0.048,
        alpha: 1.0,
      },
    ];
    const rate = swing.rate ?? 1;
    for (const spec of specs) {
      const t = (swing.age - spec.delay * rate) / rate;
      if (t < 0 || t >= spec.life) continue;
      const p = Math.min(1, t / (spec.life * 0.6));
      const fade = 1 - Math.max(0, (t - spec.life * 0.4) / (spec.life * 0.6));
      const grow = 1 + 0.14 * (t / spec.life);
      const ease = 1 - Math.pow(1 - p, 4);
      const span = swing.halfAngle * 2 * spec.spanMult;
      const baseAngle = Math.atan2(swing.dirY, swing.dirX);
      const a0 = baseAngle - span / 2;
      const a1 = a0 + span * ease;
      const rIn = swing.radius * spec.rInMul * grow;
      const rOut = swing.radius * spec.rOutMul * grow;
      const alpha = spec.alpha * Math.pow(Math.max(0, fade), 1.5);
      if (alpha <= 0.015) continue;
      const outer = arcPoints(origin.x, origin.y, rOut, a0, a1, 22);
      const inner = arcPoints(origin.x, origin.y, rIn, a1, a0, 22);
      swing.graphic
        .poly([...outer, ...inner])
        .closePath()
        .fill({ color: spec.color, alpha: (spec.core ? 0.32 : 0.2) * alpha });
      if (spec.core) {
        const mid = arcPoints(origin.x, origin.y, (rIn + rOut) / 2, a0, a1, 22);
        const back = arcPoints(origin.x, origin.y, rOut, a1, a0, 22);
        swing.graphic
          .poly([...mid, ...back])
          .closePath()
          .fill({ color: spec.core, alpha: 0.6 * alpha });
      }
      swing.graphic.poly(outer, false).stroke({
        width: 3,
        color: spec.core ?? spec.color,
        alpha: 0.9 * alpha,
      });
    }
  }

  function renderThrust(swing) {
    const p =
      swing.age < 0.1
        ? swing.age / 0.1
        : swing.age < 0.16
          ? 1
          : 1 - (swing.age - 0.16) / 0.16;
    const beamLen = swing.radius * Math.max(0.06, p);
    const cx = swing.originX;
    const cy = swing.originY;
    const ux = swing.dirX;
    const uy = swing.dirY;
    const vx = -uy;
    const vy = ux;
    const width = swing.halfWidth * (1.12 - 0.3 * p);
    const k = swing.age / swing.life;
    const alpha = Math.pow(1 - k, 1.6);
    swing.graphic.clear();
    const quad = (halfWidth, color, opacity) => {
      swing.graphic
        .poly([
          cx + ux * 20 + vx * halfWidth,
          cy + uy * 20 + vy * halfWidth,
          cx + ux * beamLen + vx * halfWidth * 0.45,
          cy + uy * beamLen + vy * halfWidth * 0.45,
          cx + ux * beamLen - vx * halfWidth * 0.45,
          cy + uy * beamLen - vy * halfWidth * 0.45,
          cx + ux * 20 - vx * halfWidth,
          cy + uy * 20 - vy * halfWidth,
        ])
        .closePath()
        .fill({ color, alpha: Math.max(0, opacity) });
    };
    quad(width * 2.1, 0xff9a3d, 0.15 * alpha);
    quad(width * 1.15, 0xffc46b, 0.4 * alpha);
    quad(width * 0.5, 0xfff7e0, 0.85 * alpha);
    const tipLen = 12;
    const tip = [
      cx + ux * beamLen + vx * (width * 0.75),
      cy + uy * beamLen + vy * (width * 0.75),
      cx + ux * (beamLen + tipLen),
      cy + uy * (beamLen + tipLen),
      cx + ux * beamLen - vx * (width * 0.75),
      cy + uy * beamLen - vy * (width * 0.75),
    ];
    swing.graphic
      .poly(tip)
      .closePath()
      .fill({ color: 0xfff7e0, alpha: Math.max(0, 0.95 * alpha) });
    swing.graphic
      .poly(tip)
      .closePath()
      .stroke({ width: 1.5, color: 0xff9a3d, alpha: Math.max(0, 0.6 * alpha) });
  }

  function update(ctx, _weapon, dt) {
    for (let i = swings.length - 1; i >= 0; i -= 1) {
      const swing = swings[i];
      if (swing.kind === "spin") {
        const position = playerPosition(ctx.player);
        swing.originX = position.x;
        swing.originY = position.y;
        const step = swing.speed * dt;
        swing.angle += step;
        swing.spun += step;
        if (swing.spun >= Math.PI * 2) {
          swing.spun -= Math.PI * 2;
          swing.hitEnemies.clear();
        }
        swing.dirX = Math.cos(swing.angle);
        swing.dirY = Math.sin(swing.angle);
        swing.age = 0.12;
        damageSector(ctx, swing, swing.amount);
        renderSlash(swing);
        continue;
      }
      swing.age += dt;
      if (swing.age >= swing.damageStart && swing.age <= swing.damageEnd) {
        if (swing.kind === "thrust") damageStrip(ctx, swing, swing.amount);
        else damageSector(ctx, swing, swing.amount);
      }
      if (swing.age >= swing.life) {
        ctx.app.stage.removeChild(swing.graphic);
        swing.graphic.destroy();
        swings.splice(i, 1);
      } else if (swing.kind === "thrust") {
        renderThrust(swing);
      } else {
        renderSlash(swing);
      }
    }
  }

  function reset() {
    for (const swing of swings) {
      swing.graphic.destroy();
    }
    swings.length = 0;
  }

  return { activate, update, reset };
}
