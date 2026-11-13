import { icon } from "./icons.js";
import { SKILL_NODES, buyUpgrade, loadUpgrades, readGold } from "../data/upgrades.js";

const NODE_SIZE = 104;
const NODE_MIN_VISIBLE = 4;
const MIN_SCALE = 0.4;
const MAX_SCALE = 3;
const GRID_STEP = 32;
const DRAG_THRESHOLD = 4;

export function createSkillTree({ onGoldChange } = {}) {
  const root = document.createElement("section");
  root.dataset.tab = "skills";
  Object.assign(root.style, {
    display: "none",
    width: "100%",
    maxWidth: "1080px",
    margin: "0 auto",
    alignItems: "stretch",
    justifyContent: "center",
    animation: "fantasy-rise var(--dur-slow) var(--ease-out) both",
  });

  const card = document.createElement("div");
  card.className = "fantasy-panel fantasy-panel--ornate";
  Object.assign(card.style, {
    display: "flex",
    flexDirection: "column",
    gap: "var(--sp-4)",
    width: "100%",
  });

  const title = document.createElement("div");
  title.className = "fantasy-title fantasy-title--section";
  Object.assign(title.style, { textAlign: "center" });
  title.textContent = "Дерево навыков";

  const canvas = document.createElement("div");
  Object.assign(canvas.style, {
    position: "relative",
    height: "clamp(360px, 58vh, 720px)",
    overflow: "hidden",
    borderRadius: "var(--radius-m)",
    border: "1px solid var(--color-border-subtle)",
    backgroundImage:
      "radial-gradient(circle at 50% 45%, rgba(212, 169, 66, 0.1), transparent 55%), radial-gradient(circle, rgba(212, 169, 66, 0.18) 1px, transparent 1.5px)",
    backgroundSize: "100% 100%, 32px 32px",
    backgroundPosition: "0 0, 0 0",
    cursor: "grab",
    touchAction: "none",
    userSelect: "none",
  });

  const world = document.createElement("div");
  Object.assign(world.style, {
    position: "absolute",
    left: "0",
    top: "0",
    transformOrigin: "0 0",
    willChange: "transform",
  });
  canvas.append(world);

  const hint = document.createElement("div");
  Object.assign(hint.style, {
    position: "absolute",
    left: "var(--sp-3)",
    bottom: "var(--sp-3)",
    font: "12px var(--font-body)",
    color: "var(--color-text-muted)",
    letterSpacing: "0.04em",
    pointerEvents: "none",
  });
  hint.textContent = "Колесо — масштаб · Перетаскивание — панорама · Двойной клик — центр";
  canvas.append(hint);

  const view = { x: 0, y: 0, scale: 1 };

  const nodeEls = SKILL_NODES.map((nodeDef) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fantasy-card fantasy-card--interactive";
    Object.assign(button.style, {
      position: "absolute",
      left: `${nodeDef.x}px`,
      top: `${nodeDef.y}px`,
      transform: "translate(-50%, -50%)",
      width: `${NODE_SIZE}px`,
      height: `${NODE_SIZE}px`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "var(--sp-1)",
      borderRadius: "50%",
      color: "var(--color-accent)",
      padding: "0",
    });
    const iconWrap = document.createElement("span");
    Object.assign(iconWrap.style, { display: "inline-flex" });
    iconWrap.append(icon(nodeDef.icon ?? "sword", 28));
    const label = document.createElement("span");
    Object.assign(label.style, {
      font: "600 12px var(--font-display)",
      color: "var(--color-text)",
      letterSpacing: "0.04em",
    });
    label.textContent = nodeDef.effect;
    const count = document.createElement("span");
    count.className = "fantasy-mono";
    count.style.fontSize = "12px";
    count.style.color = "var(--color-text-dim)";
    button.append(iconWrap, label, count);
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      if (consumeSuppressedClick()) return;
      if (selectedId === nodeDef.id) closeInfo();
      else selectNode(nodeDef);
    });
    world.append(button);
    return { nodeDef, button, count };
  });

  const info = document.createElement("div");
  info.className = "fantasy-panel";
  Object.assign(info.style, {
    display: "none",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "var(--sp-4)",
    flexWrap: "wrap",
  });

  const infoText = document.createElement("div");
  Object.assign(infoText.style, { display: "flex", flexDirection: "column", gap: "var(--sp-1)" });
  const infoName = document.createElement("div");
  infoName.className = "fantasy-title--section";
  Object.assign(infoName.style, { fontSize: "16px" });
  const infoEffect = document.createElement("div");
  infoEffect.className = "fantasy-subtitle";
  const infoBought = document.createElement("div");
  infoBought.className = "fantasy-text-dim";
  Object.assign(infoBought.style, { fontSize: "14px" });
  infoText.append(infoName, infoEffect, infoBought);

  const infoBuy = document.createElement("button");
  infoBuy.type = "button";
  infoBuy.className = "fantasy-button fantasy-button--primary";
  Object.assign(infoBuy.style, { display: "inline-flex", alignItems: "center", gap: "var(--sp-2)" });
  const infoPrice = document.createElement("span");
  infoBuy.append(icon("coin", 16), infoPrice);

  info.append(infoText, infoBuy);
  card.append(title, canvas, info);
  root.append(card);

  let selectedId = null;
  let selectedDef = null;
  let suppressClick = false;
  let dragging = false;
  let dragMoved = false;
  let dragStart = null;
  let centered = false;

  function viewportSize() {
    return { w: canvas.clientWidth, h: canvas.clientHeight };
  }

  function clampScale(value) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
  }

  function clampView() {
    const { w, h } = viewportSize();
    if (!w || !h || nodeEls.length === 0) return;
    const s = view.scale;
    const pad = Math.max(0, NODE_SIZE / 2 - NODE_MIN_VISIBLE) * s;
    let best = null;
    for (const { nodeDef } of nodeEls) {
      const minX = -pad - nodeDef.x * s;
      const maxX = w + pad - nodeDef.x * s;
      const minY = -pad - nodeDef.y * s;
      const maxY = h + pad - nodeDef.y * s;
      const x = Math.min(Math.max(view.x, minX), maxX);
      const y = Math.min(Math.max(view.y, minY), maxY);
      const dist = (x - view.x) ** 2 + (y - view.y) ** 2;
      if (!best || dist < best.dist) best = { dist, x, y };
    }
    if (best) {
      view.x = best.x;
      view.y = best.y;
    }
  }

  function applyView() {
    world.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
    const step = GRID_STEP * view.scale;
    canvas.style.backgroundSize = `100% 100%, ${step}px ${step}px`;
    canvas.style.backgroundPosition = `0 0, ${view.x}px ${view.y}px`;
  }

  function resetView() {
    const { w, h } = viewportSize();
    if (!w || !h) return;
    view.scale = 1;
    if (nodeEls.length) {
      const xs = nodeEls.map(({ nodeDef }) => nodeDef.x);
      const ys = nodeEls.map(({ nodeDef }) => nodeDef.y);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      view.x = w / 2 - cx;
      view.y = h / 2 - cy;
    } else {
      view.x = w / 2;
      view.y = h / 2;
    }
    clampView();
    applyView();
  }

  function consumeSuppressedClick() {
    if (!suppressClick) return false;
    suppressClick = false;
    return true;
  }

  function syncNodeHighlight() {
    for (const { nodeDef, button } of nodeEls) {
      const active = nodeDef.id === selectedId;
      button.style.borderColor = active ? "var(--color-accent-border)" : "var(--color-border-subtle)";
      button.style.boxShadow = active ? "var(--shadow-raised)" : "var(--shadow-panel)";
      button.setAttribute("aria-pressed", active ? "true" : "false");
    }
  }

  function refresh() {
    const upgrades = loadUpgrades();
    const gold = readGold();
    for (const { nodeDef, count } of nodeEls) {
      const bought = upgrades[nodeDef.id] ?? 0;
      count.textContent = bought > 0 ? `×${bought}` : "";
    }
    if (selectedDef) {
      const bought = upgrades[selectedDef.id] ?? 0;
      infoBought.textContent = `Куплено копий: ${bought}`;
      infoPrice.textContent = String(selectedDef.price);
      infoBuy.disabled = gold < selectedDef.price;
    }
  }

  function selectNode(nodeDef) {
    selectedId = nodeDef.id;
    selectedDef = nodeDef;
    infoName.textContent = nodeDef.name;
    infoEffect.textContent = nodeDef.effect;
    info.style.display = "flex";
    syncNodeHighlight();
    refresh();
  }

  function closeInfo() {
    selectedId = null;
    selectedDef = null;
    info.style.display = "none";
    syncNodeHighlight();
  }

  infoBuy.addEventListener("click", () => {
    if (!selectedDef) return;
    if (buyUpgrade(selectedDef.id)) {
      refresh();
      onGoldChange?.();
    } else {
      refresh();
    }
  });

  canvas.addEventListener("click", (event) => {
    if (consumeSuppressedClick()) return;
    if (event.target === canvas) closeInfo();
  });

  canvas.addEventListener("dblclick", (event) => {
    if (event.target === canvas) resetView();
  });

  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const nextScale = clampScale(view.scale * Math.exp(-event.deltaY * 0.001));
      const worldX = (px - view.x) / view.scale;
      const worldY = (py - view.y) / view.scale;
      view.scale = nextScale;
      view.x = px - worldX * nextScale;
      view.y = py - worldY * nextScale;
      clampView();
      applyView();
    },
    { passive: false },
  );

  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    dragStart = { x: event.clientX, y: event.clientY, panX: view.x, panY: view.y };
    dragging = true;
    dragMoved = false;
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!dragging || !dragStart) return;
    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;
    if (!dragMoved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!dragMoved) {
      dragMoved = true;
      canvas.style.cursor = "grabbing";
      canvas.setPointerCapture(event.pointerId);
    }
    view.x = dragStart.panX + dx;
    view.y = dragStart.panY + dy;
    clampView();
    applyView();
  });

  function endDrag(event) {
    if (!dragging) return;
    dragging = false;
    dragStart = null;
    canvas.style.cursor = "grab";
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (dragMoved) {
      dragMoved = false;
      suppressClick = true;
      setTimeout(() => {
        suppressClick = false;
      }, 0);
    }
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  const resizeObserver = new ResizeObserver(() => {
    const { w, h } = viewportSize();
    if (!w || !h) return;
    if (!centered) {
      centered = true;
      resetView();
    } else {
      clampView();
      applyView();
    }
  });
  resizeObserver.observe(canvas);

  applyView();
  refresh();
  syncNodeHighlight();

  return { root, refresh, close: closeInfo };
}
