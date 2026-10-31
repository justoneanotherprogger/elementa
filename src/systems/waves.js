export function createWaves({
  enemySystem,
  runTimeFn,
  onVictoryFn,
  getPausedFn,
} = {}) {
  const spawnInterval = 0.5;
  let spawnTimer = 0;
  let lastBossLevel = 0;
  let victoryTriggered = false;

  function getTime(arg) {
    if (arg !== undefined && arg !== null) return Number(arg) || 0;
    if (typeof runTimeFn === "function") return Number(runTimeFn()) || 0;
    return 0;
  }

  function reset() {
    spawnTimer = 0;
    lastBossLevel = 0;
    victoryTriggered = false;
  }

  function update(dt, timeArg) {
    if (typeof getPausedFn === "function" && getPausedFn()) return;
    const sec = getTime(timeArg);
    const density = Math.round(20 + (480 * Math.min(sec, 1800)) / 1800);
    const statGains = 1 + Math.floor(sec / 10) * 0.01;

    spawnTimer += dt ?? 0;
    while (
      spawnTimer >= spawnInterval &&
      enemySystem?.enemies?.length < density
    ) {
      spawnTimer -= spawnInterval;
      if (typeof enemySystem.spawnEnemy === "function") {
        enemySystem.spawnEnemy(statGains, statGains, 1);
      }
      if ((enemySystem?.enemies?.length ?? 0) >= 500) break;
    }

    const bossLevel = Math.floor(sec / 300);
    if (bossLevel > lastBossLevel) {
      lastBossLevel = bossLevel;
      if (typeof enemySystem?.spawnEnemy === "function") {
        enemySystem.spawnEnemy(statGains * 0.6, statGains * 5, 1.6);
      }
    }

    if (!victoryTriggered && sec >= 1800) {
      victoryTriggered = true;
      if (typeof onVictoryFn === "function") onVictoryFn();
    }
  }

  return { update, reset };
}
