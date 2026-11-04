import { Container, Graphics } from "pixi.js";
import { rollDamage } from "../core/damage.js";
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
    return { graphic, ring:null, particles:[], active:false, x:0, y:0, radius:60, duration:5, timer:0, dps:10, pulseSeed:Math.random()*Math.PI*2, effectTimer:0 };
  }
  function acquire() {
    if (pool.length) return pool.pop();
    if (pool.length === 0 && activeZones.length + 1 > maxZones) return null;
    return createZoneInstance();
  }
  function spawnParticles(zone) {
    const count = 8;
    while (zone.particles.length < count) {
      const p = { graphic: new Graphics(), vx:0, vy:0 };
      p.graphic.circle(0, 0, 2).fill(0xffffff);
      p.graphic.visible = false;
      p.graphic.alpha = 0;
      layer.addChild(p.graphic);
      zone.particles.push(p);
    }
    for (let i = 0; i < zone.particles.length; i += 1) {
      const p = zone.particles[i];
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.graphic.x = zone.x;
      p.graphic.y = zone.y;
      p.graphic.visible = true;
      p.graphic.alpha = 1;
    }
  }
  function release(zone) {
    zone.active = false;
    zone.timer = 0;
    zone.effectTimer = 0;
    zone.graphic.visible = false;
    zone.graphic.clear();
    zone.graphic.alpha = 0.32;
    if (zone.ring) {
      zone.ring.visible = false;
      zone.ring.clear();
      zone.ring.alpha = 0;
      zone.ring.scale.set(0);
    }
    if (zone.particles) {
      for (const p of zone.particles) {
        if (p?.graphic) { p.graphic.visible = false; p.graphic.alpha = 0; }
      }
    }
    pool.push(zone);
  }
  function spawnSteam(x,y,opts) {
    const zone = acquire();
    if (!zone) return false;
    zone.active = true;
    zone.x = x; zone.y = y;
    zone.radius = (opts && opts.radius) || (60 * areaMult());
    zone.duration = (opts && opts.duration) || (5 * durMult());
    zone.timer = zone.duration;
    zone.dps = 10;
    zone.pulseSeed = Math.random() * Math.PI * 2;
    zone.effectTimer = 0.4;

    const radius = zone.radius;
    zone.graphic.clear();
    zone.graphic.circle(0, 0, radius).fill({ color: 0xffffff, alpha: 1 });
    zone.graphic.x = x; zone.graphic.y = y; zone.graphic.zIndex = 1; zone.graphic.visible = true;
    zone.graphic.alpha = 0.15;
    if (!zone.ring) { zone.ring = new Graphics(); layer.addChild(zone.ring); }
    zone.ring.clear();
    zone.ring.circle(0, 0, radius).stroke({ color: 0xffffff, width: 2 });
    zone.ring.x = x; zone.ring.y = y; zone.ring.visible = true; zone.ring.alpha = 0.8; zone.ring.scale.set(0.01);
    spawnParticles(zone);
    activeZones.push(zone);
    return true;
  }
  function update(dt) {
    for (let i = activeZones.length - 1; i >= 0; i -= 1) {
      const zone = activeZones[i];
      zone.timer -= dt;
      const t = performance.now() / 1000;
      zone.graphic.alpha = 0.15 + 0.04 * Math.sin((t + zone.pulseSeed) * 2);

      if (zone.effectTimer > 0) {
        zone.effectTimer -= dt;
        const progress = Math.max(0, 1 - zone.effectTimer / 0.4);
        if (zone.ring) {
          zone.ring.scale.set(Math.max(0.01, progress));
          zone.ring.alpha = Math.max(0, 1 - progress);
        }
        if (zone.particles) {
          for (const p of zone.particles) {
            if (!p?.graphic) continue;
            p.graphic.x += p.vx * dt;
            p.graphic.y += p.vy * dt;
            p.graphic.alpha = Math.max(0, 1 - progress);
          }
        }
      } else {
        if (zone.ring) zone.ring.visible = false;
        if (zone.particles) for (const p of zone.particles) if (p?.graphic) p.graphic.visible = false;
      }

      const enemies = enemySystem?.enemies ?? [];
      for (const enemy of enemies) {
        if (!enemy || enemy.alive === false || enemy.hp <= 0) continue;
        const d = Math.hypot(enemy.x - zone.x, enemy.y - zone.y);
        if (d <= zone.radius) {
          enemy.hp -= rollDamage(zone.dps * dt);
        }
      }

      if (zone.timer <= 0) {
        const idx = activeZones.indexOf(zone);
        if (idx >= 0) activeZones.splice(idx, 1);
        release(zone);
      }
    }
  }
  function reset() {
    for (const zone of [...activeZones]) {
      const idx = activeZones.indexOf(zone);
      if (idx >= 0) activeZones.splice(idx, 1);
      release(zone);
    }
    activeZones.length = 0;
    pool.length = 0;
  }
  return { spawnSteam, update, reset };
}
