export const GOLD_KEY = "elementa_gold_v1";
export const UPGRADES_KEY = "elementa_upgrades_v1";

export const SKILL_NODES = [
  {
    id: "damage",
    name: "Усиление удара",
    effect: "+1% урона",
    price: 25,
    step: 0.01,
    icon: "sword",
    x: 0,
    y: 0,
  },
];

export function defaultUpgrades() {
  return Object.fromEntries(SKILL_NODES.map((node) => [node.id, 0]));
}

export function normalizeUpgrades(value) {
  const result = defaultUpgrades();
  for (const node of SKILL_NODES) {
    const count = Number(value?.[node.id]);
    result[node.id] = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  }
  return result;
}

export function loadUpgrades() {
  try {
    const raw = localStorage.getItem(UPGRADES_KEY);
    if (!raw) return defaultUpgrades();
    return normalizeUpgrades(JSON.parse(raw));
  } catch {
    return defaultUpgrades();
  }
}

export function saveUpgrades(value) {
  const normalized = normalizeUpgrades(value);
  localStorage.setItem(UPGRADES_KEY, JSON.stringify(normalized));
  return normalized;
}

export function readGold() {
  const gold = Number(localStorage.getItem(GOLD_KEY) || 0);
  return Number.isFinite(gold) && gold > 0 ? Math.floor(gold) : 0;
}

export function writeGold(value) {
  localStorage.setItem(GOLD_KEY, String(Math.max(0, Math.floor(value))));
}

export function buyUpgrade(id) {
  const node = SKILL_NODES.find((item) => item.id === id);
  if (!node) return false;
  const gold = readGold();
  if (gold < node.price) return false;
  const upgrades = loadUpgrades();
  upgrades[node.id] += 1;
  saveUpgrades(upgrades);
  writeGold(gold - node.price);
  return true;
}

export function damageMultiplier() {
  const node = SKILL_NODES.find((item) => item.id === "damage");
  if (!node) return 1;
  return 1 + node.step * loadUpgrades()[node.id];
}
