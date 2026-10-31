export function createDebugPanel() {
  const panel = document.createElement("div");
  panel.style.position = "fixed";
  panel.style.top = "8px";
  panel.style.right = "8px";
  panel.style.zIndex = "1000";
  panel.style.display = "none";
  panel.style.padding = "8px 10px";
  panel.style.background = "rgba(0, 0, 0, 0.75)";
  panel.style.color = "#7cff7c";
  panel.style.font = "12px monospace";
  panel.style.borderRadius = "4px";
  panel.style.pointerEvents = "none";

  const fpsLine = document.createElement("div");
  const hpLine = document.createElement("div");
  const enemiesLine = document.createElement("div");
  const killsLine = document.createElement("div");

  let fps = 0;
  let hp = 60;
  let enemies = 0;
  let kills = 0;

  fpsLine.textContent = "FPS: 0";
  hpLine.textContent = "HP: 60";
  enemiesLine.textContent = "Враги: 0";
  killsLine.textContent = "Убийства: 0";

  panel.append(fpsLine, hpLine, enemiesLine, killsLine);
  document.body.appendChild(panel);

  let visible = false;
  const show = () => {
    panel.style.display = "block";
    visible = true;
  };
  const hide = () => {
    panel.style.display = "none";
    visible = false;
  };
  const toggle = () => {
    if (visible) hide();
    else show();
  };

  const update = (stats = {}) => {
    if (stats.fps !== undefined) fps = stats.fps;
    if (stats.hp !== undefined) hp = stats.hp;
    if (stats.enemies !== undefined) enemies = stats.enemies;
    if (stats.kills !== undefined) kills = stats.kills;
    fpsLine.textContent = `FPS: ${Math.round(fps)}`;
    hpLine.textContent = `HP: ${hp}`;
    enemiesLine.textContent = `Враги: ${enemies}`;
    killsLine.textContent = `Убийства: ${kills}`;
  };

  const onKeyDown = (event) => {
    if (event.code === "Backquote") toggle();
  };
  window.addEventListener("keydown", onKeyDown);

  return { update, toggle, show, hide };
}
