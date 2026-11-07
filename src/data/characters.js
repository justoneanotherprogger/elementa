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

// Combat sprite assets that currently exist. New assets are added here explicitly.
const COMBAT_SPRITES = {
  "human:m": "/assets/player/pix_human_m.png",
};

// Preview/cutout assets that currently exist.
const PREVIEW_SPRITES = {
  "human:m:executioner": "/assets/ai_executioner_cutout.png",
};

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
  const key = `${character.race}:${character.gender}`;
  return COMBAT_SPRITES[key] || COMBAT_SPRITES["human:m"];
}

export function previewSpriteUrl(character) {
  const key = `${character.race}:${character.gender}:${character.classId}`;
  return PREVIEW_SPRITES[key] || null;
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