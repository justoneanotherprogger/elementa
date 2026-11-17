export function createRankStars(rank, options = {}) {
  const size = options.size ?? 9;
  const gap = options.gap ?? "1px";
  const color = options.color ?? "var(--color-accent)";
  const dimColor = options.dimColor ?? "rgba(212, 169, 66, 0.22)";

  const wrap = document.createElement("div");
  Object.assign(wrap.style, {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap,
    lineHeight: "1",
  });

  for (let row = 0; row < 2; row += 1) {
    const line = document.createElement("div");
    Object.assign(line.style, { display: "flex", gap: "1px" });
    for (let col = 0; col < 5; col += 1) {
      const star = document.createElement("span");
      star.textContent = "★";
      star.style.fontSize = `${size}px`;
      star.style.color = row * 5 + col < rank ? color : dimColor;
      line.appendChild(star);
    }
    wrap.appendChild(line);
  }

  return wrap;
}
