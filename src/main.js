import './style.css';
import { Game } from './game/Game.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');

  if (!canvas) {
    console.error('Canvas not found!');
    return;
  }

  // Create and start game
  const game = new Game(canvas);
  game.start();

  console.log(`
  ╔═══════════════════════════════════╗
  ║        ERODIUM - MMORPG          ║
  ║         Phase 1: Prototype        ║
  ╚═══════════════════════════════════╝
  
  Controls:
  - Left Click: Move or Attack
  - [1] Switch to Knight
  - [2] Switch to Archer
  - [3] Switch to Mage
  - [D] Toggle Debug Info
  
  Have fun!
  `);
});
