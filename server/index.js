import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { PlayerModel } from './models/Player.js';
import { authRoutes } from './routes/auth.js';
import cors from 'cors';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));
app.use('/api/auth', authRoutes);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Database Connection
let isDbConnected = false;
if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            console.log('MongoDB Connected');
            isDbConnected = true;
        })
        .catch(err => console.log('MongoDB Connection Error:', err));
} else {
    console.log('No MONGO_URI found. Running in memory-only mode.');
}

app.use(express.static(path.join(__dirname, '../dist')));

// Game State
const players = {};
const monsters = {};
let monsterIdCounter = 0;

// Config for monsters
const MONSTER_TYPES = ['goblin', 'skeleton', 'orc'];
const MAX_MONSTERS = 20;

function createMonster() {
    const type = MONSTER_TYPES[Math.floor(Math.random() * MONSTER_TYPES.length)];
    const id = `monster_${monsterIdCounter++}`;

    const x = Math.random() * 1600;
    const y = Math.random() * 1600;

    let hp = 100;
    if (type === 'goblin') hp = 30;
    if (type === 'skeleton') hp = 50;
    if (type === 'orc') hp = 80;

    return {
        id, type, x, y, hp, maxHp: hp
    };
}

for (let i = 0; i < MAX_MONSTERS; i++) {
    const monster = createMonster();
    monsters[monster.id] = monster;
}

io.on('connection', async (socket) => {
    const userId = socket.handshake.query.userId || 'guest_' + socket.id;
    console.log(`Player connected: ${socket.id} (User: ${userId})`);

    let playerData = {
        x: 400, y: 400, class: 'knight',
        level: 1, hp: 100, maxHp: 100
    };

    // Load from DB if available
    if (isDbConnected) {
        try {
            let player = await PlayerModel.findOne({ username: userId });
            if (player) {
                playerData = {
                    x: player.x, y: player.y, class: player.class,
                    level: player.level, hp: player.hp, maxHp: player.maxHp
                    // Add more stats loading here
                };
                console.log(`Loaded player ${userId} from DB`);
            } else {
                // Create new (will be saved on disconnect)
                console.log(`New player ${userId}, will create in DB`);
            }
        } catch (err) {
            console.error('Error loading player:', err);
        }
    }

    // Create active player instance
    players[socket.id] = {
        id: socket.id,
        userId: userId, // Store persistent ID
        ...playerData
    };

    socket.emit('currentPlayers', players);
    socket.emit('currentMonsters', monsters);
    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('classChange', (classType) => {
        if (players[socket.id]) {
            players[socket.id].class = classType;
            io.emit('playerClassChanged', { id: socket.id, class: classType });
        }
    });

    socket.on('playerAttack', (attackData) => {
        const player = players[socket.id];
        const monster = monsters[attackData.monsterId];

        if (player && monster && monster.hp > 0) {
            let damage = 5;
            if (player.class === 'knight') damage = 12;
            if (player.class === 'archer') damage = 8;
            if (player.class === 'mage') damage = 15;

            monster.hp -= damage;

            io.emit('monsterDamaged', {
                monsterId: monster.id,
                damage: damage,
                attackerId: socket.id,
                newHp: monster.hp
            });

            if (monster.hp <= 0) {
                io.emit('monsterDied', {
                    monsterId: monster.id,
                    killerId: socket.id,
                    xpReward: 50
                });
                delete monsters[monster.id];

                setTimeout(() => {
                    const newMonster = createMonster();
                    monsters[newMonster.id] = newMonster;
                    io.emit('monsterSpawned', newMonster);
                }, 3000);
            }
        }
    });

    socket.on('disconnect', async () => {
        console.log(`Player disconnected: ${socket.id}`);

        // Save to DB
        if (isDbConnected && players[socket.id]) {
            const p = players[socket.id];
            try {
                await PlayerModel.findOneAndUpdate(
                    { username: p.userId },
                    {
                        x: p.x, y: p.y, class: p.class,
                        level: p.level, hp: p.hp, maxHp: p.maxHp,
                        lastLogin: Date.now()
                    },
                    { upsert: true, new: true }
                );
                console.log(`Saved player ${p.userId} to DB`);
            } catch (err) {
                console.error('Error saving player:', err);
            }
        }

        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
