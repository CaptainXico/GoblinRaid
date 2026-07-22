// game.js - Game state management and game over logic

AFRAME.registerComponent('game-manager', {
  schema: {
    isGameOver: { type: 'boolean', default: false }
  },

  init() {
    this.healthText = document.getElementById('health-text');
    this.scoreText = document.getElementById('score-text');
    this.gameOverText = null;
    
    // Listen for game over event
    this.el.sceneEl.addEventListener('game-over', () => {
      this.handleGameOver();
    });
    
    // Listen for restart
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyR' && this.data.isGameOver) {
        this.restartGame();
      }
    });
  },

  handleGameOver() {
    this.data.isGameOver = true;
    
    // Create game over UI
    this.showGameOverScreen();
    
    // Stop enemy spawning
    const spawner = document.getElementById('enemy-spawner');
    if (spawner) {
      spawner.setAttribute('enemy-spawner', 'spawnRate', 999999);
    }
    
    // Remove all enemies
    const enemies = document.querySelectorAll('.enemy');
    enemies.forEach(enemy => {
      if (enemy.parentNode) {
        enemy.parentNode.removeChild(enemy);
      }
    });
    
    console.log('Game Over!');
  },

  showGameOverScreen() {
    if (this.gameOverText) return;
    
    this.gameOverText = document.createElement('a-text');
    this.gameOverText.setAttribute('value', 'GAME OVER\nPress R to Restart');
    this.gameOverText.setAttribute('position', '0 0 -3');
    this.gameOverText.setAttribute('color', '#ff0000');
    this.gameOverText.setAttribute('width', '4');
    this.gameOverText.setAttribute('align', 'center');
    
    this.el.sceneEl.appendChild(this.gameOverText);
  },

  restartGame() {
    // Reset game state
    this.data.isGameOver = false;
    
    // Remove game over text
    if (this.gameOverText && this.gameOverText.parentNode) {
      this.gameOverText.parentNode.removeChild(this.gameOverText);
      this.gameOverText = null;
    }
    
    // Reset player health
    const cameraRig = document.getElementById('camera-rig');
    if (cameraRig) {
      cameraRig.setAttribute('player-health', 'currentHealth', 100);
    }
    
    // Reset score
    const spawner = document.getElementById('enemy-spawner');
    if (spawner) {
      // Reset spawner
      spawner.setAttribute('enemy-spawner', 'spawnRate', 3000);
      spawner.components['enemy-spawner'].score = 0;
      if (this.scoreText) {
        this.scoreText.setAttribute('value', 'Score: 0');
      }
    }
    
    // Reset player position
    if (cameraRig) {
      cameraRig.setAttribute('position', '0 0 0');
      cameraRig.setAttribute('rotation', '0 0 0');
    }
    
    console.log('Game Restarted!');
  }
});

// Initialize game manager on scene
window.addEventListener('load', () => {
  const scene = document.querySelector('a-scene');
  if (scene) {
    scene.setAttribute('game-manager', '');
  }
});
