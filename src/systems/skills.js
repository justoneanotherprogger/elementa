import { Graphics } from "pixi.js";
import { SKILLS } from "../data/skills/index.js";
import { spriteHalfWidth, spriteHalfHeight } from "../core/spriteBounds.js";
import { hitEnemy } from "./combat.js";
import { ELEMENT_EFFECTS } from "../data/elements.js";

export const SKILL_SLOTS = 6;

function playerPosition(player) {
  if (player?.body) return { x: player.body.x, y: player.body.y };
  return { x: player?.x ?? 0, y: player?.y ?? 0 };
}

function enemyCenter(enemy) {
  const sprite = enemy?.sprite;
  const x = sprite?.x ?? enemy?.x ?? 0;
  const y = sprite?.y ?? enemy?.y ?? 0;
  const height = sprite?.height ?? 0;
  const anchorY = sprite?.anchor?.y ?? 0.5;
  return { x, y: y - height * (anchorY - 0.5) };
}

export function createSkillSystem(app, player, enemySystem, options = {}) {
  const reactionSystem = options.reactionSystem ?? null;
  let element = options.element ?? "fire";
  const slots = new Array(SKILL_SLOTS).fill(null);
  const projectiles = [];

  function enemies() {
    return enemySystem?.enemies ?? [];
  }

  function findNearest(px, py, radius) {
    let nearest = null;
    let bestDist = radius;
    for (const enemy of enemies()) {
      if (!enemy || enemy.alive === false || enemy.hp <= 0) continue;
      const point = enemyCenter(enemy);
      const dist = Math.hypot(point.x - px, point.y - py);
      if (dist <= bestDist) {
        bestDist = dist;
        nearest = enemy;
      }
    }
    return nearest;
  }

  function rankOf(id) {
    const slot = slots.find((entry) => entry?.id === id);
    return slot?.rank ?? 0;
  }

  function hasFreeSlot() {
    return slots.some((entry) => entry === null);
  }

  function grant(id) {
    const skill = SKILLS[id];
    if (!skill) return false;
    const existing = slots.find((entry) => entry?.id === id);
    if (existing) {
      if (existing.rank >= skill.ranks.length) return false;
      existing.rank += 1;
      return true;
    }
    if (!hasFreeSlot()) return false;
    slots[slots.indexOf(null)] = { id, rank: 1, timer: 0 };
    return true;
  }

  function statsAt(slot) {
    const skill = SKILLS[slot.id];
    return skill.ranks[Math.min(slot.rank, skill.ranks.length) - 1];
  }

  function cooldownOf(slot) {
    return Math.max(
      0.15,
      statsAt(slot).cooldown / Math.max(0.1, player.aspdMult ?? 1),
    );
  }

  function removeProjectile(index, projectile) {
    app.stage.removeChild(projectile.graphic);
    projectile.graphic.destroy();
    projectiles.splice(index, 1);
  }

  function spawnProjectile(slot, target) {
    const skill = SKILLS[slot.id];
    const stats = statsAt(slot);
    const pos = playerPosition(player);
    const point = enemyCenter(target);
    const dx = point.x - pos.x;
    const dy = point.y - pos.y;
    const dist = Math.hypot(dx, dy) || 1;

    const graphic = new Graphics();
    graphic
      .circle(0, 0, skill.hitRadius + 3)
      .fill({ color: skill.color, alpha: 0.18 });
    graphic
      .circle(0, 0, skill.hitRadius * 0.65)
      .fill({ color: skill.color, alpha: 0.95 });
    graphic
      .circle(0, 0, skill.hitRadius * 0.3)
      .fill({ color: 0xffffff, alpha: 0.9 });
    graphic.x = pos.x;
    graphic.y = pos.y;
    app.stage.addChild(graphic);

    projectiles.push({
      skill,
      graphic,
      x: pos.x,
      y: pos.y,
      dirX: dx / dist,
      dirY: dy / dist,
      speed: skill.projectileSpeed,
      damage: stats.damage * (player.dmgMult ?? 1),
      knockback: ELEMENT_EFFECTS[skill.element]?.knockback ?? 0,
      target,
      age: 0,
      life: 4,
    });
  }

  function findHitTarget(projectile) {
    for (const enemy of enemies()) {
      if (!enemy || enemy.alive === false || enemy.hp <= 0) continue;
      const point = enemyCenter(enemy);
      const margin = Math.max(
        2,
        Math.max(
          spriteHalfWidth(enemy.sprite),
          spriteHalfHeight(enemy.sprite),
        ) * 0.35,
      );
      const reach = projectile.skill.hitRadius + margin;
      if (Math.hypot(point.x - projectile.x, point.y - projectile.y) <= reach) {
        return enemy;
      }
    }
    return null;
  }

  // Толчок ветра привязан к попаданию: направление берётся из полёта
  // снаряда, а движение враг выполняет в своём кадре. Статусы — в hitEnemy.
  function applyKnockback(projectile, enemy) {
    if (projectile.knockback) {
      enemy.impulseX =
        (enemy.impulseX ?? 0) + projectile.dirX * projectile.knockback;
      enemy.impulseY =
        (enemy.impulseY ?? 0) + projectile.dirY * projectile.knockback;
    }
  }

  function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = projectiles[i];
      projectile.age += dt;

      const target = projectile.target;
      if (target && target.alive !== false && target.hp > 0) {
        const point = enemyCenter(target);
        const dx = point.x - projectile.x;
        const dy = point.y - projectile.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.001) {
          projectile.dirX = dx / dist;
          projectile.dirY = dy / dist;
        }
      }

      projectile.x += projectile.dirX * projectile.speed * dt;
      projectile.y += projectile.dirY * projectile.speed * dt;
      projectile.graphic.x = projectile.x;
      projectile.graphic.y = projectile.y;

      const hit = findHitTarget(projectile);
      if (hit) {
        hitEnemy(
          { enemySystem, reactionSystem },
          hit,
          projectile.damage,
          projectile.skill.element,
        );
        applyKnockback(projectile, hit);
        removeProjectile(i, projectile);
        continue;
      }

      if (projectile.age >= projectile.life) {
        removeProjectile(i, projectile);
      }
    }
  }

  function update(dt) {
    for (const slot of slots) {
      if (!slot) continue;
      slot.timer = Math.max(0, slot.timer - dt);
      if (slot.timer > 0) continue;

      const skill = SKILLS[slot.id];
      const pos = playerPosition(player);
      const target = findNearest(pos.x, pos.y, skill.range);
      if (!target) continue;

      spawnProjectile(slot, target);
      slot.timer = cooldownOf(slot);
    }
    updateProjectiles(dt);
  }

  function reset(nextElement) {
    element = nextElement ?? element;
    slots.fill(null);
    for (const projectile of projectiles) {
      app.stage.removeChild(projectile.graphic);
      projectile.graphic.destroy();
    }
    projectiles.length = 0;
  }

  return {
    slots,
    grant,
    rankOf,
    hasFreeSlot,
    reset,
    update,
    get element() {
      return element;
    },
  };
}
