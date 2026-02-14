# Erodium

🎮 **Erodium** - A 2D MMORPG inspired by Rucoy Online

## Phase 1: Single-Player Prototype

This is the initial playable prototype featuring:
- ⚔️ **Three switchable classes**: Knight, Archer, Mage
- 🎯 **Tick-based combat** system (auto-attack + special)
- 👾 **Monster AI** with aggro and chase mechanics
- 📊 **Skill progression** (Melee, Distance, Magic, Defense)
- 🗺️ **Procedural tile-based world**
- 🎨 **Real-time UI** with HP/MP/XP bars

## Controls

- **Left Click**: Move or attack monster
- **1**: Switch to Knight (melee)
- **2**: Switch to Archer (range)
- **3**: Switch to Mage (magic)
- **D**: Toggle debug info

## Running the Game

```bash
npm install
npm run dev
```

Open your browser at `http://localhost:5173`

## Development Roadmap

- [x] **Phase 1**: Single-player prototype ✅
- [ ] **Phase 2**: Multiplayer (WebSocket)
- [ ] **Phase 3**: Accounts & Persistence (MongoDB)
- [ ] **Phase 4**: Equipment, Stamina, PvP
- [ ] **Phase 5**: Multiple zones, Guilds, Polish

## Tech Stack

- **Framework**: Vite + Vanilla JavaScript
- **Rendering**: HTML5 Canvas 2D
- **Future**: Socket.io (multiplayer), MongoDB (persistence)

---

Made with 💚 by the Erodium dev team
