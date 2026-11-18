import { createAuraBehavior } from "./aura.js";
import { createCompanionBehavior } from "./companion.js";
import { createMeleeBehavior } from "./melee.js";
import { createProjectileBehavior } from "./projectile.js";
import { createPullBehavior } from "./pull.js";
import { createZoneBehavior } from "./zone.js";

const FACTORIES = {
  melee: createMeleeBehavior,
  projectile: createProjectileBehavior,
  zone: createZoneBehavior,
  pull: createPullBehavior,
  companion: createCompanionBehavior,
  aura: createAuraBehavior,
};

// Неизвестное поведение — ошибка автора конфига, а не повод молча запустить
// оружие с пустым апдейтом. Ошибка видна в консоли, оружие не активируется.
export function createBehavior(weapon) {
  const factory = FACTORIES[weapon?.behavior];
  if (!factory) {
    console.error(
      `[weapons] unknown behavior "${weapon?.behavior}" for "${weapon?.id}"`,
    );
    return null;
  }
  return factory();
}

export const BEHAVIOR_NAMES = Object.keys(FACTORIES);
