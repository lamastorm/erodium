import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Should be hashed in production!
    class: { type: String, default: 'knight' },
    x: { type: Number, default: 400 },
    y: { type: Number, default: 400 },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    hp: { type: Number, default: 100 },
    maxHp: { type: Number, default: 100 },
    mp: { type: Number, default: 50 },
    maxMp: { type: Number, default: 50 },

    // Skills
    melee: { type: Number, default: 1 },
    distance: { type: Number, default: 1 },
    magic: { type: Number, default: 1 },
    defense: { type: Number, default: 1 },

    // Equipment (simplified for now)
    weapon: {
        type: { type: String, default: 'sword' },
        class: { type: String, default: 'knight' },
        damage: { type: Number, default: 5 }
    },

    lastLogin: { type: Date, default: Date.now }
});

export const PlayerModel = mongoose.model('Player', PlayerSchema);
