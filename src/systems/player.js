import { Graphics } from "pixi.js";

export function createPlayer(app, input) {
  const body = new Graphics();
  body.rect(-12, -12, 24, 24);
  body.fill(0x4caf50);

  body.x = app.screen.width / 2;
  body.y = app.screen.height / 2;
  app.stage.addChild(body);

  const speed = 180;
  const maxHp = 60;

  const player = {
    body,
    hp: maxHp,
    maxHp,
    invuln: 0,
    update(dt) {
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
        player.invuln = 0.2;
      }
    },
  };

  return player;
}
