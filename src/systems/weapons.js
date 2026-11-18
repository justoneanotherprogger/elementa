import { STARTER_WEAPON } from "../data/weapons/index.js";
import { masteryMaxRank, masteryStats } from "../data/weaponMastery.js";
import { createBehavior } from "./behaviors/index.js";

function cloneWeapon(config) {
  const copy = { ...config, base: { ...(config?.base ?? {}) } };
  copy.rank = 1;
  copy.cd = masteryStats(copy, copy.rank).cd ?? 1;
  copy.timer = 0;
  return copy;
}

// Система хранит список оружия и общий таймер. Наведение, форма атаки и
// отрисовка — дело поведения: у снаряда, ауры и питомца они разные.
export function createWeaponSystem(app, player, enemySystem, options = {}) {
  const {
    initialWeapons = [STARTER_WEAPON],
    zoneSystem = null,
    reactionSystem = null,
  } = options;
  const weapons = initialWeapons.map(cloneWeapon);
  const behaviors = new Map();
  const ctx = { app, player, enemySystem, zoneSystem, reactionSystem };

  function behaviorOf(weapon) {
    if (!behaviors.has(weapon.id)) {
      behaviors.set(weapon.id, createBehavior(weapon));
    }
    return behaviors.get(weapon.id);
  }

  function update(dt) {
    const aspdMult = Math.max(0.1, player.aspdMult ?? 1);
    for (const weapon of weapons) {
      const stats = masteryStats(weapon, weapon.rank);
      weapon.cd = (stats.cd ?? 1) / aspdMult;
      weapon.timer -= dt;

      const behavior = behaviorOf(weapon);
      if (!behavior) continue;
      behavior.update?.(ctx, weapon, dt);
      if (weapon.timer <= 0 && behavior.activate?.(ctx, weapon, stats)) {
        weapon.timer = weapon.cd;
      }
    }
  }

  function addWeapon(config) {
    if (!config || weapons.some((weapon) => weapon.id === config.id))
      return false;
    weapons.push(cloneWeapon(config));
    return true;
  }

  function masteryOf(id) {
    return weapons.find((weapon) => weapon.id === id)?.rank ?? 0;
  }

  function raiseMastery(id) {
    const weapon = weapons.find((item) => item.id === id);
    if (!weapon || weapon.rank >= masteryMaxRank(id)) return false;
    weapon.rank += 1;
    return true;
  }

  function reset() {
    for (const behavior of behaviors.values()) behavior?.reset?.();
    behaviors.clear();
    weapons.length = 0;
  }

  return { weapons, update, reset, addWeapon, masteryOf, raiseMastery };
}
