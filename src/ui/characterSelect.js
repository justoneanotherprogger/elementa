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
  startingWeaponLabel,
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
  const labelsToMeasure = [];

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
      updateClassImages();
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
    gridTemplateColumns: "minmax(250px, 320px) 1fr minmax(220px, 260px)",
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

  // Race column (3x3 square tiles)
  const raceColumn = createColumn("Раса");
  const raceGrid = document.createElement("div");
  Object.assign(raceGrid.style, { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--sp-2)", marginTop: "var(--sp-2)" });
  const raceButtons = {};
  const raceImages = {};
  function updateRaceImages() {
    for (const race of RACES) {
      const img = raceImages[race.id];
      if (!img) continue;
      img.src = withAssetBase(combatSpriteUrl({ race: race.id, gender: current.gender, classId: current.classId }));
      img.onerror = () => { img.style.opacity = "0.25"; };
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
    Object.assign(button.style, {
      aspectRatio: "1 / 1",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--sp-1)",
      padding: "var(--sp-2)",
      overflow: "hidden",
      whiteSpace: "nowrap",
    });
    const thumb = document.createElement("div");
    Object.assign(thumb.style, {
      width: "100%",
      aspectRatio: "1 / 1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-s)",
      background: "rgba(20, 14, 10, 0.72)",
      border: "1px solid var(--color-accent-border)",
      overflow: "hidden",
      boxShadow: "inset 0 0 0 1px rgba(212,169,66,0.12)",
    });
    const image = document.createElement("img");
    Object.assign(image.style, {
      width: "82%",
      height: "82%",
      objectFit: "contain",
      imageRendering: "pixelated",
    });
    thumb.appendChild(image);
    const label = document.createElement("span");
    Object.assign(label.style, { font: "500 11px var(--font-body)", color: "var(--color-text)", textAlign: "center", lineHeight: "1.1" });
    label.textContent = race.name;
    labelsToMeasure.push(label);
    button.append(thumb, label);
    button.addEventListener("click", () => {
      current.race = race.id;
      current = normalizeCharacter(current);
      syncRaceButtons();
      updateRaceImages();
      updateClassImages();
      refreshPreview();
    });
    raceButtons[race.id] = button;
    raceImages[race.id] = image;
    raceGrid.appendChild(button);
  }
  updateRaceImages();
  syncRaceButtons();
  raceColumn.appendChild(raceGrid);

  // Class column (3x3 square tiles)
  const classColumn = createColumn("Класс");
  const classGrid = document.createElement("div");
  Object.assign(classGrid.style, { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--sp-2)", marginTop: "var(--sp-2)" });
  const classButtons = {};
  const classImages = {};
  const classPlaceholders = {};
  function updateClassImages() {
    for (const cls of CLASSES) {
      const img = classImages[cls.id];
      const placeholder = classPlaceholders[cls.id];
      if (!img) continue;
      const url = previewSpriteUrl({ ...current, classId: cls.id });
      if (url) {
        img.style.display = "block";
        if (placeholder) placeholder.style.display = "none";
        img.onerror = () => {
          img.style.display = "none";
          if (placeholder) placeholder.style.display = "block";
        };
        img.onload = () => {
          img.style.display = "block";
          if (placeholder) placeholder.style.display = "none";
        };
        img.src = withAssetBase(url);
      } else {
        img.style.display = "none";
        if (placeholder) placeholder.style.display = "block";
      }
    }
  }
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
    Object.assign(button.style, {
      aspectRatio: "1 / 1",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--sp-1)",
      padding: "var(--sp-2)",
      overflow: "hidden",
      whiteSpace: "nowrap",
    });
    const thumb = document.createElement("div");
    Object.assign(thumb.style, {
      width: "100%",
      aspectRatio: "1 / 1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-s)",
      background: "rgba(20, 14, 10, 0.72)",
      border: "1px solid var(--color-accent-border)",
      overflow: "hidden",
      boxShadow: "inset 0 0 0 1px rgba(212,169,66,0.12)",
    });
    const image = document.createElement("img");
    Object.assign(image.style, { width: "78%", height: "78%", objectFit: "contain", imageRendering: "pixelated" });
    thumb.appendChild(image);
    const placeholder = document.createElement("span");
    placeholder.textContent = "будет добавлено";
    Object.assign(placeholder.style, {
      display: "none",
      font: "500 9px var(--font-body)",
      color: "var(--color-text-dim)",
      textAlign: "center",
      padding: "var(--sp-1)",
      lineHeight: "1.1",
    });
    thumb.appendChild(placeholder);
    const label = document.createElement("span");
    Object.assign(label.style, { font: "500 10px var(--font-body)", color: "var(--color-text)", textAlign: "center", lineHeight: "1.1" });
    label.textContent = cls.name;
    labelsToMeasure.push(label);
    button.append(thumb, label);
    classPlaceholders[cls.id] = placeholder;
    button.addEventListener("click", () => {
      current.classId = cls.id;
      current = normalizeCharacter(current);
      syncClassButtons();
      refreshPreview();
    });
    classButtons[cls.id] = button;
    classImages[cls.id] = image;
    classGrid.appendChild(button);
  }
  updateClassImages();
  syncClassButtons();
  classColumn.appendChild(classGrid);

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
    const raceName = RACES.find((r) => r.id === current.race)?.name ?? current.race;
    const className = CLASSES.find((c) => c.id === current.classId)?.name ?? current.classId;
    const genderName = GENDERS.find((g) => g.id === current.gender)?.name ?? current.gender;
    previewMeta.textContent = `${raceName} · ${genderName} · ${className}`;
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
  const elementButtons = {};
  const elementGroup = document.createElement("div");
  Object.assign(elementGroup.style, { display: "flex", flexDirection: "column", gap: "var(--sp-1)", alignItems: "center" });
  const elementLabel = document.createElement("span");
  elementLabel.style.color = "var(--color-text-dim)";
  elementLabel.style.fontSize = "12px";
  elementLabel.style.textTransform = "uppercase";
  elementLabel.style.letterSpacing = "0.08em";
  elementLabel.textContent = "Стихия";
  elementGroup.appendChild(elementLabel);
  const elementButtonRow = document.createElement("div");
  Object.assign(elementButtonRow.style, { display: "flex", gap: "var(--sp-2)", flexWrap: "wrap", justifyContent: "center" });
  for (const element of ELEMENTS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fantasy-tab";
    Object.assign(button.style, { minWidth: "84px", justifyContent: "center", alignItems: "center", gap: "6px", flexDirection: "column", padding: "var(--sp-2)" });
    const iconName = element.id === "fire" ? "fire" : element.id === "water" ? "water" : element.id === "air" ? "air" : "earth";
    button.appendChild(icon(iconName, 18));
    const name = document.createElement("span");
    name.textContent = element.name;
    button.appendChild(name);
    button.addEventListener("click", () => {
      current.element = element.id;
      current = normalizeCharacter(current);
      for (const b of Object.values(elementButtons)) b.classList.remove("fantasy-tab--active");
      button.classList.add("fantasy-tab--active");
      refreshWeaponInfo();
      refreshPreview();
    });
    elementButtons[element.id] = button;
    elementButtonRow.appendChild(button);
  }
  elementGroup.append(elementLabel, elementButtonRow);

  function syncElementButtons() {
    for (const element of ELEMENTS) {
      elementButtons[element.id].classList.toggle("fantasy-tab--active", element.id === current.element);
    }
  }
  syncElementButtons();

  genderGroup._dummy = null;
  syncToggleGroup(genderGroup, current.gender);
  controlRow.append(elementGroup);

  const weaponRow = document.createElement("div");
  Object.assign(weaponRow.style, { display: "flex", justifyContent: "center", alignItems: "center", gap: "var(--sp-2)" });
  const weaponInfo = document.createElement("div");
  weaponInfo.className = "fantasy-subtitle";
  Object.assign(weaponInfo.style, { textAlign: "center" });
  function refreshWeaponInfo() {
    weaponInfo.textContent = `Начальное оружие: ${startingWeaponLabel(current)}`;
  }
  refreshWeaponInfo();
  weaponRow.appendChild(weaponInfo);

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

  card.append(title, subtitle, genderRow, layout, metaRow, controlRow, weaponRow, saveRow, status);
  root.appendChild(card);

  function refresh() {
    current = loadCharacter();
    syncRaceButtons();
    updateRaceImages();
    syncClassButtons();
    updateClassImages();
    syncToggleGroup(genderGroup, current.gender);
    syncElementButtons();
    refreshWeaponInfo();
    refreshPreview();
    status.textContent = "";
  }
  refreshPreview();

  function fitLabels() {
    for (const label of labelsToMeasure) {
      const parent = label.parentElement;
      if (!parent) continue;
      let size = 11;
      label.style.fontSize = `${size}px`;
      // Shrink until the whole label fits the button; floor at 7px.
      while (label.scrollWidth > parent.clientWidth - 2 && size > 7) {
        size -= 0.5;
        label.style.fontSize = `${size}px`;
      }
    }
  }
  window.addEventListener("resize", () => {
    requestAnimationFrame(fitLabels);
  });
  requestAnimationFrame(fitLabels);

  return { root, refresh, fitLabels };
}