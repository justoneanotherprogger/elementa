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
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      display: "none",
      zIndex: "2000",
      background: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
      gap: "12px",
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

    const title = document.createElement("div");
    title.textContent = "Сундук";
    title.style.color = "#fff";
    title.style.font = "bold 20px sans-serif";
    overlay.appendChild(title);

    const row = document.createElement("div");
    Object.assign(row.style, { display: "flex", gap: "12px" });
    overlay.appendChild(row);

    choices.forEach((choice, index) => {
      const card = document.createElement("button");
      Object.assign(card.style, {
        width: "140px",
        padding: "12px",
        background: "#222",
        color: "#fff",
        border: "1px solid #555",
        font: "14px sans-serif",
        cursor: "pointer",
      });
      card.textContent = `${index + 1}. ${choice.label}`;
      card.addEventListener("click", () => select(index, choices));
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