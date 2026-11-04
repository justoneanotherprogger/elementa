import { Graphics } from "pixi.js";

export function createChestSystem(app, player, options = {}) {
  const onCollect = typeof options.onCollect === "function" ? options.onCollect : () => {};
  let chest = null;
  app.stage.sortableChildren = true;

  function playerPosition() {
    if (player?.body) return { x: player.body.x, y: player.body.y };
    return { x: player?.x ?? 0, y: player?.y ?? 0 };
  }

  function removeChest() {
    if (chest?.graphic && chest.graphic.parent) {
      chest.graphic.parent.removeChild(chest.graphic);
      chest.graphic.destroy();
    }
    chest = null;
  }

  function spawn(x, y) {
    if (chest) return false;
    const graphic = new Graphics();
    graphic.rect(0, 0, 24, 18).fill(0xffd54f);
    graphic.rect(0, 0, 24, 18).stroke({ color: 0x333333, width: 2 });
    graphic.x = x - 12;
    graphic.y = y - 9;
    graphic.zIndex = 1000;
    app.stage.addChild(graphic);
    chest = { x, y, graphic };
    return true;
  }

  function update(dt) {
    void dt;
    if (!chest) return;
    const pos = playerPosition();
    const dx = pos.x - chest.x;
    const dy = pos.y - chest.y;
    if (Math.hypot(dx, dy) < 30) {
      onCollect({ gold: 10 });
      removeChest();
    }
    if (chest?.graphic?.parent) {
      app.stage.setChildIndex(chest.graphic, app.stage.children.length - 1);
    }
  }

  function reset() {
    removeChest();
  }

  return { spawn, update, reset };
}
