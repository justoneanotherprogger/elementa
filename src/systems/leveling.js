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
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.display = "none";
    overlay.style.zIndex = "2000";
    overlay.style.background = "rgba(0, 0, 0, 0.7)";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.flexDirection = "column";
    overlay.style.gap = "12px";
    overlay.style.color = "#fff";
    overlay.style.padding = "1rem";
    overlay.style.border = "1px solid #555";
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

    const title = document.createElement("h2");
    title.textContent = `Уровень ${state.level}`;
    title.style.margin = "0";
    overlay.appendChild(title);

    if (choices) {
      const cardRow = document.createElement("div");
      Object.assign(cardRow.style, { display: "flex", gap: "12px" });
      overlay.appendChild(cardRow);
      choices.forEach((choice, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = `${index + 1}. ${choice.label}`;
        button.addEventListener("click", () => applyChoice(choice));
        Object.assign(button.style, { width: "140px", padding: "12px", background: "#222", color: "#fff", border: "1px solid #555", font: "14px sans-serif", cursor: "pointer" });
        cardRow.appendChild(button);
      });
    }
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
