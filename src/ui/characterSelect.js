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
    maxWidth: "1420px",
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

  // Пол — кнопки с иконками над выбором расы.
  const genderRow = document.createElement("div");
  Object.assign(genderRow.style, { display: "flex", gap: "4px", justifyContent: "center", width: "200px", flexWrap: "nowrap" });
  const genderButtons = {};
  for (const gender of GENDERS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fantasy-button fantasy-button--ghost";
    Object.assign(button.style, { display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: "1", minWidth: "0", gap: "2px", padding: "var(--sp-1)" });
    button.appendChild(icon(gender.id === "m" ? "genderMale" : "genderFemale", 30));
    const label = document.createElement("span");
    Object.assign(label.style, { fontSize: "12px" });
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
    gridTemplateColumns: "minmax(530px, 1fr) 220px minmax(530px, 1fr)",
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
      textAlign: "center",
      width: "100%",
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
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      padding: "var(--sp-2)",
      width: "176px",
      overflow: "hidden",
      whiteSpace: "nowrap",
    });
    const thumb = document.createElement("div");
    Object.assign(thumb.style, {
      width: "160px",
      height: "160px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-s)",
      background: "rgba(20, 14, 10, 0.72)",
      border: "1px solid var(--color-accent-border)",
      overflow: "hidden",
      boxShadow: "inset 0 0 0 1px rgba(212,169,66,0.12)",
      flexShrink: "0",
    });
    const image = document.createElement("img");
    Object.assign(image.style, {
      width: "auto",
      height: "auto",
      maxWidth: "160px",
      maxHeight: "160px",
      objectFit: "contain",
      imageRendering: "pixelated",
    });
    thumb.appendChild(image);
    const label = document.createElement("span");
    Object.assign(label.style, { font: "500 12px var(--font-body)", color: "var(--color-text)", textAlign: "center", lineHeight: "1.1" });
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
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      padding: "var(--sp-2)",
      width: "176px",
      overflow: "hidden",
      whiteSpace: "nowrap",
    });
    const thumb = document.createElement("div");
    Object.assign(thumb.style, {
      width: "160px",
      height: "160px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-s)",
      background: "rgba(20, 14, 10, 0.72)",
      border: "1px solid var(--color-accent-border)",
      overflow: "hidden",
      boxShadow: "inset 0 0 0 1px rgba(212,169,66,0.12)",
      flexShrink: "0",
    });
    const image = document.createElement("img");
    Object.assign(image.style, { width: "auto", height: "auto", maxWidth: "160px", maxHeight: "160px", objectFit: "contain", imageRendering: "pixelated" });
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
    Object.assign(label.style, { font: "500 12px var(--font-body)", color: "var(--color-text)", textAlign: "center", lineHeight: "1.1" });
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
  Object.assign(previewColumn.style, { alignItems: "center", width: "220px" });
  const previewCard = document.createElement("div");
  Object.assign(previewCard.style, {
    width: "200px",
    height: "300px",
    aspectRatio: "2 / 3",
    minHeight: "300px",
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
  previewColumn.append(previewCard, genderRow);

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
    const elementName = ELEMENTS.find((e) => e.id === current.element)?.name ?? current.element;
    const weaponLabel = startingWeaponLabel(current).replace(/\s*\([^)]*\)\s*$/, "").trim();
    buildLineRace.textContent = `${raceName} · ${genderName}`;
    buildLineClass.textContent = `${className} · ${elementName}`;
    buildLineWeapon.textContent = `Оружие: ${weaponLabel}`;
  }
  layout.append(raceColumn, previewColumn, classColumn);
  const metaRow = document.createElement("div");
  Object.assign(metaRow.style, {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    alignItems: "center",
    justifyContent: "center",
    width: "200px",
    marginTop: "var(--sp-2)",
    textAlign: "center",
  });
  const buildLineRace = document.createElement("div");
  const buildLineClass = document.createElement("div");
  const buildLineWeapon = document.createElement("div");
  Object.assign(buildLineRace.style, { fontSize: "14px", lineHeight: "1.2" });
  Object.assign(buildLineClass.style, { fontSize: "14px", lineHeight: "1.2" });
  Object.assign(buildLineWeapon.style, { fontSize: "14px", lineHeight: "1.2", color: "var(--color-text-dim)" });
  metaRow.append(buildLineRace, buildLineClass, buildLineWeapon);

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
  Object.assign(elementGroup.style, { display: "flex", flexDirection: "column", gap: "var(--sp-2)", alignItems: "center", marginTop: "10px" });
  const elementLabel = document.createElement("span");
  elementLabel.style.color = "var(--color-text-dim)";
  elementLabel.style.fontSize = "12px";
  elementLabel.style.textTransform = "uppercase";
  elementLabel.style.letterSpacing = "0.08em";
  elementLabel.textContent = "Стихия";
  elementGroup.appendChild(elementLabel);
  const elementButtonRow = document.createElement("div");
  Object.assign(elementButtonRow.style, { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--sp-2)", justifyContent: "center", width: "200px" });
  for (const element of ELEMENTS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fantasy-tab";
    Object.assign(button.style, { display: "flex", minWidth: "84px", justifyContent: "center", alignItems: "center", gap: "6px", flexDirection: "column", padding: "var(--sp-2)" });
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
      refreshPreview();
    });
    elementButtons[element.id] = button;
    elementButtonRow.appendChild(button);
  }
  elementGroup.append(elementLabel, elementButtonRow);
  previewColumn.append(elementGroup, metaRow);

  function syncElementButtons() {
    for (const element of ELEMENTS) {
      elementButtons[element.id].classList.toggle("fantasy-tab--active", element.id === current.element);
    }
  }
  syncElementButtons();

  genderGroup._dummy = null;
  syncToggleGroup(genderGroup, current.gender);

  const saveRow = document.createElement("div");
  Object.assign(saveRow.style, { display: "flex", gap: "var(--sp-3)", justifyContent: "center", flexWrap: "wrap" });
  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "fantasy-button fantasy-button--primary";
  saveBtn.textContent = "Сохранить персонажа";
  saveBtn.addEventListener("click", () => {
    current = saveCharacter(current);
    const toast = document.createElement("div");
    toast.textContent = "Сохранено. Применится при следующем забеге.";
    Object.assign(toast.style, {
      position: "fixed",
      top: "18px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "3000",
      background: "rgba(42, 32, 26, 0.96)",
      color: "var(--color-text)",
      border: "1px solid var(--color-accent-border)",
      borderRadius: "var(--radius-m)",
      padding: "var(--sp-2) var(--sp-4)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
      opacity: "0",
      transition: "opacity var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)",
    });
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(4px)";
    });
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%)";
      setTimeout(() => toast.remove(), 180);
    }, 1600);
    refreshPreview();
    if (typeof onSave === "function") onSave(current);
  });
  saveRow.append(saveBtn);

  card.append(layout, saveRow);
  root.appendChild(card);

  function refresh() {
    current = loadCharacter();
    syncRaceButtons();
    updateRaceImages();
    syncClassButtons();
    updateClassImages();
    syncToggleGroup(genderGroup, current.gender);
    syncElementButtons();
    refreshPreview();
    requestAnimationFrame(() => requestAnimationFrame(fitLabels));
  }
  refreshPreview();
  requestAnimationFrame(() => requestAnimationFrame(fitLabels));

  function fitLabels() {
    for (const label of labelsToMeasure) {
      const parent = label.parentElement;
      if (!parent || parent.clientWidth === 0) continue;
      let size = 12;
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