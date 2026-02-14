import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    username: { type: String, unique: true, sparse: true }, // sparse allows null/undefined to not conflict
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },

    // Game Data
    character: {
        class: { type: String, default: 'knight' },
        stats: {
            level: { type: Number, default: 1 },
            xp: { type: Number, default: 0 },
            hp: { type: Number, default: 100 },
            maxHp: { type: Number, default: 100 },
            mp: { type: Number, default: 50 },
            maxMp: { type: Number, default: 50 },
            melee: { type: Number, default: 1 },
            distance: { type: Number, default: 1 },
            magic: { type: Number, default: 1 },
            defense: { type: Number, default: 1 }
        },
        position: {
            x: { type: Number, default: 400 },
            y: { type: Number, default: 400 },
            map: { type: String, default: 'default' }
        },
        inventory: [] // TODO: Define inventory schema later
    }
});

export const User = mongoose.model('User', UserSchema);
