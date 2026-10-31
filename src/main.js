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
import { createDeathScreen } from "./ui/deathScreen.js";
import { createVictoryScreen } from "./ui/victoryScreen.js";
import { createWaves } from "./systems/waves.js";

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

  let gamePaused = false;
  let runTime = 0;

  function restartRun() {
    gamePaused = false;
    runTime = 0;
    if (weaponSystem && Array.isArray(weaponSystem.weapons)) {
      weaponSystem.weapons.forEach((weapon) => {
        if (weapon) weapon.timer = 0;
      });
    }
    enemySystem.reset();
    player.dmgMult = 1;
    player.aspdMult = 1;
    player.speedMult = 1;
    player.areaMult = 1;
    player.durMult = 1;
    player.maxHp = 60;
    player.hp = 60;
    player.invuln = 0.5;
    leveling.level = 1;
    leveling.xp = 0;
    leveling.xpToNext = 10;
    leveling.seenKills = 0;
    leveling.paused = false;
    hud.reset();
    if (waves?.reset) waves.reset();
    deathScreen.hide();
    victoryScreen.hide();
  }

  function quitRun() {
    window.location.reload();
  }

  const deathScreen = createDeathScreen(
    app,
    player,
    enemySystem,
    leveling,
    hud,
    restartRun,
    quitRun,
  );

  const victoryScreen = createVictoryScreen(
    app,
    player,
    enemySystem,
    leveling,
    hud,
    restartRun,
    quitRun,
  );

  const onVictory = () => {
    gamePaused = true;
    leveling.paused = true;
    victoryScreen.show();
  };

  const waves = createWaves({
    enemySystem,
    runTimeFn: () => runTime,
    onVictoryFn: onVictory,
    getPausedFn: () => gamePaused || leveling.paused,
  });

  const loop = createLoop({
    update(dt) {
      if (player.hp <= 0 && !gamePaused) {
        gamePaused = true;
        leveling.paused = true;
        player.hp = 0;
        deathScreen.show();
      }
      const paused = gamePaused || leveling.paused;
      if (!paused) {
        runTime += dt;
        waves.update(dt, runTime);
      }
      const playing = !gamePaused && !leveling.paused;
      if (playing) {
        input.update();
        player.update(dt);
        enemySystem.update(dt);
        weaponSystem.update(dt);
      }
      if (player.hp <= 0 && !gamePaused) {
        gamePaused = true;
        leveling.paused = true;
        player.hp = 0;
        deathScreen.show();
      }
      if (!gamePaused) leveling.update(dt);
      deathScreen.update(dt);
      victoryScreen.update(dt);
      hud.update(dt);
      const fps = Math.min(999, Math.max(0, dt > 0 ? 1 / dt : 0));
      debug.update({
        fps,
        hp: player.hp,
        enemies: enemySystem.enemies.length,
        kills: enemySystem.kills,
        level: leveling.level,
      });
    },
    render() {
      app.render();
    },
    step: 1 / 60,
  });
  loop.start();
}

start();
