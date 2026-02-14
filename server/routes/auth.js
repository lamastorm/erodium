import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const router = express.Router();


// TODO: Move to .env
const CLIENT_ID = '715880740963-ucde4m53hrtct7dm04u3nlhr81a1l1au.apps.googleusercontent.com';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123'; // Change in prod!

const client = new OAuth2Client(CLIENT_ID);

// POST /api/auth/google
router.post('/google', async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const googleId = payload.sub;
        const email = payload.email;

        let user = await User.findOne({ googleId });

        if (!user) {
            // Create new user
            user = new User({
                googleId,
                email,
                // Username is null initially, trigger selection frontend
            });
            await user.save();
        }

        // Generate Session Token
        const sessionToken = jwt.sign(
            { userId: user._id, googleId: user.googleId },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token: sessionToken,
            username: user.username,
            needsUsername: !user.username
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ success: false, message: 'Invalid Token' });
    }
});

// POST /api/auth/username
router.post('/username', async (req, res) => {
    const { username, token } = req.body; // Or get token from header

    try {
        // Verify session token
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        // Check if username taken
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Username taken' });
        }

        // Update user
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.username = username;
        await user.save();

        res.json({ success: true, username: user.username });

    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid Session' });
    }
});

// GET /api/auth/me (Verify session on load)
router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            success: true,
            username: user.username,
            needsUsername: !user.username
            // Send game data?
        });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

export const authRoutes = router;
