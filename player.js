// player.js - Player health and entity management

AFRAME.registerComponent('player-health', {
  schema: {
    maxHealth: { type: 'number', default: 100 },
    currentHealth: { type: 'number', default: 100 }
  },

  init() {
    this.healthText = document.getElementById('health-text');
    this.updateHealthUI();
    
    // Listen for damage events
    this.el.addEventListener('player-damaged', (evt) => {
      this.takeDamage(evt.detail.damage);
    });
  },

  takeDamage(amount) {
    this.data.currentHealth = Math.max(0, this.data.currentHealth - amount);
    this.updateHealthUI();
    
    if (this.data.currentHealth <= 0) {
      this.die();
    }
  },

  heal(amount) {
    this.data.currentHealth = Math.min(this.data.maxHealth, this.data.currentHealth + amount);
    this.updateHealthUI();
  },

  updateHealthUI() {
    if (this.healthText) {
      this.healthText.setAttribute('value', `Health: ${this.data.currentHealth}`);
      
      // Change color based on health
      if (this.data.currentHealth > 60) {
        this.healthText.setAttribute('color', '#00ff00');
      } else if (this.data.currentHealth > 30) {
        this.healthText.setAttribute('color', '#ffff00');
      } else {
        this.healthText.setAttribute('color', '#ff0000');
      }
    }
  },

  die() {
    console.log('Player died!');
    // Emit game over event
    this.el.sceneEl.emit('game-over');
  }
});
