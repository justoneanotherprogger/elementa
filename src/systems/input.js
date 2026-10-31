const pressed = new Set();

window.addEventListener("keydown", (event) => {
  pressed.add(event.code);
});

window.addEventListener("keyup", (event) => {
  pressed.delete(event.code);
});

function has(code) {
  return pressed.has(code);
}

export function createInput() {
  return {
    direction() {
      let x = 0;
      let y = 0;
      if (has("KeyW") || has("ArrowUp")) y -= 1;
      if (has("KeyS") || has("ArrowDown")) y += 1;
      if (has("KeyA") || has("ArrowLeft")) x -= 1;
      if (has("KeyD") || has("ArrowRight")) x += 1;
      const length = Math.hypot(x, y);
      if (length > 0) {
        x /= length;
        y /= length;
      }
      return { x, y };
    },
    update() {},
  };
}
