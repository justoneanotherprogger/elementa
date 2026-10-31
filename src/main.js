import { Application, Assets } from "pixi.js";
import { createLoop } from "./core/loop.js";
import { createInput } from "./systems/input.js";
import { createPlayer } from "./systems/player.js";
import { createEnemySystem } from "./systems/enemy.js";
import { createWeaponSystem } from "./systems/weapons.js";
import { createLeveling } from "./systems/leveling.js";
import { createSpatialHash } from "./core/spatialHash.js";
import { createStage } from "./render/stage.js";
import { createDebugPanel } from "./debug/panel.js";
import { createHud } from "./ui/hud.js";

const app = new Application();

async function start() {
  await app.init({
    resizeTo: window,
    background: 0x0a0a0a,
    antialias: true,
  });

  document.querySelector("#game")?.appendChild(app.canvas);
  app.ticker.stop();

  createStage(app);

  const input = createInput();
  const spatialHash = createSpatialHash();

  const enemyTexture = await Assets.load("/assets/enemies/pix_goblin.png");
  const playerTexture = await Assets.load("/assets/player/pix_human_m.png");
  const player = createPlayer(app, input, playerTexture);
  const enemySystem = createEnemySystem(app, player, spatialHash, enemyTexture);
  const weaponSystem = createWeaponSystem(app, player, enemySystem);
  const leveling = createLeveling(player, enemySystem);
  const hud = createHud(app, player, enemySystem, leveling);

  const debug = createDebugPanel();

  const loop = createLoop({
    update(dt) {
      if (!leveling.paused) {
        input.update();
        player.update(dt);
        enemySystem.update(dt);
        weaponSystem.update(dt);
      }
      leveling.update(dt);
      const fps = Math.min(999, Math.max(0, dt > 0 ? 1 / dt : 0));
      debug.update({
        fps,
        hp: player.hp,
        enemies: enemySystem.enemies.length,
        kills: enemySystem.kills,
        level: leveling.level,
      });
      hud.update(dt);
      if (player.hp <= 0) {
        player.hp = 60;
        player.invuln = 0.2;
      }
    },
    render() {
      app.render();
    },
    step: 1 / 60,
  });
  loop.start();
}

start();
