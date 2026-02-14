import { Monster } from '../entities/Monster.js';

export class Spawner {
    constructor(map) {
        this.map = map;
        this.monsters = [];
    }

    update(dt, game) {
        // Client-side prediction or interpolation could go here
        // For now, we trust the server completely

        this.monsters.forEach(monster => monster.update(dt, game));
    }

    syncMonsters(serverMonsters) {
        this.monsters = [];
        Object.values(serverMonsters).forEach(m => {
            this.spawnRemoteMonster(m);
        });
        console.log(`[Network] Synced ${this.monsters.length} monsters`);
    }

    spawnRemoteMonster(data) {
        const monster = new Monster(data.x, data.y, data.type);
        monster.id = data.id;
        monster.hp = data.hp;
        monster.maxHp = data.maxHp;
        this.monsters.push(monster);
    }

    damageMonster(id, damage, attackerId, newHp) {
        const monster = this.monsters.find(m => m.id === id);
        if (monster) {
            monster.takeDamageInternal(damage, newHp);
            // Show damage number (visual effect)
            // TODO: Add floating text
        }
    }

    killMonster(id) {
        const index = this.monsters.findIndex(m => m.id === id);
        if (index !== -1) {
            const monster = this.monsters[index];
            monster.die();
            this.monsters.splice(index, 1);
        }
    }

    render(ctx, camera) {
        this.monsters.forEach(monster => monster.render(ctx, camera));
    }

    getMonsterAt(x, y) {
        return this.monsters.find(m => {
            return m.isAlive &&
                x >= m.x && x <= m.x + m.width &&
                y >= m.y && y <= m.y + m.height;
        });
    }
}
