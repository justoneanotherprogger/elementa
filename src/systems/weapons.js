import { Graphics } from "pixi.js";
import { STARTER_WEAPON } from "../data/weapons.js";

const HALFW = 17;
const HALFH = 25;

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
  return [
    { x: enemy.x - HALFW, y: enemy.y - HALFH },
    { x: enemy.x + HALFW, y: enemy.y - HALFH },
    { x: enemy.x - HALFW, y: enemy.y + HALFH },
    { x: enemy.x + HALFW, y: enemy.y + HALFH },
  ];
}

export function createWeaponSystem(app, player, enemySystem) {
  const weapons = [STARTER_WEAPON];
  for (const weapon of weapons) {
    weapon.cd = weapon.base.cd;
    weapon.timer = 0;
  }

  const slashes = [];

  function enemies() {
    return enemySystem?.enemies ?? [];
  }

  function findNearest(px, py, radius) {
    let nearest = { enemy: null, point: null, dist: radius };
    for (const enemy of enemies()) {
      if (!enemy || enemy.alive === false || enemy.hp <= 0) continue;
      for (const point of enemyCorners(enemy)) {
        const dx = point.x - px;
        const dy = point.y - py;
        const dist = Math.hypot(dx, dy);
        if (dist <= radius && dist < nearest.dist) {
          nearest = { enemy, point, dist };
        }
      }
    }
    if (!nearest.enemy) return null;
    return nearest;
  }

  function damageSector(px, py, dirX, dirY, radius, halfAngle, amount) {
    const baseAngle = Math.atan2(dirY, dirX);
    for (const enemy of enemies()) {
      if (!enemy || enemy.alive === false || enemy.hp <= 0) continue;
      let hit = false;
      for (const corner of enemyCorners(enemy)) {
        const dx = corner.x - px;
        const dy = corner.y - py;
        const dist = Math.hypot(dx, dy);
        if (dist > radius) continue;
        const dev = Math.abs(angleDelta(Math.atan2(dy, dx), baseAngle));
        if (dev <= halfAngle) {
          hit = true;
          break;
        }
      }
      if (hit) enemy.hp -= amount;
    }
  }

  function spawnSlash(px, py, angle, radius, halfAngle) {
    const start = angle - halfAngle;
    const end = angle + halfAngle;
    const graphic = new Graphics();
    graphic.moveTo(0, 0);
    graphic.lineTo(radius * Math.cos(start), radius * Math.sin(start));
    graphic.arc(0, 0, radius, start, end);
    graphic.closePath();
    graphic.fill({ color: 0xff7043, alpha: 0.3 });
    graphic.x = px;
    graphic.y = py;
    app.stage.addChild(graphic);
    slashes.push({ graphic, age: 0, life: 0.15 });
  }

  function update(dt) {
    // advance slash visuals
    for (let i = slashes.length - 1; i >= 0; i -= 1) {
      const slash = slashes[i];
      slash.age += dt;
      if (slash.age >= slash.life) {
        app.stage.removeChild(slash.graphic);
        slash.graphic.destroy();
        slashes.splice(i, 1);
      } else {
        slash.graphic.alpha = 1 - slash.age / slash.life;
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
      if (weapon.timer <= 0) {
        const pos = playerPosition(player);
        const originX = pos.x;
        const originY = pos.y;
        const radius = weapon.base.radius * areaMult;
        const best = findNearest(originX, originY, radius);
        if (best) {
          const dx = best.point.x - originX;
          const dy = best.point.y - originY;
          const dist = Math.hypot(dx, dy) || 1;
          const dirX = dx / dist;
          const dirY = dy / dist;
          const angle = Math.atan2(dirY, dirX);
          const halfAngle = (weapon.base.angleDeg * Math.PI) / 180 / 2;
          spawnSlash(originX, originY, angle, radius, halfAngle);
          damageSector(
            originX,
            originY,
            dirX,
            dirY,
            radius,
            halfAngle,
            weapon.base.dmg * dmgMult,
          );
          weapon.timer = weapon.cd;
        } else {
          weapon.timer = 0;
        }
      }
    }
  }

  return { weapons, update };
}
