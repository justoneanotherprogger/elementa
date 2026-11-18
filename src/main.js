import { Application, Assets } from "pixi.js";
import { createLoop } from "./core/loop.js";
import { createInput } from "./systems/input.js";
import { createPlayer } from "./systems/player.js";
import { createDamageNumbers } from "./systems/damageNumbers.js";
import { createEnemySystem } from "./systems/enemy.js";
import { createWeaponSystem } from "./systems/weapons.js";
import { createSkillSystem } from "./systems/skills.js";
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
import { createSettingsPanel } from "./ui/settingsPanel.js";
import {
  loadCharacter,
  combatSpriteUrl,
  previewSpriteUrl,
  startingWeaponId,
  weaponConfigById,
  withAssetBase,
  characterScale,
} from "./data/characters.js";
import { damageMultiplier } from "./data/upgrades.js";
import { runCardsForElement } from "./data/runCards.js";
import { masteryCardsForWeapon } from "./data/weaponMastery.js";
import "./ui/theme.css";
import { STARTER_WEAPON, SPEAR_WEAPON } from "./data/weapons/index.js";
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

  const assetUrl = (path) =>
    `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
  const enemyTexture = await Assets.load(
    assetUrl("assets/enemies/pix_goblin.png"),
  );
  const selectedCharacter = loadCharacter();
  async function loadPlayerTexture(character) {
    const candidates = [
      withAssetBase(previewSpriteUrl(character)),
      withAssetBase(combatSpriteUrl(character)),
    ].filter(Boolean);
    for (const spriteUrl of candidates) {
      try {
        return await Assets.load(spriteUrl);
      } catch {
        // Try the next available sprite.
      }
    }
    return null;
  }
  const playerTexture =
    (await loadPlayerTexture(selectedCharacter)) ??
    (await Assets.load(assetUrl("assets/player/races/pix_human_m.png")));
  const player = createPlayer(
    app,
    input,
    playerTexture,
    characterScale(selectedCharacter),
  );
  player.gold = 0;
  const damageNumbers = createDamageNumbers(app);
  player.onDamage = (amount) => damageNumbers.spawnOnPlayer(player, amount);

  let playerSkinRequest = 0;
  function applyPlayerSkin(character) {
    player.setScale(characterScale(character));
    const request = ++playerSkinRequest;
    loadPlayerTexture(character)
      .then((texture) => {
        if (texture && request === playerSkinRequest) {
          player.body.texture = texture;
        }
      })
      .catch(() => {});
  }
  const audio = createAudio();
  let rewardOpen = false;
  let rewardScreen = null;
  let pauseOpen = false;
  let pauseSettingsOpen = false;
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
    background:
      "radial-gradient(circle at center, rgba(27, 20, 16, 0.82), rgba(6, 4, 3, 0.95))",
    backdropFilter: "blur(3px)",
    color: "var(--color-text)",
    pointerEvents: "auto",
  });
  pauseOverlay.style.display = "none";

  const pauseMainView = document.createElement("div");
  Object.assign(pauseMainView.style, {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "var(--sp-4)",
  });

  const pauseSigil = document.createElement("div");
  pauseSigil.style.color = "var(--color-accent)";
  pauseSigil.style.opacity = "0.8";
  pauseSigil.style.filter = "drop-shadow(0 0 14px rgba(212,169,66,0.5))";
  pauseSigil.textContent = "II";
  Object.assign(pauseSigil.style, {
    font: "700 40px var(--font-display)",
    letterSpacing: "0.25em",
  });
  const pauseText = document.createElement("div");
  pauseText.className = "fantasy-title";
  pauseText.textContent = "Пауза";
  Object.assign(pauseText.style, { fontSize: "34px" });
  const pauseHint = document.createElement("div");
  pauseHint.className = "fantasy-subtitle";
  pauseHint.textContent = "Esc — продолжить";

  const pauseResumeBtn = document.createElement("button");
  pauseResumeBtn.type = "button";
  pauseResumeBtn.className = "fantasy-button";
  pauseResumeBtn.textContent = "Продолжить";

  const pauseSettingsBtn = document.createElement("button");
  pauseSettingsBtn.type = "button";
  pauseSettingsBtn.className = "fantasy-button fantasy-button--ghost";
  pauseSettingsBtn.textContent = "Настройки";

  const pauseQuitBtn = document.createElement("button");
  pauseQuitBtn.type = "button";
  pauseQuitBtn.className = "fantasy-button fantasy-button--ghost";
  pauseQuitBtn.textContent = "Покинуть поле боя";

  const pauseSettings = createSettingsPanel({ audio });
  const pauseSettingsView = document.createElement("div");
  Object.assign(pauseSettingsView.style, {
    display: "none",
    flexDirection: "column",
    alignItems: "center",
    gap: "var(--sp-4)",
    width: "min(560px, 100%)",
    maxHeight: "82vh",
    overflowY: "auto",
    padding: "var(--sp-2)",
  });
  const pauseSettingsBackBtn = document.createElement("button");
  pauseSettingsBackBtn.type = "button";
  pauseSettingsBackBtn.className = "fantasy-button fantasy-button--ghost";
  pauseSettingsBackBtn.textContent = "Назад";
  pauseSettingsView.append(pauseSettings.root, pauseSettingsBackBtn);

  function setPauseSettingsOpen(value) {
    pauseSettingsOpen = value;
    pauseMainView.style.display = value ? "none" : "flex";
    pauseSettingsView.style.display = value ? "flex" : "none";
    if (value) pauseSettings.refresh();
  }

  function setPauseOpen(value) {
    pauseOpen = value;
    pauseOverlay.style.display = value ? "flex" : "none";
    if (!value) setPauseSettingsOpen(false);
  }

  pauseResumeBtn.addEventListener("click", () => setPauseOpen(false));
  pauseSettingsBtn.addEventListener("click", () => setPauseSettingsOpen(true));
  pauseSettingsBackBtn.addEventListener("click", () =>
    setPauseSettingsOpen(false),
  );
  pauseQuitBtn.addEventListener("click", () => {
    setPauseOpen(false);
    finishRun("quit");
  });

  pauseMainView.append(
    pauseSigil,
    pauseText,
    pauseHint,
    pauseResumeBtn,
    pauseSettingsBtn,
    pauseQuitBtn,
  );
  pauseOverlay.append(pauseMainView, pauseSettingsView);
  document.body.appendChild(pauseOverlay);
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (
      lobbyOpen ||
      rewardOpen ||
      leveling.paused ||
      player.hp <= 0 ||
      gamePaused
    )
      return;
    if (pauseOpen && pauseSettingsOpen) {
      setPauseSettingsOpen(false);
      event.preventDefault();
      return;
    }
    setPauseOpen(!pauseOpen);
    event.preventDefault();
  });
  let hud = null;
  let runGold = 0;
  let runGoldSaved = false;
  const savedGold = Number(localStorage.getItem("elementa_gold_v1") || 0);
  void savedGold;
  const chestSystem = createChestSystem(app, player, {
    onCollect: () => {
      const chestGold = 100 + Math.floor(Math.random() * 51);
      runGold += chestGold;
      player.gold = runGold;
      openRewardScreen(chestGold);
    },
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
      onEnemyDamage: (enemy, amount) =>
        damageNumbers.spawnOnEnemy(enemy, amount),
    },
  );
  const zoneSystem = createZoneSystem(app, enemySystem, player);
  const reactionSystem = createReactionSystem({ zoneSystem, audio });
  const weaponSystem = createWeaponSystem(app, player, enemySystem, {
    initialWeapons: [],
    zoneSystem,
    reactionSystem,
  });
  const initialCharacter = loadCharacter();
  const initialElement = initialCharacter.element;
  const skillSystem = createSkillSystem(app, player, enemySystem, {
    element: initialElement,
    reactionSystem,
  });
  function runCardsFor(character) {
    return [
      ...runCardsForElement(character.element),
      ...masteryCardsForWeapon(startingWeaponId(character)),
    ];
  }
  const leveling = createLeveling(player, enemySystem, {
    cards: runCardsFor(initialCharacter),
    skills: skillSystem,
    weapons: weaponSystem,
  });
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
  hud = createHud(
    app,
    player,
    enemySystem,
    leveling,
    weaponSystem,
    skillSystem,
  );

  const debug = createDebugPanel();

  function makeRewardChoices() {
    const choices = [];
    const hasSerp = weaponSystem.weapons.some((w) => w.id === "serp");
    const hasSpear = weaponSystem.weapons.some((w) => w.id === "spear");
    if (!hasSpear)
      choices.push({
        kind: "weapon",
        label: "Копьё · Вода",
        config: SPEAR_WEAPON,
      });
    else if (!hasSerp)
      choices.push({
        kind: "weapon",
        label: "Серп · Огонь",
        config: STARTER_WEAPON,
      });
    else choices.push({ kind: "gold", label: "+25 🪙", amount: 25 });
    return choices;
  }
  function openRewardScreen(chestGold = 0) {
    rewardOpen = true;
    rewardScreen.open(makeRewardChoices(), { gold: chestGold });
  }

  let gamePaused = false;
  let lobbyOpen = true;
  let runTime = 0;

  function restartRun() {
    gamePaused = false;
    runTime = 0;
    player.runTime = 0;
    rewardOpen = false;
    setPauseOpen(false);
    rewardScreen?.close();
    const runCharacter = loadCharacter();
    applyPlayerSkin(runCharacter);
    if (weaponSystem) {
      weaponSystem.reset();
      weaponSystem.addWeapon(weaponConfigById(startingWeaponId(runCharacter)));
    }
    enemySystem.reset();
    zoneSystem.reset();
    player.dmgMult = damageMultiplier();
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
    damageNumbers.reset();
    const cx = app.screen.width / 2;
    const cy = app.screen.height / 2;
    if (player.body) {
      player.body.x = cx;
      player.body.y = cy;
    }
    player.x = cx;
    player.y = cy;
    leveling.reset();
    leveling.setCards(runCardsFor(runCharacter));
    skillSystem.reset(runCharacter.element);
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
    audio.music.runStart();
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
  audio.music.menuStart();

  const onVictory = () => {
    finishRun("victory");
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

  function finishRun(outcome) {
    if (gamePaused) return;
    gamePaused = true;
    leveling.paused = true;
    audio.music.endStart(outcome);
    if (outcome === "death") player.hp = 0;
    saveRunGold();
    if (outcome === "victory") {
      victoryScreen.show();
    } else {
      deathScreen.show(
        outcome === "quit"
          ? { title: "Поражение", subtitle: "Вы покинули поле боя." }
          : {},
      );
    }
  }

  const loop = createLoop({
    update(dt) {
      arena.update(dt);
      player.pauseOpen = pauseOpen;
      player.rewardOpen = rewardOpen;
      const paused =
        gamePaused || leveling.paused || rewardOpen || pauseOpen || lobbyOpen;
      if (!paused) {
        runTime += dt;
        player.runTime = runTime;
        waves.update(dt, runTime);
      }
      const playing =
        !gamePaused &&
        !leveling.paused &&
        !rewardOpen &&
        !pauseOpen &&
        !lobbyOpen;
      if (playing) {
        input.update();
        player.update(dt);
        camera.x += (player.body.x - camera.x) * 0.2;
        camera.y += (player.body.y - camera.y) * 0.2;
        app.stage.pivot.set(camera.x, camera.y);
        app.stage.position.set(app.screen.width / 2, app.screen.height / 2);
        enemySystem.update(dt);
        weaponSystem.update(dt);
        skillSystem.update(dt);
        chestSystem?.update(dt);
        zoneSystem?.update(dt);
        damageNumbers.update(dt);
      }
      if (player.hp <= 0) finishRun("death");
      audio.music.setBossActive(
        Array.isArray(enemySystem.enemies) &&
          enemySystem.enemies.some((e) => e.isBoss),
      );
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
