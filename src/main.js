import { Application } from "pixi.js";
import { createLoop } from "./core/loop.js";
import { createInput } from "./systems/input.js";
import { createPlayer } from "./systems/player.js";
import { createStage } from "./render/stage.js";

const app = new Application();

async function start() {
  await app.init({
    resizeTo: window,
    background: 0x0a0a0a,
    antialias: true,
  });

  document.querySelector("#game")?.appendChild(app.canvas);
  app.ticker.stop();

  createStage(app);

  const input = createInput();
  const player = createPlayer(app, input);

  const loop = createLoop({
    update(dt) {
      input.update();
      player.update(dt);
    },
    render() {
      app.render();
    },
    step: 1 / 60,
  });

  loop.start();
}

start();
