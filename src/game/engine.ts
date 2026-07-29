import {
  InputHandler,
  Star,
  Player,
  Bullet,
  EnemyBullet,
  Meteor,
  UFOEnemy,
  Boss,
  PowerUp,
  ExpGem,
  Particle,
  Shockwave,
  FlameOverdriveEffect,
  MegaLaserEffect,
  BlackHoleEntity,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from './entities';
import { LEVEL_CONFIGS } from './levels';
import { GameSettings, GameStats, PowerUpType, UpgradeOption } from '../types';
import { soundEngine } from '../audio';

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public input: InputHandler;
  public player: Player;
  public settings: GameSettings;

  public stars: Star[] = [];
  public bullets: Bullet[] = [];
  public enemyBullets: EnemyBullet[] = [];
  public enemies: (Meteor | UFOEnemy)[] = [];
  public boss: Boss | null = null;
  public powerUps: PowerUp[] = [];
  public expGems: ExpGem[] = [];
  public particles: Particle[] = [];
  public shockwaves: Shockwave[] = [];
  public flameOverdrives: FlameOverdriveEffect[] = [];
  public megaLasers: MegaLaserEffect[] = [];
  public blackHoles: BlackHoleEntity[] = [];

  public score = 0;
  public level = 1;
  public bossProgress = 0; // 0 to 100
  public earthHp = 100;
  public maxEarthHp = 100;
  public isBossActive = false;
  public isWarningActive = false;
  public warningTimer = 0;

  public isPaused = false;
  public isGameOver = false;
  public isVictory = false;
  public isLevelUpActive = false;
  public screenShake = 0;

  // Combo Streak System
  public comboCount = 0;
  public comboTimer = 0; // max 180 frames = 3 seconds

  public stats: GameStats = {
    score: 0,
    level: 1,
    meteorsDestroyed: 0,
    ufosDestroyed: 0,
    bossesDefeated: 0,
    damageDealt: 0,
  };

  private animationFrameId: number | null = null;
  private onStateChangeCb: () => void;
  private onLevelUpCb?: (level: number) => void;

  constructor(
    canvas: HTMLCanvasElement,
    settings: GameSettings,
    onStateChangeCb: () => void,
    onLevelUpCb?: (level: number) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.settings = settings;
    this.onStateChangeCb = onStateChangeCb;
    this.onLevelUpCb = onLevelUpCb;

    this.input = new InputHandler();
    this.input.useMouse = settings.controlType === 'mouse';
    this.player = new Player(settings.shipType || 'classic');

    this.initStars();
  }

  public setOnLevelUpCallback(cb: (level: number) => void) {
    this.onLevelUpCb = cb;
  }

  public applyUpgrade(upgrade: UpgradeOption) {
    switch (upgrade.id) {
      case 'drone':
        this.player.droneCount = Math.min(4, this.player.droneCount + 1);
        break;
      case 'damage':
        this.player.damageMultiplier += 0.2;
        break;
      case 'max_hp':
        this.player.maxHp += 25;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 30);
        break;
      case 'earth_heal':
        this.earthHp = Math.min(this.maxEarthHp + 200, this.earthHp + 300);
        this.maxEarthHp = Math.max(this.maxEarthHp, this.earthHp);
        break;
      case 'cooldown':
        this.player.cooldownMultiplier *= 0.8;
        break;
      case 'speed':
        this.player.speed *= 1.2;
        break;
      case 'magnet':
        this.player.magnetRadius *= 1.5;
        break;
      case 'fire_rate':
        this.player.cooldownMultiplier *= 0.85;
        break;
      case 'lifesteal':
        this.player.lifestealPercent += 4;
        break;
    }
    this.isLevelUpActive = false;
    this.onStateChangeCb();
  }

  public updateSettings(newSettings: GameSettings) {
    this.settings = newSettings;
    this.input.useMouse = newSettings.controlType === 'mouse';
    if (this.player) {
      this.player.setShipType(newSettings.shipType || 'classic');
    }
    soundEngine.setSoundEnabled(newSettings.soundEnabled);
  }

  private initStars() {
    this.stars = [];
    for (let i = 0; i < 120; i++) {
      this.stars.push(new Star());
    }
  }

  public start() {
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.loop();
  }

  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public togglePause() {
    this.isPaused = !this.isPaused;
    if (!this.isPaused) {
      this.loop();
    }
    this.onStateChangeCb();
  }

  public resetGame() {
    this.score = 0;
    this.level = 1;
    this.bossProgress = 0;
    this.earthHp = 100;
    this.isBossActive = false;
    this.isWarningActive = false;
    this.boss = null;
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;

    this.player = new Player(this.settings.shipType || 'classic');
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.powerUps = [];
    this.expGems = [];
    this.particles = [];
    this.shockwaves = [];
    this.flameOverdrives = [];
    this.megaLasers = [];
    this.blackHoles = [];
    this.isLevelUpActive = false;

    this.stats = {
      score: 0,
      level: 1,
      meteorsDestroyed: 0,
      ufosDestroyed: 0,
      bossesDefeated: 0,
      damageDealt: 0,
    };

    this.start();
    this.onStateChangeCb();
  }

  private loop = () => {
    if (this.isPaused || this.isGameOver || this.isVictory || this.isLevelUpActive) return;

    this.update();
    this.draw();

    this.onStateChangeCb();
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update() {
    // Check Pause key (P or Esc)
    if (this.input.keys['KeyP'] || this.input.keys['Escape']) {
      this.input.keys['KeyP'] = false;
      this.input.keys['Escape'] = false;
      this.togglePause();
      return;
    }

    // Special Skill Trigger (E Key)
    if (this.input.keys['KeyE'] && this.player.specialEnergy >= 100) {
      this.input.keys['KeyE'] = false;
      this.activateSpecialSkill();
    }

    // Update Player
    this.player.update(
      this.input,
      (newBullets) => {
        this.bullets.push(...newBullets);
      },
      this.enemies,
      this.boss
    );

    // Update Background Stars
    this.stars.forEach((star) => star.update(this.player.isBoosting ? 2.5 : 1));

    // Update Combo Timer
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer === 0) {
        this.comboCount = 0; // Combo breaks after 3s of no hits
      }
    }

    // Update Bullets
    this.bullets.forEach((b) => b.update(this.enemies, this.boss));
    this.enemyBullets.forEach((eb) => eb.update());

    // Enemy Spawning Logic
    const levelConfig = LEVEL_CONFIGS[this.level] || LEVEL_CONFIGS[1];
    let difficultyMult = 1.0;
    if (this.settings.difficulty === 'easy') difficultyMult = 0.6;
    else if (this.settings.difficulty === 'hard') difficultyMult = 1.35;

    if (!this.isBossActive && !this.isWarningActive) {
      if (Math.random() < levelConfig.meteorSpawnRate * difficultyMult) {
        this.enemies.push(new Meteor());
      }
      if (Math.random() < levelConfig.ufoSpawnRate * difficultyMult) {
        const ufoType = levelConfig.ufoTypes[Math.floor(Math.random() * levelConfig.ufoTypes.length)];
        this.enemies.push(new UFOEnemy(ufoType));
      }
    }

    // Update Enemies
    this.enemies.forEach((enemy) => {
      if (enemy instanceof UFOEnemy) {
        const breached = enemy.update((eb) => this.enemyBullets.push(eb));
        if (breached) this.damageEarth(10);
      } else {
        const breached = enemy.update();
        if (breached) this.damageEarth(5);
      }
    });

    // Update Boss
    if (this.boss) {
      this.boss.update(
        (eb) => this.enemyBullets.push(eb),
        (minion) => this.enemies.push(minion),
        this.player.x + this.player.width / 2
      );

      if (this.boss.markedForDeletion) {
        this.onBossDefeated();
      }
    }

    // Update PowerUps & Effects
    const pCenterX = this.player.x + this.player.width / 2;
    const pCenterY = this.player.y + this.player.height / 2;
    this.expGems.forEach((gem) => gem.update(pCenterX, pCenterY, this.player.magnetRadius));
    this.powerUps.forEach((p) => p.update());
    this.particles.forEach((pt) => pt.update());
    this.shockwaves.forEach((s) => s.update());

    // Update Special Skill Effects
    this.flameOverdrives.forEach((fo) => fo.update(pCenterX, pCenterY, this.enemies, this.boss, this.enemyBullets, this.particles));
    this.megaLasers.forEach((ml) => ml.update(pCenterX, pCenterY, this.enemies, this.boss, this.enemyBullets, this.particles));
    this.blackHoles.forEach((bh) => bh.update(this.enemies, this.boss, this.enemyBullets, this.particles));

    // Collisions
    this.checkCollisions();

    // Clean up dead objects
    this.bullets = this.bullets.filter((b) => !b.markedForDeletion);
    this.enemyBullets = this.enemyBullets.filter((eb) => !eb.markedForDeletion);
    this.enemies = this.enemies.filter((e) => !e.markedForDeletion);
    this.powerUps = this.powerUps.filter((p) => !p.markedForDeletion);
    this.expGems = this.expGems.filter((g) => !g.markedForDeletion);
    this.particles = this.particles.filter((pt) => !pt.markedForDeletion);
    this.shockwaves = this.shockwaves.filter((s) => !s.markedForDeletion);
    this.flameOverdrives = this.flameOverdrives.filter((fo) => !fo.markedForDeletion);
    this.megaLasers = this.megaLasers.filter((ml) => !ml.markedForDeletion);
    this.blackHoles = this.blackHoles.filter((bh) => !bh.markedForDeletion);
  }

  private damageEarth(amount: number) {
    this.earthHp = Math.max(0, this.earthHp - amount);
    this.screenShake = Math.max(this.screenShake, 8);
    soundEngine.playPlayerHit();

    if (this.earthHp <= 0) {
      this.triggerGameOver('Trái Đất đã bị hủy diệt hoàn toàn!');
    }
  }

  private checkCollisions() {
    const pCenterX = this.player.x + this.player.width / 2;
    const pCenterY = this.player.y + this.player.height / 2;

    // 1. Player Bullets vs Enemies
    this.bullets.forEach((bullet) => {
      this.enemies.forEach((enemy) => {
        const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
        const hitRadius = enemy instanceof Meteor ? enemy.size : enemy.size + 10;

        if (dist < bullet.radius + hitRadius) {
          // Combo hit boost
          this.comboCount++;
          this.comboTimer = 180; // 3 second combo window
          const comboMult = 1 + Math.min(1.5, Math.floor(this.comboCount / 5) * 0.10);
          const finalDamage = bullet.damage * comboMult;

          const killed = enemy.takeDamage(finalDamage);
          this.stats.damageDealt += finalDamage;

          // Lifesteal recovery
          if (this.player.lifestealPercent > 0) {
            const healAmt = finalDamage * (this.player.lifestealPercent / 100);
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmt);
            if (Math.random() < 0.35) {
              this.particles.push(new Particle(bullet.x, bullet.y, '#00ff66', 3, 'spark'));
            }
          }

          // Piercing laser does not immediately delete
          if (!bullet.isLaser) bullet.markedForDeletion = true;

          // Hit particles
          for (let i = 0; i < 4; i++) {
            this.particles.push(new Particle(bullet.x, bullet.y, '#ffffff', 2, 'spark'));
          }

          if (killed) {
            this.addScore(enemy instanceof Meteor ? 20 : 50);
            if (enemy instanceof Meteor) this.stats.meteorsDestroyed++;
            else this.stats.ufosDestroyed++;

            this.addBossProgress(enemy instanceof Meteor ? 1.5 : 3.0);
            const isUfo = enemy instanceof UFOEnemy;
            this.createExplosion(enemy.x, enemy.y, enemy instanceof Meteor ? enemy.size > 30 : true, isUfo);

            // Drop EXP gems on destroy
            const gemCount = isUfo ? 3 : 2;
            const gemVal = isUfo ? 25 : 15;
            for (let g = 0; g < gemCount; g++) {
              this.expGems.push(new ExpGem(enemy.x, enemy.y, gemVal));
            }

            // Item drop chance (25%)
            if (Math.random() < 0.25) {
              this.powerUps.push(new PowerUp(enemy.x, enemy.y));
            }
          }
        }
      });

      // Player Bullets vs Boss
      if (this.boss) {
        const bossDist = Math.hypot(bullet.x - this.boss.x, bullet.y - this.boss.y);
        if (bossDist < bullet.radius + 80) {
          // Combo hit boost for Boss
          this.comboCount++;
          this.comboTimer = 180;
          const comboMult = 1 + Math.min(1.5, Math.floor(this.comboCount / 5) * 0.10);
          const finalDamage = bullet.damage * comboMult;

          const bossDead = this.boss.takeDamage(finalDamage);
          this.stats.damageDealt += finalDamage;

          // Lifesteal recovery from Boss
          if (this.player.lifestealPercent > 0) {
            const healAmt = finalDamage * (this.player.lifestealPercent / 100);
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmt);
            if (Math.random() < 0.35) {
              this.particles.push(new Particle(bullet.x, bullet.y, '#00ff66', 3, 'spark'));
            }
          }

          if (!bullet.isLaser) bullet.markedForDeletion = true;

          for (let i = 0; i < 3; i++) {
            this.particles.push(new Particle(bullet.x, bullet.y, '#ff0055', 3, 'spark'));
          }

          if (bossDead) {
            this.onBossDefeated();
          }
        }
      }
    });

    // 2. Enemy Bullets vs Player
    if (!this.player.isDashing) {
      this.enemyBullets.forEach((eb) => {
        const dist = Math.hypot(eb.x - pCenterX, eb.y - pCenterY);
        if (dist < eb.radius + 24) {
          eb.markedForDeletion = true;
          if (this.player.shieldActive) {
            this.particles.push(new Particle(eb.x, eb.y, '#00ffff', 5, 'spark'));
          } else {
            this.comboCount = 0; // Combo breaks on hit!
            const died = this.player.takeDamage(12);
            this.screenShake = 12;
            if (died && this.player.lives < 0) {
              this.triggerGameOver('Phi thuyền của bạn đã bị tiêu diệt!');
            }
          }
        }
      });
    }

    // 3. Enemies vs Player (Direct Collision)
    if (!this.player.isDashing) {
      this.enemies.forEach((enemy) => {
        const dist = Math.hypot(enemy.x - pCenterX, enemy.y - pCenterY);
        const hitRadius = enemy instanceof Meteor ? enemy.size : enemy.size;

        if (dist < hitRadius + 28) {
          if (this.player.shieldActive) {
            enemy.takeDamage(20);
            this.createExplosion(enemy.x, enemy.y, false);
          } else {
            this.comboCount = 0; // Combo breaks on collision!
            enemy.takeDamage(10);
            const died = this.player.takeDamage(25);
            this.screenShake = 16;
            if (died && this.player.lives < 0) {
              this.triggerGameOver('Phi thuyền đâm phải kẻ địch!');
            }
          }
        }
      });
    }

    // 4. PowerUps vs Player
    this.powerUps.forEach((p) => {
      const dist = Math.hypot(p.x - pCenterX, p.y - pCenterY);
      if (dist < p.radius + 28) {
        p.markedForDeletion = true;
        this.collectPowerUp(p.type);
      }
    });

    // 5. ExpGems vs Player
    this.expGems.forEach((gem) => {
      const dist = Math.hypot(gem.x - pCenterX, gem.y - pCenterY);
      if (dist < gem.radius + 28) {
        gem.markedForDeletion = true;
        this.player.exp += gem.value;
        soundEngine.playPowerUp();

        if (this.player.exp >= this.player.maxExp) {
          this.player.level++;
          this.player.exp -= this.player.maxExp;
          this.player.maxExp = Math.floor(this.player.maxExp * 1.55 + 50);

          // Tăng chỉ số máu & dame tự động cho thuyền khi lên Level
          this.player.maxHp += 20;
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25);
          this.player.damageMultiplier += 0.12; // +12% base damage per level

          // Level Up shockwave & sound
          this.shockwaves.push(new Shockwave(pCenterX, pCenterY, '#00ffcc'));
          soundEngine.playSpecialSkill();

          // Trigger Level Up Modal
          this.isLevelUpActive = true;
          if (this.onLevelUpCb) {
            this.onLevelUpCb(this.player.level);
          }
        }
      }
    });
  }

  private collectPowerUp(type: PowerUpType) {
    soundEngine.playPowerUp();
    switch (type) {
      case PowerUpType.WEAPON_UPGRADE:
        this.player.bulletLevel = Math.min(5, this.player.bulletLevel + 1);
        break;
      case PowerUpType.SHIP_HEAL:
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 30);
        break;
      case PowerUpType.EARTH_HEAL:
        this.earthHp = Math.min(this.maxEarthHp, this.earthHp + 20);
        break;
      case PowerUpType.RAPID_FIRE:
        this.player.rapidFireTimer = 480; // 8 seconds
        break;
      case PowerUpType.DAMAGE_BOOST:
        this.score += 200;
        break;
      case PowerUpType.SHIELD_REFILL:
        this.player.shieldCooldown = 0;
        this.player.activateShield();
        break;
      case PowerUpType.SPECIAL_RECHARGE:
        this.player.specialEnergy = Math.min(100, this.player.specialEnergy + 40);
        break;
    }
  }

  private activateSpecialSkill() {
    this.player.specialEnergy = 0;
    this.screenShake = 25;

    const pCenterX = this.player.x + this.player.width / 2;
    const pCenterY = this.player.y + this.player.height / 2;

    if (this.player.shipType === 'classic') {
      // Flame Overdrive: Roaring Inferno Column
      this.flameOverdrives.push(new FlameOverdriveEffect());
      soundEngine.playSpecialSkill();
      this.shockwaves.push(new Shockwave(pCenterX, pCenterY, '#ff4d00'));
    } else if (this.player.shipType === 'laser') {
      // Mega Laser: Piercing Orbital Beam
      this.megaLasers.push(new MegaLaserEffect());
      soundEngine.playSpecialSkill();
      this.shockwaves.push(new Shockwave(pCenterX, pCenterY, '#00ffff'));
    } else if (this.player.shipType === 'spread') {
      // Spread Storm: V-Formation Triple Heavy Volley
      soundEngine.playSpecialSkill();
      this.shockwaves.push(new Shockwave(pCenterX, pCenterY, '#ffaa00'));

      for (let wave = 0; wave < 3; wave++) {
        setTimeout(() => {
          if (!this.player) return;
          const bX = this.player.x + this.player.width / 2;
          const bY = this.player.y;
          const count = 15;
          for (let i = 0; i < count; i++) {
            const angle = (i - (count - 1) / 2) * 0.16;
            const vx = Math.sin(angle) * 16;
            const vy = -Math.cos(angle) * 16;
            this.bullets.push(
              new Bullet(
                bX,
                bY,
                vx,
                vy,
                20 * this.player.damageMultiplier,
                false,
                true,
                false,
                false
              )
            );
          }
        }, wave * 160);
      }
    } else if (this.player.shipType === 'homing') {
      // Black Hole Singularity: Gravitational Void
      this.blackHoles.push(new BlackHoleEntity(pCenterX, Math.max(160, pCenterY - 240)));
      soundEngine.playSpecialSkill();
      this.shockwaves.push(new Shockwave(pCenterX, pCenterY, '#e040fb'));
    }
  }

  private addBossProgress(amount: number) {
    if (this.isBossActive || this.isWarningActive) return;

    this.bossProgress = Math.min(100, this.bossProgress + amount);
    if (this.bossProgress >= 100) {
      this.triggerBossEntrance();
    }
  }

  private triggerBossEntrance() {
    this.isWarningActive = true;
    this.warningTimer = 180; // 3 seconds warning
    soundEngine.playBossWarning();

    setTimeout(() => {
      this.isWarningActive = false;
      this.isBossActive = true;
      this.boss = new Boss(this.level);
    }, 3000);
  }

  private onBossDefeated() {
    this.score += 1000 * this.level;
    this.stats.bossesDefeated++;
    this.createExplosion(this.boss?.x || CANVAS_WIDTH / 2, this.boss?.y || 150, true);

    this.boss = null;
    this.isBossActive = false;
    this.bossProgress = 0;

    if (this.level >= 5) {
      this.triggerVictory();
    } else {
      this.level++;
      this.stats.level = this.level;
    }
  }

  private addScore(pts: number) {
    this.score += pts;
    this.stats.score = this.score;
  }

  public createExplosion(x: number, y: number, isLarge: boolean, isUfo = false) {
    soundEngine.playExplosion(isLarge);
    const flameCount = isLarge ? 20 : 10;
    const shrapnelCount = isLarge ? 10 : 5;
    const sparkCount = isLarge ? 14 : 7;
    const smokeCount = isLarge ? 8 : 4;

    const primaryColor = isUfo ? '#00ffff' : '#ff4500';
    const secondaryColor = isUfo ? '#e040fb' : '#ffea00';

    this.shockwaves.push(new Shockwave(x, y, primaryColor));

    // Flames
    for (let i = 0; i < flameCount; i++) {
      const color = i % 2 === 0 ? primaryColor : secondaryColor;
      this.particles.push(new Particle(x, y, color, Math.random() * 6 + 3, 'circle'));
    }
    // Shrapnel
    for (let i = 0; i < shrapnelCount; i++) {
      const color = isUfo ? '#38bdf8' : '#854d0e';
      this.particles.push(new Particle(x, y, color, Math.random() * 6 + 4, 'shrapnel'));
    }
    // Sparks
    for (let i = 0; i < sparkCount; i++) {
      this.particles.push(new Particle(x, y, '#ffffff', Math.random() * 3 + 2, 'spark'));
    }
    // Smoke
    for (let i = 0; i < smokeCount; i++) {
      this.particles.push(new Particle(x, y, 'rgba(100, 116, 139, 0.5)', Math.random() * 10 + 6, 'smoke'));
    }
  }

  private triggerGameOver(reason: string) {
    this.isGameOver = true;
    this.onStateChangeCb();
  }

  private triggerVictory() {
    this.isVictory = true;
    this.onStateChangeCb();
  }

  private draw() {
    this.ctx.save();

    // Screen Shake Offset
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(shakeX, shakeY);
      this.screenShake *= 0.9;
      if (this.screenShake < 0.5) this.screenShake = 0;
    }

    // Canvas Background
    this.ctx.fillStyle = '#030712'; // Deep space dark
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Parallax Stars
    this.stars.forEach((star) => star.draw(this.ctx));

    // Draw Earth at Bottom
    this.drawEarth();

    // Draw Entities
    this.powerUps.forEach((p) => p.draw(this.ctx));
    this.expGems.forEach((gem) => gem.draw(this.ctx));
    this.blackHoles.forEach((bh) => bh.draw(this.ctx));
    this.enemies.forEach((e) => e.draw(this.ctx));
    if (this.boss) this.boss.draw(this.ctx);
    this.bullets.forEach((b) => b.draw(this.ctx));
    this.enemyBullets.forEach((eb) => eb.draw(this.ctx));
    this.player.draw(this.ctx);

    // Draw Overdrive Beams & Flames over Player
    const pCenterX = this.player.x + this.player.width / 2;
    const pCenterY = this.player.y + this.player.height / 2;
    this.flameOverdrives.forEach((fo) => fo.draw(this.ctx, pCenterX, pCenterY));
    this.megaLasers.forEach((ml) => ml.draw(this.ctx, pCenterX, pCenterY));

    this.particles.forEach((pt) => pt.draw(this.ctx));
    this.shockwaves.forEach((sw) => sw.draw(this.ctx));

    // Draw Flashing Warning Overlay
    if (this.isWarningActive) {
      this.drawWarningBanner();
    }

    this.ctx.restore();
  }

  private drawEarth() {
    const earthCenterX = CANVAS_WIDTH / 2;
    const earthCenterY = CANVAS_HEIGHT + 480;
    const earthRadius = 580;

    const levelConfig = LEVEL_CONFIGS[this.level] || LEVEL_CONFIGS[1];
    const lowEarthHp = this.earthHp < 30;

    // Outer Atmosphere Multi-layered Glow
    const atmosGrad = this.ctx.createRadialGradient(
      earthCenterX,
      earthCenterY,
      earthRadius - 15,
      earthCenterX,
      earthCenterY,
      earthRadius + 75
    );
    atmosGrad.addColorStop(0, lowEarthHp ? 'rgba(239, 68, 68, 0.5)' : levelConfig.bgTheme.earthGlow);
    atmosGrad.addColorStop(0.6, 'rgba(14, 165, 233, 0.2)');
    atmosGrad.addColorStop(1, 'transparent');

    this.ctx.fillStyle = atmosGrad;
    this.ctx.beginPath();
    this.ctx.arc(earthCenterX, earthCenterY, earthRadius + 75, 0, Math.PI * 2);
    this.ctx.fill();

    // Planet Ocean Body (3D Sphere Gradient)
    const bodyGrad = this.ctx.createRadialGradient(
      earthCenterX - 140,
      earthCenterY - 340,
      80,
      earthCenterX,
      earthCenterY,
      earthRadius
    );
    bodyGrad.addColorStop(0, '#38bdf8');
    bodyGrad.addColorStop(0.35, '#0284c7');
    bodyGrad.addColorStop(0.7, '#0f172a');
    bodyGrad.addColorStop(1, '#020617');

    this.ctx.fillStyle = bodyGrad;
    this.ctx.beginPath();
    this.ctx.arc(earthCenterX, earthCenterY, earthRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // Continents & Landmasses with Coastal Cyan Glows
    this.ctx.save();
    // North America / Eurasia Shapes
    this.ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';
    this.ctx.shadowColor = '#00ffcc';
    this.ctx.shadowBlur = 10;

    this.ctx.beginPath();
    this.ctx.ellipse(earthCenterX - 220, earthCenterY - 510, 190, 85, 0.15, 0, Math.PI * 2);
    this.ctx.ellipse(earthCenterX + 120, earthCenterY - 530, 240, 95, -0.1, 0, Math.PI * 2);
    this.ctx.ellipse(earthCenterX - 30, earthCenterY - 490, 110, 60, -0.2, 0, Math.PI * 2);
    this.ctx.fill();

    // Night-Side Golden City Lights (Dots)
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.shadowColor = '#fbbf24';
    this.ctx.shadowBlur = 8;
    const cityDotCoords = [
      { x: earthCenterX + 160, y: earthCenterY - 520 },
      { x: earthCenterX + 210, y: earthCenterY - 510 },
      { x: earthCenterX + 260, y: earthCenterY - 500 },
      { x: earthCenterX + 180, y: earthCenterY - 480 },
      { x: earthCenterX + 230, y: earthCenterY - 470 },
      { x: earthCenterX - 180, y: earthCenterY - 500 },
      { x: earthCenterX - 140, y: earthCenterY - 490 },
    ];
    cityDotCoords.forEach((pt) => {
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Cloud Swirl Arcs
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    this.ctx.shadowColor = '#ffffff';
    this.ctx.shadowBlur = 6;
    const t = Date.now() / 4000;
    this.ctx.beginPath();
    this.ctx.ellipse(earthCenterX + Math.sin(t) * 20, earthCenterY - 525, 280, 25, 0.05, 0, Math.PI * 2);
    this.ctx.ellipse(earthCenterX - Math.cos(t) * 30, earthCenterY - 485, 320, 22, -0.08, 0, Math.PI * 2);
    this.ctx.fill();

    // Protective Grid Shield Arc if low HP or Shield Active
    if (lowEarthHp) {
      this.ctx.strokeStyle = '#ef4444';
      this.ctx.shadowColor = '#ef4444';
      this.ctx.shadowBlur = 15;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(earthCenterX, earthCenterY, earthRadius + 12, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private drawWarningBanner() {
    const now = Math.floor(Date.now() / 250) % 2 === 0;
    if (now) {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      this.ctx.fillRect(0, CANVAS_HEIGHT / 2 - 60, CANVAS_WIDTH, 120);

      this.ctx.fillStyle = '#ef4444';
      this.ctx.shadowColor = '#ef4444';
      this.ctx.shadowBlur = 20;
      this.ctx.font = 'bold 42px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('⚠️ WARNING: BOSS APPROACHING ⚠️', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      this.ctx.restore();
    }
  }
}
