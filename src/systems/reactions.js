import { REACTIONS, STATUSES } from "../data/elements.js";
import { getReactionKey } from "../data/elements.js";

export function createReactionSystem({ zoneSystem, audio } = {}) {
  const zs = zoneSystem;
  return {
    handleHit(enemy, element, _dmg) {
      if (!enemy || !element) return null;
      if ((enemy.reactCd ?? 0) > 0) return null;
      let foreignId = null;
      for (const id of enemy.statuses.keys()) {
        const status = STATUSES[id];
        if (status && status.element && status.element !== element) {
          foreignId = id;
          break;
        }
      }
      if (!foreignId) return null;
      const foreign = STATUSES[foreignId];
      if (!foreign?.element) return null;
      const key = getReactionKey(element, foreign.element);
      const reaction = REACTIONS[key];
      if (!reaction) return null;
      enemy.reactCd = 0.4;
      if (reaction.id === "steam" && zs && typeof zs.spawnSteam === "function") {
        zs.spawnSteam(enemy.x, enemy.y);
    audio?.playSteam?.();
      }
      return reaction;
    },
  };
}
