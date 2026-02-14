import io from 'socket.io-client';

export class Network {
    constructor(game) {
        this.game = game;

        // Get or create persistent ID
        let userId = localStorage.getItem('erodium_user_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('erodium_user_id', userId);
        }
        this.userId = userId;

        // Use relative path in production (deployed), localhost:3000 in dev
        const serverUrl = import.meta.env.PROD
            ? undefined // Connect to same origin
            : 'http://localhost:3000';

        this.socket = io(serverUrl, {
            query: { userId: this.userId }
        });

        this.connected = false;

        this.setupListeners();
    }

    setupListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to server with ID:', this.userId);
            this.connected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.connected = false;
        });

        // Players
        this.socket.on('currentPlayers', (players) => {
            Object.keys(players).forEach((id) => {
                if (id !== this.socket.id) {
                    this.game.addRemotePlayer(players[id]);
                } else {
                    // Update local player ID
                    this.game.player.id = id;
                    // Also sync local player position if server has saved position
                    if (players[id].x && players[id].y) {
                        this.game.player.x = players[id].x;
                        this.game.player.y = players[id].y;
                    }
                }
            });
        });

        this.socket.on('newPlayer', (playerInfo) => {
            this.game.addRemotePlayer(playerInfo);
        });

        this.socket.on('playerMoved', (playerInfo) => {
            this.game.updateRemotePlayer(playerInfo.id, playerInfo.x, playerInfo.y);
        });

        this.socket.on('playerDisconnected', (playerId) => {
            this.game.removeRemotePlayer(playerId);
        });

        this.socket.on('playerClassChanged', (data) => {
            this.game.updateRemotePlayerClass(data.id, data.class);
        });

        // Monsters & Combat
        this.socket.on('currentMonsters', (monsters) => {
            this.game.spawner.syncMonsters(monsters);
        });

        this.socket.on('monsterSpawned', (monsterData) => {
            this.game.spawner.spawnRemoteMonster(monsterData);
        });

        this.socket.on('monsterDamaged', (data) => {
            this.game.spawner.damageMonster(data.monsterId, data.damage, data.attackerId, data.newHp);
        });

        this.socket.on('monsterDied', (data) => {
            this.game.spawner.killMonster(data.monsterId);

            // If local player killed it, show XP
            if (data.killerId === this.socket.id) {
                this.game.player.gainXP(data.xpReward);
            }
        });
    }

    sendMovement(x, y) {
        this.socket.emit('playerMovement', { x, y });
    }

    sendClassChange(newClass) {
        this.socket.emit('classChange', newClass);
    }

    sendAttack(monsterId) {
        this.socket.emit('playerAttack', { monsterId });
    }
}
