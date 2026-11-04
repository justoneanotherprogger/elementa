import { Sprite } from "pixi.js";

export function createPlayer(app, input, texture) {
  const body = new Sprite(texture);
  body.anchor.set(0.5);
  body.scale.set(0.7);

  body.x = app.screen.width / 2;
  body.y = app.screen.height / 2;
  app.stage.addChild(body);

  const maxHp = 100;

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
      const speed = 180 * (player.speedMult ?? 1);
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
      }
    },
  };
  return player;
}