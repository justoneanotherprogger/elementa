import { Graphics } from "pixi.js";
import { hitEnemy } from "../combat.js";
import {
  damageOf,
  durationOf,
  elementColor,
  enemyCenter,
  enemyMargin,
  findNearest,
  playerPosition,
  radiusOf,
} from "./common.js";

// Питомец — союзная сущность рядом с героем. Живёт ограниченное время,
// сам ищет цель, идёт к ней и бьёт по своему кулдауну.
export function createCompanionBehavior() {
  const pets = [];

  function spawn(ctx, weapon, stats) {
    const position = playerPosition(ctx.player);
    const angle = Math.random() * Math.PI * 2;
    const offset = 34;
    const color = elementColor(weapon.element);
    const graphic = new Graphics();
    graphic.circle(0, 0, 7).fill({ color, alpha: 0.85 });
    graphic.circle(0, 0, 12).stroke({ color, width: 2, alpha: 0.35 });
    graphic.x = position.x + Math.cos(angle) * offset;
    graphic.y = position.y + Math.sin(angle) * offset;
    graphic.zIndex = 3;
    ctx.app.stage.addChild(graphic);

    pets.push({
      graphic,
      x: graphic.x,
      y: graphic.y,
      age: 0,
      attackTimer: 0,
      damage: damageOf(ctx, stats),
      duration: durationOf(ctx, stats),
      speed: stats.speed ?? 230,
      radius: radiusOf(ctx, stats),
      attackCd: stats.attackCd ?? 0.8,
      color,
    });
  }

  function activate(ctx, weapon, stats) {
    const count = Math.max(1, Math.round(stats.count ?? 1));
    if (pets.length < count) {
      spawn(ctx, weapon, stats);
    }
    return true;
  }

  function update(ctx, _weapon, dt) {
    const position = playerPosition(ctx.player);
    for (let i = pets.length - 1; i >= 0; i -= 1) {
      const pet = pets[i];
      pet.age += dt;
      pet.attackTimer = Math.max(0, pet.attackTimer - dt);

      if (pet.duration > 0 && pet.age >= pet.duration) {
        pet.graphic.destroy();
        pets.splice(i, 1);
        continue;
      }

      const target = findNearest(ctx, pet.x, pet.y, pet.radius);
      const goal = target
        ? target.point
        : {
            x: position.x + Math.cos(pet.age * 0.8 + i) * 38,
            y: position.y + Math.sin(pet.age * 0.8 + i) * 38,
          };
      const dx = goal.x - pet.x;
      const dy = goal.y - pet.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 4) {
        const step = Math.min(distance, pet.speed * dt);
        pet.x += (dx / distance) * step;
        pet.y += (dy / distance) * step;
      }

      if (target && pet.attackTimer <= 0) {
        const center = enemyCenter(target.enemy);
        const reach = 20 + enemyMargin(target.enemy);
        if (Math.hypot(center.x - pet.x, center.y - pet.y) <= reach) {
          hitEnemy(ctx, target.enemy, pet.damage);
          pet.attackTimer = pet.attackCd;
          pet.graphic.clear();
          pet.graphic.circle(0, 0, 7).fill({ color: 0xffffff, alpha: 0.95 });
          pet.graphic
            .circle(0, 0, 12)
            .stroke({ color: pet.color, width: 2, alpha: 0.35 });
        }
      } else if (pet.attackTimer <= 0) {
        pet.graphic.clear();
        pet.graphic.circle(0, 0, 7).fill({ color: pet.color, alpha: 0.85 });
        pet.graphic
          .circle(0, 0, 12)
          .stroke({ color: pet.color, width: 2, alpha: 0.35 });
      }

      pet.graphic.x = pet.x;
      pet.graphic.y = pet.y;
    }
  }

  function reset() {
    for (const pet of pets) pet.graphic.destroy();
    pets.length = 0;
  }

  return { activate, update, reset };
}
