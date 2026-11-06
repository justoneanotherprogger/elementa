import { Sprite, Graphics, Text } from "pixi.js";
import { updateStatuses } from "./statuses.js";
import { STATUSES } from "../data/elements.js";
import { spriteHalfWidth, spriteHalfHeight, spriteTopY } from "../core/spriteBounds.js";
import { spriteBounds, spriteHitBounds } from "../core/spriteBounds.js";
import { rollDamage } from "../core/damage.js";

export function createEnemySystem(app, player, spatialHash, texture, camera, hooks = {}) {
  const enemies = [];
  let kills = 0;
  let spawnTimer = 0;

  const maxEnemies = 500;
  const GOBLIN_BOTTOM_OFFSET = 25;
  const spawnInterval = 999;
  const enemySpeed = 60;
  const enemyHp = 8;
  app.stage.sortableChildren = true;
  const contactDamage = 8;
  const playerIFrames = 0.5;

  function spawnEnemy(speedMul = 1, hpMul = 1, scale = 1, isBoss = false) {
    if (enemies.length >= maxEnemies) return;

    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5, 131 / 160);
    sprite.scale.set(scale);
    sprite.zIndex = isBoss ? 2 : 0;
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

    const enemy = {
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
      scale,
      statuses: new Map(),
      reactCd: 0,
      baseSpeed: enemySpeed * speedMul,
      damageMult: 1,
      damageTakenMult: 1,
      statusIcons: new Map(),
      isBoss,
    };
    enemy.maxHp = Math.round(enemyHp * hpMul);
    const dangerWeight = (enemy.hp / 8) * (contactDamage / 5) * (enemy.speed / 60);
    enemy.xpReward = Math.max(1, Math.round(dangerWeight));
    enemy.hpBar = new Graphics();
    enemy.hpBar.visible = enemy.hp < enemy.maxHp;
    app.stage.addChild(enemy.hpBar);
    enemies.push(enemy);
  }

  const system = {
    enemies,
    camera,
    kills: 0,
    xpEarned: 0,
    spawnEnemy,
    maxEnemies,
    update(dt) {
      spawnTimer += dt;
      while (spawnTimer >= spawnInterval && enemies.length < maxEnemies) {
        spawnTimer -= spawnInterval;
        spawnEnemy();
      }

      updateStatuses(system, dt);

      const px = player.body ? player.body.x : (player.x ?? 0);
      const py = player.body ? player.body.y : (player.y ?? 0);

      for (const enemy of enemies) {
        const scale = enemy.scale;
        const dx = px - enemy.x;
        const dy = py - enemy.y;
        const distance = Math.hypot(dx, dy) || 1;
        enemy.vx = (dx / distance) * enemy.speed;
        enemy.vy = (dy / distance) * enemy.speed;
        enemy.x += enemy.vx * dt;
        enemy.y += enemy.vy * dt;
        enemy.sprite.x = enemy.x;
        enemy.sprite.y = enemy.y;
        enemy.hpBar.scale.set(scale);
        enemy.hpBar.x = enemy.x - 18 * scale;
        enemy.hpBar.y = enemy.y + GOBLIN_BOTTOM_OFFSET * scale;
        enemy.hpBar.visible = enemy.hp < enemy.maxHp;
        enemy.hpBar.clear();
        const ratio = enemy.maxHp
          ? Math.max(0, Math.min(1, enemy.hp / enemy.maxHp))
          : 0;
        enemy.hpBar.roundRect(0, 0, 36, 4, 2).fill(0x1b1410);
        enemy.hpBar.roundRect(0, 0, 36 * ratio, 4, 2).fill(0xe25555);
        enemy.hpBar.roundRect(0, 0, 36, 4, 2).stroke({ width: 1, color: 0x8a6d3b, alpha: 0.3 });
        if (enemy.vx < 0)
          enemy.sprite.scale.x = +Math.abs(enemy.sprite.scale.x || 1);
        else if (enemy.vx > 0)
          enemy.sprite.scale.x = -Math.abs(enemy.sprite.scale.x || 1);

        const statusIds = [...enemy.statuses.keys()];
        for (const [id, icon] of [...enemy.statusIcons.entries()]) {
          if (!enemy.statuses.has(id)) {
            icon.destroy();
            enemy.statusIcons.delete(id);
          }
        }
        for (const id of statusIds) {
          if (!enemy.statusIcons.has(id)) {
            const cfg = STATUSES[id];
            if (cfg?.icon) {
              const icon = new Text({ text: cfg.icon, style: { fontSize: 12 } });
              app.stage.addChild(icon);
              icon.anchor.set(0.5, 1);
              enemy.statusIcons.set(id, icon);
            }
          }
        }
        let iconOffset = -(statusIds.length - 1) * 8;
        for (const id of statusIds) {
          const icon = enemy.statusIcons.get(id);
          if (icon) {
            icon.x = enemy.x + iconOffset;
            icon.y = spriteTopY(enemy.sprite, enemy.y) - 4;
            iconOffset += 16;
          }
        }
      }

      for (let i = 0; i < enemies.length; i += 1) {
        for (let j = i + 1; j < enemies.length; j += 1) {
          const a = enemies[i];
          const b = enemies[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const halfX = spriteHalfWidth(a.sprite) + spriteHalfWidth(b.sprite);
          const halfY = spriteHalfHeight(a.sprite) + spriteHalfHeight(b.sprite);
          const overlapX = halfX - Math.abs(dx);
          const overlapY = halfY - Math.abs(dy);
          if (overlapX > 0 && overlapY > 0) {
            if (overlapX < overlapY) {
              const push = overlapX / 2;
              const sign = dx >= 0 ? 1 : -1;
              a.x -= sign * push;
              b.x += sign * push;
            } else {
              const push = overlapY / 2;
              const sign = dy >= 0 ? 1 : -1;
              a.y -= sign * push;
              b.y += sign * push;
            }
            a.sprite.x = a.x;
            a.sprite.y = a.y;
            b.sprite.x = b.x;
            b.sprite.y = b.y;
          }
        }
      }

      if (spatialHash) {
        spatialHash.clear();
        for (const enemy of enemies) spatialHash.add(enemy);
      }

      if (player.invuln <= 0) {
        const pB = spriteHitBounds(player.body, 0.1);
        for (const enemy of enemies) {
          const eB = spriteBounds(enemy.sprite);
          const overlapX = Math.min(pB.right, eB.right) - Math.max(pB.left, eB.left);
          const overlapY = Math.min(pB.bottom, eB.bottom) - Math.max(pB.top, eB.top);
          if (overlapX > 0 && overlapY > 0) {
            if (typeof player.takeDamage === "function") {
              player.takeDamage(rollDamage(contactDamage * enemy.damageMult));
            } else {
              player.hp -= rollDamage(contactDamage * enemy.damageMult);
              player.invuln = playerIFrames;
            }
            break;
          }
        }
      }

      const pBounds = spriteHitBounds(player.body, 0.1);
      for (const enemy of enemies) {
        const eBounds = spriteBounds(enemy.sprite);
        const overlapX = Math.min(pBounds.right, eBounds.right) - Math.max(pBounds.left, eBounds.left);
        const overlapY = Math.min(pBounds.bottom, eBounds.bottom) - Math.max(pBounds.top, eBounds.top);
        if (overlapX > 0 && overlapY > 0) {
          const push = overlapX < overlapY ? overlapX / 2 : overlapY / 2;
          if (overlapX < overlapY) {
            const sign = (enemy.sprite.x - (player.body?.x ?? px)) >= 0 ? 1 : -1;
            enemy.x += sign * push;
          } else {
            const sign = (enemy.sprite.y - (player.body?.y ?? py)) >= 0 ? 1 : -1;
            enemy.y += sign * push;
          }
          enemy.sprite.x = enemy.x;
          enemy.sprite.y = enemy.y;
        }
      }

      for (let i = enemies.length - 1; i >= 0; i -= 1) {
        const enemy = enemies[i];
        if (!enemy.alive || enemy.hp <= 0) {
          if (enemy.isBoss === true && typeof hooks.onBossDeath === "function") {
            hooks.onBossDeath(enemy.x, enemy.y);
          }
          if (enemy.statusIcons) {
            for (const icon of enemy.statusIcons.values()) icon.destroy();
            enemy.statusIcons.clear();
          }
          app.stage.removeChild(enemy.sprite);
          enemy.sprite.destroy();
          if (enemy.hpBar) {
            app.stage.removeChild(enemy.hpBar);
            enemy.hpBar.destroy();
          }
          system.xpEarned += enemy?.xpReward ?? 1;
          enemies.splice(i, 1);
          kills += 1;
        }
      }

      system.kills = kills;
    },
    reset() {
      for (const enemy of enemies) {
        if (enemy?.sprite) {
          if (enemy.statusIcons) {
            for (const icon of enemy.statusIcons.values()) icon.destroy();
            enemy.statusIcons.clear();
          }
          app.stage.removeChild(enemy.sprite);
          enemy.sprite.destroy();
        }
        if (enemy?.hpBar) {
          app.stage.removeChild(enemy.hpBar);
          enemy.hpBar.destroy();
        }
      }
      enemies.length = 0;
      spawnTimer = 0;
      kills = 0;
      this.kills = 0;
      this.xpEarned = 0;
    },
  };

  return system;
}
