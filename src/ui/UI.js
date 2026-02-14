// UI Manager for displaying stats, skills, etc.
export class UI {
  constructor() {
    this.statsBar = document.getElementById('statsBar');
    this.skillsBar = document.getElementById('skillsBar');
    this.inventory = document.getElementById('inventory');
  }

  update(player) {
    this.updateStats(player);
    this.updateSkills(player);
  }

  updateStats(player) {
    const { level, hp, maxHp, mp, maxMp, xp, xpToNextLevel } = player.stats;

    this.statsBar.innerHTML = `
      <div style="margin-bottom: 10px;">
        <strong>Level ${level}</strong> - ${player.currentClass.toUpperCase()}
      </div>
      
      <div class="bar">
        <div class="bar-fill hp" style="width: ${(hp / maxHp) * 100}%"></div>
        <div class="bar-text">HP: ${Math.floor(hp)}/${maxHp}</div>
      </div>
      
      <div class="bar">
        <div class="bar-fill mp" style="width: ${(mp / maxMp) * 100}%"></div>
        <div class="bar-text">MP: ${Math.floor(mp)}/${maxMp}</div>
      </div>
      
      <div class="bar">
        <div class="bar-fill xp" style="width: ${(xp / xpToNextLevel) * 100}%"></div>
        <div class="bar-text">XP: ${Math.floor(xp)}/${xpToNextLevel}</div>
      </div>
    `;
  }

  updateSkills(player) {
    const { melee, distance, magic, defense } = player.stats;

    this.skillsBar.innerHTML = `
      <div style="margin-bottom: 5px;"><strong>Skills</strong></div>
      
      <div class="skill-item">
        <span class="skill-name">⚔️ Melee</span>
        <span class="skill-value">${Math.floor(melee)}</span>
      </div>
      
      <div class="skill-item">
        <span class="skill-name">🏹 Distance</span>
        <span class="skill-value">${Math.floor(distance)}</span>
      </div>
      
      <div class="skill-item">
        <span class="skill-name">🔮 Magic</span>
        <span class="skill-value">${Math.floor(magic)}</span>
      </div>
      
      <div class="skill-item" style="border-bottom: none;">
        <span class="skill-name">🛡️ Defense</span>
        <span class="skill-value">${Math.floor(defense)}</span>
      </div>
    `;

    // Network Status (Overlay on canvas logic should be in Game.render, but we can cheat and put a div here if we want, 
    // OR we can just rely on the canvas rendering that I'll add to Game.js instead of UI.js DOM manipulation)

    // Actually, UI.js manipulates DOM. Drawing on canvas happens in Game.js. 
    // Let's add a DOM indicator.
    let statusDiv = document.getElementById('networkStatus');
    if (!statusDiv) {
      statusDiv = document.createElement('div');
      statusDiv.id = 'networkStatus';
      statusDiv.style.position = 'absolute';
      statusDiv.style.top = '10px';
      statusDiv.style.right = '10px';
      statusDiv.style.padding = '5px 10px';
      statusDiv.style.borderRadius = '5px';
      statusDiv.style.color = 'white';
      statusDiv.style.fontSize = '12px';
      statusDiv.style.fontFamily = 'Arial';
      document.body.appendChild(statusDiv);
    }

    const isConnected = this.game.network && this.game.network.connected;
    statusDiv.style.backgroundColor = isConnected ? 'rgba(0, 200, 0, 0.5)' : 'rgba(200, 0, 0, 0.5)';
    statusDiv.innerHTML = isConnected ? '🟢 Online' : '🔴 Offline';
  }

  showInventory() {
    this.inventory.style.display = 'block';
  }

  hideInventory() {
    this.inventory.style.display = 'none';
  }
}
