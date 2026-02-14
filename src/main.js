import './style.css';
import { Game } from './game/Game.js';
import { Login } from './ui/Login.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');

  if (!canvas) {
    console.error('Canvas not found!');
    return;
  }

  // Create game instance (but don't start yet)
  const game = new Game(canvas);
  const login = new Login(game);

  // Check for existing session
  const token = localStorage.getItem('token');
  if (token) {
    // Verify token with backend
    fetch(import.meta.env.PROD ? '/api/auth/me' : 'http://localhost:3000/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.needsUsername) {
            login.showUsernameForm();
            login.show();
          } else {
            console.log('Auto-login successful');
            login.startGame({ ...data, token });
          }
        } else {
          console.log('Session expired');
          localStorage.removeItem('token');
          login.show();
        }
      })
      .catch(err => {
        console.error('Session check failed', err);
        login.show();
      });
  } else {
    login.show();
  }

  console.log(`
  ╔═══════════════════════════════════╗
  ║        ERODIUM - MMORPG          ║
  ║         Phase 1: Prototype        ║
  ╚═══════════════════════════════════╝
  `);
});
