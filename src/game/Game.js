import { Player } from '../entities/Player.js';
import { Camera } from './Camera.js';
import { Map } from '../world/Map.js';
import { Spawner } from '../world/Spawner.js';
import { UI } from '../ui/UI.js';
import { Network } from './Network.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = 1024;
        this.canvas.height = 768;

        // Game state
        this.running = false;
        this.lastTime = 0;
        this.fps = 60;
        this.frameTime = 1000 / this.fps;

        // Create world
        this.map = new Map(50, 50); // 50x50 tiles

        // Create player
        this.player = new Player(400, 400);
        this.remotePlayers = {}; // Store other players

        // Create camera
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        this.camera.setTarget(this.player);

        // Create spawner
        this.spawner = new Spawner(this.map);

        // Create UI
        this.ui = new UI();

        // Network
        this.network = new Network(this);

        // Input handling
        this.setupInput();

        // Debug info
        this.showDebug = true;
    }

    addRemotePlayer(playerInfo) {
        const remotePlayer = new Player(playerInfo.x, playerInfo.y);
        remotePlayer.currentClass = playerInfo.class;
        // Set remote player specific properties if needed (e.g. name, color tint)
        this.remotePlayers[playerInfo.id] = remotePlayer;
        console.log(`[Network] Player joined: ${playerInfo.id}`);
    }

    updateRemotePlayer(id, x, y) {
        if (this.remotePlayers[id]) {
            this.remotePlayers[id].moveTo(x, y);
        }
    }

    removeRemotePlayer(id) {
        if (this.remotePlayers[id]) {
            delete this.remotePlayers[id];
            console.log(`[Network] Player left: ${id}`);
        }
    }

    updateRemotePlayerClass(id, newClass) {
        if (this.remotePlayers[id]) {
            this.remotePlayers[id].currentClass = newClass;
            // You might want to update appearance/weapon here too if Player class handles it
        }
    }

    setupInput() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            // Convert to world coordinates
            const worldPos = this.camera.screenToWorld(clickX, clickY);

            // Check if clicked on a monster
            const monster = this.spawner.getMonsterAt(worldPos.x, worldPos.y);

            if (monster) {
                this.player.attackEntity(monster);
                console.log(`[Click] Attacking ${monster.type}`);
            } else {
                this.player.moveTo(worldPos.x, worldPos.y);
                this.network.sendMovement(worldPos.x, worldPos.y); // Send target position
                console.log(`[Click] Moving to (${Math.floor(worldPos.x)}, ${Math.floor(worldPos.y)})`);
            }
        });

        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            switch (e.key) {
                case '1':
                    this.player.switchWeapon({ type: 'sword', class: 'knight', damage: 5 });
                    this.network.sendClassChange('knight');
                    break;
                case '2':
                    this.player.switchWeapon({ type: 'bow', class: 'archer', damage: 4 });
                    this.network.sendClassChange('archer');
                    break;
                case '3':
                    this.player.switchWeapon({ type: 'wand', class: 'mage', damage: 6 });
                    this.network.sendClassChange('mage');
                    break;
                case 'i':
                case 'I':
                    // Toggle inventory (future feature)
                    break;
                case 'd':
                case 'D':
                    this.showDebug = !this.showDebug;
                    break;
            }
        });
    }

    start() {
        this.running = true;
        requestAnimationFrame((time) => this.gameLoop(time));
        console.log('[Game] Started!');
    }

    gameLoop(currentTime) {
        if (!this.running) return;

        const deltaTime = currentTime - this.lastTime;

        if (deltaTime >= this.frameTime) {
            this.update(deltaTime);
            this.render();
            this.lastTime = currentTime;
        }

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(dt) {
        // Update local player
        this.player.update(dt, this);

        // Throttle network updates for continuous movement if needed
        // But since we send target position on click, that's efficient enough for now.
        // However, if we want smoother interpolation or anti-cheat, we'd send periodic updates.
        // For this prototype, sending target on click is fine.

        // Update remote players
        Object.values(this.remotePlayers).forEach(p => p.update(dt, this));

        // Update camera
        this.camera.update();

        // Update spawner (and all monsters)
        this.spawner.update(dt, this);

        // Update UI
        this.ui.update(this.player);

        // Regenerate MP slowly
        if (this.player.stats.mp < this.player.stats.maxMp) {
            this.player.stats.mp = Math.min(
                this.player.stats.maxMp,
                this.player.stats.mp + 0.1
            );
        }
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render map
        this.map.render(this.ctx, this.camera);

        // Render monsters
        this.spawner.render(this.ctx, this.camera);

        // Render remote players
        Object.values(this.remotePlayers).forEach(p => p.render(this.ctx, this.camera));

        // Render local player
        this.player.render(this.ctx, this.camera);

        // Render debug info
        if (this.showDebug) {
            this.renderDebug();
        }
    }

    renderDebug() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, this.canvas.height - 100, 250, 90);

        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';

        const debugText = [
            `Position: (${Math.floor(this.player.x)}, ${Math.floor(this.player.y)})`,
            `Class: ${this.player.currentClass}`,
            `Remote Players: ${Object.keys(this.remotePlayers).length}`,
            `Monsters: ${this.spawner.monsters.length}`,
            `Target: ${this.player.attackTarget ? this.player.attackTarget.type : 'none'}`,
            `[1/2/3] Switch class | [D] Toggle debug`
        ];

        debugText.forEach((text, i) => {
            this.ctx.fillText(text, 20, this.canvas.height - 80 + i * 14);
        });
    }

    stop() {
        this.running = false;
    }
}
