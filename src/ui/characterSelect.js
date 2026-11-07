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

  // Пол — кнопки с иконками над выбором расы.
  const genderRow = document.createElement("div");
  Object.assign(genderRow.style, { display: "flex", gap: "var(--sp-2)", justifyContent: "center", flexWrap: "wrap" });
  const genderButtons = {};
  for (const gender of GENDERS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fantasy-button fantasy-button--ghost";
    Object.assign(button.style, { minWidth: "120px", justifyContent: "center", gap: "var(--sp-2)" });
    button.appendChild(icon(gender.id === "m" ? "genderMale" : "genderFemale", 16));
    const label = document.createElement("span");
    label.textContent = gender.name;
    button.appendChild(label);
    button.addEventListener("click", () => {
      current.gender = gender.id;
      current = normalizeCharacter(current);
      syncGenderButtons();
      updateRaceImages();
      syncRaceButtons();
      refreshPreview();
    });
    genderButtons[gender.id] = button;
    genderRow.appendChild(button);
  }
  function syncGenderButtons() {
    for (const gender of GENDERS) {
      genderButtons[gender.id].classList.toggle("fantasy-tab--active", gender.id === current.gender);
    }
  }
  syncGenderButtons();

  const layout = document.createElement("div");
  Object.assign(layout.style, {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 260px) 1fr minmax(220px, 260px)",
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
  const raceImages = {};
  function updateRaceImages() {
    for (const race of RACES) {
      const img = raceImages[race.id];
      if (!img) continue;
      img.src = withAssetBase(combatSpriteUrl({ race: race.id, gender: current.gender, classId: current.classId }));
      img.onerror = () => { img.style.opacity = "0.3"; };
      img.onload = () => { img.style.opacity = "1"; };
    }
  }
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
    Object.assign(button.style, { justifyContent: "flex-start", flex: "1", minWidth: "0", gap: "var(--sp-2)", whiteSpace: "normal", overflowWrap: "anywhere", lineHeight: "1.2" });
    const thumb = document.createElement("div");
    Object.assign(thumb.style, {
      width: "64px",
      height: "64px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-s)",
      background: "rgba(20, 14, 10, 0.72)",
      border: "1px solid var(--color-accent-border)",
      overflow: "hidden",
      flexShrink: "0",
      boxShadow: "inset 0 0 0 1px rgba(212,169,66,0.12)",
    });
    const image = document.createElement("img");
    Object.assign(image.style, {
      width: "100%",
      height: "100%",
      objectFit: "contain",
      imageRendering: "pixelated",
    });
    thumb.appendChild(image);
    const label = document.createElement("span");
    label.textContent = race.name;
    button.appendChild(label);
    button.addEventListener("click", () => {
      current.race = race.id;
      current = normalizeCharacter(current);
      syncRaceButtons();
      refreshPreview();
    });
    const row = document.createElement("div");
    Object.assign(row.style, { display: "flex", alignItems: "center", gap: "var(--sp-2)", width: "100%" });
    row.append(thumb, button);
    raceButtons[race.id] = button;
    raceImages[race.id] = image;
    raceColumn.appendChild(row);
  }
  updateRaceImages();
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

  // Element change automatically determines starting weapon; weapon no longer has a separate selector.
  ELEMENTS.forEach((element) => {
    const btn = elementGroup._buttons[element.id];
    btn.addEventListener("click", () => {
      current.element = element.id;
      current.weaponId = element.id === "fire" ? "serp" : element.id === "water" ? "spear" : current.weaponId;
      current = normalizeCharacter(current);
      syncToggleGroup(elementGroup, current.element);
      refreshPreview();
    });
  });

  controlRow.append(elementGroup);

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

  card.append(title, subtitle, genderRow, layout, metaRow, controlRow, saveRow, status);
  root.appendChild(card);

  function refresh() {
    current = loadCharacter();
    syncRaceButtons();
    syncClassButtons();
    syncToggleGroup(genderGroup, current.gender);
    syncToggleGroup(elementGroup, current.element);
    refreshPreview();
    status.textContent = "";
  }
  refreshPreview();

  return { root, refresh };
}