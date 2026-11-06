import { icon } from "./icons.js";

export function createDeathScreen(
  app,
  player,
  enemySystem,
  leveling,
  hud,
  onRestart,
  onQuit,
) {
  void app;
  void player;

  const overlay = document.createElement("div");
  overlay.id = "deathscreen";
  overlay.className = "fantasy-grain";
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: "var(--sp-4)",
    zIndex: "1060",
    background: "radial-gradient(circle at center, rgba(60, 20, 16, 0.82), rgba(8, 4, 3, 0.95))",
    backdropFilter: "blur(3px)",
    pointerEvents: "auto",
    padding: "var(--sp-5)",
    animation: "fantasy-flare var(--dur-base) var(--ease-out) both",
  });

  const sigil = document.createElement("div");
  sigil.style.color = "var(--color-danger)";
  sigil.style.opacity = "0.85";
  sigil.style.filter = "drop-shadow(0 0 14px rgba(226,85,85,0.55))";
  sigil.appendChild(icon("skull", 56));
  overlay.appendChild(sigil);

  const title = document.createElement("h2");
  title.textContent = "Вы погибли";
  title.className = "fantasy-title";
  Object.assign(title.style, {
    color: "var(--color-danger)",
    fontSize: "clamp(34px, 6vw, 56px)",
    textShadow: "0 2px 12px rgba(226,85,85,0.45)",
  });
  overlay.appendChild(title);

  const statsCard = document.createElement("div");
  statsCard.className = "fantasy-panel";
  Object.assign(statsCard.style, {
    maxWidth: "520px",
    width: "100%",
    textAlign: "center",
    padding: "var(--sp-4) var(--sp-5)",
  });
  const stats = document.createElement("div");
  Object.assign(stats.style, {
    color: "var(--color-text)",
    font: "500 16px var(--font-body)",
    lineHeight: "1.7",
  });
  statsCard.appendChild(stats);
  overlay.appendChild(statsCard);

  const formatTime = (seconds) => {
    const total = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const buttonRow = document.createElement("div");
  Object.assign(buttonRow.style, {
    display: "flex",
    gap: "var(--sp-3)",
    flexWrap: "wrap",
    justifyContent: "center",
  });

  const restartBtn = document.createElement("button");
  restartBtn.type = "button";
  restartBtn.className = "fantasy-button fantasy-button--primary";
  restartBtn.textContent = "Начать заново";
  restartBtn.addEventListener("click", () => {
    if (typeof onRestart === "function") onRestart();
  });

  const quitBtn = document.createElement("button");
  quitBtn.type = "button";
  quitBtn.className = "fantasy-button fantasy-button--ghost";
  quitBtn.textContent = "Покинуть поле боя";
  quitBtn.addEventListener("click", () => {
    if (typeof onQuit === "function") onQuit();
  });

  buttonRow.append(restartBtn, quitBtn);
  overlay.appendChild(buttonRow);

  document.body.appendChild(overlay);

  const show = () => {
    overlay.style.display = "flex";
    update(0);
  };

  const hide = () => {
    overlay.style.display = "none";
  };

  function update(_dt) {
    const elapsed = Number(hud?.elapsed) || 0;
    const level = leveling?.level ?? 1;
    const kills = enemySystem?.kills ?? 0;
    stats.innerHTML = `
      <span style="color:var(--color-text-dim)">Время </span><span class="fantasy-mono">${formatTime(elapsed)}</span>
      &nbsp;·&nbsp;
      <span style="color:var(--color-text-dim)">Уровень </span><span class="fantasy-mono">${level}</span>
      &nbsp;·&nbsp;
      <span style="color:var(--color-text-dim)">Убийства </span><span class="fantasy-mono">${kills}</span>
    `;
  }

  return { show, hide, update };
}