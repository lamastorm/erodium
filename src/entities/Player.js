import { Entity } from './Entity.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y);

        // Stats
        this.stats = {
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            hp: 100,
            maxHp: 100,
            mp: 50,
            maxMp: 50,

            // Skills (Rucoy-style)
            melee: 1,
            distance: 1,
            magic: 1,
            defense: 1
        };

        // Equipment
        this.equipment = {
            weapon: { type: 'sword', class: 'knight', damage: 5 },
            armor: null,
            shield: null
        };

        this.currentClass = 'knight'; // knight, archer, mage
        this.movementSpeed = 100; // pixels per second
        this.targetPosition = null;
        this.attackTarget = null;

        // Combat timers
        this.lastAttackTime = 0;
        this.lastSpecialTime = 0;
        this.attackCooldown = 1000; // 1 second
        this.specialCooldown = 1500; // 1.5 seconds
    }

    update(dt, game) {
        // Combat (process before movement so attacking takes priority)
        if (this.attackTarget && this.attackTarget.isAlive) {
            const now = Date.now();
            const distToTarget = this.distanceTo(this.attackTarget);
            const attackRange = this.getAttackRange();

            if (distToTarget <= attackRange * 32) {
                // Stop moving when in range
                this.targetPosition = null;

                // Initialize timers on first attack
                if (this.lastAttackTime === 0) {
                    this.lastAttackTime = now;
                    this.lastSpecialTime = now;
                }

                // Auto-attack tick
                if (now - this.lastAttackTime >= this.attackCooldown) {
                    this.performAttack(game);
                    this.lastAttackTime = now;
                }

                // Special attack (only if we have enough MP)
                if (this.stats.mp >= 10 && now - this.lastSpecialTime >= this.specialCooldown) {
                    this.performSpecial(game);
                    this.lastSpecialTime = now;
                }
            } else {
                // Move closer to target (but don't override manual movement)
                if (!this.targetPosition) {
                    this.targetPosition = { x: this.attackTarget.x, y: this.attackTarget.y };
                }
            }
        } else {
            this.attackTarget = null;
        }

        // Movement
        if (this.targetPosition) {
            const dx = this.targetPosition.x - this.x;
            const dy = this.targetPosition.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 5) {
                this.targetPosition = null;
            } else {
                const moveAmount = this.movementSpeed * (dt / 1000);
                this.x += (dx / distance) * moveAmount;
                this.y += (dy / distance) * moveAmount;
            }
        }
    }

    render(ctx, camera) {
        // Screen position
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Draw player (simple colored square for now)
        ctx.fillStyle = this.getClassColor();
        ctx.fillRect(screenX, screenY, this.width, this.height);

        // Draw border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, screenY, this.width, this.height);

        // Draw HP bar
        const hpPercent = this.stats.hp / this.stats.maxHp;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(screenX, screenY - 8, this.width * hpPercent, 4);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY - 8, this.width, 4);
    }

    getClassColor() {
        switch (this.currentClass) {
            case 'knight': return '#4488ff';
            case 'archer': return '#44ff44';
            case 'mage': return '#ff4488';
            default: return '#888888';
        }
    }

    getAttackRange() {
        switch (this.currentClass) {
            case 'knight': return 1.5; // 1.5 tiles
            case 'archer': return 4;   // 4 tiles
            case 'mage': return 5;     // 5 tiles
            default: return 1;
        }
    }

    performAttack(game) {
        if (!this.attackTarget) return;

        // Send attack to server
        if (game.network) {
            game.network.sendAttack(this.attackTarget.id);
        }

        // Gain skill XP (local prediction)
        this.gainSkillXP(this.currentClass, 1);

        console.log(`[Attack] Sent attack on ${this.attackTarget.type} (ID: ${this.attackTarget.id})`);
    }

    performSpecial(game) {
        if (!this.attackTarget) return;

        // Send special attack
        // For now, same as normal attack but consumes MP
        if (game.network) {
            game.network.sendAttack(this.attackTarget.id);
        }

        // Consume MP
        this.stats.mp = Math.max(0, this.stats.mp - 10);

        console.log(`[Special] Sent special attack on ${this.attackTarget.type}`);
    }

    calculateDamage() {
        const skill = this.stats[this.currentClass];
        const weaponDamage = this.equipment.weapon?.damage || 1;
        return Math.floor(weaponDamage + skill * 0.5);
    }

    takeDamage(amount) {
        this.stats.hp = Math.max(0, this.stats.hp - amount);

        if (this.stats.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.isAlive = false;
        console.log('[Player] You died!');
    }

    gainXP(amount) {
        this.stats.xp += amount;

        while (this.stats.xp >= this.stats.xpToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.stats.level++;
        this.stats.xp -= this.stats.xpToNextLevel;
        this.stats.xpToNextLevel = Math.floor(this.stats.xpToNextLevel * 1.2);

        // Increase max HP and MP
        this.stats.maxHp += 10;
        this.stats.maxMp += 5;
        this.stats.hp = this.stats.maxHp;
        this.stats.mp = this.stats.maxMp;

        console.log(`[Level Up] You are now level ${this.stats.level}!`);
    }

    gainSkillXP(skillName, amount) {
        this.stats[skillName] += amount * 0.01; // Slow skill progression
    }

    moveTo(x, y) {
        this.targetPosition = { x, y };
        this.attackTarget = null; // Stop attacking when moving
    }

    attackEntity(entity) {
        this.attackTarget = entity;
        this.targetPosition = null; // Stop moving when attacking

        // Reset timers so first attack happens immediately
        const now = Date.now();
        this.lastAttackTime = now - this.attackCooldown; // Ready to attack
        this.lastSpecialTime = now - this.specialCooldown; // Ready for special

        console.log(`[Target] Now attacking ${entity.type}`);
    }

    switchWeapon(weapon) {
        this.equipment.weapon = weapon;
        this.currentClass = weapon.class;
        console.log(`[Switch] Changed to ${this.currentClass}`);
    }
}
