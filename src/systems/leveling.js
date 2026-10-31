export function createLeveling(player, enemySystem) {
  const state = {
    level: 1,
    xp: 0,
    xpToNext: 1 * 10,
    paused: false,
    seenKills: 0,
  };

  let choices = null;
  let overlay = null;

  const choicePool = [
    {
      key: "hp",
      label: "HP +6 / maxHP ×1.1",
      apply: (p) => {
        p.maxHp *= 1.1;
        p.hp = Math.min(p.hp + 6, p.maxHp);
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
    overlay.style.top = "50%";
    overlay.style.left = "50%";
    overlay.style.transform = "translate(-50%, -50%)";
    overlay.style.zIndex = "1000";
    overlay.style.background = "#222";
    overlay.style.border = "1px solid #555";
    overlay.style.padding = "1rem";
    overlay.style.display = "none";
    overlay.style.flexDirection = "column";
    overlay.style.gap = "0.5rem";
    overlay.style.alignItems = "center";
    overlay.style.color = "#fff";
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
    title.textContent = `Уровень ${state.level} (XP ${state.xp}/${state.xpToNext})`;
    title.style.margin = "0";
    overlay.appendChild(title);

    if (choices) {
      choices.forEach((choice, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = `${index + 1}. ${choice.label}`;
        button.addEventListener("click", () => applyChoice(choice));
        overlay.appendChild(button);
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
    if (enemySystem && enemySystem.kills > (state.seenKills || 0)) {
      const delta = enemySystem.kills - (state.seenKills || 0);
      grantXp(delta);
      state.seenKills = enemySystem.kills;
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
