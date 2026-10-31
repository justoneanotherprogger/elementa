import { Sprite } from "pixi.js";

export function createPlayer(app, input, texture) {
  const body = new Sprite(texture);
  body.anchor.set(0.5);
  body.scale.set(0.7);

  body.x = app.screen.width / 2;
  body.y = app.screen.height / 2;
  app.stage.addChild(body);

  const maxHp = 60;

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
    update(dt) {
      const speed = 180 * (player.speedMult ?? 1);
      const direction = input.direction();
      body.x += direction.x * speed * dt;
      body.y += direction.y * speed * dt;
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
