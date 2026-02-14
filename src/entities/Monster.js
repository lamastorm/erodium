import { Entity } from './Entity.js';

export class Monster extends Entity {
    constructor(x, y, type) {
        super(x, y);

        this.type = type; // 'goblin', 'skeleton', etc.
        this.config = this.getMonsterConfig(type);

        this.hp = this.config.maxHp;
        this.maxHp = this.config.maxHp;
        this.damage = this.config.damage;
        this.xpReward = this.config.xpReward;
        this.aggroRange = this.config.aggroRange;
        this.attackRange = this.config.attackRange;
        this.speed = this.config.speed;

        this.state = 'idle'; // idle, chase, attack, dead
        this.target = null;
        this.lastAttackTime = 0;
        this.attackCooldown = 1500; // 1.5 seconds

        this.spawnX = x;
        this.spawnY = y;
        this.id = null; // Set by spawner
    }

    getMonsterConfig(type) {
        const configs = {
            goblin: {
                maxHp: 30,
                damage: 5,
                xpReward: 20,
                aggroRange: 150,
                attackRange: 40,
                speed: 60,
                color: '#44ff44'
            },
            skeleton: {
                maxHp: 50,
                damage: 8,
                xpReward: 35,
                aggroRange: 120,
                attackRange: 40,
                speed: 50,
                color: '#cccccc'
            },
            orc: {
                maxHp: 80,
                damage: 12,
                xpReward: 50,
                aggroRange: 180,
                attackRange: 40,
                speed: 70,
                color: '#ff4444'
            }
        };

        return configs[type] || configs.goblin;
    }

    update(dt, game) {
        if (!this.isAlive) return;

        const player = game.player;

        // Simple client-side prediction for movement/aggro
        // ideally this should be server-driven too, but for smoothness we keep some local logic

        switch (this.state) {
            case 'idle':
                // Check for player in range
                if (this.distanceTo(player) < this.aggroRange) {
                    this.state = 'chase';
                    this.target = player;
                }
                break;

            case 'chase':
                const distToPlayer = this.distanceTo(player);

                // Lost aggro
                if (distToPlayer > this.aggroRange * 2) {
                    this.state = 'idle';
                    this.target = null;
                    // Return to spawn
                    this.returnToSpawn(dt);
                }
                // In attack range
                else if (distToPlayer < this.attackRange) {
                    this.state = 'attack';
                }
                // Chase player
                else {
                    this.moveTowards(player, dt);
                }
                break;

            case 'attack':
                if (this.distanceTo(player) > this.attackRange * 1.5) {
                    this.state = 'chase';
                } else {
                    this.attackTarget(player);
                }
                break;
        }
    }

    moveTowards(target, dt) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const moveAmount = this.speed * (dt / 1000);
            this.x += (dx / distance) * moveAmount;
            this.y += (dy / distance) * moveAmount;
        }
    }

    returnToSpawn(dt) {
        const dx = this.spawnX - this.x;
        const dy = this.spawnY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            const moveAmount = this.speed * (dt / 1000);
            this.x += (dx / distance) * moveAmount;
            this.y += (dy / distance) * moveAmount;
        }
    }

    attackTarget(target) {
        const now = Date.now();

        if (now - this.lastAttackTime >= this.attackCooldown) {
            // Logic for monster attack on player (client side visual only?)
            // Real damage should come from server to player

            // For now, let's keep local damage to player for simplicity in Phase 2
            // target.takeDamage(this.damage);

            this.lastAttackTime = now;
            console.log(`[Monster] ${this.type} attacks!`);
        }
    }

    takeDamage(amount) {
        // Local prediction or visual feedback
    }

    takeDamageInternal(amount, newHp) {
        this.hp = newHp;
        // Visual flash could go here
    }

    die() {
        this.isAlive = false;
        this.state = 'dead';
        console.log(`[Monster] ${this.type} died!`);

        // Trigger death callback
        if (this.onDeath) {
            this.onDeath(this);
        }
    }

    render(ctx, camera) {
        if (!this.isAlive) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Draw monster
        ctx.fillStyle = this.config.color;
        ctx.fillRect(screenX, screenY, this.width, this.height);

        // Draw border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, screenY, this.width, this.height);

        // Draw HP bar
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(screenX, screenY - 8, this.width * hpPercent, 4);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY - 8, this.width, 4);

        // Draw type label
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.type, screenX + this.width / 2, screenY - 12);
    }
}
