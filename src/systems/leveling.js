import { rankTitle } from "../data/runCards.js";
import { createRankStars } from "../ui/rankStars.js";
import { spriteImage } from "../ui/icons.js";

export function createLeveling(player, enemySystem, options = {}) {
  let cards = Array.isArray(options.cards) ? options.cards : [];
  const skills = options.skills ?? null;
  const weapons = options.weapons ?? null;
  const state = {
    level: 1,
    xp: 0,
    xpToNext: 1 * 10,
    paused: false,
    seenXp: 0,
  };

  let choices = null;
  let overlay = null;
  const pendingLevels = [];

  function ensureOverlay() {
    if (overlay) {
      if (!document.body.contains(overlay)) {
        document.body.appendChild(overlay);
      }
      return;
    }
    overlay = document.getElementById("levelup");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "levelup";
      document.body.appendChild(overlay);
    }
    overlay.className = "fantasy-grain";
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      display: "none",
      zIndex: "2000",
      background: "radial-gradient(circle at center, rgba(50, 38, 18, 0.78), rgba(6, 4, 3, 0.92))",
      backdropFilter: "blur(3px)",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
      gap: "var(--sp-4)",
      color: "var(--color-text)",
      padding: "var(--sp-5)",
      pointerEvents: "auto",
    });
  }

  function hideOverlay() {
    if (overlay) overlay.style.display = "none";
  }

  function cardCandidates() {
    const context = { player, skills, weapons };
    const candidates = [];
    for (const card of cards) {
      const rank = card.rankOf ? card.rankOf(context) : 0;
      if (rank >= card.maxRank) continue;
      if (rank === 0 && card.needsFreeSlot?.(context)) continue;
      candidates.push({ card, rank: rank + 1, isNew: rank === 0 });
    }
    return candidates;
  }

  function pickChoices() {
    const candidates = cardCandidates();
    for (let i = candidates.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    return candidates.slice(0, 3);
  }

  function openWindow() {
    const candidates = pickChoices();
    if (!candidates.length) {
      pendingLevels.length = 0;
      choices = null;
      hideOverlay();
      state.paused = false;
      return false;
    }
    choices = candidates;
    state.paused = true;
    renderOverlay(pendingLevels[0] ?? state.level);
    return true;
  }

  function applyChoice(choice) {
    if (choice?.card) {
      choice.card.apply({ player, skills, weapons });
    }
    pendingLevels.shift();
    choices = null;
    if (pendingLevels.length > 0) {
      openWindow();
      return;
    }
    hideOverlay();
    state.paused = false;
  }

  function renderCard(candidate, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fantasy-card fantasy-card--interactive";
    Object.assign(button.style, {
      minWidth: "200px",
      maxWidth: "250px",
      flex: "1 1 200px",
      padding: "var(--sp-4)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: "var(--sp-3)",
      cursor: "pointer",
      pointerEvents: "auto",
      border: "1px solid var(--color-accent-border)",
      background: "linear-gradient(180deg, rgba(42,32,26,0.95), rgba(27,20,16,0.95))",
    });

    const badge = document.createElement("div");
    badge.className = "fantasy-mono";
    Object.assign(badge.style, {
      width: "30px",
      height: "30px",
      borderRadius: "var(--radius-pill)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--color-accent-dim)",
      border: "1px solid var(--color-accent-border)",
      color: "var(--color-accent)",
      font: "700 14px var(--font-display)",
    });
    badge.textContent = String(index + 1);
    button.appendChild(badge);

    const titleBlock = document.createElement("div");
    Object.assign(titleBlock.style, {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "2px",
      width: "100%",
    });
    if (candidate.card.caption) {
      const caption = document.createElement("div");
      caption.textContent = candidate.card.caption;
      Object.assign(caption.style, {
        font: "500 10px var(--font-body)",
        color: "var(--color-text-dim)",
        textAlign: "center",
      });
      titleBlock.appendChild(caption);
    }

    const head = document.createElement("div");
    Object.assign(head.style, {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      width: "100%",
      justifyContent: "center",
    });
    const iconEl = document.createElement("div");
    if (candidate.card.sprite) {
      iconEl.appendChild(spriteImage(candidate.card.sprite, 32, true));
    } else {
      iconEl.textContent = candidate.card.icon ?? "★";
      iconEl.style.fontSize = "22px";
      iconEl.style.lineHeight = "1";
    }
    const name = document.createElement("div");
    name.textContent = candidate.card.title;
    Object.assign(name.style, {
      font: "600 16px var(--font-display)",
      color: "var(--color-text)",
      textAlign: "center",
      lineHeight: "1.25",
      width: "fit-content",
      maxWidth: "160px",
    });
    head.append(iconEl, name);
    titleBlock.appendChild(head);
    button.appendChild(titleBlock);

    const rankLine = document.createElement("div");
    rankLine.textContent = rankTitle(candidate.rank);
    Object.assign(rankLine.style, {
      font: "600 12px var(--font-display)",
      color: "var(--color-accent)",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      textAlign: "center",
    });
    button.appendChild(rankLine);
    button.appendChild(createRankStars(candidate.rank, { size: 11 }));

    const stats = document.createElement("div");
    Object.assign(stats.style, {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      width: "100%",
      marginTop: "auto",
    });
    const nextStats = candidate.card.stats(candidate.rank);
    const prevStats = candidate.isNew ? null : candidate.card.stats(candidate.rank - 1);
    nextStats.forEach((stat, statIndex) => {
      const row = document.createElement("div");
      Object.assign(row.style, {
        display: "flex",
        justifyContent: "space-between",
        gap: "8px",
        font: "500 12px var(--font-mono)",
        fontVariantNumeric: "tabular-nums",
      });
      const label = document.createElement("span");
      label.textContent = stat.label;
      label.style.color = "var(--color-text-dim)";
      const value = document.createElement("span");
      const previous = prevStats?.[statIndex];
      const changed = previous && previous.text !== stat.text;
      value.textContent = changed ? `${previous.text} → ${stat.text}` : stat.text;
      value.style.color = changed ? "var(--color-accent)" : "var(--color-text)";
      value.style.textAlign = "right";
      row.append(label, value);
      stats.appendChild(row);
    });
    button.appendChild(stats);

    button.addEventListener("click", () => applyChoice(candidate));
    button.addEventListener("focus", () => {
      button.style.boxShadow = "0 0 0 3px var(--color-accent-dim), var(--shadow-raised)";
    });
    button.addEventListener("blur", () => {
      button.style.boxShadow = "";
    });
    return button;
  }

  function renderOverlay(level) {
    ensureOverlay();
    if (!overlay) return;
    overlay.innerHTML = "";
    overlay.style.display = "flex";

    const panel = document.createElement("div");
    panel.className = "fantasy-panel fantasy-panel--ornate";
    Object.assign(panel.style, {
      maxWidth: "820px",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "var(--sp-4)",
      padding: "var(--sp-5)",
      animation: "fantasy-rise var(--dur-base) var(--ease-out) both",
    });

    const sigil = document.createElement("div");
    sigil.style.color = "var(--color-accent)";
    sigil.style.opacity = "0.85";
    sigil.style.filter = "drop-shadow(0 0 14px rgba(212,169,66,0.55))";
    sigil.textContent = "★";
    Object.assign(sigil.style, { font: "700 34px var(--font-display)" });
    panel.appendChild(sigil);

    const title = document.createElement("h2");
    title.className = "fantasy-title";
    title.textContent = `Новый уровень ${level}`;
    Object.assign(title.style, { margin: "0", fontSize: "clamp(26px, 4vw, 40px)" });
    panel.appendChild(title);

    const hint = document.createElement("div");
    hint.className = "fantasy-subtitle";
    hint.textContent = "Выберите одну карту. Клавиши 1-3 работают так же.";
    panel.appendChild(hint);

    if (choices) {
      const cardRow = document.createElement("div");
      Object.assign(cardRow.style, {
        display: "flex",
        gap: "var(--sp-3)",
        flexWrap: "wrap",
        justifyContent: "center",
        width: "100%",
      });
      panel.appendChild(cardRow);

      choices.forEach((candidate, index) => {
        cardRow.appendChild(renderCard(candidate, index));
      });
    }

    overlay.appendChild(panel);
  }

  function levelUp() {
    state.level += 1;
    state.xp -= state.xpToNext;
    state.xpToNext = state.level * 10;
    pendingLevels.push(state.level);
    if (!state.paused) openWindow();
  }

  function grantXp(amount) {
    state.xp += amount;
    while (state.xp >= state.xpToNext) {
      levelUp();
    }
  }

  function update(_dt) {
    if (state.paused) {
      ensureOverlay();
      if (overlay && overlay.style.display !== "flex") {
        overlay.style.display = "flex";
      }
      return;
    }
    const earnedXp = enemySystem?.xpEarned ?? 0;
    if (earnedXp > (state.seenXp ?? 0)) {
      const deltaXp = earnedXp - (state.seenXp ?? 0);
      grantXp(deltaXp);
      state.seenXp = earnedXp;
    }
  }

  const onKeyDown = (event) => {
    if (!state.paused || !choices) return;
    const index = Number(event.key) - 1;
    if (Number.isInteger(index) && index >= 0 && index < choices.length) {
      event.preventDefault();
      applyChoice(choices[index]);
    }
  };
  window.addEventListener("keydown", onKeyDown);

  state.xpToNext = state.level * 10;
  state.update = update;
  state.setCards = (nextCards) => {
    cards = Array.isArray(nextCards) ? nextCards : [];
  };
  state.reset = () => {
    state.level = 1;
    state.xp = 0;
    state.xpToNext = 10;
    state.seenXp = 0;
    state.paused = false;
    pendingLevels.length = 0;
    choices = null;
    hideOverlay();
  };
  return state;
}
