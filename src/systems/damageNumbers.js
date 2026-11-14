import { Text } from "pixi.js";
import { isDamageNumbersEnabled } from "../data/settings.js";

const POOL_SIZE = 64;
const LIFETIME = 0.75;
const FADE_FROM = 0.45;
const BASE_COLOR = 0xffe9b8;
const PLAYER_COLOR = 0xe25555;

export function createDamageNumbers(app) {
  const items = [];

  for (let i = 0; i < POOL_SIZE; i += 1) {
    const text = new Text({
      text: "",
      style: {
        fontFamily: "Georgia, serif",
        fontSize: 16,
        fontWeight: "700",
        fill: BASE_COLOR,
        stroke: { color: 0x1b1410, width: 3 },
      },
    });
    text.anchor.set(0.5);
    text.visible = false;
    text.zIndex = 60;
    app.stage.addChild(text);
    items.push({ text, age: 0, vx: 0, vy: 0, alive: false });
  }

  let cursor = 0;

  function spawn(x, y, amount, options = {}) {
    if (!isDamageNumbersEnabled()) return;
    const value = Math.max(0, Math.round(amount));
    if (value <= 0) return;

    const item = items[cursor % POOL_SIZE];
    cursor += 1;

    item.text.text = String(value);
    item.text.style.fill = options.color ?? BASE_COLOR;
    item.text.x = x + (Math.random() - 0.5) * 12;
    item.text.y = y;
    item.text.alpha = 1;
    item.text.visible = true;
    item.age = 0;
    item.vx = (Math.random() - 0.5) * 30;
    item.vy = -46 - Math.random() * 14;
    item.alive = true;
  }

  function update(dt) {
    for (const item of items) {
      if (!item.alive) continue;
      item.age += dt;
      if (item.age >= LIFETIME) {
        item.alive = false;
        item.text.visible = false;
        continue;
      }
      item.text.x += item.vx * dt;
      item.text.y += item.vy * dt;
      const fade = Math.max(0, (item.age - FADE_FROM) / (LIFETIME - FADE_FROM));
      item.text.alpha = 1 - fade;
    }
  }

  function reset() {
    for (const item of items) {
      item.alive = false;
      item.text.visible = false;
    }
    cursor = 0;
  }

  function spawnOnEnemy(enemy, amount) {
    const scale = enemy?.scale ?? 1;
    spawn(enemy?.x ?? 0, (enemy?.y ?? 0) - 28 * scale, amount);
  }

  function spawnOnPlayer(player, amount) {
    spawn(player?.body?.x ?? 0, (player?.body?.y ?? 0) - 30, amount, { color: PLAYER_COLOR });
  }

  return { spawn, spawnOnEnemy, spawnOnPlayer, update, reset };
}
