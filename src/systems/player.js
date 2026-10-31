import { Graphics } from "pixi.js";

export function createPlayer(app, input) {
  const body = new Graphics();
  body.rect(-12, -12, 24, 24);
  body.fill(0x4caf50);

  body.x = app.screen.width / 2;
  body.y = app.screen.height / 2;
  app.stage.addChild(body);

  const speed = 180;

  return {
    update(dt) {
      const direction = input.direction();
      body.x += direction.x * speed * dt;
      body.y += direction.y * speed * dt;
    },
  };
}
