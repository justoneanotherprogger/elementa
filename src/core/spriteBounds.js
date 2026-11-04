export function spriteHalfWidth(sprite) {
  return (sprite?.width ?? 0) / 2;
}

export function spriteHalfHeight(sprite) {
  return (sprite?.height ?? 0) / 2;
}

export function spriteTopY(sprite, y) {
  return y - (sprite?.height ?? 0) * (sprite?.anchor?.y ?? 0.5);
}

export function spriteBounds(sprite) {
  const x = sprite?.x ?? 0;
  const y = sprite?.y ?? 0;
  const width = sprite?.width ?? 0;
  const height = sprite?.height ?? 0;
  const ax = sprite?.anchor?.x ?? 0.5;
  const ay = sprite?.anchor?.y ?? 0.5;
  return {
    left: x - width * ax,
    right: x + width * (1 - ax),
    top: y - height * ay,
    bottom: y + height * (1 - ay),
    width,
    height,
  };
}

export function spriteHitBounds(sprite, trimRatio = 0.1) {
  const x = sprite?.x ?? 0;
  const y = sprite?.y ?? 0;
  const width = sprite?.width ?? 0;
  const height = sprite?.height ?? 0;
  const trim = height * trimRatio;
  const halfH = height / 2 - trim;
  return {
    left: x - width / 2,
    right: x + width / 2,
    top: y - halfH,
    bottom: y + halfH,
    width,
    height,
  };
}
