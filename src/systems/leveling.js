export function createLeveling(player, enemySystem) {
  const state = {
    level: 1,
    xp: 0,
    xpToNext: 1 * 10,
    paused: false,
    seenXp: 0,
  };

  let choices = null;
  let overlay = null;

  const choicePool = [
    {
      key: "hp",
      label: "Max HP ×1.1",
      apply: (p) => {
        const ratio = p.maxHp ? p.hp / p.maxHp : 1;
        p.maxHp = Math.floor(p.maxHp * 1.1);
        p.hp = Math.round(ratio * p.maxHp);
      },
    },
    {
      key: "dmgMult",
      label: "Урон ×1.1",
      apply: (p) => {
        p.dmgMult = (p.dmgMult ?? 1) * 1.1;
      },
    },
    {
      key: "aspdMult",
      label: "Скорость атаки ×1.1",
      apply: (p) => {
        p.aspdMult = (p.aspdMult ?? 1) * 1.1;
      },
    },
    {
      key: "speedMult",
      label: "Скорость бега ×1.1",
      apply: (p) => {
        p.speedMult = (p.speedMult ?? 1) * 1.1;
      },
    },
    {
      key: "areaMult",
      label: "Площадь ×1.1",
      apply: (p) => {
        p.areaMult = (p.areaMult ?? 1) * 1.1;
      },
    },
    {
      key: "durMult",
      label: "Длительность ×1.1",
      apply: (p) => {
        p.durMult = (p.durMult ?? 1) * 1.1;
      },
    },
  ];

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

  function pickChoices() {
    const pool = [...choicePool];
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 3);
  }

  function applyChoice(choice) {
    if (choice && typeof choice.apply === "function") {
      choice.apply(player);
    }
    ensureOverlay();
    if (overlay) overlay.style.display = "none";
    choices = null;
    state.paused = false;
  }

  function renderOverlay() {
    ensureOverlay();
    if (!overlay) return;
    overlay.innerHTML = "";
    overlay.style.display = "flex";

    const panel = document.createElement("div");
    panel.className = "fantasy-panel fantasy-panel--ornate";
    Object.assign(panel.style, {
      maxWidth: "760px",
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
    title.textContent = `Новый уровень ${state.level}`;
    Object.assign(title.style, { margin: "0", fontSize: "clamp(26px, 4vw, 40px)" });
    panel.appendChild(title);

    const hint = document.createElement("div");
    hint.className = "fantasy-subtitle";
    hint.textContent = "Выберите одно усиление. Клавиши 1-3 работают так же.";
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

      choices.forEach((choice, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "fantasy-card fantasy-card--interactive";
        Object.assign(button.style, {
          minWidth: "180px",
          maxWidth: "240px",
          minHeight: "132px",
          padding: "var(--sp-4)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--sp-3)",
          cursor: "pointer",
          pointerEvents: "auto",
          border: "1px solid var(--color-accent-border)",
          background: "linear-gradient(180deg, rgba(42,32,26,0.95), rgba(27,20,16,0.95))",
        });
        const badge = document.createElement("div");
        badge.className = "fantasy-mono";
        Object.assign(badge.style, {
          width: "34px",
          height: "34px",
          borderRadius: "var(--radius-pill)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-accent-dim)",
          border: "1px solid var(--color-accent-border)",
          color: "var(--color-accent)",
          font: "700 15px var(--font-display)",
        });
        badge.textContent = String(index + 1);
        button.appendChild(badge);

        const label = document.createElement("div");
        label.textContent = choice.label;
        Object.assign(label.style, {
          font: "600 16px var(--font-display)",
          color: "var(--color-text)",
          textAlign: "center",
          lineHeight: "1.35",
        });
        button.appendChild(label);

        button.addEventListener("click", () => applyChoice(choice));
        button.addEventListener("focus", () => {
          button.style.boxShadow = "0 0 0 3px var(--color-accent-dim), var(--shadow-raised)";
        });
        button.addEventListener("blur", () => {
          button.style.boxShadow = "";
        });
        cardRow.appendChild(button);
      });
    }

    overlay.appendChild(panel);
  }

  function levelUp() {
    state.level += 1;
    state.xp -= state.xpToNext;
    state.xpToNext = state.level * 10;
    state.paused = true;
    choices = pickChoices();
    renderOverlay();
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
  return state;
}
