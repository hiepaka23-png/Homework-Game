import { PowerUpType, POWERUP_CONFIGS, ShipType, SHIP_CONFIGS } from '../types';
import { soundEngine } from '../audio';

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

// --- INPUT HANDLER ---
export class InputHandler {
  public keys: Record<string, boolean> = {};
  public mouse = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 100, pressed: false, rightPressed: false };
  public useMouse: boolean = false;

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyM') {
        soundEngine.setSoundEnabled(!soundEngine.isEnabled());
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousemove', (e) => {
      const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      this.mouse.y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouse.pressed = true;
      if (e.button === 2) this.mouse.rightPressed = true;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.pressed = false;
      if (e.button === 2) this.mouse.rightPressed = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }
}

// --- STAR BACKGROUND ---
export class Star {
  public x: number;
  public y: number;
  public size: number;
  public speed: number;
  public color: string;
  public alpha: number;

  constructor() {
    this.x = Math.random() * CANVAS_WIDTH;
    this.y = Math.random() * CANVAS_HEIGHT;
    this.size = Math.random() * 2.5 + 0.5;
    this.speed = Math.random() * 2.5 + 0.5;
    this.alpha = Math.random() * 0.8 + 0.2;
    const colors = ['#ffffff', '#80d8ff', '#b388ff', '#ffd180'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update(speedMultiplier: number = 1) {
    this.y += this.speed * speedMultiplier;
    if (this.y > CANVAS_HEIGHT) {
      this.y = 0;
      this.x = Math.random() * CANVAS_WIDTH;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// --- PLAYER SHIP ---
export class Player {
  public width = 64;
  public height = 64;
  public x = CANVAS_WIDTH / 2 - 32;
  public y = CANVAS_HEIGHT - 120;
  public speed = 7;
  public hp = 100;
  public maxHp = 100;
  public lives = 3;
  public bulletLevel = 1;
  public shootTimer = 0;
  public shootInterval = 12; // Auto-fire rate
  public rapidFireTimer = 0;
  public shipType: ShipType = 'classic';

  // Skills & Level Up Stats
  public exp = 0;
  public maxExp = 100;
  public level = 1;
  public damageMultiplier = 1.0;
  public cooldownMultiplier = 1.0;
  public magnetRadius = 180;
  public lifestealPercent = 0;

  // Satellite Drone Skill
  public droneCount = 0;
  public droneAngle = 0;
  public droneShootTimer = 0;

  // Dash Maneuver (Space Key)
  public isDashing = false;
  public dashTimer = 0;
  public dashCooldown = 0; // max 90 frames = 1.5s
  public maxDashCooldown = 90;
  public dashDirX = 0;
  public dashDirY = -1;

  public shieldActive = false;
  public shieldEnergy = 100;
  public shieldTimer = 0;
  public shieldCooldown = 0; // 360 frames = 6s
  public missileCooldown = 0; // 300 frames = 5s
  public maxMissileCooldown = 300;
  public specialEnergy = 0; // 0 to 100
  public isBoosting = false;

  constructor(shipType: ShipType = 'classic') {
    this.setShipType(shipType);
  }

  public setShipType(shipType: ShipType) {
    this.shipType = shipType;
    const config = SHIP_CONFIGS[shipType] || SHIP_CONFIGS.classic;
    this.speed = 4.5 + config.statSpeed * 0.9;
  }

  public launchMissiles(createBulletFn: (bullets: Bullet[]) => void): boolean {
    if (this.missileCooldown > 0) return false;

    const bX = this.x + this.width / 2;
    const bY = this.y;
    const created: Bullet[] = [];
    const count = this.shipType === 'homing' ? 8 : 5;
    const baseDmg = (2.2 + this.bulletLevel * 0.4) * this.damageMultiplier;

    for (let i = 0; i < count; i++) {
      const angle = (i - (count - 1) / 2) * 0.35 - Math.PI / 2;
      const vx = Math.cos(angle) * 12;
      const vy = Math.sin(angle) * 12;
      created.push(new Bullet(bX, bY, vx, vy, baseDmg, false, false, true, false));
    }

    createBulletFn(created);
    soundEngine.playShoot(3);
    this.missileCooldown = Math.floor(300 * this.cooldownMultiplier);
    return true;
  }

  update(
    input: InputHandler,
    createBulletFn: (bullets: Bullet[]) => void,
    enemies: (Meteor | UFOEnemy)[] = [],
    boss: Boss | null = null
  ) {
    // Speed Boost (Shift key)
    this.isBoosting = !!input.keys['ShiftLeft'] || !!input.keys['ShiftRight'];
    const currentSpeed = this.isBoosting ? this.speed * 1.5 : this.speed;

    if (!input.useMouse) {
      if (input.keys['KeyA'] || input.keys['ArrowLeft']) this.x -= currentSpeed;
      if (input.keys['KeyD'] || input.keys['ArrowRight']) this.x += currentSpeed;
      if (input.keys['KeyW'] || input.keys['ArrowUp']) this.y -= currentSpeed;
      if (input.keys['KeyS'] || input.keys['ArrowDown']) this.y += currentSpeed;
    } else {
      const targetX = input.mouse.x - this.width / 2;
      const targetY = input.mouse.y - this.height / 2;
      this.x += (targetX - this.x) * 0.15;
      this.y += (targetY - this.y) * 0.15;
    }

    // Dash Maneuver (Space key triggers Dash)
    if (input.keys['Space'] && this.dashCooldown <= 0 && !this.isDashing) {
      this.isDashing = true;
      this.dashTimer = 16; // ~0.27s dash duration
      this.dashCooldown = Math.floor(90 * this.cooldownMultiplier); // ~1.5s cooldown

      let dirX = 0;
      let dirY = 0;
      if (input.keys['KeyA'] || input.keys['ArrowLeft']) dirX -= 1;
      if (input.keys['KeyD'] || input.keys['ArrowRight']) dirX += 1;
      if (input.keys['KeyW'] || input.keys['ArrowUp']) dirY -= 1;
      if (input.keys['KeyS'] || input.keys['ArrowDown']) dirY += 1;

      if (dirX === 0 && dirY === 0) {
        dirY = -1; // Default dash forward
      } else {
        const len = Math.hypot(dirX, dirY);
        dirX /= len;
        dirY /= len;
      }
      this.dashDirX = dirX;
      this.dashDirY = dirY;
      soundEngine.playBoost();
    }

    if (this.isDashing) {
      this.dashTimer--;
      this.x += this.dashDirX * this.speed * 3.4;
      this.y += this.dashDirY * this.speed * 3.4;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }

    if (this.dashCooldown > 0) {
      this.dashCooldown--;
    }

    // FULL SCREEN BOUNDARY: Allow player to fly all the way up to top of screen
    this.x = Math.max(0, Math.min(CANVAS_WIDTH - this.width, this.x));
    this.y = Math.max(20, Math.min(CANVAS_HEIGHT - this.height - 10, this.y));

    // Rapid fire buff decay
    if (this.rapidFireTimer > 0) {
      this.rapidFireTimer--;
      this.shootInterval = Math.max(3, Math.floor(6 * this.cooldownMultiplier));
    } else {
      const baseInterval = this.shipType === 'spread' ? 10 : this.shipType === 'laser' ? 14 : this.shipType === 'classic' ? 8 : 12;
      this.shootInterval = Math.max(3, Math.floor(baseInterval * this.cooldownMultiplier));
    }

    // Shooting logic
    if ((input.mouse.pressed || input.keys['KeyJ'] || input.keys['KeyK'] || (!this.isDashing && input.keys['Space'])) && this.shootTimer <= 0) {
      this.shoot(createBulletFn);
      this.shootTimer = this.shootInterval;
    }
    if (this.shootTimer > 0) this.shootTimer--;

    // Satellite Drone Support Firing
    if (this.droneCount > 0) {
      this.droneAngle += 0.04;
      this.droneShootTimer--;
      if (this.droneShootTimer <= 0) {
        this.droneShootTimer = Math.max(12, Math.floor(22 * this.cooldownMultiplier));
        const droneBullets: Bullet[] = [];
        const pCenterX = this.x + this.width / 2;
        const pCenterY = this.y + this.height / 2;
        const droneDmg = (1.4 + this.bulletLevel * 0.35) * this.damageMultiplier;

        for (let i = 0; i < this.droneCount; i++) {
          const angle = this.droneAngle + (i * Math.PI * 2) / this.droneCount;
          const dx = pCenterX + Math.cos(angle) * 55;
          const dy = pCenterY + Math.sin(angle) * 55;

          droneBullets.push(new Bullet(dx, dy, 0, -16, droneDmg, false, true, false, false));
        }
        createBulletFn(droneBullets);
      }
    }

    // Shield Skill (Q key)
    if (input.keys['KeyQ'] && this.shieldCooldown <= 0 && !this.shieldActive) {
      this.activateShield();
    }

    // Homing Missile Skill (E / R key or Right Click)
    if ((input.keys['KeyE'] || input.keys['KeyR'] || input.mouse.rightPressed) && this.missileCooldown <= 0) {
      this.launchMissiles(createBulletFn);
    }

    if (this.shieldActive) {
      this.shieldTimer--;
      if (this.shieldTimer <= 0) {
        this.shieldActive = false;
        this.shieldCooldown = Math.floor(360 * this.cooldownMultiplier); // 6s cooldown
      }
    } else if (this.shieldCooldown > 0) {
      this.shieldCooldown--;
    }

    if (this.missileCooldown > 0) {
      this.missileCooldown--;
    }

    // Passive energy recharge
    if (this.specialEnergy < 100) {
      this.specialEnergy = Math.min(100, this.specialEnergy + 0.035);
    }
  }

  shoot(createBulletFn: (bullets: Bullet[]) => void) {
    const bX = this.x + this.width / 2;
    const bY = this.y;
    const created: Bullet[] = [];

    soundEngine.playShoot(this.bulletLevel);

    if (this.shipType === 'laser') {
      // Laser Dreadnought: Piercing Laser Beams
      const mult = this.damageMultiplier;
      const baseDmg = (2.2 + this.bulletLevel * 0.5) * mult;
      created.push(new Bullet(bX, bY, 0, -20, baseDmg, true, false, false, false));
      if (this.bulletLevel >= 2) {
        created.push(new Bullet(bX - 18, bY + 12, 0, -20, baseDmg * 0.7, true, false, false, false));
        created.push(new Bullet(bX + 18, bY + 12, 0, -20, baseDmg * 0.7, true, false, false, false));
      }
      if (this.bulletLevel >= 4) {
        created.push(new Bullet(bX - 32, bY + 22, -1.5, -19, baseDmg * 0.5, true, false, false, false));
        created.push(new Bullet(bX + 32, bY + 22, 1.5, -19, baseDmg * 0.5, true, false, false, false));
      }
    } else if (this.shipType === 'spread') {
      // Spread Storm: 5-way Wide Fan Spread
      const mult = this.damageMultiplier;
      const baseDmg = (1.0 + this.bulletLevel * 0.25) * mult;
      const count = 3 + Math.min(2, Math.floor((this.bulletLevel + 1) / 2));
      for (let i = 0; i < count; i++) {
        const offsetAngle = (i - (count - 1) / 2) * 0.2;
        const vx = Math.sin(offsetAngle) * 12;
        const vy = -Math.cos(offsetAngle) * 12;
        created.push(new Bullet(bX, bY, vx, vy, baseDmg));
      }
    } else if (this.shipType === 'homing') {
      // Homing Phantom: Auto-targeting Missiles
      const mult = this.damageMultiplier;
      const baseDmg = (1.4 + this.bulletLevel * 0.3) * mult;
      created.push(new Bullet(bX - 12, bY, -2.5, -8, baseDmg, false, false, true, false));
      created.push(new Bullet(bX + 12, bY, 2.5, -8, baseDmg, false, false, true, false));
      if (this.bulletLevel >= 3) {
        created.push(new Bullet(bX, bY - 8, 0, -10, baseDmg * 1.2, false, false, true, false));
      }
      if (this.bulletLevel >= 5) {
        created.push(new Bullet(bX - 24, bY + 10, -4, -6, baseDmg, false, false, true, false));
        created.push(new Bullet(bX + 24, bY + 10, 4, -6, baseDmg, false, false, true, false));
      }
    } else {
      // Hoả Phụng: Roaring Flamethrower
      const mult = this.damageMultiplier;
      const baseDmg = (0.75 + this.bulletLevel * 0.22) * mult;
      const flameStreams = 1 + Math.min(4, this.bulletLevel);

      for (let i = 0; i < flameStreams; i++) {
        const spreadAngle = (i - (flameStreams - 1) / 2) * 0.18 + (Math.random() - 0.5) * 0.08;
        const speed = 11 + Math.random() * 3;
        const vx = Math.sin(spreadAngle) * speed;
        const vy = -Math.cos(spreadAngle) * speed;
        created.push(new Bullet(bX, bY, vx, vy, baseDmg, false, false, false, false, true, this.bulletLevel));
      }
    }

    createBulletFn(created);
  }

  activateShield() {
    this.shieldActive = true;
    this.shieldTimer = 240; // 4 seconds duration
    soundEngine.playShield();
  }

  takeDamage(amount: number): boolean {
    if (this.shieldActive) return false;
    this.hp -= amount;
    soundEngine.playPlayerHit();
    if (this.hp <= 0) {
      this.lives--;
      if (this.lives >= 0) {
        this.hp = this.maxHp;
        this.activateShield(); // Grant brief grace shield on respawn
        return false;
      } else {
        this.hp = 0;
        return true; // Completely out of lives, player dies
      }
    }
    this.hp = Math.max(0, this.hp);
    return false;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // Dash Stealth / Invisibility Effect
    if (this.isDashing) {
      ctx.globalAlpha = 0.35 + Math.random() * 0.25;

      // Afterimage Ghost Aura
      ctx.strokeStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 20;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX - this.dashDirX * 12, centerY - this.dashDirY * 12, 36, 0, Math.PI * 2);
      ctx.stroke();
    }

    // DRAW SATELLITE DRONES
    if (this.droneCount > 0) {
      for (let i = 0; i < this.droneCount; i++) {
        const angle = this.droneAngle + (i * Math.PI * 2) / this.droneCount;
        const dx = centerX + Math.cos(angle) * 55;
        const dy = centerY + Math.sin(angle) * 55;

        ctx.save();
        ctx.translate(dx, dy);

        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 12;

        // Energy Tether to Player
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(centerX - dx, centerY - dy);
        ctx.stroke();

        // Satellite Body Ring
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Winglets
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(-12, -2, 4, 4);
        ctx.fillRect(8, -2, 4, 4);

        // Core Glowing Lens
        ctx.fillStyle = '#e040fb';
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    const shipConfig = SHIP_CONFIGS[this.shipType] || SHIP_CONFIGS.classic;

    // Thruster Flame
    const flameLength = this.isBoosting ? 32 + Math.random() * 12 : 18 + Math.random() * 8;
    const grad = ctx.createLinearGradient(centerX, this.y + this.height, centerX, this.y + this.height + flameLength);
    grad.addColorStop(0, shipConfig.color);
    grad.addColorStop(0.5, shipConfig.glowColor);
    grad.addColorStop(1, 'transparent');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(centerX - 14, this.y + this.height - 4);
    ctx.lineTo(centerX, this.y + this.height + flameLength);
    ctx.lineTo(centerX + 14, this.y + this.height - 4);
    ctx.fill();

    // SHIP HULL BY TYPE
    if (this.shipType === 'laser') {
      // Laser Dreadnought (Broad armored silhouette, twin heavy barrels)
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(centerX, this.y);
      ctx.lineTo(this.x + 8, this.y + 16);
      ctx.lineTo(this.x, this.y + this.height - 10);
      ctx.lineTo(this.x + 20, this.y + this.height - 4);
      ctx.lineTo(centerX, this.y + 24);
      ctx.lineTo(this.x + this.width - 20, this.y + this.height - 4);
      ctx.lineTo(this.x + this.width, this.y + this.height - 10);
      ctx.lineTo(this.x + this.width - 8, this.y + 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Twin Heavy Laser Barrels
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 10;
      ctx.fillRect(centerX - 10, this.y - 6, 4, 22);
      ctx.fillRect(centerX + 6, this.y - 6, 4, 22);
      ctx.shadowBlur = 0;
    } else if (this.shipType === 'spread') {
      // Spread Storm (Fiery Orange Delta Wing)
      ctx.fillStyle = '#1c1917';
      ctx.strokeStyle = '#ff9900';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(centerX, this.y - 4);
      ctx.lineTo(this.x - 6, this.y + this.height);
      ctx.lineTo(this.x + 18, this.y + this.height - 16);
      ctx.lineTo(centerX, this.y + 18);
      ctx.lineTo(this.x + this.width - 18, this.y + this.height - 16);
      ctx.lineTo(this.x + this.width + 6, this.y + this.height);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Core Flame Vent
      ctx.fillStyle = '#ff5500';
      ctx.beginPath();
      ctx.arc(centerX, centerY + 6, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shipType === 'homing') {
      // Homing Phantom (Violet Stealth Crystal Vessel)
      ctx.fillStyle = '#2e1065';
      ctx.strokeStyle = '#e040fb';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(centerX, this.y - 8);
      ctx.lineTo(this.x + 10, this.y + 28);
      ctx.lineTo(this.x + 4, this.y + this.height - 6);
      ctx.lineTo(centerX, this.y + this.height - 18);
      ctx.lineTo(this.x + this.width - 4, this.y + this.height - 6);
      ctx.lineTo(this.x + this.width - 10, this.y + 28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing Crystal Eye
      ctx.fillStyle = '#e040fb';
      ctx.shadowColor = '#e040fb';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(centerX, centerY - 6, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Hoả Phụng (Flame Phoenix Cruiser)
      ctx.fillStyle = '#1e0505';
      ctx.strokeStyle = '#ff4d00';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(centerX, this.y - 4);
      ctx.lineTo(this.x + 4, this.y + this.height - 4);
      ctx.lineTo(this.x + 18, this.y + this.height - 18);
      ctx.lineTo(centerX, this.y + 16);
      ctx.lineTo(this.x + this.width - 18, this.y + this.height - 18);
      ctx.lineTo(this.x + this.width - 4, this.y + this.height - 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Dual Fire Exhausts & Furnace Core
      ctx.fillStyle = '#ff3300';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(centerX, centerY + 2, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffea00';
      ctx.beginPath();
      ctx.arc(centerX, centerY + 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Active Shield Aura
    if (this.shieldActive) {
      const shieldRadius = 52;
      const shieldGrad = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, shieldRadius);
      shieldGrad.addColorStop(0, 'rgba(0, 255, 255, 0.05)');
      shieldGrad.addColorStop(0.8, 'rgba(0, 255, 255, 0.3)');
      shieldGrad.addColorStop(1, 'rgba(0, 255, 255, 0.8)');

      ctx.fillStyle = shieldGrad;
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.arc(centerX, centerY, shieldRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }
}

// --- PLAYER BULLET ---
export class Bullet {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public damage: number;
  public isLaser: boolean;
  public isPlasma: boolean;
  public isHoming: boolean;
  public isElectric: boolean;
  public isFlame: boolean;
  public bulletLevel: number = 1;
  public lifetime: number = 0;
  public maxLifetime: number = 999;
  public markedForDeletion = false;
  public radius = 5;

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage = 1,
    isLaser = false,
    isPlasma = false,
    isHoming = false,
    isElectric = false,
    isFlame = false,
    bulletLevel = 1
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.isLaser = isLaser;
    this.isPlasma = isPlasma;
    this.isHoming = isHoming;
    this.isElectric = isElectric;
    this.isFlame = isFlame;
    this.bulletLevel = bulletLevel;
    if (isPlasma) this.radius = 16;
    if (isHoming) this.radius = 6;
    if (isElectric) this.radius = 8;
    if (isFlame) {
      this.radius = 12 + bulletLevel * 1.5;
      this.maxLifetime = 24 + bulletLevel * 3;
    }
  }

  update(enemies: (Meteor | UFOEnemy)[] = [], boss: Boss | null = null) {
    if (this.isFlame) {
      this.lifetime++;
      this.radius = 12 + Math.min(26, this.lifetime * 1.1) + this.bulletLevel * 1.5;
      if (this.lifetime >= this.maxLifetime) {
        this.markedForDeletion = true;
      }
    }

    if (this.isHoming || this.isElectric) {
      let closestTarget: { x: number; y: number } | null = null;
      let minDist = Infinity;

      if (boss && !boss.markedForDeletion) {
        minDist = Math.hypot(boss.x - this.x, boss.y - this.y);
        closestTarget = { x: boss.x, y: boss.y };
      }

      for (const e of enemies) {
        if (e.markedForDeletion) continue;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d < minDist) {
          minDist = d;
          closestTarget = { x: e.x, y: e.y };
        }
      }

      if (closestTarget && minDist < (this.isElectric ? 450 : 650)) {
        const angle = Math.atan2(closestTarget.y - this.y, closestTarget.x - this.x);
        const speed = this.isElectric ? 18 : 14;
        const factor = this.isElectric ? 0.35 : 0.22;
        this.vx += (Math.cos(angle) * speed - this.vx) * factor;
        this.vy += (Math.sin(angle) * speed - this.vy) * factor;
      }
    }

    this.x += this.vx;
    this.y += this.vy;
    if (this.y < -30 || this.y > CANVAS_HEIGHT + 30 || this.x < -30 || this.x > CANVAS_WIDTH + 30) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    if (this.isLaser) {
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x, this.y + 35);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x, this.y + 35);
      ctx.stroke();
    } else if (this.isFlame) {
      ctx.shadowColor = '#ff4d00';
      ctx.shadowBlur = 20;

      const alpha = Math.max(0, 1 - this.lifetime / this.maxLifetime);
      const grad = ctx.createRadialGradient(this.x, this.y, 2, this.x, this.y, this.radius);
      grad.addColorStop(0, `rgba(255, 255, 220, ${alpha})`);
      grad.addColorStop(0.3, `rgba(255, 180, 0, ${alpha * 0.95})`);
      grad.addColorStop(0.7, `rgba(255, 50, 0, ${alpha * 0.75})`);
      grad.addColorStop(1, `rgba(180, 0, 0, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x + (Math.random() - 0.5) * 4, this.y + (Math.random() - 0.5) * 4, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Flame core sparks
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x + (Math.random() - 0.5) * 6, this.y + (Math.random() - 0.5) * 6, Math.max(1, this.radius * 0.25), 0, Math.PI * 2);
      ctx.fill();
    } else if (this.isElectric) {
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      const randX1 = (Math.random() - 0.5) * 16;
      const randX2 = (Math.random() - 0.5) * 16;
      ctx.lineTo(this.x + randX1, this.y + 12);
      ctx.lineTo(this.x + randX2, this.y + 24);
      ctx.lineTo(this.x, this.y + 36);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.isPlasma) {
      ctx.shadowColor = '#e040fb';
      ctx.shadowBlur = 20;
      const grad = ctx.createRadialGradient(this.x, this.y, 2, this.x, this.y, this.radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#e040fb');
      grad.addColorStop(1, '#7b1fa2');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.isHoming) {
      ctx.shadowColor = '#e040fb';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#e040fb';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x - this.vx * 0.4, this.y - this.vy * 0.4, this.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffea00';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// --- ENEMY BULLET ---
export class EnemyBullet {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public radius = 6;
  public markedForDeletion = false;
  public isLaser: boolean;
  public color: string;

  constructor(x: number, y: number, vx: number, vy: number, color = '#ff3366', isLaser = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.isLaser = isLaser;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.y > CANVAS_HEIGHT + 30 || this.y < -30 || this.x < -30 || this.x > CANVAS_WIDTH + 30) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    if (this.isLaser) {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.vx * 3, this.y - this.vy * 3);
      ctx.stroke();
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// --- METEOR ENEMY ---
export class Meteor {
  public x: number;
  public y: number;
  public size: number; // radius
  public hp: number;
  public maxHp: number;
  public speedX: number;
  public speedY: number;
  public rotation = 0;
  public rotationSpeed: number;
  public points: { x: number; y: number }[] = [];
  public markedForDeletion = false;
  public isGlowingMagma = false;

  constructor(x?: number, y?: number, size?: number, speedY?: number) {
    this.size = size || Math.random() * 32 + 18;
    // Spawns within middle 70% width to avoid extreme edges
    const margin = 180;
    this.x = x !== undefined ? x : margin + Math.random() * (CANVAS_WIDTH - margin * 2);
    this.y = y !== undefined ? y : -60;
    this.hp = Math.floor(this.size / 8);
    this.maxHp = this.hp;
    this.speedX = (Math.random() - 0.5) * 1.5;
    this.speedY = speedY || Math.random() * 2 + 1.2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.04;
    this.isGlowingMagma = Math.random() < 0.25;

    // Generate procedural irregular rock polygon points
    const numPoints = 8 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const radiusOffset = this.size * (0.8 + Math.random() * 0.4);
      this.points.push({
        x: Math.cos(angle) * radiusOffset,
        y: Math.sin(angle) * radiusOffset,
      });
    }
  }

  update(): boolean {
    this.x += this.speedX;
    this.y += this.speedY;
    this.rotation += this.rotationSpeed;

    // Reached bottom - damages Earth
    if (this.y > CANVAS_HEIGHT + this.size) {
      this.markedForDeletion = true;
      return true; // Breached flag
    }
    return false;
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.markedForDeletion = true;
      return true;
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Rock base style
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, this.size);
    if (this.isGlowingMagma) {
      grad.addColorStop(0, '#ff6600');
      grad.addColorStop(0.6, '#4a1500');
      grad.addColorStop(1, '#1a0500');
      ctx.shadowColor = '#ff4500';
      ctx.shadowBlur = 12;
    } else {
      grad.addColorStop(0, '#94a3b8');
      grad.addColorStop(0.7, '#475569');
      grad.addColorStop(1, '#1e293b');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // Outline & Craters
    ctx.strokeStyle = this.isGlowingMagma ? '#ff9900' : '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner crater details
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(this.size * 0.2, -this.size * 0.2, this.size * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// --- UFO ENEMY ---
export class UFOEnemy {
  public x: number;
  public y: number;
  public size = 28;
  public hp = 4;
  public maxHp = 4;
  public speedX: number;
  public speedY: number;
  public shootTimer = 0;
  public shootInterval = 90;
  public markedForDeletion = false;
  public type: 'scout' | 'shooter' | 'shielded';
  public shieldHp = 0;

  constructor(type: 'scout' | 'shooter' | 'shielded' = 'scout') {
    this.type = type;
    const margin = 180;
    this.x = margin + Math.random() * (CANVAS_WIDTH - margin * 2);
    this.y = -50;
    this.speedX = (Math.random() - 0.5) * 3;
    this.speedY = Math.random() * 1.5 + 1;

    if (type === 'shooter') {
      this.hp = 6;
      this.shootInterval = 70;
    } else if (type === 'shielded') {
      this.hp = 8;
      this.shieldHp = 5;
      this.shootInterval = 80;
    }
    this.maxHp = this.hp;
  }

  update(createEnemyBulletFn: (b: EnemyBullet) => void): boolean {
    this.x += this.speedX;
    this.y += this.speedY;

    // Bounce off walls
    if (this.x < 60 || this.x > CANVAS_WIDTH - 60) {
      this.speedX *= -1;
    }

    // Shoot bullets
    this.shootTimer++;
    if (this.shootTimer >= this.shootInterval) {
      this.shootTimer = 0;
      soundEngine.playEnemyShoot();
      createEnemyBulletFn(new EnemyBullet(this.x, this.y + 15, 0, 5, '#ff0055'));
      if (this.type === 'shooter') {
        createEnemyBulletFn(new EnemyBullet(this.x, this.y + 15, -2, 4, '#ff0055'));
        createEnemyBulletFn(new EnemyBullet(this.x, this.y + 15, 2, 4, '#ff0055'));
      }
    }

    if (this.y > CANVAS_HEIGHT + 40) {
      this.markedForDeletion = true;
      return true; // Breached Earth
    }
    return false;
  }

  takeDamage(amount: number): boolean {
    if (this.shieldHp > 0) {
      this.shieldHp -= amount;
      if (this.shieldHp < 0) {
        this.hp += this.shieldHp;
        this.shieldHp = 0;
      }
    } else {
      this.hp -= amount;
    }

    if (this.hp <= 0) {
      this.markedForDeletion = true;
      return true;
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Shield Aura
    if (this.shieldHp > 0) {
      ctx.strokeStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 36, 20, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Saucer Disc Body
    const discGrad = ctx.createLinearGradient(-30, 0, 30, 0);
    discGrad.addColorStop(0, '#64748b');
    discGrad.addColorStop(0.5, '#e2e8f0');
    discGrad.addColorStop(1, '#64748b');

    ctx.fillStyle = discGrad;
    ctx.beginPath();
    ctx.ellipse(0, 2, 30, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Glass Dome Cockpit
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, -4, 12, Math.PI, 0, false);
    ctx.fill();

    // LED Perimeter Lights
    const now = Date.now() / 150;
    for (let i = -2; i <= 2; i++) {
      const active = Math.floor(now + i) % 2 === 0;
      ctx.fillStyle = active ? '#00ff66' : '#ff0055';
      ctx.beginPath();
      ctx.arc(i * 10, 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// --- BOSS ENTITY ---
export class Boss {
  public x = CANVAS_WIDTH / 2;
  public y = -150;
  public targetY = 140;
  public width = 240;
  public height = 120;
  public level: number;
  public hp: number;
  public maxHp: number;
  public phase = 1;
  public shootTimer = 0;
  public attackPatternTimer = 0;
  public markedForDeletion = false;
  public name: string;
  public shieldActive = false;

  // Boss 1 Charge Dash
  public isDashing = false;
  public dashTargetX = CANVAS_WIDTH / 2;
  public dashTargetY = CANVAS_HEIGHT - 180;

  // Boss 4 & 5 Laser Sweep
  public isLaserSweeping = false;
  public laserSweepX = 0;
  public laserSweepDir = 1;

  // Advanced Boss Skills: Stealth, Horizontal Fly-By Dash Telegraph, & Combo Attacks
  public isStealthed = false;
  public stealthTimer = 0;
  public stealthCooldown = 180;

  public isHorizontalDashing = false;
  public dashWarningTimer = 0;
  public dashYLine = 240;
  public horizontalDashDir = 1; // 1: left-to-right, -1: right-to-left
  public dashCooldown = 320;

  constructor(level: number) {
    this.level = level;

    switch (level) {
      case 1:
        this.name = 'CHÚA THẠCH THIÊN THẠCH (MÀN 1)';
        this.maxHp = 1000;
        break;
      case 2:
        this.name = 'UFO CHỈ HUY TRINH SÁT (MÀN 2)';
        this.maxHp = 2200;
        break;
      case 3:
        this.name = 'ĐẠI CHIẾN HẠM VŨ TRỤ (MÀN 3)';
        this.maxHp = 4500;
        break;
      case 4:
        this.name = 'LÕI PHÁO ĐÀI MẶT TRĂNG (MÀN 4)';
        this.maxHp = 8000;
        break;
      case 5:
      default:
        this.name = 'MẪU HẠM ĐẾ QUỐC UFO (CHỦ LỰC)';
        this.maxHp = 14000;
        break;
    }
    this.hp = this.maxHp;
  }

  update(
    createEnemyBulletFn: (b: EnemyBullet) => void,
    spawnMinionFn: (m: Meteor | UFOEnemy) => void,
    playerX: number
  ) {
    // Entrance movement
    if (this.y < this.targetY && !this.isDashing && !this.isHorizontalDashing) {
      this.y += 2;
      return;
    }

    // Phase management for ALL bosses (Phase 1 > 66%, Phase 2 > 33%, Phase 3 <= 33%)
    const hpRatio = this.hp / this.maxHp;
    const nextPhase = hpRatio <= 0.33 ? 3 : hpRatio <= 0.66 ? 2 : 1;
    if (this.phase !== nextPhase) {
      this.phase = nextPhase;
      soundEngine.playSpecialSkill();
    }

    this.shootTimer++;
    this.attackPatternTimer++;

    // 1. HORIZONTAL DASH TELEGRAPH & FLY-BY EXECUTION
    if (this.dashWarningTimer > 0) {
      this.dashWarningTimer--;
      if (this.dashWarningTimer === 0) {
        this.isHorizontalDashing = true;
        this.horizontalDashDir = Math.random() < 0.5 ? 1 : -1;
        this.x = this.horizontalDashDir === 1 ? -120 : CANVAS_WIDTH + 120;
        this.y = this.dashYLine;
        soundEngine.playSpecialSkill();
      }
    }

    if (this.isHorizontalDashing) {
      this.x += this.horizontalDashDir * 24; // High speed fly-by sweep

      // Drop plasma bullets along trajectory
      if (this.shootTimer % 4 === 0) {
        createEnemyBulletFn(new EnemyBullet(this.x, this.y + 20, 0, 7, '#ff0055', true));
        createEnemyBulletFn(new EnemyBullet(this.x, this.y - 15, (Math.random() - 0.5) * 4, -5, '#ffaa00'));
      }

      if ((this.horizontalDashDir === 1 && this.x > CANVAS_WIDTH + 140) ||
          (this.horizontalDashDir === -1 && this.x < -140)) {
        this.isHorizontalDashing = false;
        this.x = CANVAS_WIDTH / 2;
        this.y = this.targetY;
      }
      return; // Skip normal movement during horizontal dash
    }

    // Trigger horizontal dash warning periodically for Level 2+
    if (this.level >= 2 && !this.isHorizontalDashing && this.dashWarningTimer <= 0) {
      this.dashCooldown--;
      if (this.dashCooldown <= 0) {
        this.dashWarningTimer = 75; // ~1.25s telegraph
        this.dashYLine = 160 + Math.random() * 260; // middle area
        this.dashCooldown = this.phase === 3 ? 240 : this.phase === 2 ? 320 : 420;
      }
    }

    // 2. STEALTH CAMOUFLAGE MECHANIC
    if (this.isStealthed) {
      this.stealthTimer--;
      if (this.stealthTimer <= 0) {
        this.isStealthed = false;
        // Ambush 360 bullet ring on exit
        const count = 18;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          createEnemyBulletFn(new EnemyBullet(this.x, this.y, Math.cos(angle) * 6.5, Math.sin(angle) * 6.5, '#a855f7'));
        }
        soundEngine.playExplosion(false);
      }
    } else if (this.level >= 2 && this.phase >= 2) {
      this.stealthCooldown--;
      if (this.stealthCooldown <= 0) {
        this.isStealthed = true;
        this.stealthTimer = 110; // ~1.8s stealth duration
        this.stealthCooldown = this.phase === 3 ? 220 : 320;
        this.x = 100 + Math.random() * (CANVAS_WIDTH - 200);
        soundEngine.playBoost();
      }
    }

    // Side-to-side sweeping motion if not dashing
    if (!this.isDashing && !this.isStealthed) {
      const sweepSpeed = this.phase === 3 ? 6.5 : this.phase === 2 ? 5 : 3.5;
      this.x += Math.sin(Date.now() / (this.phase === 3 ? 450 : 750)) * sweepSpeed;
    }

    // BOSS MECHANICS BY LEVEL AND PHASE (COMBO MULTIPLE ATTACKS)
    if (this.level === 1) {
      // Màn 1: Boss Giant Meteor
      if (this.isDashing) {
        this.y += this.phase === 3 ? 12 : 9;
        this.x += (this.dashTargetX - this.x) * 0.1;
        if (this.y >= this.dashTargetY) {
          this.isDashing = false;
          soundEngine.playExplosion(true);
        }
      } else if (this.y > this.targetY) {
        this.y -= 4; // Retreat back
      }

      const dashInterval = this.phase === 3 ? 140 : this.phase === 2 ? 200 : 280;
      if (this.attackPatternTimer % dashInterval === 0 && !this.isDashing) {
        this.isDashing = true;
        this.dashTargetX = playerX;
      }

      if (this.shootTimer % (this.phase === 3 ? 60 : 100) === 0) {
        spawnMinionFn(new Meteor(this.x + (Math.random() - 0.5) * 160, this.y, 22, 2.8));
      }

      const shotInterval = this.phase === 3 ? 30 : this.phase === 2 ? 45 : 60;
      if (this.shootTimer % shotInterval === 0) {
        const spreadCount = this.phase === 3 ? 7 : this.phase === 2 ? 5 : 3;
        for (let i = -spreadCount; i <= spreadCount; i++) {
          createEnemyBulletFn(new EnemyBullet(this.x + i * 16, this.y + 50, i * 1.6, 5.5, '#ff6600'));
        }
      }
    } else if (this.level === 2) {
      // Màn 2: Boss UFO Commander (COMBO: Shield + Targeted Lasers + Minions)
      this.shieldActive = this.phase === 3 ? true : Math.floor(Date.now() / 1800) % 2 === 0;

      const shotInterval = this.phase === 3 ? 25 : this.phase === 2 ? 38 : 50;
      if (this.shootTimer % shotInterval === 0) {
        const angleToPlayer = Math.atan2(500 - this.y, playerX - this.x);
        const count = this.phase === 3 ? 8 : this.phase === 2 ? 5 : 3;
        for (let i = -count; i <= count; i++) {
          const spread = angleToPlayer + i * (this.phase === 3 ? 0.12 : 0.16);
          createEnemyBulletFn(new EnemyBullet(this.x, this.y + 30, Math.cos(spread) * 6.5, Math.sin(spread) * 6.5, '#00ffff'));
        }
      }

      const spawnInterval = this.phase === 3 ? 140 : 220;
      if (this.attackPatternTimer % spawnInterval === 0) {
        spawnMinionFn(new UFOEnemy(this.phase === 3 ? 'shooter' : 'scout'));
      }
    } else if (this.level === 3) {
      // Màn 3: Boss Alien Battleship (COMBO: Wing Lasers + Targeted Plasma + Cannon Volley)
      const shotInterval = this.phase === 3 ? 22 : this.phase === 2 ? 30 : 42;
      if (this.shootTimer % shotInterval === 0) {
        createEnemyBulletFn(new EnemyBullet(this.x - 90, this.y + 50, -0.8, 7.5, '#ef4444', true));
        createEnemyBulletFn(new EnemyBullet(this.x + 90, this.y + 50, 0.8, 7.5, '#ef4444', true));
        if (this.phase >= 2) {
          createEnemyBulletFn(new EnemyBullet(this.x - 40, this.y + 50, -1.8, 8, '#ef4444', true));
          createEnemyBulletFn(new EnemyBullet(this.x + 40, this.y + 50, 1.8, 8, '#ef4444', true));
        }

        const angle = Math.atan2(550 - this.y, playerX - this.x);
        createEnemyBulletFn(new EnemyBullet(this.x, this.y + 60, Math.cos(angle) * 7, Math.sin(angle) * 7, '#00ffcc'));
      }

      const cannonInterval = this.phase === 3 ? 40 : 65;
      if (this.shootTimer % cannonInterval === 0) {
        [-110, -50, 50, 110].forEach((offX) => {
          createEnemyBulletFn(new EnemyBullet(this.x + offX, this.y + 35, 0, 6, '#ff0055'));
        });
      }
    } else if (this.level === 4) {
      // Màn 4: Boss Moon Fortress Core (COMBO: Double Spiral Hell Rings + Minion Shields)
      const ringInterval = this.phase === 3 ? 18 : this.phase === 2 ? 25 : 35;
      if (this.shootTimer % ringInterval === 0) {
        const count = this.phase === 3 ? 22 : this.phase === 2 ? 18 : 14;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2 + (Date.now() / 700) * (this.phase === 3 ? 2.5 : 1.5);
          createEnemyBulletFn(new EnemyBullet(this.x, this.y, Math.cos(angle) * 5.5, Math.sin(angle) * 5.5, '#e040fb'));
        }
      }

      if (this.attackPatternTimer % (this.phase === 3 ? 150 : 220) === 0) {
        spawnMinionFn(new UFOEnemy(this.phase === 3 ? 'shielded' : 'shooter'));
      }
    } else if (this.level === 5) {
      // Màn 5: Boss Emperor Mothership (TRIPLE COMBO: Spiral Hell + Stealth Clones + Horizontal Fly-By)
      if (this.phase === 1) {
        if (this.shootTimer % 28 === 0) {
          for (let i = -6; i <= 6; i++) {
            createEnemyBulletFn(new EnemyBullet(this.x, this.y + 50, i * 1.8, 6.5, '#ff0055'));
          }
        }
      } else if (this.phase === 2) {
        if (this.shootTimer % 18 === 0) {
          const angle = (this.shootTimer / 18) * 0.45;
          createEnemyBulletFn(new EnemyBullet(this.x, this.y + 50, Math.sin(angle) * 7, 7.5, '#ffff00'));
        }
        if (this.attackPatternTimer % 120 === 0) {
          spawnMinionFn(new Meteor(undefined, undefined, 24, 4.5));
        }
      } else { // Phase 3: Ultra All-Out Bullet Hell Spiral + Double Ring Combo
        if (this.shootTimer % 12 === 0) {
          const count = 24;
          for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + (this.shootTimer / 12) * 0.4;
            createEnemyBulletFn(new EnemyBullet(this.x, this.y, Math.cos(angle) * 6.5, Math.sin(angle) * 6.5, '#00ffff'));
          }
        }
        if (this.attackPatternTimer % 140 === 0) {
          spawnMinionFn(new UFOEnemy('shooter'));
        }
      }
    }
  }

  takeDamage(amount: number): boolean {
    if (this.shieldActive) {
      amount *= 0.3; // Shield absorbs 70% damage
    }
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.markedForDeletion = true;
      return true;
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D) {
    // 1. Draw Horizontal Dash Telegraph Line across screen if active
    if (this.dashWarningTimer > 0) {
      ctx.save();
      ctx.strokeStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 20;
      ctx.lineWidth = 4 + Math.sin(Date.now() / 40) * 3;
      ctx.setLineDash([16, 10]);

      ctx.beginPath();
      ctx.moveTo(0, this.dashYLine);
      ctx.lineTo(CANVAS_WIDTH, this.dashYLine);
      ctx.stroke();

      // Warning Label
      ctx.fillStyle = '#ff2266';
      ctx.font = '900 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ CẢNH BÁO MÔI TRƯỜNG: TRÙM BAY NGANG TỐC ĐỘ CAO! ⚠️', CANVAS_WIDTH / 2, this.dashYLine - 12);
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    // Stealth Camouflage Visual Effect
    if (this.isStealthed) {
      ctx.globalAlpha = 0.12 + Math.random() * 0.12;
      // Static distortion aura
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 110, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.level === 1) {
      // Giant Cracking Meteor Boss
      ctx.shadowColor = '#ff3300';
      ctx.shadowBlur = 25;

      const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 95);
      grad.addColorStop(0, '#ff4500');
      grad.addColorStop(0.5, '#4a1500');
      grad.addColorStop(1, '#0f0200');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 90, 0, Math.PI * 2);
      ctx.fill();

      // Magma cracks
      ctx.strokeStyle = '#ff9900';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-45, -35);
      ctx.lineTo(0, 0);
      ctx.lineTo(55, -20);
      ctx.moveTo(0, 0);
      ctx.lineTo(-25, 65);
      ctx.stroke();
    } else if (this.level === 2) {
      // UFO Scout Commander
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 25;

      if (this.shieldActive) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 135, 55, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 120, 45, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(0, -15, 35, Math.PI, 0, false);
      ctx.fill();
    } else if (this.level === 3) {
      // Alien Battleship
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(0, 60);
      ctx.lineTo(-110, -40);
      ctx.lineTo(-60, -60);
      ctx.lineTo(60, -60);
      ctx.lineTo(110, -40);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Red Glowing Core
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.level === 4) {
      // Moon Base Core
      ctx.shadowColor = '#e040fb';
      ctx.shadowBlur = 25;

      ctx.fillStyle = '#3b0764';
      ctx.beginPath();
      ctx.arc(0, 0, 75, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#e040fb';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, 92, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Level 5 UFO Emperor
      ctx.shadowColor = this.phase === 3 ? '#ff0055' : '#00f0ff';
      ctx.shadowBlur = 35;

      const empGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 115);
      empGrad.addColorStop(0, this.phase === 3 ? '#ff0055' : '#0284c7');
      empGrad.addColorStop(0.7, '#0f172a');
      empGrad.addColorStop(1, '#000000');

      ctx.fillStyle = empGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 135, 58, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -10, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// --- POWER-UP DROP ---
export class PowerUp {
  public x: number;
  public y: number;
  public type: PowerUpType;
  public radius = 16;
  public markedForDeletion = false;
  public vy = 1.8;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const types = [
      PowerUpType.WEAPON_UPGRADE,
      PowerUpType.SHIP_HEAL,
      PowerUpType.EARTH_HEAL,
      PowerUpType.RAPID_FIRE,
      PowerUpType.DAMAGE_BOOST,
      PowerUpType.SHIELD_REFILL,
      PowerUpType.SPECIAL_RECHARGE,
    ];
    this.type = types[Math.floor(Math.random() * types.length)];
  }

  update() {
    this.y += this.vy;
    if (this.y > CANVAS_HEIGHT + 30) this.markedForDeletion = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const config = POWERUP_CONFIGS[this.type];
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.shadowColor = config.color;
    ctx.shadowBlur = 12;

    ctx.fillStyle = config.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.icon, 0, 1);

    ctx.restore();
  }
}

// --- EXP GEM ---
export class ExpGem {
  public x: number;
  public y: number;
  public value: number;
  public radius = 7;
  public markedForDeletion = false;
  public vx: number;
  public vy: number;
  public pulse = Math.random() * Math.PI * 2;

  constructor(x: number, y: number, value = 15) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.vx = (Math.random() - 0.5) * 5;
    this.vy = (Math.random() - 0.5) * 5;
  }

  update(playerX: number, playerY: number, magnetRadius: number) {
    this.pulse += 0.08;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.94;
    this.vy *= 0.94;

    const dist = Math.hypot(playerX - this.x, playerY - this.y);
    if (dist < magnetRadius) {
      const angle = Math.atan2(playerY - this.y, playerX - this.x);
      const speed = 12;
      this.x += Math.cos(angle) * speed;
      this.y += Math.sin(angle) * speed;
    } else {
      this.y += 1.2;
    }

    if (this.y > CANVAS_HEIGHT + 30) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;

    const scale = 1 + Math.sin(this.pulse) * 0.15;
    ctx.scale(scale, scale);

    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(7, 0);
    ctx.lineTo(0, 9);
    ctx.lineTo(-7, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// --- PARTICLE EFFECT ---
export class Particle {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public size: number;
  public color: string;
  public life = 1.0;
  public decay: number;
  public type: 'circle' | 'shrapnel' | 'spark' | 'smoke';
  public rotation = Math.random() * Math.PI * 2;
  public vRot = (Math.random() - 0.5) * 0.2;
  public markedForDeletion = false;

  constructor(
    x: number,
    y: number,
    color?: string,
    size?: number,
    type: 'circle' | 'shrapnel' | 'spark' | 'smoke' = 'circle'
  ) {
    this.x = x;
    this.y = y;
    this.type = type;
    const speed = type === 'spark' ? 12 : type === 'shrapnel' ? 7 : 5;
    this.vx = (Math.random() - 0.5) * speed;
    this.vy = (Math.random() - 0.5) * speed;
    this.size = size || (type === 'smoke' ? Math.random() * 12 + 8 : Math.random() * 5 + 2);
    const colors = ['#ff4500', '#ffea00', '#00f0ff', '#ffffff', '#ef4444'];
    this.color = color || colors[Math.floor(Math.random() * colors.length)];
    this.decay = type === 'smoke' ? 0.015 : Math.random() * 0.03 + 0.02;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.vRot;
    if (this.type === 'smoke') {
      this.size += 0.2; // Expanding smoke cloud
      this.vx *= 0.96;
      this.vy *= 0.96;
    }
    this.life -= this.decay;
    if (this.life <= 0) this.markedForDeletion = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;

    if (this.type === 'shrapnel') {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.beginPath();
      ctx.moveTo(-this.size, -this.size / 2);
      ctx.lineTo(this.size, -this.size);
      ctx.lineTo(this.size / 2, this.size);
      ctx.lineTo(-this.size / 2, this.size / 2);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'spark') {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.vx * 2, this.y - this.vy * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// --- SHOCKWAVE EFFECT ---
export class Shockwave {
  public x: number;
  public y: number;
  public radius = 10;
  public maxRadius = 800;
  public color: string;
  public markedForDeletion = false;

  constructor(x: number, y: number, color = '#00ffff') {
    this.x = x;
    this.y = y;
    this.color = color;
  }

  update() {
    this.radius += 25;
    if (this.radius >= this.maxRadius) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20;
    ctx.lineWidth = Math.max(1, 10 - (this.radius / this.maxRadius) * 10);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// --- SPECIAL SKILL EFFECTS ---

export class FlameOverdriveEffect {
  public timer = 240; // 4 seconds
  public markedForDeletion = false;

  update(
    playerX: number,
    playerY: number,
    enemies: (Meteor | UFOEnemy)[],
    boss: Boss | null,
    enemyBullets: EnemyBullet[],
    particles: Particle[]
  ) {
    this.timer--;
    if (this.timer <= 0) this.markedForDeletion = true;

    const flameX = playerX;
    const flameY = playerY - 10;
    const flameWidth = 170;
    const flameLength = 650;

    for (const eb of enemyBullets) {
      if (
        eb.x >= flameX - flameWidth / 2 &&
        eb.x <= flameX + flameWidth / 2 &&
        eb.y <= flameY &&
        eb.y >= flameY - flameLength
      ) {
        eb.markedForDeletion = true;
        particles.push(new Particle(eb.x, eb.y, '#ffaa00', 3, 'spark'));
      }
    }

    for (const e of enemies) {
      if (
        !e.markedForDeletion &&
        e.x >= flameX - flameWidth / 2 - e.size &&
        e.x <= flameX + flameWidth / 2 + e.size &&
        e.y <= flameY &&
        e.y >= flameY - flameLength
      ) {
        e.takeDamage(1.8);
        if (Math.random() < 0.35) {
          particles.push(
            new Particle(
              e.x + (Math.random() - 0.5) * 20,
              e.y + (Math.random() - 0.5) * 20,
              '#ff4d00',
              4,
              'circle'
            )
          );
        }
      }
    }

    if (boss && !boss.markedForDeletion) {
      if (boss.x >= flameX - flameWidth / 2 - 80 && boss.x <= flameX + flameWidth / 2 + 80 && boss.y <= flameY) {
        boss.takeDamage(3.0);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, playerX: number, playerY: number) {
    ctx.save();
    const flameX = playerX;
    const flameY = playerY - 10;

    const grad = ctx.createLinearGradient(flameX, flameY, flameX, flameY - 650);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.2, 'rgba(255, 200, 0, 0.85)');
    grad.addColorStop(0.5, 'rgba(255, 80, 0, 0.75)');
    grad.addColorStop(0.85, 'rgba(220, 0, 0, 0.4)');
    grad.addColorStop(1, 'rgba(120, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.shadowColor = '#ff3300';
    ctx.shadowBlur = 35;

    ctx.beginPath();
    const flicker1 = (Math.random() - 0.5) * 25;
    const flicker2 = (Math.random() - 0.5) * 35;
    ctx.moveTo(flameX - 30, flameY);
    ctx.lineTo(flameX - 95 + flicker1, flameY - 450);
    ctx.lineTo(flameX + flicker2, flameY - 650);
    ctx.lineTo(flameX + 95 + flicker1, flameY - 450);
    ctx.lineTo(flameX + 30, flameY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

export class MegaLaserEffect {
  public timer = 150; // 2.5 seconds
  public markedForDeletion = false;

  update(
    playerX: number,
    playerY: number,
    enemies: (Meteor | UFOEnemy)[],
    boss: Boss | null,
    enemyBullets: EnemyBullet[],
    particles: Particle[]
  ) {
    this.timer--;
    if (this.timer <= 0) this.markedForDeletion = true;

    const laserX = playerX;
    const laserWidth = 95;

    for (const eb of enemyBullets) {
      if (Math.abs(eb.x - laserX) < laserWidth / 2 + eb.radius) {
        eb.markedForDeletion = true;
      }
    }

    for (const e of enemies) {
      if (!e.markedForDeletion && Math.abs(e.x - laserX) < laserWidth / 2 + e.size) {
        e.takeDamage(2.8);
        particles.push(new Particle(laserX + (Math.random() - 0.5) * 30, e.y, '#00ffff', 4, 'spark'));
      }
    }

    if (boss && !boss.markedForDeletion && Math.abs(boss.x - laserX) < laserWidth / 2 + 80) {
      boss.takeDamage(4.5);
    }
  }

  draw(ctx: CanvasRenderingContext2D, playerX: number, playerY: number) {
    ctx.save();
    const laserX = playerX;
    const laserWidth = 95;

    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 40;
    ctx.fillStyle = 'rgba(0, 255, 255, 0.45)';
    ctx.fillRect(laserX - laserWidth / 2, 0, laserWidth, playerY);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(laserX - laserWidth / 4, 0, laserWidth / 2, playerY);

    ctx.restore();
  }
}

export class BlackHoleEntity {
  public x: number;
  public y: number;
  public timer = 270; // 4.5 seconds
  public markedForDeletion = false;
  public radius = 350;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(
    enemies: (Meteor | UFOEnemy)[],
    boss: Boss | null,
    enemyBullets: EnemyBullet[],
    particles: Particle[]
  ) {
    this.timer--;
    if (this.timer <= 0) this.markedForDeletion = true;

    for (const eb of enemyBullets) {
      const dist = Math.hypot(eb.x - this.x, eb.y - this.y);
      if (dist < this.radius) {
        const angle = Math.atan2(this.y - eb.y, this.x - eb.x);
        eb.x += Math.cos(angle) * 14;
        eb.y += Math.sin(angle) * 14;

        if (dist < 50) {
          eb.markedForDeletion = true;
          particles.push(new Particle(eb.x, eb.y, '#e040fb', 3, 'spark'));
        }
      }
    }

    for (const e of enemies) {
      if (e.markedForDeletion) continue;
      const dist = Math.hypot(e.x - this.x, e.y - this.y);
      if (dist < this.radius + 100) {
        const angle = Math.atan2(this.y - e.y, this.x - e.x);
        e.x += Math.cos(angle) * 3.8;
        e.y += Math.sin(angle) * 3.8;

        e.takeDamage(0.9);
        if (dist < 70) {
          e.takeDamage(2.8);
          particles.push(new Particle(e.x, e.y, '#e040fb', 3, 'circle'));
        }
      }
    }

    if (boss && !boss.markedForDeletion) {
      const dist = Math.hypot(boss.x - this.x, boss.y - this.y);
      if (dist < this.radius) {
        boss.takeDamage(2.0);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const time = Date.now() / 180;

    ctx.shadowColor = '#e040fb';
    ctx.shadowBlur = 35;

    const grad = ctx.createRadialGradient(this.x, this.y, 10, this.x, this.y, this.radius);
    grad.addColorStop(0, '#000000');
    grad.addColorStop(0.2, '#3b0764');
    grad.addColorStop(0.65, 'rgba(168, 85, 247, 0.28)');
    grad.addColorStop(1, 'transparent');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#e040fb';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, 70 + i * 18, 28 + i * 7, time + i * 1.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
