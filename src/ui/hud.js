import { Graphics } from "pixi.js";
import { iconOrSprite, weaponIcon } from "./icons.js";
import { SKILLS } from "../data/skills/index.js";
import { createRankStars } from "./rankStars.js";

export function createHud(app, player, enemySystem, leveling, weaponSystem, skillSystem) {
  const heroYBottom = 73;
  if (app.stage) app.stage.sortableChildren = true;
  const uiRoot = document.getElementById("ui");

  const hud = document.createElement("div");
  hud.id = "hud";
  Object.assign(hud.style, {
    position: "fixed",
    inset: "0",
    pointerEvents: "none",
    zIndex: "10",
    color: "var(--color-text)",
    fontFamily: "var(--font-body)",
  });

  if (uiRoot) uiRoot.appendChild(hud);
  else document.body.appendChild(hud);

  // Верхняя XP-полоса
  const xpTrack = document.createElement("div");
  Object.assign(xpTrack.style, {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    height: "10px",
    background: "rgba(20, 14, 10, 0.78)",
    borderBottom: "1px solid var(--color-accent-border)",
    pointerEvents: "none",
    overflow: "hidden",
  });
  const xpFill = document.createElement("div");
  Object.assign(xpFill.style, {
    height: "100%",
    width: "0%",
    background: "linear-gradient(90deg, var(--color-accent-pressed), var(--color-accent), var(--color-accent-hover))",
    boxShadow: "0 0 12px var(--color-accent-dim)",
    transition: "width var(--dur-base) var(--ease-out)",
  });
  xpTrack.appendChild(xpFill);
  hud.appendChild(xpTrack);

  const levelText = document.createElement("div");
  Object.assign(levelText.style, {
    position: "absolute",
    top: "16px",
    left: "var(--sp-5)",
    color: "var(--color-accent)",
    font: "600 13px var(--font-display)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    pointerEvents: "none",
    textShadow: "0 1px 3px rgba(0,0,0,0.95)",
  });
  levelText.textContent = "Уровень 1";
  hud.appendChild(levelText);

  const timer = document.createElement("div");
  Object.assign(timer.style, {
    position: "absolute",
    top: "14px",
    left: "50%",
    transform: "translateX(-50%)",
    color: "var(--color-text)",
    font: "700 20px var(--font-display)",
    letterSpacing: "0.04em",
    pointerEvents: "none",
    textShadow: "0 1px 4px rgba(0,0,0,0.95), 0 0 12px var(--color-accent-dim)",
  });
  timer.textContent = "00:00";
  hud.appendChild(timer);

  const xpText = document.createElement("div");
  Object.assign(xpText.style, {
    position: "absolute",
    top: "18px",
    right: "var(--sp-5)",
    color: "var(--color-text-dim)",
    font: "500 12px var(--font-mono)",
    pointerEvents: "none",
    textShadow: "0 1px 3px rgba(0,0,0,0.95)",
  });
  hud.appendChild(xpText);

  // HP над головой героя — канвасный Graphics, как у врагов, для единого принципа
  const overhead = new Graphics();
  overhead.zIndex = 5;
  app.stage.addChild(overhead);

  // Нижний блок
  const bottom = document.createElement("div");
  Object.assign(bottom.style, {
    position: "absolute",
    left: "0",
    right: "0",
    bottom: "0",
    pointerEvents: "none",
  });
  hud.appendChild(bottom);

  const boosts = document.createElement("div");
  Object.assign(boosts.style, {
    position: "absolute",
    left: "var(--sp-5)",
    bottom: "var(--sp-5)",
    maxWidth: "30%",
    color: "var(--color-text-dim)",
    font: "500 13px var(--font-body)",
    lineHeight: "1.5",
    pointerEvents: "none",
    textShadow: "0 1px 3px rgba(0,0,0,0.95)",
  });
  boosts.textContent = "Усиления: —";
  bottom.appendChild(boosts);

  const center = document.createElement("div");
  Object.assign(center.style, {
    position: "absolute",
    left: "50%",
    bottom: "var(--sp-5)",
    transform: "translateX(-50%)",
    width: "min(540px, 56vw)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "var(--sp-2)",
    pointerEvents: "none",
  });
  bottom.appendChild(center);

  const weaponRow = document.createElement("div");
  Object.assign(weaponRow.style, {
    display: "flex",
    gap: "var(--sp-2)",
    justifyContent: "center",
    pointerEvents: "none",
  });
  center.appendChild(weaponRow);

  const skillRow = document.createElement("div");
  Object.assign(skillRow.style, {
    display: "flex",
    gap: "var(--sp-2)",
    justifyContent: "center",
    pointerEvents: "none",
  });
  center.appendChild(skillRow);

  const hpTrack = document.createElement("div");
  Object.assign(hpTrack.style, {
    position: "relative",
    width: "100%",
    height: "22px",
    background: "rgba(20, 14, 10, 0.78)",
    border: "1px solid var(--color-accent-border)",
    borderRadius: "var(--radius-m)",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.45)",
    pointerEvents: "none",
  });
  const hpFill = document.createElement("div");
  Object.assign(hpFill.style, {
    height: "100%",
    width: "100%",
    background: "linear-gradient(90deg, #8a2525, var(--color-danger), #f07a7a)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
    transition: "width var(--dur-base) var(--ease-out)",
  });
  hpTrack.appendChild(hpFill);

  const hpText = document.createElement("div");
  Object.assign(hpText.style, {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    color: "#fff5e8",
    font: "600 13px var(--font-mono)",
    textShadow: "0 1px 2px rgba(0,0,0,0.95)",
    pointerEvents: "none",
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
  });
  hpTrack.appendChild(hpText);
  center.appendChild(hpTrack);

  const statsCol = document.createElement("div");
  Object.assign(statsCol.style, {
    position: "absolute",
    right: "var(--sp-5)",
    bottom: "var(--sp-5)",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "var(--sp-1)",
    pointerEvents: "none",
    textShadow: "0 1px 3px rgba(0,0,0,0.95)",
  });
  bottom.appendChild(statsCol);

  function makeStatLine(iconName, initialText, color) {
    const line = document.createElement("div");
    Object.assign(line.style, {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      color: color || "var(--color-text)",
      font: "600 14px var(--font-mono)",
      whiteSpace: "nowrap",
      fontVariantNumeric: "tabular-nums",
    });
    const ic = iconOrSprite(iconName, 16);
    ic.style.color = "var(--color-accent)";
    line.appendChild(ic);
    const value = document.createElement("span");
    value.textContent = initialText;
    line.appendChild(value);
    return { line, value };
  }

  const killsStat = makeStatLine("skull", "0", "var(--color-text)");
  statsCol.appendChild(killsStat.line);

  const goldStat = makeStatLine("coin", String(player?.gold ?? 0), "var(--color-gold)");
  statsCol.appendChild(goldStat.line);

  function syncWeaponSlots() {
    const weapons = Array.isArray(weaponSystem?.weapons) ? weaponSystem.weapons : [];
    const signature = weapons.map((weapon) => `${weapon?.id}:${weapon?.rank ?? 1}`).join("|");
    if (weaponRow.dataset.signature === signature) return;
    weaponRow.dataset.signature = signature;
    weaponRow.replaceChildren();
    for (const weapon of weapons) {
      const slot = document.createElement("div");
      Object.assign(slot.style, {
        minWidth: "56px",
        padding: "6px 10px",
        background: "linear-gradient(180deg, rgba(42,32,26,0.85), rgba(27,20,16,0.85))",
        color: "var(--color-text)",
        border: "1px solid var(--color-accent-border)",
        borderRadius: "var(--radius-m)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
        pointerEvents: "none",
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
      });
      const weaponIconEl = weaponIcon(weapon, 36);
      weaponIconEl.style.color = "var(--color-accent)";
      const weaponStars = createRankStars(weapon?.rank ?? 1, { size: 8, gap: "1px" });
      slot.appendChild(weaponIconEl);
      slot.appendChild(weaponStars);
      weaponRow.appendChild(slot);
    }
  }

  function syncSkillSlots() {
    const slots = Array.isArray(skillSystem?.slots) ? skillSystem.slots : [];
    const signature = slots.map((slot) => (slot ? `${slot.id}:${slot.rank}` : "empty")).join("|");
    if (skillRow.dataset.signature === signature) return;
    skillRow.dataset.signature = signature;
    skillRow.replaceChildren();

    for (const slot of slots) {
      const skill = slot ? SKILLS[slot.id] : null;
      const cell = document.createElement("div");
      Object.assign(cell.style, {
        width: "54px",
        height: "66px",
        padding: "4px 3px",
        background: slot
          ? "linear-gradient(180deg, rgba(42,32,26,0.85), rgba(27,20,16,0.85))"
          : "rgba(20,14,10,0.35)",
        border: slot ? "1px solid var(--color-accent-border)" : "1px dashed rgba(212,169,66,0.28)",
        borderRadius: "var(--radius-m)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2px",
        pointerEvents: "none",
        boxShadow: slot ? "0 2px 8px rgba(0,0,0,0.4)" : "none",
        opacity: slot ? "1" : "0.7",
      });

      const glyph = document.createElement("div");
      glyph.textContent = skill?.icon ?? "·";
      Object.assign(glyph.style, {
        fontSize: slot ? "36px" : "18px",
        lineHeight: "1",
        color: "var(--color-text-dim)",
        filter: slot ? "drop-shadow(0 0 5px rgba(255,255,255,0.18))" : "none",
      });
      cell.appendChild(glyph);

      if (slot) {
        cell.appendChild(createRankStars(slot.rank, { size: 8, gap: "1px" }));
      }
      skillRow.appendChild(cell);
    }
  }

  let elapsed = 0;

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  const update = (dt) => {
    const displayedElapsed = player && player.runTime !== null ? player.runTime : elapsed;
    syncWeaponSlots();
    syncSkillSlots();
    if (!leveling.paused && !player?.rewardOpen && !player?.pauseOpen) {
      elapsed += dt;
    }

    const xpToNext = leveling.xpToNext || 1;
    const xpRatio = Math.max(0, Math.min(1, (leveling.xp || 0) / xpToNext));
    xpFill.style.width = `${xpRatio * 100}%`;
    levelText.textContent = `Уровень ${leveling.level ?? 1}`;
    xpText.textContent = `Опыт ${leveling.xp ?? 0} / ${leveling.xpToNext ?? 1}`;
    timer.textContent = formatTime(displayedElapsed);

    const body = player.body || {};
    const px = body.x ?? player.x ?? 0;
    const py = body.y ?? player.y ?? 0;
    const offset = Math.round(heroYBottom * (player.body?.scale.y ?? 0.7)) + 4;
    const hpRatio = Math.max(0, Math.min(1, (player.hp || 0) / (player.maxHp || 1)));
    hpFill.style.width = `${hpRatio * 100}%`;
    // Канвасный HP-бар над игроком: единый принцип с врагами, мировые координаты сцены
    overhead.visible = (player.hp || 0) < (player.maxHp || 1);
    overhead.clear();
    if (overhead.visible) {
      const barWidth = 46;
      const barHeight = 6;
      const x = px - barWidth / 2;
      const y = py + offset;
      overhead.roundRect(x, y, barWidth, barHeight, 2).fill(0x1b1410);
      overhead.roundRect(x, y, barWidth * hpRatio, barHeight, 2).fill(0xe25555);
      overhead.roundRect(x, y, barWidth, barHeight, 2).stroke({ width: 1, color: 0x8a6d3b, alpha: 0.35 });
    }
    hpText.textContent = `${player.hp ?? 0} / ${player.maxHp ?? 0}`;

    const kills = enemySystem?.kills ?? 0;
    killsStat.value.textContent = `${kills}`;
    const gold = player?.gold ?? 0;
    goldStat.value.textContent = `${gold}`;
  };

  return {
    update,
    reset() {
      elapsed = 0;
    },
    get elapsed() {
      if (player && player.runTime !== null) return player.runTime;
      return elapsed;
    },
  };
}