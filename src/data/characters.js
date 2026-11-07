import { STARTER_WEAPON, SPEAR_WEAPON } from "./weapons.js";

export const STORAGE_KEY = "elementa_character_v1";

export const RACES = [
  { id: "human", name: "Человек" },
  { id: "elf", name: "Эльф" },
  { id: "orc", name: "Орк" },
  { id: "dwarf", name: "Дварф" },
  { id: "fae", name: "Фея" },
  { id: "dragonborn", name: "Драконорождённый" },
  { id: "tiefling", name: "Тифлинг" },
  { id: "beastfolk", name: "Зверолюд" },
  { id: "undead", name: "Нежить" },
];

export const GENDERS = [
  { id: "m", name: "Мужской" },
  { id: "f", name: "Женский" },
];

export const CLASSES = [
  { id: "monk", name: "Монах" },
  { id: "forester", name: "Лесничий" },
  { id: "executioner", name: "Палач" },
  { id: "actor", name: "Лицедей" },
  { id: "shaman", name: "Шаман" },
  { id: "necromancer", name: "Некромант" },
  { id: "templar", name: "Храмовник" },
  { id: "virtuoso", name: "Виртуоз" },
  { id: "invoker", name: "Заклинатель" },
];

export const ELEMENTS = [
  { id: "fire", name: "Огонь" },
  { id: "water", name: "Вода" },
  { id: "air", name: "Ветер" },
  { id: "earth", name: "Земля" },
];

export const AVAILABLE_WEAPONS = [
  { id: "serp", name: "Серп (Огонь)" },
  { id: "spear", name: "Копьё (Вода)" },
];

// Asset convention requested by the designer:
// - combat sprite: /assets/player/races/pix_{race}_{gender}.png
// - class preview/cutout: /assets/player/classes/pix_{race}_{gender}_{class}.png
// New combinations are added by dropping a file into the matching folder, not by editing data.
const ELEMENT_WEAPON = {
  fire: "serp",
  water: "spear",
};

export function defaultCharacter() {
  return {
    race: "human",
    gender: "m",
    classId: "executioner",
    element: "fire",
    weaponId: ELEMENT_WEAPON.fire,
  };
}

export function loadCharacter() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultCharacter();
    const parsed = JSON.parse(raw);
    return normalizeCharacter(parsed);
  } catch (_e) {
    return defaultCharacter();
  }
}

export function normalizeCharacter(value) {
  const fallback = defaultCharacter();
  const race = RACES.find((r) => r.id === value?.race)?.id ?? fallback.race;
  const gender = GENDERS.find((g) => g.id === value?.gender)?.id ?? fallback.gender;
  const classId = CLASSES.find((c) => c.id === value?.classId)?.id ?? fallback.classId;
  const element = ELEMENTS.find((e) => e.id === value?.element)?.id ?? fallback.element;
  const weaponId = AVAILABLE_WEAPONS.find((w) => w.id === value?.weaponId)?.id
    ?? ELEMENT_WEAPON[element]
    ?? fallback.weaponId;
  return { race, gender, classId, element, weaponId };
}

export function saveCharacter(value) {
  const normalized = normalizeCharacter(value);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function combatSpriteUrl(character) {
  return `/assets/player/races/pix_${character.race}_${character.gender}.png`;
}

export function previewSpriteUrl(character) {
  return `/assets/player/classes/pix_${character.race}_${character.gender}_${character.classId}.png`;
}

export function startingWeaponId(character) {
  if (character.weaponId) return character.weaponId;
  return ELEMENT_WEAPON[character.element] ?? "spear";
}

export function weaponConfigById(id) {
  if (id === "serp") return STARTER_WEAPON;
  if (id === "spear") return SPEAR_WEAPON;
  return SPEAR_WEAPON;
}

export function withAssetBase(assetPath) {
  if (!assetPath) return null;
  const base = (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) || "./";
  return `${base}${assetPath.replace(/^\//, "")}`.replace(/\/{2,}/g, "/");
}