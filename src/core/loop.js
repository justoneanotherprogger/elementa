export function createLoop({ update, render, step = 1 / 60 }) {
  let last = performance.now() / 1000;
  let accumulator = 0;
  let running = false;
  const maxSteps = 3;
  let frameId = null;

  function tick(nowMs) {
    if (!running) return;
    const now = nowMs / 1000;
    let delta = now - last;
    if (delta > 0.25) delta = 0.25;
    last = now;
    accumulator += delta;

    let steps = 0;
    while (accumulator >= step && steps < maxSteps) {
      update(step);
      accumulator -= step;
      steps += 1;
    }

    render();
    frameId = requestAnimationFrame(tick);
  }

  return {
    start() {
      running = true;
      last = performance.now() / 1000;
      accumulator = 0;
      frameId = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      if (frameId !== null) cancelAnimationFrame(frameId);
    },
  };
}
