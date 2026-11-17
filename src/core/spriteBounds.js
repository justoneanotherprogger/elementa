const ALPHA_THRESHOLD = 8;

// Границы непрозрачной части текстуры в пикселях кадра.
// Кадр 160×160 у спрайтов рас содержит прозрачные поля по бокам, поэтому
// хитбокс и полуразмеры считаются по контуру, а не по всему кадру.
const contentFrameCache = new WeakMap();

function measureContentFrame(texture) {
  const width = Math.round(texture?.width ?? 0);
  const height = Math.round(texture?.height ?? 0);
  const full = { x: 0, y: 0, width, height };
  const source = texture?.source;
  const resource = source?.resource;
  const frame = texture?.frame;
  if (!width || !height || !resource) return full;
  if (typeof OffscreenCanvas === "undefined" && typeof document === "undefined") return full;
  // Атласы не разбираем: у них ресурс больше кадра, и скан попал бы не туда.
  if (frame && (frame.x !== 0 || frame.y !== 0 || frame.width !== source.width || frame.height !== source.height)) {
    return full;
  }

  try {
    let canvas;
    if (typeof OffscreenCanvas !== "undefined") {
      canvas = new OffscreenCanvas(width, height);
    } else {
      canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
    }
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return full;
    context.drawImage(resource, 0, 0);
    const { data } = context.getImageData(0, 0, width, height);
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y += 1) {
      const row = y * width;
      for (let x = 0; x < width; x += 1) {
        if (data[(row + x) * 4 + 3] > ALPHA_THRESHOLD) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX || maxY < minY) return full;
    return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
  } catch {
    return full;
  }
}

function contentFrame(texture) {
  if (!texture) return null;
  let frame = contentFrameCache.get(texture);
  if (!frame) {
    frame = measureContentFrame(texture);
    contentFrameCache.set(texture, frame);
  }
  return frame;
}

export function spriteContentBounds(sprite) {
  const x = sprite?.x ?? 0;
  const y = sprite?.y ?? 0;
  const texture = sprite?.texture;
  const textureWidth = texture?.width ?? 0;
  const textureHeight = texture?.height ?? 0;
  const anchorX = sprite?.anchor?.x ?? 0.5;
  const anchorY = sprite?.anchor?.y ?? 0.5;
  const scaleX = sprite?.scale?.x ?? 1;
  const scaleY = sprite?.scale?.y ?? 1;
  const frame = contentFrame(texture) ?? { x: 0, y: 0, width: 0, height: 0 };

  const localLeft = (frame.x - anchorX * textureWidth) * scaleX;
  const localRight = (frame.x + frame.width - anchorX * textureWidth) * scaleX;
  const localTop = (frame.y - anchorY * textureHeight) * scaleY;
  const localBottom = (frame.y + frame.height - anchorY * textureHeight) * scaleY;
  const left = x + Math.min(localLeft, localRight);
  const right = x + Math.max(localLeft, localRight);
  const top = y + Math.min(localTop, localBottom);
  const bottom = y + Math.max(localTop, localBottom);
  return { left, right, top, bottom, width: right - left, height: bottom - top };
}

export function spriteHalfWidth(sprite) {
  return spriteContentBounds(sprite).width / 2;
}

export function spriteHalfHeight(sprite) {
  return spriteContentBounds(sprite).height / 2;
}

export function spriteTopY(sprite, y) {
  const baseY = y ?? sprite?.y ?? 0;
  const texture = sprite?.texture;
  const textureHeight = texture?.height ?? 0;
  const anchorY = sprite?.anchor?.y ?? 0.5;
  const scaleY = sprite?.scale?.y ?? 1;
  const frame = contentFrame(texture) ?? { x: 0, y: 0, width: 0, height: 0 };
  return baseY + (frame.y - anchorY * textureHeight) * scaleY;
}

export function spriteBounds(sprite) {
  return spriteContentBounds(sprite);
}

export function spriteHitBounds(sprite, trimRatio = 0.1) {
  const bounds = spriteContentBounds(sprite);
  const trim = bounds.height * trimRatio;
  return {
    left: bounds.left,
    right: bounds.right,
    top: bounds.top + trim,
    bottom: bounds.bottom - trim,
    width: bounds.width,
    height: Math.max(0, bounds.height - trim * 2),
  };
}
