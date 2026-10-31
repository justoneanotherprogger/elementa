export function createVictoryScreen(
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
  overlay.id = "victoryscreen";
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: "12px",
    zIndex: "1001",
    background: "rgba(0, 0, 0, 0.7)",
    pointerEvents: "auto",
  });

  const title = document.createElement("h2");
  title.textContent = "Вы победили";
  Object.assign(title.style, {
    color: "#fff",
    margin: "0",
    font: "bold 32px sans-serif",
  });
  overlay.appendChild(title);

  const stats = document.createElement("div");
  Object.assign(stats.style, {
    color: "#fff",
    font: "16px sans-serif",
    pointerEvents: "none",
  });
  overlay.appendChild(stats);

  const formatTime = (seconds) => {
    const total = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const restartBtn = document.createElement("button");
  restartBtn.type = "button";
  restartBtn.textContent = "Начать новое сражение";
  Object.assign(restartBtn.style, {
    padding: "8px 16px",
    font: "14px sans-serif",
    cursor: "pointer",
    pointerEvents: "auto",
  });
  restartBtn.addEventListener("click", () => {
    if (typeof onRestart === "function") onRestart();
  });
  overlay.appendChild(restartBtn);

  const quitBtn = document.createElement("button");
  quitBtn.type = "button";
  quitBtn.textContent = "Покинуть поле боя";
  Object.assign(quitBtn.style, {
    padding: "8px 16px",
    font: "14px sans-serif",
    cursor: "pointer",
    pointerEvents: "auto",
  });
  quitBtn.addEventListener("click", () => {
    if (typeof onQuit === "function") onQuit();
  });
  overlay.appendChild(quitBtn);

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
    stats.textContent = `Время ${formatTime(elapsed)} · Уровень ${level} · Убийства ${kills} · Золото 0`;
  }

  return { show, hide, update };
}
