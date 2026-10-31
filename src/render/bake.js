const cache = new Map();

export function bake(key, size, drawFn) {
  if (cache.has(key)) return cache.get(key);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  drawFn(ctx, size);
  cache.set(key, canvas);
  return canvas;
}
