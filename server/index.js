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

import jwt from 'jsonwebtoken';
import { User } from './models/User.js';

// TODO: move to .env
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

// Socket Middleware for Auth
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.user = await User.findById(decoded.userId);
            if (socket.user) {
                console.log(`Authenticated user: ${socket.user.username}`);
                return next();
            }
        } catch (err) {
            console.log('Socket Auth Failed:', err.message);
        }
    }
    // Allow guest connection, or reject?
    // For now, allow guests but they won't save
    socket.isGuest = true;
    next();
});

io.on('connection', async (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    let playerData = {
        x: 400, y: 400, class: 'knight',
        level: 1, hp: 100, maxHp: 100
    };

    // Load from User Model if authenticated
    if (socket.user && socket.user.character) {
        const char = socket.user.character;
        playerData = {
            x: char.position.x,
            y: char.position.y,
            class: char.class,
            level: char.stats.level,
            hp: char.stats.hp, // Should load current HP or reset to max?
            maxHp: char.stats.maxHp,
            // Allow override if corrupted
        };
        console.log(`Loaded character for ${socket.user.username}`);
    }
    // Legacy support for guests (optional)
    else {
        const userId = socket.handshake.query.userId || 'guest_' + socket.id;
        // ... (Guest logic, maybe skip saving for now)
    }

    // Create active player instance
    // Use user.username as public ID if auth, else socket.id or guest_id
    const publicId = socket.user ? socket.user.username : ('Guest_' + socket.id.substr(0, 4));

    players[socket.id] = {
        id: socket.id, // Socket ID is still used for routing
        userId: publicId, // Display Name
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
            // TODO: Use stats
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
                // XP Logic
                if (socket.user) {
                    // Update server-side User state
                    // We need to fetch and save, or keep a live reference?
                    // Better to update memory then save on disconnect
                    // For now, just rely on client optimism? NO.
                    // Server needs to track XP.
                    // Simplified: Just update `players[socket.id]` and save on disconnect.
                }

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

        // Save to User Model
        if (socket.user && players[socket.id]) {
            const p = players[socket.id];
            try {
                // Update specific fields
                // This replaces the entire character object or use $set
                await User.findByIdAndUpdate(socket.user._id, {
                    $set: {
                        'character.position.x': p.x,
                        'character.position.y': p.y,
                        'character.class': p.class,
                        'character.stats.hp': p.hp,
                        // Add XP/Level here if tracked
                        lastLogin: Date.now()
                    }
                });
                console.log(`Saved character for ${socket.user.username}`);
            } catch (err) {
                console.error('Error saving user:', err);
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
