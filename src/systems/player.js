import { Sprite } from "pixi.js";

export const PLAYER_BASE = {
  maxHp: 100,
  speed: 180,
};

export const PLAYER_SCALE = 0.7;

// scaleMultiplier — расовый/половой множитель поверх базового PLAYER_SCALE.
export function createPlayer(app, input, texture, scaleMultiplier = 1) {
  const body = new Sprite(texture);
  body.anchor.set(0.5);
  body.scale.set(PLAYER_SCALE * scaleMultiplier);

  body.x = app.screen.width / 2;
  body.y = app.screen.height / 2;
  app.stage.addChild(body);

  const maxHp = PLAYER_BASE.maxHp;

  const player = {
    body,
    hp: maxHp,
    maxHp,
    invuln: 0,
    dmgMult: 1,
    aspdMult: 1,
    speedMult: 1,
    areaMult: 1,
    durMult: 1,
    lastMoveDir: { x: 0, y: -1 },
    update(dt) {
      const speed = PLAYER_BASE.speed * (player.speedMult ?? 1);
      const direction = input.direction();
      body.x += direction.x * speed * dt;
      body.y += direction.y * speed * dt;
      const d = input.direction();
      const mag = Math.hypot(d.x, d.y);
      if (mag > 0.01) {
        player.lastMoveDir = { x: d.x / mag, y: d.y / mag };
      }
      if (d.x < 0) body.scale.x = +Math.abs(body.scale.x);
      else if (d.x > 0) body.scale.x = -Math.abs(body.scale.x);
      if (player.invuln > 0) {
        player.invuln = Math.max(0, player.invuln - dt);
      }
    },
    takeDamage(amount) {
      if (player.invuln <= 0) {
        player.hp -= amount;
        player.invuln = 0.5;
        player.onDamage?.(amount);
      }
    },
    setScale(scaleMultiplier) {
      const sign = body.scale.x < 0 ? -1 : 1;
      const nextScale = PLAYER_SCALE * scaleMultiplier;
      body.scale.set(sign * nextScale, nextScale);
    },
  };
  return player;
}