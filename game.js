// game.js - Game state management and game over logic

AFRAME.registerComponent('game-manager', {
  schema: {
    isGameOver: { type: 'boolean', default: false },
    gameStarted: { type: 'boolean', default: false }
  },

  init() {
    this.healthText = document.getElementById('health-text');
    this.scoreText = document.getElementById('score-text');
    this.gameOverText = null;
    this.titleScreen = document.getElementById('title-screen');
    this.startButton = document.getElementById('start-button');
    
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
    
    // Listen for start button click
    if (this.startButton) {
      this.startButton.addEventListener('click', () => {
        this.startGame();
      });
    }
  },

  startGame() {
    this.data.gameStarted = true;
    
    // Hide title screen
    if (this.titleScreen) {
      this.titleScreen.classList.add('hidden');
    }
    
    // Emit game started event to notify spawner
    this.el.sceneEl.emit('game-started');
    
    console.log('Game Started!');
  },

  handleGameOver() {
    this.data.isGameOver = true;
    
    // Create game over UI
    this.showGameOverScreen();
    
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
    this.gameOverText.setAttribute('position', '0.2 1 -2');
    this.gameOverText.setAttribute('color', '#ff0000');
    this.gameOverText.setAttribute('width', '4');
    this.gameOverText.setAttribute('align', 'center');
    
    this.el.sceneEl.appendChild(this.gameOverText);
  },

  restartGame() {
    // Reset game state
    this.data.isGameOver = false;
    this.data.gameStarted = false;
    
    // Remove game over text
    if (this.gameOverText && this.gameOverText.parentNode) {
      this.gameOverText.parentNode.removeChild(this.gameOverText);
      this.gameOverText = null;
    }
    
    // Show title screen again
    if (this.titleScreen) {
      this.titleScreen.classList.remove('hidden');
    }
    
    // Release pointer lock so cursor is visible
    document.exitPointerLock();
    
    // Reset score
    const spawner = document.getElementById('enemy-spawner');
    if (spawner) {
      spawner.components['enemy-spawner'].score = 0;
      if (this.scoreText) {
        this.scoreText.setAttribute('value', 'Score: 0');
      }
    }
    
    // Reset player health
    const cameraRig = document.getElementById('camera-rig');
    if (cameraRig) {
      cameraRig.setAttribute('player-health', 'currentHealth', 100);
      cameraRig.components['player-health'].updateHealthUI();
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
