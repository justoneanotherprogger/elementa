import { Application, Assets } from "pixi.js";
import { createLoop } from "./core/loop.js";
import { createInput } from "./systems/input.js";
import { createPlayer } from "./systems/player.js";
import { createEnemySystem } from "./systems/enemy.js";
import { createWeaponSystem } from "./systems/weapons.js";
import { createReactionSystem } from "./systems/reactions.js";
import { createZoneSystem } from "./systems/zones.js";
import { createAudio } from "./systems/audio.js";
import { createLeveling } from "./systems/leveling.js";
import { createSpatialHash } from "./core/spatialHash.js";
import { createStage } from "./render/stage.js";
import { createArena } from "./render/arena.js";
import { createDebugPanel } from "./debug/panel.js";
import { createHud } from "./ui/hud.js";
import { createDeathScreen } from "./ui/deathScreen.js";
import { createVictoryScreen } from "./ui/victoryScreen.js";
import { createWaves } from "./systems/waves.js";
import { createChestSystem } from "./systems/chests.js";
import { createRewardScreen } from "./ui/rewardScreen.js";
import { createLobby } from "./ui/lobby.js";
import "./ui/theme.css";
import { STARTER_WEAPON, SPEAR_WEAPON } from "./data/weapons.js";
const app = new Application();

async function start() {
  await app.init({
    resizeTo: window,
    background: 0x1b1410,
    antialias: true,
  });

  document.querySelector("#game")?.appendChild(app.canvas);
  app.ticker.stop();

  createStage(app);

  const camera = { x: app.screen.width / 2, y: app.screen.height / 2 };
  const arena = createArena(app, camera);
  const input = createInput();
  const spatialHash = createSpatialHash();

  const enemyTexture = await Assets.load("/assets/enemies/pix_goblin.png");
  const playerTexture = await Assets.load("/assets/player/pix_human_m.png");
  const player = createPlayer(app, input, playerTexture);
  player.gold = 0;
  const audio = createAudio();
  let rewardOpen = false;
  let rewardScreen = null;
  let pauseOpen = false;
  const pauseOverlay = document.createElement("div");
  pauseOverlay.className = "fantasy-grain";
  Object.assign(pauseOverlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "2000",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "var(--sp-4)",
    padding: "var(--sp-5)",
    background: "radial-gradient(circle at center, rgba(27, 20, 16, 0.82), rgba(6, 4, 3, 0.95))",
    backdropFilter: "blur(3px)",
    color: "var(--color-text)",
    pointerEvents: "auto",
  });
  pauseOverlay.style.display = "none";
  const pauseSigil = document.createElement("div");
  pauseSigil.style.color = "var(--color-accent)";
  pauseSigil.style.opacity = "0.8";
  pauseSigil.style.filter = "drop-shadow(0 0 14px rgba(212,169,66,0.5))";
  pauseSigil.textContent = "II";
  Object.assign(pauseSigil.style, { font: "700 40px var(--font-display)", letterSpacing: "0.25em" });
  const pauseText = document.createElement("div");
  pauseText.className = "fantasy-title";
  pauseText.textContent = "Пауза";
  Object.assign(pauseText.style, { fontSize: "34px" });
  const pauseHint = document.createElement("div");
  pauseHint.className = "fantasy-subtitle";
  pauseHint.textContent = "Esc — продолжить";
  const pauseQuitBtn = document.createElement("button");
  pauseQuitBtn.type = "button";
  pauseQuitBtn.className = "fantasy-button fantasy-button--ghost";
  pauseQuitBtn.textContent = "Покинуть поле боя";
  pauseQuitBtn.addEventListener("click", () => {
    pauseOpen = false;
    pauseOverlay.style.display = "none";
    quitRun();
  });

  const pauseSoundBtn = document.createElement("button");
  pauseSoundBtn.type = "button";
  pauseSoundBtn.className = "fantasy-button fantasy-button--ghost";
  const syncPauseSound = () => {
    pauseSoundBtn.textContent = audio.music.isMuted() ? "Звук: выкл" : "Звук: вкл";
  };
  syncPauseSound();
  pauseSoundBtn.addEventListener("click", () => {
    audio.music.toggleMuted();
    syncPauseSound();
  });
  pauseOverlay.append(pauseSigil, pauseText, pauseHint, pauseSoundBtn, pauseQuitBtn);
  document.body.appendChild(pauseOverlay);
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (lobbyOpen || rewardOpen || leveling.paused || player.hp <= 0 || gamePaused) return;
    pauseOpen = !pauseOpen;
    pauseOverlay.style.display = pauseOpen ? "flex" : "none";
    event.preventDefault();
  });
  let hud = null;
  let runGold = 0;
  let runGoldSaved = false;
  const savedGold = Number(localStorage.getItem("elementa_gold_v1") || 0);
  void savedGold;
  const chestSystem = createChestSystem(app, player, {
    onCollect: () => { openRewardScreen(); },
  });
  const enemySystem = createEnemySystem(
    app,
    player,
    spatialHash,
    enemyTexture,
    camera,
    {
      onBossDeath: (x, y) => {
        chestSystem?.spawn(x, y);
      },
    },
  );
  const zoneSystem = createZoneSystem(app, enemySystem, player);
  const reactionSystem = createReactionSystem({ zoneSystem, audio });
  const weaponSystem = createWeaponSystem(app, player, enemySystem, [SPEAR_WEAPON], reactionSystem);
  const leveling = createLeveling(player, enemySystem);
  rewardScreen = createRewardScreen({
    onPick: (choice) => {
      if (choice.kind === "weapon") {
        weaponSystem.addWeapon(choice.config);
      } else {
        runGold += choice.amount ?? 0;
        player.gold = runGold;
      }
      rewardOpen = false;
    },
  });
  hud = createHud(app, player, enemySystem, leveling, camera, weaponSystem, audio);

  const debug = createDebugPanel();

  function makeRewardChoices() {
    const choices = [];
    const hasSerp = weaponSystem.weapons.some((w) => w.id === "serp");
    const hasSpear = weaponSystem.weapons.some((w) => w.id === "spear");
    if (!hasSpear) choices.push({ kind: "weapon", label: "Копьё · Вода", config: SPEAR_WEAPON });
    else if (!hasSerp) choices.push({ kind: "weapon", label: "Серп · Огонь", config: STARTER_WEAPON });
    else choices.push({ kind: "gold", label: "+10 🪙", amount: 10 });
    choices.push({ kind: "gold", label: "+15 🪙", amount: 15 });
    choices.push({ kind: "gold", label: "+25 🪙", amount: 25 });
    return choices;
  }
  function openRewardScreen() {
    rewardOpen = true;
    rewardScreen.open(makeRewardChoices());
  }

  let gamePaused = false;
  let lobbyOpen = true;
  let runTime = 0;

  function restartRun() {
    gamePaused = false;
    runTime = 0;
    player.runTime = 0;
    rewardOpen = false;
    pauseOpen = false;
    pauseOverlay.style.display = "none";
    rewardScreen?.close();
    if (weaponSystem && Array.isArray(weaponSystem.weapons)) {
      weaponSystem.weapons.forEach((weapon) => {
        if (weapon) weapon.timer = 0;
      });
    }
    enemySystem.reset();
    zoneSystem.reset();
    player.dmgMult = 1;
    player.aspdMult = 1;
    player.speedMult = 1;
    player.areaMult = 1;
    player.durMult = 1;
    player.maxHp = 100;
    player.hp = 100;
    player.invuln = 0.5;
    runGold = 0;
    player.gold = 0;
    runGoldSaved = false;
    if (chestSystem) chestSystem.reset();
    const cx = app.screen.width / 2;
    const cy = app.screen.height / 2;
    if (player.body) {
      player.body.x = cx;
      player.body.y = cy;
    }
    player.x = cx;
    player.y = cy;
    leveling.level = 1;
    leveling.xp = 0;
    leveling.xpToNext = 10;
    leveling.seenXp = 0;
    leveling.paused = false;
    hud.reset();
    if (waves?.reset) waves.reset();
    deathScreen.hide();
    victoryScreen.hide();
  }

  function quitRun() {
    restartRun();
    audio.music.runStop();
    deathScreen.hide();
    victoryScreen.hide();
    lobby?.refresh();
    lobbyOpen = true;
    lobby?.show();
    audio.music.menuStart?.();
  }

  function restartNow() {
    lobbyOpen = false;
    lobby?.hide();
    restartRun();
  }

  const deathScreen = createDeathScreen(
    app,
    player,
    enemySystem,
    leveling,
    hud,
    restartNow,
    quitRun,
  );

  const victoryScreen = createVictoryScreen(
    app,
    player,
    enemySystem,
    leveling,
    hud,
    restartNow,
    quitRun,
  );

  const lobby = createLobby({
    audio,
    onStart: () => {
      lobbyOpen = false;
      lobby.hide();
      restartRun();
      audio.music.runStart();
    },
  });
  lobby.show();

  const onVictory = () => {
    gamePaused = true;
    leveling.paused = true;
    audio.music.runStop();
    saveRunGold();
    victoryScreen.show();
  };

  const waves = createWaves({
    enemySystem,
    runTimeFn: () => runTime,
    onVictoryFn: onVictory,
    getPausedFn: () => gamePaused || leveling.paused,
    camera,
  });

  function saveRunGold() {
    if (runGoldSaved) return;
    runGoldSaved = true;
    const previous = Number(localStorage.getItem("elementa_gold_v1") || 0);
    localStorage.setItem("elementa_gold_v1", String(previous + runGold));
  }

  window.addEventListener("beforeunload", saveRunGold);

  const loop = createLoop({
    update(dt) {
      arena.update(dt);
      player.pauseOpen = pauseOpen;
      player.rewardOpen = rewardOpen;
      if (player.hp <= 0 && !gamePaused) {
        gamePaused = true;
        leveling.paused = true;
        player.hp = 0;
        audio.music.runStop();
        saveRunGold();
        deathScreen.show();
      }
      const paused = gamePaused || leveling.paused || rewardOpen || pauseOpen || lobbyOpen;
      if (!paused) {
        runTime += dt;
        player.runTime = runTime;
        waves.update(dt, runTime);
      }
      const playing = !gamePaused && !leveling.paused && !rewardOpen && !pauseOpen && !lobbyOpen;
      if (playing) {
        input.update();
        player.update(dt);
        camera.x += (player.body.x - camera.x) * 0.2;
        camera.y += (player.body.y - camera.y) * 0.2;
        app.stage.pivot.set(camera.x, camera.y);
        app.stage.position.set(app.screen.width / 2, app.screen.height / 2);
        enemySystem.update(dt);
        weaponSystem.update(dt);
        chestSystem?.update(dt);
        zoneSystem?.update(dt);
      }
      if (player.hp <= 0 && !gamePaused) {
        gamePaused = true;
        leveling.paused = true;
        player.hp = 0;
        deathScreen.show();
      }
      audio.music.setBossActive(Array.isArray(enemySystem.enemies) && enemySystem.enemies.some((e) => e.isBoss));
      if (!gamePaused && !lobbyOpen) leveling.update(dt);
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
