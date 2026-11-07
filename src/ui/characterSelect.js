import { icon } from "./icons.js";
import {
  RACES,
  GENDERS,
  CLASSES,
  ELEMENTS,
  AVAILABLE_WEAPONS,
  loadCharacter,
  saveCharacter,
  normalizeCharacter,
  previewSpriteUrl,
  combatSpriteUrl,
  startingWeaponId,
  withAssetBase,
  defaultCharacter,
} from "../data/characters.js";

export function createCharacterSelect({ onSave } = {}) {
  const root = document.createElement("section");
  root.dataset.tab = "character";
  Object.assign(root.style, {
    display: "none",
    width: "100%",
    maxWidth: "900px",
    margin: "0 auto",
    alignItems: "stretch",
    justifyContent: "center",
    animation: "fantasy-rise var(--dur-slow) var(--ease-out) both",
  });

  let current = loadCharacter();

  const card = document.createElement("div");
  card.className = "fantasy-panel fantasy-panel--ornate";
  Object.assign(card.style, {
    display: "flex",
    flexDirection: "column",
    gap: "var(--sp-4)",
    padding: "var(--sp-5)",
  });

  const title = document.createElement("h2");
  title.className = "fantasy-title fantasy-title--section";
  title.textContent = "Персонаж";
  const subtitle = document.createElement("div");
  subtitle.className = "fantasy-subtitle";
  subtitle.textContent = "Выбор сохраняется и будет использован при следующем забеге. Ассеты, которых ещё нет, показываются как «будет добавлено».";

  const layout = document.createElement("div");
  Object.assign(layout.style, {
    display: "grid",
    gridTemplateColumns: "minmax(180px, 220px) 1fr minmax(180px, 220px)",
    gap: "var(--sp-4)",
    alignItems: "start",
  });

  function createColumn(titleText) {
    const column = document.createElement("div");
    Object.assign(column.style, { display: "flex", flexDirection: "column", gap: "var(--sp-2)" });
    const heading = document.createElement("div");
    Object.assign(heading.style, {
      font: "600 12px var(--font-display)",
      color: "var(--color-accent)",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      marginBottom: "var(--sp-1)",
    });
    heading.textContent = titleText;
    column.appendChild(heading);
    return column;
  }

  // Race column
  const raceColumn = createColumn("Раса");
  const raceButtons = {};
  function syncRaceButtons() {
    for (const race of RACES) {
      const button = raceButtons[race.id];
      if (!button) continue;
      button.classList.toggle("fantasy-tab--active", race.id === current.race);
    }
  }
  for (const race of RACES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fantasy-tab";
    Object.assign(button.style, { justifyContent: "flex-start", width: "100%" });
    button.textContent = race.name;
    button.addEventListener("click", () => {
      current.race = race.id;
      current = normalizeCharacter(current);
      syncRaceButtons();
      refreshPreview();
    });
    raceButtons[race.id] = button;
    raceColumn.appendChild(button);
  }
  syncRaceButtons();

  // Class column
  const classColumn = createColumn("Класс");
  const classButtons = {};
  function syncClassButtons() {
    for (const cls of CLASSES) {
      const button = classButtons[cls.id];
      if (!button) continue;
      button.classList.toggle("fantasy-tab--active", cls.id === current.classId);
    }
  }
  for (const cls of CLASSES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fantasy-tab";
    Object.assign(button.style, { justifyContent: "flex-start", width: "100%" });
    button.textContent = cls.name;
    button.addEventListener("click", () => {
      current.classId = cls.id;
      current = normalizeCharacter(current);
      syncClassButtons();
      refreshPreview();
    });
    classButtons[cls.id] = button;
    classColumn.appendChild(button);
  }
  syncClassButtons();

  // Middle: preview + gender/element/weapon
  const previewColumn = createColumn("Превью");
  const previewCard = document.createElement("div");
  Object.assign(previewCard.style, {
    aspectRatio: "3 / 4",
    minHeight: "200px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(20, 14, 10, 0.6)",
    border: "1px solid var(--color-accent-border)",
    borderRadius: "var(--radius-m)",
    overflow: "hidden",
    position: "relative",
  });
  const previewImage = document.createElement("img");
  Object.assign(previewImage.style, {
    maxWidth: "80%",
    maxHeight: "90%",
    imageRendering: "pixelated",
  });
  previewImage.alt = "Превью персонажа";
  const previewEmpty = document.createElement("div");
  previewEmpty.className = "fantasy-empty";
  Object.assign(previewEmpty.style, { padding: "var(--sp-3)" });
  const previewEmptyTitle = document.createElement("div");
  previewEmptyTitle.className = "fantasy-empty__title";
  previewEmptyTitle.textContent = "Будет добавлено позже";
  const previewEmptyBody = document.createElement("div");
  previewEmptyBody.className = "fantasy-empty__body";
  previewEmptyBody.textContent = "Для этой комбинации раса/пол/класс ещё нет ассета.";
  previewEmpty.append(previewEmptyTitle, previewEmptyBody);

  const previewMeta = document.createElement("div");
  Object.assign(previewMeta.style, {
    font: "500 13px var(--font-body)",
    color: "var(--color-text-dim)",
    textAlign: "center",
    lineHeight: "1.5",
  });
  previewColumn.append(previewCard, previewMeta);

  function refreshPreview() {
    previewCard.replaceChildren();
    const url = previewSpriteUrl(current);
    if (url) {
      previewImage.src = withAssetBase(url);
      previewImage.style.display = "block";
      previewCard.appendChild(previewImage);
    } else {
      previewImage.style.display = "none";
      previewCard.appendChild(previewEmpty);
    }
    const weaponId = startingWeaponId(current);
    const weaponName = AVAILABLE_WEAPONS.find((w) => w.id === weaponId)?.name ?? weaponId;
    const raceName = RACES.find((r) => r.id === current.race)?.name ?? current.race;
    const className = CLASSES.find((c) => c.id === current.classId)?.name ?? current.classId;
    const genderName = GENDERS.find((g) => g.id === current.gender)?.name ?? current.gender;
    previewMeta.textContent = `${raceName} · ${genderName} · ${className}\nНачальное оружие: ${weaponName}`;
  }
  layout.append(raceColumn, previewColumn, classColumn);
  const metaRow = document.createElement("div");
  metaRow.appendChild(previewMeta);

  // Gender + element + weapon row
  const controlRow = document.createElement("div");
  Object.assign(controlRow.style, {
    display: "flex",
    flexWrap: "wrap",
    gap: "var(--sp-3)",
    alignItems: "center",
    justifyContent: "center",
  });

  function createToggleGroup(labelText, items, getValue, setValue) {
    const group = document.createElement("div");
    Object.assign(group.style, { display: "flex", flexDirection: "column", gap: "var(--sp-1)", alignItems: "center" });
    const label = document.createElement("span");
    label.style.color = "var(--color-text-dim)";
    label.style.fontSize = "12px";
    label.style.textTransform = "uppercase";
    label.style.letterSpacing = "0.08em";
    label.textContent = labelText;
    const buttons = document.createElement("div");
    Object.assign(buttons.style, { display: "flex", gap: "var(--sp-2)", flexWrap: "wrap", justifyContent: "center" });
    const buttonMap = {};
    for (const item of items) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fantasy-tab";
      button.textContent = item.name;
      button.addEventListener("click", () => {
        setValue(item.id);
        current = normalizeCharacter(current);
        if (labelText === "Пол" && getValue() !== item.id) return;
        syncToggleGroup(group, item.id);
        refreshPreview();
      });
      buttonMap[item.id] = button;
      buttons.appendChild(button);
    }
    group.append(label, buttons);
    group._buttons = buttonMap;
    group._getValue = getValue;
    return group;
  }

  function syncToggleGroup(group, value) {
    for (const [id, button] of Object.entries(group._buttons)) {
      button.classList.toggle("fantasy-tab--active", id === value);
    }
  }

  const genderGroup = createToggleGroup("Пол", GENDERS, () => current.gender, (v) => { current.gender = v; });
  const elementGroup = createToggleGroup("Стихия", ELEMENTS, () => current.element, (v) => { current.element = v; });
  const weaponGroup = createToggleGroup("Оружие", AVAILABLE_WEAPONS, () => current.weaponId, (v) => { current.weaponId = v; });
  syncToggleGroup(genderGroup, current.gender);
  syncToggleGroup(elementGroup, current.element);
  syncToggleGroup(weaponGroup, current.weaponId);

  // Keep weapon selection aligned with element by default only if user has not touched it.
  let weaponTouched = false;
  const originalWeaponSet = (v) => { weaponTouched = true; current.weaponId = v; };
  // Replace weapon callback with touched tracking
  for (const button of Object.values(weaponGroup._buttons)) {
    button.onclick = null;
  }
  // Recreate weapon group cleanly
  weaponGroup.remove();
  const weaponGroup2 = createToggleGroup("Оружие", AVAILABLE_WEAPONS, () => current.weaponId, (v) => {
    weaponTouched = true;
    current.weaponId = v;
  });
  syncToggleGroup(weaponGroup2, current.weaponId);
  AVAILABLE_WEAPONS.forEach((w) => {
    const btn = weaponGroup2._buttons[w.id];
    btn.addEventListener("click", () => {
      refreshPreview();
    });
  });

  // Element change should auto-pick weapon only if not manually changed.
  ELEMENTS.forEach((element) => {
    const btn = elementGroup._buttons[element.id];
    btn.addEventListener("click", () => {
      if (!weaponTouched) {
        current.weaponId = (element.id === "fire" ? "serp" : element.id === "water" ? "spear" : current.weaponId);
        syncToggleGroup(weaponGroup2, current.weaponId);
        refreshPreview();
      }
    });
  });

  controlRow.append(genderGroup, elementGroup, weaponGroup2);

  const saveRow = document.createElement("div");
  Object.assign(saveRow.style, { display: "flex", gap: "var(--sp-3)", justifyContent: "center", flexWrap: "wrap" });
  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "fantasy-button fantasy-button--primary";
  saveBtn.textContent = "Сохранить персонажа";
  const status = document.createElement("div");
  status.className = "fantasy-subtitle";
  saveBtn.addEventListener("click", () => {
    current = saveCharacter(current);
    status.textContent = "Сохранено. Применится при следующем забеге.";
    refreshPreview();
    if (typeof onSave === "function") onSave(current);
  });
  saveRow.append(saveBtn);

  card.append(title, subtitle, layout, metaRow, controlRow, saveRow, status);
  root.appendChild(card);

  function refresh() {
    current = loadCharacter();
    weaponTouched = false;
    syncRaceButtons();
    syncClassButtons();
    syncToggleGroup(genderGroup, current.gender);
    syncToggleGroup(elementGroup, current.element);
    syncToggleGroup(weaponGroup2, current.weaponId);
    refreshPreview();
    status.textContent = "";
  }
  refreshPreview();

  return { root, refresh };
}