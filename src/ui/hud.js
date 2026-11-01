export function createHud(app, player, enemySystem, leveling, camera) {
  const cam = camera || { x: 0, y: 0 };
  const heroYBottom = 73;
  void app;
  const uiRoot = document.getElementById("ui");

  const hud = document.createElement("div");
  hud.id = "hud";
  Object.assign(hud.style, {
    position: "fixed",
    inset: "0",
    pointerEvents: "none",
    maxWidth: "100%",
  });

  if (uiRoot) {
    uiRoot.appendChild(hud);
  } else {
    document.body.appendChild(hud);
  }

  // Верхняя XP-полоса
  const xpTrack = document.createElement("div");
  Object.assign(xpTrack.style, {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    width: "100%",
    height: "16px",
    background: "#333",
    pointerEvents: "none",
  });
  const xpFill = document.createElement("div");
  Object.assign(xpFill.style, {
    height: "100%",
    width: "0%",
    background: "#ffd54f",
  });
  xpTrack.appendChild(xpFill);
  hud.appendChild(xpTrack);

  const levelText = document.createElement("div");
  Object.assign(levelText.style, {
    position: "absolute",
    top: "30px",
    left: "8px",
    color: "#fff",
    font: "bold 12px sans-serif",
    pointerEvents: "none",
  });
  levelText.textContent = "Уровень 1";
  hud.appendChild(levelText);

  const timer = document.createElement("div");
  Object.assign(timer.style, {
    position: "absolute",
    top: "30px",
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    font: "bold 18px sans-serif",
    pointerEvents: "none",
  });
  timer.textContent = "00:00";
  hud.appendChild(timer);

  const xpText = document.createElement("div");
  Object.assign(xpText.style, {
    position: "absolute",
    top: "30px",
    right: "8px",
    color: "#fff",
    font: "12px sans-serif",
    pointerEvents: "none",
  });
  hud.appendChild(xpText);

  // HP над головой героя
  const overhead = document.createElement("div");
  Object.assign(overhead.style, {
    position: "absolute",
    width: "36px",
    height: "4px",
    background: "#333",
    transform: "translate(-50%, 0)",
    pointerEvents: "none",
  });
  const overheadFill = document.createElement("div");
  Object.assign(overheadFill.style, {
    height: "100%",
    width: "100%",
    background: "red",
  });
  overhead.appendChild(overheadFill);
  hud.appendChild(overhead);

  // Нижний блок
  const bottom = document.createElement("div");
  Object.assign(bottom.style, {
    position: "absolute",
    left: "0",
    right: "0",
    bottom: "0",
    display: "block",
    pointerEvents: "none",
    maxWidth: "100%",
  });
  hud.appendChild(bottom);

  const boosts = document.createElement("div");
  Object.assign(boosts.style, {
    position: "absolute",
    left: "8px",
    bottom: "8px",
    maxWidth: "30%",
    color: "#fff",
    font: "12px sans-serif",
    pointerEvents: "none",
  });
  boosts.textContent = "Усиления: —";
  bottom.appendChild(boosts);

  const center = document.createElement("div");
  Object.assign(center.style, {
    position: "absolute",
    left: "50%",
    bottom: "8px",
    transform: "translateX(-50%)",
    width: "40%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    pointerEvents: "none",
  });
  bottom.appendChild(center);

  const weaponRow = document.createElement("div");
  Object.assign(weaponRow.style, {
    display: "flex",
    gap: "4px",
    marginBottom: "4px",
    pointerEvents: "none",
  });
  const weaponSlot = document.createElement("div");
  Object.assign(weaponSlot.style, {
    padding: "2px 6px",
    background: "#222",
    color: "#fff",
    font: "12px sans-serif",
    pointerEvents: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  });
  const weaponIcon = document.createElement("div");
  weaponIcon.textContent = "🌙";
  const weaponStars = document.createElement("div");
  Object.assign(weaponStars.style, {
    font: "bold 10px sans-serif",
  });
  weaponStars.textContent = "★";
  weaponSlot.appendChild(weaponIcon);
  weaponSlot.appendChild(weaponStars);
  weaponRow.appendChild(weaponSlot);
  center.appendChild(weaponRow);

  const hpTrack = document.createElement("div");
  Object.assign(hpTrack.style, {
    width: "100%",
    height: "24px",
    background: "#333",
    pointerEvents: "none",
  });
  const hpFill = document.createElement("div");
  Object.assign(hpFill.style, {
    height: "100%",
    width: "100%",
    background: "red",
  });
  hpTrack.appendChild(hpFill);
  center.appendChild(hpTrack);

  const hpText = document.createElement("div");
  Object.assign(hpText.style, {
    position: "absolute",
    left: "50%",
    bottom: "12px",
    transform: "translate(-50%, 50%)",
    color: "#fff",
    font: "12px sans-serif",
    textShadow: "rgba(0,0,0,.6) 1px 1px",
    pointerEvents: "none",
    whiteSpace: "nowrap",
  });
  center.appendChild(hpText);

  const statsCol = document.createElement("div");
  Object.assign(statsCol.style, {
    position: "absolute",
    right: "8px",
    bottom: "8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "2px",
    pointerEvents: "none",
  });
  bottom.appendChild(statsCol);

  const killsLine = document.createElement("div");
  Object.assign(killsLine.style, {
    color: "#fff",
    font: "12px sans-serif",
    pointerEvents: "none",
    textAlign: "right",
    maxWidth: "none",
    width: "auto",
    whiteSpace: "nowrap",
  });
  killsLine.textContent = `0 💀`;
  statsCol.appendChild(killsLine);

  const goldLine = document.createElement("div");
  Object.assign(goldLine.style, {
    color: "#fff",
    font: "12px sans-serif",
    pointerEvents: "none",
    textAlign: "right",
    maxWidth: "none",
    width: "auto",
    whiteSpace: "nowrap",
  });
  goldLine.textContent = `0 🪙`;
  statsCol.appendChild(goldLine);

  let elapsed = 0;

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  const update = (dt) => {
    if (!leveling.paused) {
      elapsed += dt;
    }

    const xpToNext = leveling.xpToNext || 1;
    const xpRatio = Math.max(0, Math.min(1, (leveling.xp || 0) / xpToNext));
    xpFill.style.width = `${xpRatio * 100}%`;
    levelText.textContent = `Уровень ${leveling.level ?? 1}`;
    xpText.textContent = `Опыт ${leveling.xp ?? 0} / ${leveling.xpToNext ?? 1}`;
    timer.textContent = formatTime(elapsed);

    const body = player.body || {};
    const px = body.x ?? player.x ?? 0;
    const py = body.y ?? player.y ?? 0;
    const sx = px - cam.x + app.screen.width / 2;
    const sy = py - cam.y + app.screen.height / 2;
    overhead.style.left = `${sx}px`;
    const offset = Math.round(heroYBottom * (player.body?.scale.y ?? 0.7)) + 4;
    overhead.style.top = `${sy + offset}px`;
    const hpRatio = Math.max(
      0,
      Math.min(1, (player.hp || 0) / (player.maxHp || 1)),
    );
    overheadFill.style.width = `${hpRatio * 100}%`;
    overhead.style.display = player.hp < player.maxHp ? "block" : "none";
    hpFill.style.width = `${hpRatio * 100}%`;
    hpText.textContent = `${player.hp ?? 0} / ${player.maxHp ?? 0}`;

    const kills = enemySystem?.kills ?? 0;
    killsLine.textContent = `${kills} 💀`;
    goldLine.textContent = `0 🪙`;
  };

  return {
    update,
    reset() {
      elapsed = 0;
    },
    get elapsed() {
      return elapsed;
    },
  };
}
