import { STORAGE_KEY as CHARACTER_KEY } from "./characters.js";
import { GOLD_KEY, UPGRADES_KEY } from "./upgrades.js";

// Wipes meta progress only: build, gold, skill tree. Settings stay as they are.
export function resetMetaProgress() {
  localStorage.removeItem(CHARACTER_KEY);
  localStorage.removeItem(GOLD_KEY);
  localStorage.removeItem(UPGRADES_KEY);
}
