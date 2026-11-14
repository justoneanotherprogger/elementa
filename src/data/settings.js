const DAMAGE_NUMBERS_KEY = "elementa_damage_numbers_v1";

let damageNumbersEnabled = null;

export function isDamageNumbersEnabled() {
  if (damageNumbersEnabled === null) {
    damageNumbersEnabled = localStorage.getItem(DAMAGE_NUMBERS_KEY) !== "0";
  }
  return damageNumbersEnabled;
}

export function setDamageNumbersEnabled(value) {
  damageNumbersEnabled = Boolean(value);
  localStorage.setItem(DAMAGE_NUMBERS_KEY, damageNumbersEnabled ? "1" : "0");
  return damageNumbersEnabled;
}
