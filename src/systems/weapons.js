import { Graphics } from "pixi.js";
import { applyStatus } from "./statuses.js";
import { STARTER_WEAPON } from "../data/weapons.js";
import { spriteHalfWidth, spriteHalfHeight } from "../core/spriteBounds.js";
import { rollDamage } from "../core/damage.js";

function playerPosition(player) {
  if (player?.body) return { x: player.body.x, y: player.body.y };
  return { x: player?.x ?? 0, y: player?.y ?? 0 };
}

function angleDelta(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

function enemyCorners(enemy) {
  const hw = spriteHalfWidth(enemy.sprite);
  const hh = spriteHalfHeight(enemy.sprite);
  return [
    { x: enemy.x - hw, y: enemy.y - hh },
    { x: enemy.x + hw, y: enemy.y - hh },
    { x: enemy.x - hw, y: enemy.y + hh },
    { x: enemy.x + hw, y: enemy.y + hh },
    { x: enemy.x, y: enemy.y },
  ];
}

function enemyCenter(enemy) {
  const sprite = enemy?.sprite;
  const x = sprite?.x ?? enemy?.x ?? 0;
  const y = sprite?.y ?? enemy?.y ?? 0;
  const height = sprite?.height ?? 0;
  const anchorY = sprite?.anchor?.y ?? 0.5;
  return { x, y: y - height * (anchorY - 0.5) };
}

function cloneWeapon(config) {
  const copy = { ...config, base: { ...(config?.base ?? {}) } };
  copy.cd = copy.base.cd ?? 1;
  copy.timer = 0;
  return copy;
}

export function createWeaponSystem(app, player, enemySystem, initialWeapons = [STARTER_WEAPON], reactionSystem = null) {
  const weapons = initialWeapons.map(cloneWeapon);
  const slashes = [];
  const thrusts = [];

  function enemies() {
    return enemySystem?.enemies ?? [];
  }

  function findNearest(px, py, radius) {
    let nearest = { enemy: null, point: null, dist: radius };
    for (const enemy of enemies()) {
      if (!enemy || enemy.alive === false || enemy.hp <= 0) continue;
      const point = enemyCenter(enemy);
      const dx = point.x - px;
      const dy = point.y - py;
      const dist = Math.hypot(dx, dy);
      if (dist <= radius && dist < nearest.dist) {
        nearest = { enemy, point, dist };
      }
    }
    if (!nearest.enemy) return null;
    return nearest;
  }

  function damageSector(px, py, dirX, dirY, radius, halfAngle, amount, element, hitTargets = null) {
    const baseAngle = Math.atan2(dirY, dirX);
    for (const enemy of enemies()) {
      if (!enemy || enemy.alive === false || enemy.hp <= 0) continue;
      if (hitTargets?.has(enemy)) continue;

      let hit = false;
      const enemyMargin = Math.max(2, Math.max(spriteHalfWidth(enemy.sprite), spriteHalfHeight(enemy.sprite)) * 0.35);
      for (const corner of enemyCorners(enemy)) {
        const dx = corner.x - px;
        const dy = corner.y - py;
        const dist = Math.hypot(dx, dy);
        if (dist > radius + enemyMargin) continue;
        const dev = Math.abs(angleDelta(Math.atan2(dy, dx), baseAngle));
        if (dev <= halfAngle + 0.18) {
          hit = true;
          break;
        }
      }
      if (hit) {
        enemy.hp -= rollDamage(amount * (enemy.damageTakenMult ?? 1));
        applyStatus(enemy, element, amount);
        reactionSystem?.handleHit(enemy, element, amount);
        hitTargets?.add(enemy);
      }
    }
  }

  function spawnSlash(px, py, angle, radius, halfAngle, amount, element) {
    const start = angle - halfAngle;
    const end = angle + halfAngle;
    const graphic = new Graphics();
    graphic.moveTo(0, 0);
    graphic.lineTo(radius * Math.cos(start), radius * Math.sin(start));
    graphic.arc(0, 0, radius, start, end);
    graphic.closePath();
    graphic.fill({ color: 0xff7043, alpha: 0.18 });
    graphic.x = 0;
    graphic.y = 0;
    app.stage.addChild(graphic);
    slashes.push({
      graphic,
      age: 0,
      life: 0.34,
      damageStart: 0.13,
      damageEnd: 0.30,
      originX: px,
      originY: py,
      dirX: Math.cos(angle),
      dirY: Math.sin(angle),
      radius,
      halfAngle,
      amount,
      element,
      hitEnemies: new Set(),
    });
  }

  function spawnThrust(px, py, angle, radius, halfWidth, amount, element) {
    const graphic = new Graphics();
    const tipLength = 10;
    graphic.rect(0, -halfWidth, radius, halfWidth * 2).fill({ color: 0x2196f3, alpha: 0.12 });
    graphic.moveTo(radius, -halfWidth * 0.75);
    graphic.lineTo(radius + tipLength, 0);
    graphic.lineTo(radius, halfWidth * 0.75);
    graphic.closePath();
    graphic.fill({ color: 0x2196f3, alpha: 0.28 });
    graphic.x = 0;
    graphic.y = 0;
    app.stage.addChild(graphic);
    thrusts.push({
      graphic,
      age: 0,
      life: 0.32,
      damageStart: 0.10,
      damageEnd: 0.28,
      originX: px,
      originY: py,
      dirX: Math.cos(angle),
      dirY: Math.sin(angle),
      radius,
      halfWidth,
      amount,
      element,
      hitEnemies: new Set(),
    });
  }

  function addWeapon(config) {
    if (!config || weapons.some((weapon) => weapon.id === config.id)) return false;
    weapons.push(cloneWeapon(config));
    return true;
  }

  function update(dt) {
    for (let i = slashes.length - 1; i >= 0; i -= 1) {
      const slash = slashes[i];
      slash.age += dt;
      if (slash.age >= slash.damageStart && slash.age <= slash.damageEnd) {
        damageSector(
          slash.originX,
          slash.originY,
          slash.dirX,
          slash.dirY,
          slash.radius,
          slash.halfAngle,
          slash.amount,
          slash.element,
          slash.hitEnemies
        );
      }
      if (slash.age >= slash.life) {
        app.stage.removeChild(slash.graphic);
        slash.graphic.destroy();
        slashes.splice(i, 1);
      } else {
        const o = { x: slash.originX, y: slash.originY };
        slash.graphic.clear();
        const specs = [
          { spanMult: 1.00, rInMul: 0.40, rOutMul: 1.10, color: 0x2e6fd0, core: null, life: 0.21, delay: 0.000, alpha: 0.45 },
          { spanMult: 0.99, rInMul: 0.44, rOutMul: 1.02, color: 0x7fc4ff, core: 0xeaf6ff, life: 0.19, delay: 0.022, alpha: 0.90 },
          { spanMult: 0.92, rInMul: 0.58, rOutMul: 0.94, color: 0x7fc4ff, core: 0xffffff, life: 0.16, delay: 0.048, alpha: 1.00 },
        ];
        for (let j = 0; j < specs.length; j += 1) {
          const spec = specs[j];
          const t = slash.age - spec.delay;
          if (t < 0) continue;
          if (t >= spec.life) continue;
          const p = Math.min(1, t / (spec.life * 0.6));
          const fade = 1 - Math.max(0, (t - spec.life * 0.4) / (spec.life * 0.6));
          const grow = 1 + 0.14 * (t / spec.life);
          const ease = 1 - Math.pow(1 - p, 4);
          const span = slash.halfAngle * 2 * spec.spanMult;
          const baseAngle = Math.atan2(slash.dirY, slash.dirX);
          const a0 = baseAngle - span / 2;
          const a1 = a0 + span * ease;
          const rIn = slash.radius * spec.rInMul * grow;
          const rOut = slash.radius * spec.rOutMul * grow;
          const al = spec.alpha * Math.pow(Math.max(0, fade), 1.5);
          if (al <= 0.015) continue;
          function arcPts(cx, cy, r, start, end, n) {
            const pts = [];
            for (let i = 0; i <= n; i += 1) {
              const a = start + (end - start) * i / n;
              pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
            }
            return pts;
          }
          const outer = arcPts(o.x, o.y, rOut, a0, a1, 22);
          const inner = arcPts(o.x, o.y, rIn, a1, a0, 22);
          slash.graphic.poly([...outer, ...inner]).closePath().fill({ color: spec.color, alpha: (spec.core ? 0.32 : 0.20) * al });
          if (spec.core) {
            slash.graphic.poly([...arcPts(o.x, o.y, (rIn + rOut) / 2, a0, a1, 22), ...arcPts(o.x, o.y, rOut, a1, a0, 22)]).closePath().fill({ color: spec.core, alpha: 0.6 * al });
          }
          slash.graphic.poly(outer, false).stroke({ width: 3, color: spec.core ?? spec.color, alpha: 0.9 * al });
        }
      }
    }

    for (let i = thrusts.length - 1; i >= 0; i -= 1) {
      const thrust = thrusts[i];
      thrust.age += dt;
      if (thrust.age >= thrust.damageStart && thrust.age <= thrust.damageEnd) {
        for (const enemy of enemies()) {
          if (!enemy || enemy.alive === false || enemy.hp <= 0) continue;
          if (thrust.hitEnemies.has(enemy)) continue;

          const dx = enemy.x - thrust.originX;
          const dy = enemy.y - thrust.originY;
          const margin = Math.max(3, Math.max(spriteHalfWidth(enemy.sprite), spriteHalfHeight(enemy.sprite)) * 0.4);
          const projection = dx * thrust.dirX + dy * thrust.dirY;
          if (projection < 0 || projection > thrust.radius + margin) continue;
          const perpendicular = Math.abs(dx * thrust.dirY - dy * thrust.dirX);
          if (perpendicular > thrust.halfWidth + margin) continue;

          let hit = false;
          for (const corner of enemyCorners(enemy)) {
            const cdx = corner.x - thrust.originX;
            const cdy = corner.y - thrust.originY;
            const margin = Math.max(3, Math.max(spriteHalfWidth(enemy.sprite), spriteHalfHeight(enemy.sprite)) * 0.4);
            const proj = cdx * thrust.dirX + cdy * thrust.dirY;
            if (proj < 0 || proj > thrust.radius + margin) continue;
            const perp = Math.abs(cdx * thrust.dirY - cdy * thrust.dirX);
            if (perp <= thrust.halfWidth + margin) {
              hit = true;
              break;
            }
          }
          if (hit) {
            enemy.hp -= rollDamage(thrust.amount * (enemy.damageTakenMult ?? 1));
            applyStatus(enemy, thrust.element, thrust.amount);
            reactionSystem?.handleHit(enemy, thrust.element, thrust.amount);
            thrust.hitEnemies.add(enemy);
          }
        }
      }
      if (thrust.age >= thrust.life) {
        app.stage.removeChild(thrust.graphic);
        thrust.graphic.destroy();
        thrusts.splice(i, 1);
      } else {
        const p = thrust.age < 0.10
          ? thrust.age / 0.10
          : thrust.age < 0.16
            ? 1
            : 1 - (thrust.age - 0.16) / 0.16;
        const beamLen = thrust.radius * Math.max(0.06, p);
        const cx = thrust.originX;
        const cy = thrust.originY;
        const ux = thrust.dirX;
        const uy = thrust.dirY;
        const vx = -uy;
        const vy = ux;
        const w = thrust.halfWidth * (1.12 - 0.3 * p);
        const k = thrust.age / thrust.life;
        const al = Math.pow(1 - k, 1.6);
        thrust.graphic.clear();
        const quad = (ww, color, alpha) => {
          thrust.graphic.poly([
            cx + ux * 20 + vx * ww, cy + uy * 20 + vy * ww,
            cx + ux * beamLen + vx * ww * 0.45, cy + uy * beamLen + vy * ww * 0.45,
            cx + ux * beamLen - vx * ww * 0.45, cy + uy * beamLen - vy * ww * 0.45,
            cx + ux * 20 - vx * ww, cy + uy * 20 - vy * ww,
          ]).closePath().fill({ color, alpha: Math.max(0, alpha) });
        };
        quad(w * 2.1, 0xff9a3d, 0.15 * al);
        quad(w * 1.15, 0xffc46b, 0.40 * al);
        quad(w * 0.50, 0xfff7e0, 0.85 * al);
        const tipLen = 12;
        thrust.graphic.poly([
          cx + ux * beamLen + vx * (w * 0.75), cy + uy * beamLen + vy * (w * 0.75),
          cx + ux * (beamLen + tipLen), cy + uy * (beamLen + tipLen),
          cx + ux * beamLen - vx * (w * 0.75), cy + uy * beamLen - vy * (w * 0.75),
        ]).closePath().fill({ color: 0xfff7e0, alpha: Math.max(0, 0.95 * al) });
        thrust.graphic.poly([
          cx + ux * beamLen + vx * (w * 0.75), cy + uy * beamLen + vy * (w * 0.75),
          cx + ux * (beamLen + tipLen), cy + uy * (beamLen + tipLen),
          cx + ux * beamLen - vx * (w * 0.75), cy + uy * beamLen - vy * (w * 0.75),
        ]).closePath().stroke({ width: 1.5, color: 0xff9a3d, alpha: Math.max(0, 0.6 * al) });
      }
    }

    const dmgMult = player.dmgMult ?? 1;
    const aspdMult = player.aspdMult ?? 1;
    const areaMult = player.areaMult ?? 1;

    for (const weapon of weapons) {
      if (weapon.timer === undefined) weapon.timer = 0;
      if (weapon.cd === undefined) weapon.cd = weapon.base.cd;
      weapon.cd = weapon.base.cd / Math.max(0.1, aspdMult);
      weapon.timer -= dt;

      if (weapon.timer > 0) continue;

      const pos = playerPosition(player);
      const originX = pos.x;
      const originY = pos.y;
      const radius = weapon.base.radius * areaMult;
      const kind = weapon.base.kind ?? "slash";
      const amount = weapon.base.dmg * dmgMult;
      const lastDir = player.lastMoveDir ?? { x: 0, y: -1 };
      const lastMag = Math.hypot(lastDir.x, lastDir.y) || 1;

      if (kind === "thrust") {
        const best = findNearest(originX, originY, radius);
        let dirX = lastDir.x / lastMag;
        let dirY = lastDir.y / lastMag;
        if (best) {
          const dx = best.point.x - originX;
          const dy = best.point.y - originY;
          const dist = Math.hypot(dx, dy) || 1;
          dirX = dx / dist;
          dirY = dy / dist;
        }

        const angle = Math.atan2(dirY, dirX);
        const halfWidth = (weapon.base.width ?? 20) / 2;
        spawnThrust(originX, originY, angle, radius, halfWidth, amount, weapon.element);
        weapon.timer = weapon.cd;
      } else {
        const best = findNearest(originX, originY, radius);
        if (best) {
          const dx = best.point.x - originX;
          const dy = best.point.y - originY;
          const dist = Math.hypot(dx, dy) || 1;
          const dirX = dx / dist;
          const dirY = dy / dist;
          const angle = Math.atan2(dirY, dirX);
          const halfAngle = (weapon.base.angleDeg * Math.PI) / 180 / 2;
          spawnSlash(originX, originY, angle, radius, halfAngle, amount, weapon.element);
          weapon.timer = weapon.cd;
        } else {
          const lastDir2 = player.lastMoveDir ?? { x: 0, y: -1 };
          const lastMag2 = Math.hypot(lastDir2.x, lastDir2.y) || 1;
          const dirX = lastDir2.x / lastMag2;
          const dirY = lastDir2.y / lastMag2;
          const angle = Math.atan2(dirY, dirX);
          const halfAngle = (weapon.base.angleDeg * Math.PI) / 180 / 2;
          spawnSlash(originX, originY, angle, radius, halfAngle, amount, weapon.element);
          weapon.timer = weapon.cd;
        }
      }
    }
  }

  return { weapons, update, addWeapon };
}