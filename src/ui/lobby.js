const GOLD_KEY = "elementa_gold_v1";

export function createLobby({ onStart } = {}) {
  const overlay = document.createElement("div");
  overlay.id = "elementa-lobby";
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    display: "none",
    flexDirection: "column",
    background: "#0a0a0a",
    color: "#fff",
    font: "16px sans-serif",
    zIndex: "1200",
    padding: "24px",
  });

  const header = document.createElement("header");
  Object.assign(header.style, {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: "16px",
    borderBottom: "1px solid #222",
    minHeight: "40px",
  });

  const title = document.createElement("h1");
  title.textContent = "ELEMENTA";
  Object.assign(title.style, {
    margin: "0",
    font: "bold 32px sans-serif",
    textAlign: "center",
  });

  const wallet = document.createElement("div");
  Object.assign(wallet.style, {
    position: "absolute",
    right: "0",
    top: "0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    font: "bold 18px sans-serif",
  });
  const walletLabel = document.createElement("span");
  walletLabel.style.color = "#9e9e9e";
  walletLabel.textContent = "Золото:";
  const walletValue = document.createElement("span");
  walletValue.textContent = "0";
  wallet.append(walletLabel, walletValue);
  header.append(title, wallet);

  const tabs = document.createElement("nav");
  Object.assign(tabs.style, {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingTop: "16px",
  });

  const panels = document.createElement("main");
  Object.assign(panels.style, {
    flex: "1",
    paddingTop: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  });

  const tabDefs = [
    { id: "run", label: "В бой" },
    { id: "character", label: "Персонаж" },
    { id: "skills", label: "Дерево навыков" },
  ];

  function makePanel(id) {
    const p = document.createElement("section");
    p.dataset.tab = id;
    p.style.display = "none";
    return p;
  }

  const runPanel = makePanel("run");
  // Card layout
  const card = document.createElement("div");
  Object.assign(card.style, {
    background: "#141414",
    border: "1px solid #2a2a2a",
    borderRadius: "4px",
    padding: "20px",
    maxWidth: "360px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  });
  const arenaTitle = document.createElement("div");
  arenaTitle.textContent = "Гоблинский лес";
  arenaTitle.style.font = "bold 20px sans-serif";
  const arenaDuration = document.createElement("div");
  arenaDuration.textContent = "Длительность 30:00";
  arenaDuration.style.color = "#9e9e9e";
  const startBtn = document.createElement("button");
  startBtn.type = "button";
  startBtn.textContent = "Начать забег";
  Object.assign(startBtn.style, {
    padding: "8px 16px",
    font: "14px sans-serif",
    cursor: "pointer",
    pointerEvents: "auto",
  });
  card.append(arenaTitle, arenaDuration, startBtn);
  runPanel.append(card);

  const characterPanel = makePanel("character");
  const characterContainer = document.createElement("div");
  characterContainer.id = "lobby-character-panel";
  characterContainer.textContent = "Выбор героя появится позже";
  characterPanel.append(characterContainer);

  const skillsPanel = makePanel("skills");
  const skillsContainer = document.createElement("div");
  skillsContainer.id = "lobby-skilltree-panel";
  skillsContainer.textContent = "Дерево навыков появится позже";
  skillsPanel.append(skillsContainer);

  const panelMap = { run: runPanel, character: characterPanel, skills: skillsPanel };

  const tabButtons = {};
  function activateTab(tabId) {
    for (const def of tabDefs) {
      const btn = tabButtons[def.id];
      if (btn) btn.style.background = def.id === tabId ? "#2a2a2a" : "transparent";
      panelMap[def.id].style.display = def.id === tabId ? "flex" : "none";
    }
  }

  for (const def of tabDefs) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = def.label;
    Object.assign(btn.style, {
      padding: "8px 16px",
      font: "14px sans-serif",
      cursor: "pointer",
      pointerEvents: "auto",
      border: "1px solid #2a2a2a",
      borderRadius: "4px",
      background: "transparent",
      color: "#fff",
    });
    btn.addEventListener("click", () => activateTab(def.id));
    tabButtons[def.id] = btn;
    tabs.append(btn);
  }

  startBtn.addEventListener("click", () => {
    if (typeof onStart === "function") onStart();
  });

  panels.append(runPanel, characterPanel, skillsPanel);
  overlay.append(header, tabs, panels);
  document.body.append(overlay);

  function readGold() {
    return Number(localStorage.getItem(GOLD_KEY) || 0);
  }

  function refresh() {
    walletValue.textContent = String(readGold());
  }

  function show() {
    refresh();
    overlay.style.display = "flex";
    activateTab("run");
  }

  function hide() {
    overlay.style.display = "none";
  }

  // initial
  activateTab("run");
  refresh();

  return { show, hide, refresh };
}