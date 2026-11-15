import { ACTOR_WEAPONS } from "./actor.js";
import { EXECUTIONER_WEAPONS } from "./executioner.js";
import { FORESTER_WEAPONS } from "./forester.js";
import { INVOKER_WEAPONS } from "./invoker.js";
import { MONK_WEAPONS } from "./monk.js";
import { NECROMANCER_WEAPONS } from "./necromancer.js";
import { SHAMAN_WEAPONS } from "./shaman.js";
import { TEMPLAR_WEAPONS } from "./templar.js";
import { VIRTUOSO_WEAPONS } from "./virtuoso.js";

export const WEAPONS = {
  ...ACTOR_WEAPONS,
  ...EXECUTIONER_WEAPONS,
  ...FORESTER_WEAPONS,
  ...INVOKER_WEAPONS,
  ...MONK_WEAPONS,
  ...NECROMANCER_WEAPONS,
  ...SHAMAN_WEAPONS,
  ...TEMPLAR_WEAPONS,
  ...VIRTUOSO_WEAPONS,
};

export function getWeapon(id) {
  return WEAPONS[id] ?? null;
}

export const STARTER_WEAPON = WEAPONS.serp;
export const SPEAR_WEAPON = WEAPONS.spear;
