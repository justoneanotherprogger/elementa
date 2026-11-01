import { Sprite } from "pixi.js";

export function createEnemySystem(app, player, spatialHash, texture, camera) {
  const enemies = [];
  let kills = 0;
  let spawnTimer = 0;

  const maxEnemies = 500;
  const spawnInterval = 999;
  const enemySpeed = 60;
  const enemyHp = 8;
  const separationRadius = 28;
  const contactDamage = 8;
  const playerIFrames = 0.5;

  function spawnEnemy(speedMul = 1, hpMul = 1, scale = 1) {
    if (enemies.length >= maxEnemies) return;

    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5, 131 / 160);
    sprite.scale.set(scale);
    app.stage.addChild(sprite);

    const cam = camera || { x: 0, y: 0 };
    const w = app.screen.width;
    const h = app.screen.height;
    const side = Math.floor(Math.random() * 4);
    let x;
    let y;
    if (side === 0) {
      x = cam.x - w / 2 + Math.random() * w;
      y = cam.y - h / 2 - 20;
    } else if (side === 1) {
      x = cam.x + w / 2 + 20;
      y = cam.y - h / 2 + Math.random() * h;
    } else if (side === 2) {
      x = cam.x - w / 2 + Math.random() * w;
      y = cam.y + h / 2 + 20;
    } else {
      x = cam.x - w / 2 - 20;
      y = cam.y - h / 2 + Math.random() * h;
    }
    sprite.x = x;
    sprite.y = y;

    enemies.push({
      sprite,
      x,
      y,
      vx: 0,
      vy: 0,
      hp: Math.round(enemyHp * hpMul),
      r: 14,
      speed: enemySpeed * speedMul,
      alive: true,
      xpReward: 1,
    });
  }

  const system = {
    enemies,
    camera,
    kills: 0,
    spawnEnemy,
    maxEnemies,
    update(dt) {
      spawnTimer += dt;
      while (spawnTimer >= spawnInterval && enemies.length < maxEnemies) {
        spawnTimer -= spawnInterval;
        spawnEnemy();
      }

      const px = player.body ? player.body.x : (player.x ?? 0);
      const py = player.body ? player.body.y : (player.y ?? 0);

      // movement toward player
      for (const enemy of enemies) {
        const dx = px - enemy.x;
        const dy = py - enemy.y;
        const distance = Math.hypot(dx, dy) || 1;
        enemy.vx = (dx / distance) * enemy.speed;
        enemy.vy = (dy / distance) * enemy.speed;
        enemy.x += enemy.vx * dt;
        enemy.y += enemy.vy * dt;
        enemy.sprite.x = enemy.x;
        enemy.sprite.y = enemy.y;
        if (enemy.vx < 0)
          enemy.sprite.scale.x = +Math.abs(enemy.sprite.scale.x || 1);
        else if (enemy.vx > 0)
          enemy.sprite.scale.x = -Math.abs(enemy.sprite.scale.x || 1);
      }

      // simple separation
      for (let i = 0; i < enemies.length; i += 1) {
        for (let j = i + 1; j < enemies.length; j += 1) {
          const a = enemies[i];
          const b = enemies[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < separationRadius) {
            const push = (separationRadius - distance) / 2;
            const nx = dx / distance;
            const ny = dy / distance;
            a.x -= nx * push;
            a.y -= ny * push;
            b.x += nx * push;
            b.y += ny * push;
            a.sprite.x = a.x;
            a.sprite.y = a.y;
            b.sprite.x = b.x;
            b.sprite.y = b.y;
          }
        }
      }

      // spatial hash refresh
      if (spatialHash) {
        spatialHash.clear();
        for (const enemy of enemies) spatialHash.add(enemy);
      }

      // contact damage
      if (player.invuln <= 0) {
        const halfW = Math.max(1, (player.body?.width ?? 160) / 2 - 6);
        const halfH = Math.max(1, (player.body?.height ?? 160) / 2 - 6);
        for (const enemy of enemies) {
          if (
            enemy.x >= px - halfW &&
            enemy.x <= px + halfW &&
            enemy.y >= py - halfH &&
            enemy.y <= py + halfH
          ) {
            if (typeof player.takeDamage === "function") {
              player.takeDamage(contactDamage);
            } else {
              player.hp -= contactDamage;
              player.invuln = playerIFrames;
            }
            break;
          }
        }
      }

      // death and removal
      for (let i = enemies.length - 1; i >= 0; i -= 1) {
        const enemy = enemies[i];
        if (!enemy.alive || enemy.hp <= 0) {
          app.stage.removeChild(enemy.sprite);
          enemy.sprite.destroy();
          enemies.splice(i, 1);
          kills += 1;
        }
      }

      system.kills = kills;
    },
    reset() {
      for (const enemy of enemies) {
        if (enemy?.sprite) {
          app.stage.removeChild(enemy.sprite);
          enemy.sprite.destroy();
        }
      }
      enemies.length = 0;
      spawnTimer = 0;
      kills = 0;
      this.kills = 0;
    },
  };

  return system;
}
