import { icon } from "./icons.js";
import {
  CLASSES,
  ELEMENTS,
  RACES,
  combatSpriteUrl,
  loadCharacter,
  previewSpriteUrl,
  startingWeaponId,
  weaponConfigById,
  withAssetBase,
} from "../data/characters.js";
import { damageMultiplier } from "../data/upgrades.js";
import { PLAYER_BASE } from "../systems/player.js";

function formatValue(value) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

function createLine(labelText) {
  const row = document.createElement("div");
  Object.assign(row.style, {
    display: "flex",
    alignItems: "baseline",
    gap: "4px",
    fontSize: "14px",
    whiteSpace: "nowrap",
  });
  const label = document.createElement("span");
  label.style.color = "var(--color-text-dim)";
  label.textContent = `${labelText}:`;
  const value = document.createElement("span");
  row.append(label, value);
  return { row, value };
}

function createStatLine(labelText, iconName) {
  const line = createLine(labelText);
  line.row.style.alignItems = "center";
  line.row.style.gap = "6px";
  const iconNode = icon(iconName, 16);
  iconNode.style.color = "var(--color-accent)";
  iconNode.style.opacity = "0.85";
  line.row.prepend(iconNode);
  return line;
}

export function createBuildPanel() {
  const root = document.createElement("div");
  root.className = "fantasy-panel fantasy-panel--ornate";
  Object.assign(root.style, {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "var(--sp-3)",
  });

  const title = document.createElement("div");
  title.className = "fantasy-title fantasy-title--section";
  Object.assign(title.style, { fontSize: "16px" });
  title.textContent = "Текущий билд";

  const body = document.createElement("div");
  Object.assign(body.style, {
    display: "flex",
    gap: "var(--sp-4)",
    alignItems: "center",
    flexWrap: "wrap",
  });

  const preview = document.createElement("div");
  Object.assign(preview.style, {
    width: "80px",
    height: "120px",
    flex: "0 0 80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(20, 14, 10, 0.6)",
    border: "1px solid var(--color-accent-border)",
    borderRadius: "var(--radius-m)",
    overflow: "hidden",
  });
  const previewImage = document.createElement("img");
  Object.assign(previewImage.style, { maxWidth: "90%", maxHeight: "92%", imageRendering: "pixelated" });
  previewImage.alt = "Превью персонажа";
  preview.append(previewImage);

  const raceLine = createLine("Раса");
  const classLine = createLine("Класс");
  const elementLine = createLine("Стихия");
  const weaponLine = createLine("Оружие");
  const buildColumn = document.createElement("div");
  Object.assign(buildColumn.style, {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: "0",
  });
  buildColumn.append(raceLine.row, classLine.row, elementLine.row, weaponLine.row);

  const leftBlock = document.createElement("div");
  Object.assign(leftBlock.style, {
    display: "flex",
    gap: "var(--sp-3)",
    alignItems: "center",
    flex: "1 1 320px",
    minWidth: "0",
  });
  leftBlock.append(preview, buildColumn);

  const hpLine = createStatLine("Здоровье", "heart");
  const damageLine = createStatLine("Урон оружия", "sword");
  const aspdLine = createStatLine("Скорость атаки", "clock");
  const speedLine = createStatLine("Скорость бега", "arrow");
  const areaLine = createStatLine("Область", "target");
  const durationLine = createStatLine("Длительность", "hourglass");

  const statsGrid = document.createElement("div");
  Object.assign(statsGrid.style, {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(165px, 1fr))",
    gap: "6px var(--sp-4)",
    alignContent: "center",
    flex: "1 1 340px",
    borderLeft: "1px solid var(--color-border-subtle)",
    paddingLeft: "var(--sp-4)",
  });
  statsGrid.append(
    hpLine.row,
    damageLine.row,
    aspdLine.row,
    speedLine.row,
    areaLine.row,
    durationLine.row,
  );

  body.append(leftBlock, statsGrid);
  root.append(title, body);

  let previewSources = [];

  function setPreview(character) {
    previewSources = [previewSpriteUrl(character), combatSpriteUrl(character)].filter(Boolean);
    previewImage.style.display = "block";
    previewImage.onerror = () => {
      previewSources.shift();
      if (previewSources.length) previewImage.src = withAssetBase(previewSources[0]);
      else previewImage.style.display = "none";
    };
    previewImage.src = withAssetBase(previewSources[0]);
  }

  function refresh() {
    const character = loadCharacter();
    setPreview(character);

    raceLine.value.textContent = RACES.find((r) => r.id === character.race)?.name ?? character.race;
    classLine.value.textContent = CLASSES.find((c) => c.id === character.classId)?.name ?? character.classId;
    elementLine.value.textContent = ELEMENTS.find((e) => e.id === character.element)?.name ?? character.element;

    const weapon = weaponConfigById(startingWeaponId(character));
    weaponLine.value.textContent = weapon.title;

    hpLine.value.textContent = String(PLAYER_BASE.maxHp);
    damageLine.value.textContent = formatValue(weapon.base.dmg * damageMultiplier());
    aspdLine.value.textContent = `${formatValue(1 / weapon.base.cd)}/с`;
    speedLine.value.textContent = String(PLAYER_BASE.speed);
    areaLine.value.textContent = "100%";
    durationLine.value.textContent = "100%";
  }

  refresh();
  return { root, refresh };
}
