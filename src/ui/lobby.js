import { icon } from "./icons.js";
import { createCharacterSelect } from "./characterSelect.js";

export function createLobby({ onStart, audio } = {}) {
  const overlay = document.createElement("div");
  overlay.id = "elementa-lobby";
  overlay.tabIndex = -1;
  overlay.className = "fantasy-grain";
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    display: "none",
    flexDirection: "column",
    background: "radial-gradient(circle at 30% 20%, rgba(74, 50, 28, 0.45), transparent 55%), radial-gradient(circle at 80% 85%, rgba(212, 169, 66, 0.12), transparent 45%), var(--color-bg)",
    color: "var(--color-text)",
    zIndex: "1200",
    padding: "var(--sp-5)",
    gap: "var(--sp-4)",
    overflow: "auto",
    scrollbarGutter: "stable",
  });

  const header = document.createElement("header");
  Object.assign(header.style, {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: "var(--sp-3)",
    borderBottom: "1px solid var(--color-border-subtle)",
    height: "70px",
    minHeight: "70px",
    maxHeight: "70px",
    overflow: "hidden",
  });

  const title = document.createElement("h1");
  title.textContent = "ELEMENTA";
  title.className = "fantasy-title fantasy-title--hero";
  Object.assign(title.style, {
    margin: "0",
    fontSize: "clamp(36px, 6vw, 64px)",
  });

  const wallet = document.createElement("div");
  Object.assign(wallet.style, {
    position: "absolute",
    right: "0",
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    alignItems: "center",
    gap: "var(--sp-2)",
    font: "600 18px var(--font-display)",
    color: "var(--color-accent)",
    padding: "8px 14px",
    background: "rgba(42, 32, 26, 0.72)",
    border: "1px solid var(--color-accent-border)",
    borderRadius: "var(--radius-pill)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
  });
  const walletIcon = icon("coin", 18);
  walletIcon.style.color = "var(--color-gold)";
  const walletLabel = document.createElement("span");
  walletLabel.style.color = "var(--color-text-dim)";
  walletLabel.style.font = "500 13px var(--font-body)";
  walletLabel.style.textTransform = "uppercase";
  walletLabel.style.letterSpacing = "0.1em";
  walletLabel.textContent = "Золото";
  const walletValue = document.createElement("span");
  walletValue.className = "fantasy-mono";
  walletValue.textContent = "0";
  wallet.append(walletIcon, walletLabel, walletValue);
  header.append(title, wallet);

  const tabs = document.createElement("nav");
  tabs.className = "fantasy-tabs";
  Object.assign(tabs.style, { paddingTop: "var(--sp-3)" });

  const panels = document.createElement("main");
  Object.assign(panels.style, {
    flex: "1",
    paddingTop: "var(--sp-4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  });

  const tabDefs = [
    { id: "run", label: "В бой" },
    { id: "character", label: "Персонаж" },
    { id: "skills", label: "Навыки" },
    { id: "settings", label: "Настройки" },
  ];

  function makePanel(id) {
    const p = document.createElement("section");
    p.dataset.tab = id;
    Object.assign(p.style, {
      display: "none",
      width: "100%",
      maxWidth: "780px",
      alignItems: "stretch",
      justifyContent: "center",
      animation: "fantasy-rise var(--dur-slow) var(--ease-out) both",
    });
    return p;
  }

  const runPanel = makePanel("run");
  const card = document.createElement("div");
  card.className = "fantasy-panel fantasy-panel--ornate";
  Object.assign(card.style, {
    margin: "0 auto",
    maxWidth: "420px",
    display: "flex",
    flexDirection: "column",
    gap: "var(--sp-3)",
    textAlign: "center",
  });
  const arenaTitle = document.createElement("div");
  arenaTitle.className = "fantasy-title fantasy-title--section";
  arenaTitle.textContent = "Гоблинский лес";
  const arenaDuration = document.createElement("div");
  arenaDuration.className = "fantasy-subtitle";
  arenaDuration.textContent = "Забег · 30:00 · стартовый набор";
  const arenaMeta = document.createElement("div");
  Object.assign(arenaMeta.style, {
    display: "flex",
    justifyContent: "center",
    gap: "var(--sp-4)",
    color: "var(--color-text-dim)",
    fontSize: "14px",
    flexWrap: "wrap",
  });
  const metaItem = (label, value) => {
    const el = document.createElement("div");
    el.innerHTML = `<span style="color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.08em;font-size:11px">${label}</span><br><span style="color:var(--color-text);font:600 14px var(--font-mono)">${value}</span>`;
    return el;
  };
  arenaMeta.append(metaItem("Сложность", "Нормальная"), metaItem("Враги", "Гоблины"), metaItem("Босс", "1"));
  const startBtn = document.createElement("button");
  startBtn.type = "button";
  startBtn.className = "fantasy-button fantasy-button--primary";
  startBtn.textContent = "Начать забег";
  Object.assign(startBtn.style, { width: "100%", marginTop: "var(--sp-2)" });
  card.append(arenaTitle, arenaDuration, arenaMeta, startBtn);
  runPanel.append(card);

  function emptyPanel(id, title, body) {
    const panel = makePanel(id);
    const empty = document.createElement("div");
    empty.className = "fantasy-empty fantasy-panel";
    Object.assign(empty.style, { maxWidth: "520px", margin: "0 auto" });
    const badge = document.createElement("div");
    badge.style.color = "var(--color-accent)";
    badge.style.opacity = "0.5";
    badge.appendChild(icon("target", 48));
    const heading = document.createElement("div");
    heading.className = "fantasy-empty__title";
    heading.textContent = title;
    const text = document.createElement("div");
    text.className = "fantasy-empty__body";
    text.textContent = body;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fantasy-button";
    btn.textContent = "Скоро";
    btn.disabled = true;
    empty.append(badge, heading, text, btn);
    panel.append(empty);
    return panel;
  }

  const characterModule = createCharacterSelect({});
  const characterPanel = characterModule.root;
  const skillsPanel = emptyPanel("skills", "Дерево навыков", "Усиления и ветки навыков будут доступны после первого обновления прогрессии.");

  const settingsPanel = makePanel("settings");
  const settingsCard = document.createElement("div");
  settingsCard.className = "fantasy-panel fantasy-panel--ornate";
  Object.assign(settingsCard.style, {
    margin: "0 auto",
    maxWidth: "560px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "var(--sp-4)",
  });

  const audioSection = document.createElement("div");
  Object.assign(audioSection.style, { display: "flex", flexDirection: "column", gap: "var(--sp-3)" });
  const audioSectionTitle = document.createElement("h3");
  audioSectionTitle.className = "fantasy-title--section";
  Object.assign(audioSectionTitle.style, { margin: "0", fontSize: "16px" });
  audioSectionTitle.textContent = "Звук и музыка";

  const audioToggle = document.createElement("button");
  audioToggle.type = "button";
  audioToggle.className = "fantasy-button fantasy-button--ghost";
  Object.assign(audioToggle.style, { width: "100%", justifyContent: "space-between" });

  const volumeRow = document.createElement("div");
  Object.assign(volumeRow.style, { display: "flex", alignItems: "center", gap: "var(--sp-3)" });
  const volumeLabel = document.createElement("span");
  volumeLabel.className = "fantasy-subtitle";
  volumeLabel.textContent = "Громкость";
  const volumeSlider = document.createElement("input");
  volumeSlider.type = "range";
  volumeSlider.min = "0";
  volumeSlider.max = "100";
  Object.assign(volumeSlider.style, { flex: "1", accentColor: "var(--color-accent)" });
  const volumeValue = document.createElement("span");
  volumeValue.className = "fantasy-mono";
  Object.assign(volumeValue.style, { minWidth: "42px", textAlign: "right", color: "var(--color-accent)" });

  const syncAudioSettings = () => {
    if (!audio?.music) {
      audioToggle.disabled = true;
      volumeSlider.disabled = true;
      audioToggle.textContent = "Звук недоступен";
      volumeValue.textContent = "—";
      return;
    }
    audioToggle.replaceChildren();
    audioToggle.appendChild(icon(audio.music.isMuted() ? "volumeOff" : "volume", 18));
    const label = document.createElement("span");
    label.textContent = audio.music.isMuted() ? "Звук выключен" : "Звук включён";
    audioToggle.appendChild(label);
    const currentVolume = Math.round(audio.music.getVolume() * 100);
    volumeSlider.value = String(currentVolume);
    volumeValue.textContent = `${currentVolume}%`;
  };
  syncAudioSettings();

  audioToggle.addEventListener("click", () => {
    audio?.music?.toggleMuted();
    syncAudioSettings();
  });
  volumeSlider.addEventListener("input", () => {
    audio?.music?.setVolume(Number(volumeSlider.value) / 100);
    volumeValue.textContent = `${volumeSlider.value}%`;
  });

  volumeRow.append(volumeLabel, volumeSlider, volumeValue);
  audioSection.append(audioSectionTitle, audioToggle, volumeRow);

  settingsCard.append(audioSection);
  settingsPanel.append(settingsCard);

  const panelMap = { run: runPanel, character: characterPanel, skills: skillsPanel, settings: settingsPanel };

  const tabButtons = {};
  function activateTab(tabId) {
    for (const def of tabDefs) {
      const btn = tabButtons[def.id];
      if (btn) btn.classList.toggle("fantasy-tab--active", def.id === tabId);
      panelMap[def.id].style.display = def.id === tabId ? "flex" : "none";
    }
  }

  for (const def of tabDefs) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fantasy-tab";
    btn.textContent = def.label;
    btn.addEventListener("click", () => activateTab(def.id));
    tabButtons[def.id] = btn;
    tabs.append(btn);
  }

  startBtn.addEventListener("click", () => {
    if (typeof onStart === "function") onStart();
  });

  panels.append(runPanel, characterPanel, skillsPanel, settingsPanel);
  overlay.append(header, tabs, panels);
  document.body.append(overlay);

  function readGold() {
    return Number(localStorage.getItem("elementa_gold_v1") || 0);
  }

  function refresh() {
    walletValue.textContent = String(readGold());
  }

  function show() {
    refresh();
    characterModule.refresh();
    overlay.style.display = "flex";
    activateTab("run");
    requestAnimationFrame(() => {
      characterModule.fitLabels?.();
      overlay.focus();
    });
  }

  function hide() {
    overlay.style.display = "none";
  }

  activateTab("run");
  refresh();

  return { show, hide, refresh };
}