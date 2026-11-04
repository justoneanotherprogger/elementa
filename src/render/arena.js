import { Container, Graphics } from "pixi.js";
import { createRng } from "../core/rng.js";
import { ARENA_CONFIG } from "../data/arena.js";

function hashChunk(cx, cy) {
  return (Math.imul(cx, 374761393) + Math.imul(cy, 668265263)) >>> 0;
}

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function createChunk(cx, cy, config) {
  const size = config.chunkSize;
  const rng = createRng(hashChunk(cx, cy));
  const container = new Container();
  container.x = cx * size;
  container.y = cy * size;

  const floor = new Graphics();
  floor.rect(0, 0, size, size).fill(config.floorColor);
  container.addChild(floor);

  const spots = new Graphics();
  const spotCount = randInt(rng, config.spotsPerChunk[0], config.spotsPerChunk[1]);
  for (let i = 0; i < spotCount; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    const rx = 18 + rng() * 34;
    const ry = 8 + rng() * 16;
    spots.ellipse(x, y, rx, ry).fill(config.spotColor);
  }
  container.addChild(spots);

  const stones = new Graphics();
  const stoneCount = randInt(rng, config.stonesPerChunk[0], config.stonesPerChunk[1]);
  for (let i = 0; i < stoneCount; i += 1) {
    const cxp = 8 + rng() * (size - 16);
    const cyp = 8 + rng() * (size - 16);
    const sides = 4 + Math.floor(rng() * 3);
    const radius = 4 + rng() * 5;
    stones.moveTo(cxp + radius, cyp);
    for (let j = 1; j <= sides; j += 1) {
      const angle = (j / sides) * Math.PI * 2;
      const r = radius * (0.82 + rng() * 0.36);
      stones.lineTo(cxp + Math.cos(angle) * r, cyp + Math.sin(angle) * r);
    }
    stones.closePath();
    stones.fill(config.stoneColor);
  }
  container.addChild(stones);

  const trees = new Graphics();
  const treeCount = randInt(rng, config.treesPerChunk[0], config.treesPerChunk[1]);
  for (let i = 0; i < treeCount; i += 1) {
    const x = 20 + rng() * (size - 40);
    const y = 30 + rng() * (size - 60);
    const trunkH = 16 + rng() * 8;
    trees.rect(x - 2, y, 4, trunkH).fill(config.trunkColor);
    trees.ellipse(x, y - 12, 10 + rng() * 8, 10 + rng() * 6).fill(config.crownColor);
    trees.ellipse(x, y - 12, 10 + rng() * 8, 10 + rng() * 6).stroke({ color: config.outlineColor, width: 1 });
  }
  container.addChild(trees);

  return container;
}

export function createArena(app, camera) {
  const config = ARENA_CONFIG;
  const size = config.chunkSize;
  const margin = 1;
  const layer = new Container();
  app.stage.addChildAt(layer, 0);

  const chunks = new Map();
  let currentMinX = null;
  let currentMaxX = null;
  let currentMinY = null;
  let currentMaxY = null;

  function updateChunks(minCx, minCy, maxCx, maxCy) {
    const desired = new Set();
    for (let cy = minCy; cy <= maxCy; cy += 1) {
      for (let cx = minCx; cx <= maxCx; cx += 1) {
        const key = `${cx},${cy}`;
        desired.add(key);
        if (!chunks.has(key)) {
          const parts = key.split(",");
          const chunk = createChunk(Number(parts[0]), Number(parts[1]), config);
          chunks.set(key, chunk);
          layer.addChild(chunk);
        }
      }
    }
    for (const [key, chunk] of [...chunks.entries()]) {
      if (!desired.has(key)) {
        if (chunk.parent) chunk.parent.removeChild(chunk);
        chunk.destroy({ children: true });
        chunks.delete(key);
      }
    }
  }

  function update() {
    if (!camera || !app?.screen) return;
    const minCx = Math.floor((camera.x - app.screen.width / 2) / size) - margin;
    const maxCx = Math.floor((camera.x + app.screen.width / 2) / size) + margin;
    const minCy = Math.floor((camera.y - app.screen.height / 2) / size) - margin;
    const maxCy = Math.floor((camera.y + app.screen.height / 2) / size) + margin;

    if (
      minCx === currentMinX &&
      maxCx === currentMaxX &&
      minCy === currentMinY &&
      maxCy === currentMaxY
    ) {
      return;
    }

    currentMinX = minCx;
    currentMaxX = maxCx;
    currentMinY = minCy;
    currentMaxY = maxCy;
    updateChunks(minCx, minCy, maxCx, maxCy);
  }

  function reset() {
    for (const chunk of chunks.values()) {
      if (chunk.parent) chunk.parent.removeChild(chunk);
      chunk.destroy({ children: true });
    }
    chunks.clear();
    currentMinX = null;
    currentMaxX = null;
    currentMinY = null;
    currentMaxY = null;
    update();
  }

  update();

  return { layer, update, reset };
}
