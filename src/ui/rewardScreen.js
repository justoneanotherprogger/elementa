import { icon, weaponIcon } from "./icons.js";

export function createRewardScreen({ onPick } = {}) {
  let overlay = null;
  let keyHandler = null;

  function ensure() {
    if (overlay) {
      if (!document.body.contains(overlay)) document.body.appendChild(overlay);
      return;
    }
    overlay = document.createElement("div");
    overlay.id = "reward";
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
      gap: "var(--sp-5)",
      padding: "var(--sp-5)",
      pointerEvents: "auto",
    });
    document.body.appendChild(overlay);
  }

  function close() {
    if (keyHandler) {
      window.removeEventListener("keydown", keyHandler);
      keyHandler = null;
    }
    if (overlay) overlay.style.display = "none";
  }

  function select(index, choices) {
    const choice = choices[index];
    if (!choice) return;
    if (typeof onPick === "function") onPick(choice);
    close();
  }

  function open(choices = []) {
    ensure();
    if (!overlay) return;
    overlay.innerHTML = "";
    overlay.style.display = "flex";

    const header = document.createElement("div");
    Object.assign(header.style, {
      display: "flex",
      alignItems: "center",
      gap: "var(--sp-3)",
    });
    const sigil = document.createElement("div");
    sigil.style.color = "var(--color-gold)";
    sigil.style.filter = "drop-shadow(0 0 12px rgba(212,169,66,0.5))";
    sigil.appendChild(icon("chest", 40));
    const title = document.createElement("h2");
    title.textContent = "Сундук";
    title.className = "fantasy-title";
    Object.assign(title.style, { margin: "0", fontSize: "32px" });
    header.append(sigil, title);
    overlay.appendChild(header);

    const hint = document.createElement("div");
    hint.className = "fantasy-subtitle";
    hint.textContent = "Выберите одну награду. Клавиши 1-3 работают так же.";
    overlay.appendChild(hint);

    const row = document.createElement("div");
    Object.assign(row.style, {
      display: "flex",
      gap: "var(--sp-4)",
      flexWrap: "wrap",
      justifyContent: "center",
    });
    overlay.appendChild(row);

    choices.forEach((choice, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "fantasy-card fantasy-card--interactive";
      Object.assign(card.style, {
        minWidth: "160px",
        maxWidth: "200px",
        minHeight: "150px",
        padding: "var(--sp-4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--sp-3)",
        border: "1px solid var(--color-accent-border)",
        cursor: "pointer",
        pointerEvents: "auto",
        background: "linear-gradient(180deg, rgba(42,32,26,0.95), rgba(27,20,16,0.95))",
      });

      const badge = document.createElement("div");
      badge.className = "fantasy-mono";
      Object.assign(badge.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "var(--radius-pill)",
        background: "var(--color-accent-dim)",
        border: "1px solid var(--color-accent-border)",
        color: "var(--color-accent)",
        font: "700 16px var(--font-display)",
      });
      badge.textContent = String(index + 1);
      card.appendChild(badge);

      const ic = choice.kind === "weapon" ? weaponIcon(choice.config?.id || "spear", 36) : icon("coin", 36);
      ic.style.color = "var(--color-accent)";
      card.appendChild(ic);

      const label = document.createElement("div");
      label.textContent = choice.label;
      Object.assign(label.style, {
        font: "600 16px var(--font-display)",
        color: "var(--color-text)",
        textAlign: "center",
        lineHeight: "1.3",
      });
      card.appendChild(label);

      card.addEventListener("click", () => select(index, choices));
      card.addEventListener("focus", () => {
        card.style.boxShadow = "0 0 0 3px var(--color-accent-dim), var(--shadow-raised)";
      });
      card.addEventListener("blur", () => {
        card.style.boxShadow = "";
      });
      row.appendChild(card);
    });

    if (keyHandler) window.removeEventListener("keydown", keyHandler);
    keyHandler = (event) => {
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < choices.length) {
        event.preventDefault();
        select(index, choices);
      }
    };
    window.addEventListener("keydown", keyHandler);
  }

  return { open, close, isOpen: () => !!overlay && overlay.style.display === "flex" };
}