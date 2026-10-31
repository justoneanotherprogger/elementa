export function createSpatialHash(cellSize = 64) {
  const cells = new Map();

  function key(cx, cy) {
    return `${cx},${cy}`;
  }

  return {
    clear() {
      cells.clear();
    },
    add(entity) {
      const x = entity?.x ?? 0;
      const y = entity?.y ?? 0;
      const cx = Math.floor(x / cellSize);
      const cy = Math.floor(y / cellSize);
      const k = key(cx, cy);
      if (!cells.has(k)) cells.set(k, []);
      cells.get(k).push(entity);
      return entity;
    },
    getNearby(x, y, radius = cellSize) {
      const result = [];
      const minCx = Math.floor((x - radius) / cellSize);
      const maxCx = Math.floor((x + radius) / cellSize);
      const minCy = Math.floor((y - radius) / cellSize);
      const maxCy = Math.floor((y + radius) / cellSize);
      for (let cx = minCx; cx <= maxCx; cx++) {
        for (let cy = minCy; cy <= maxCy; cy++) {
          const bucket = cells.get(key(cx, cy));
          if (bucket) result.push(...bucket);
        }
      }
      return result;
    },
  };
}
