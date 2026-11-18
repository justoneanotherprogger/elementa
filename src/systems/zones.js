import { Container, Graphics } from "pixi.js";
import { rollDamage } from "../core/damage.js";

// Общий пул зон: пар от реакций и зоны оружия живут по одним правилам.
// Оружие передаёт свой onHit, поэтому стихия и реакция считаются тем же
// путём, что и у удара.
export function createZoneSystem(app, enemySystem, player) {
  const areaMult = () => player?.areaMult ?? 1;
  const durMult = () => player?.durMult ?? 1;
  const layer = new Container();
  app.stage.addChildAt(layer, 1);
  const activeZones = [];
  const pool = [];
  const maxZones = 60;

  function createZoneInstance() {
    const graphic = new Graphics();
    graphic.visible = false;
    layer.addChild(graphic);
    return {
      graphic,
      ring: null,
      particles: [],
      active: false,
      x: 0,
      y: 0,
      radius: 60,
      duration: 5,
      timer: 0,
      dps: 10,
      tick: 0.25,
      tickTimer: 0,
      color: 0xffffff,
      alphaBase: 0.15,
      onHit: null,
      pulseSeed: Math.random() * Math.PI * 2,
      effectTimer: 0,
    };
  }

  function acquire() {
    if (pool.length) return pool.pop();
    if (activeZones.length + 1 > maxZones) return null;
    return createZoneInstance();
  }

  function spawnParticles(zone) {
    const count = 8;
    while (zone.particles.length < count) {
      const particle = { graphic: new Graphics(), vx: 0, vy: 0 };
      particle.graphic.visible = false;
      layer.addChild(particle.graphic);
      zone.particles.push(particle);
    }
    for (const particle of zone.particles) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.graphic.clear();
      particle.graphic.circle(0, 0, 2).fill(zone.color);
      particle.graphic.x = zone.x;
      particle.graphic.y = zone.y;
      particle.graphic.visible = true;
      particle.graphic.alpha = 1;
    }
  }

  function release(zone) {
    zone.active = false;
    zone.timer = 0;
    zone.tickTimer = 0;
    zone.effectTimer = 0;
    zone.onHit = null;
    zone.graphic.visible = false;
    zone.graphic.clear();
    zone.graphic.alpha = 0.32;
    if (zone.ring) {
      zone.ring.visible = false;
      zone.ring.clear();
      zone.ring.alpha = 0;
      zone.ring.scale.set(0);
    }
    for (const particle of zone.particles) {
      if (particle?.graphic) {
        particle.graphic.visible = false;
        particle.graphic.alpha = 0;
      }
    }
    pool.push(zone);
  }

  function spawnZone(options = {}) {
    const zone = acquire();
    if (!zone) return false;
    zone.active = true;
    zone.x = options.x ?? 0;
    zone.y = options.y ?? 0;
    zone.radius = options.radius ?? 60;
    zone.duration = options.duration ?? 5;
    zone.timer = zone.duration;
    zone.dps = options.dps ?? 10;
    zone.tick = Math.max(0.05, options.tick ?? 0.25);
    zone.tickTimer = 0;
    zone.color = options.color ?? 0xffffff;
    zone.alphaBase = options.alpha ?? 0.15;
    zone.onHit = typeof options.onHit === "function" ? options.onHit : null;
    zone.pulseSeed = Math.random() * Math.PI * 2;
    zone.effectTimer = 0.4;

    const radius = zone.radius;
    zone.graphic.clear();
    zone.graphic.circle(0, 0, radius).fill({ color: zone.color, alpha: 1 });
    zone.graphic.x = zone.x;
    zone.graphic.y = zone.y;
    zone.graphic.zIndex = 1;
    zone.graphic.visible = true;
    zone.graphic.alpha = zone.alphaBase;
    if (!zone.ring) {
      zone.ring = new Graphics();
      layer.addChild(zone.ring);
    }
    zone.ring.clear();
    zone.ring.circle(0, 0, radius).stroke({ color: zone.color, width: 2 });
    zone.ring.x = zone.x;
    zone.ring.y = zone.y;
    zone.ring.visible = true;
    zone.ring.alpha = 0.8;
    zone.ring.scale.set(0.01);
    spawnParticles(zone);
    activeZones.push(zone);
    return true;
  }

  function spawnSteam(x, y, options = {}) {
    return spawnZone({
      x,
      y,
      radius: options.radius ?? 60 * areaMult(),
      duration: options.duration ?? 5 * durMult(),
      dps: 10,
      color: 0xffffff,
    });
  }

  function applyDamage(zone, amount) {
    for (const enemy of enemySystem?.enemies ?? []) {
      if (!enemy || enemy.alive === false || enemy.hp <= 0) continue;
      const distance = Math.hypot(enemy.x - zone.x, enemy.y - zone.y);
      if (distance > zone.radius) continue;
      if (zone.onHit) {
        zone.onHit(enemy, amount);
      } else {
        enemySystem.damage(
          enemy,
          rollDamage(amount * (enemy.damageTakenMult ?? 1)),
        );
      }
    }
  }

  function update(dt) {
    for (let i = activeZones.length - 1; i >= 0; i -= 1) {
      const zone = activeZones[i];
      zone.timer -= dt;
      const now = performance.now() / 1000;
      zone.graphic.alpha =
        zone.alphaBase + 0.04 * Math.sin((now + zone.pulseSeed) * 2);

      if (zone.effectTimer > 0) {
        zone.effectTimer -= dt;
        const progress = Math.max(0, 1 - zone.effectTimer / 0.4);
        if (zone.ring) {
          zone.ring.scale.set(Math.max(0.01, progress));
          zone.ring.alpha = Math.max(0, 1 - progress);
        }
        for (const particle of zone.particles) {
          if (!particle?.graphic) continue;
          particle.graphic.x += particle.vx * dt;
          particle.graphic.y += particle.vy * dt;
          particle.graphic.alpha = Math.max(0, 1 - progress);
        }
      } else {
        if (zone.ring) zone.ring.visible = false;
        for (const particle of zone.particles) {
          if (particle?.graphic) particle.graphic.visible = false;
        }
      }

      zone.tickTimer -= dt;
      if (zone.tickTimer <= 0) {
        zone.tickTimer += zone.tick;
        applyDamage(zone, zone.dps * zone.tick);
      }

      if (zone.timer <= 0) {
        activeZones.splice(i, 1);
        release(zone);
      }
    }
  }

  function reset() {
    for (const zone of [...activeZones]) {
      activeZones.splice(activeZones.indexOf(zone), 1);
      release(zone);
    }
    activeZones.length = 0;
    pool.length = 0;
  }

  return { spawnZone, spawnSteam, update, reset };
}
