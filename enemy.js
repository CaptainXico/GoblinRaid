// enemy.js - Enemy spawning and AI behavior

AFRAME.registerComponent('enemy-spawner', {
  schema: {
    spawnRate: { type: 'number', default: 3000 }, // ms between spawns
    maxEnemies: { type: 'number', default: 10 },
    spawnDistance: { type: 'number', default: 20 },
    enemyHealth: { type: 'number', default: 50 },
    enemySpeed: { type: 'number', default: 2 },
    enemyDamage: { type: 'number', default: 10 }
  },

  init() {
    this.enemies = [];
    this.lastSpawn = 0;
    this.cameraRig = document.getElementById('camera-rig');
    this.scoreText = document.getElementById('score-text');
    this.score = 0;
    this.gameStarted = false;
    this.spawnInterval = null;
    
    // Listen for game start event
    this.el.sceneEl.addEventListener('game-started', () => {
      this.gameStarted = true;
      this.startSpawning();
    });
    
    // Listen for game over event
    this.el.sceneEl.addEventListener('game-over', () => {
      this.gameStarted = false;
      this.stopSpawning();
      this.clearEnemies();
    });
  },

  clearEnemies() {
    // Remove all existing enemies
    this.enemies.forEach(enemy => {
      if (enemy.parentNode) {
        enemy.parentNode.removeChild(enemy);
      }
    });
    this.enemies = [];
  },

  startSpawning() {
    if (this.spawnInterval) return;
    this.spawnInterval = setInterval(() => {
      this.spawnEnemy();
    }, this.data.spawnRate);
  },

  stopSpawning() {
    if (this.spawnInterval) {
      clearInterval(this.spawnInterval);
      this.spawnInterval = null;
    }
  },

  spawnEnemy() {
    if (!this.gameStarted) return;
    if (this.enemies.length >= this.data.maxEnemies) return;
    
    const enemy = document.createElement('a-entity');
    enemy.setAttribute('gltf-model', '#monster');
    enemy.setAttribute('scale', '1 1 1');
    enemy.setAttribute('class', 'enemy');
    enemy.setAttribute('enemy-ai', `speed: ${this.data.enemySpeed}; damage: ${this.data.enemyDamage}`);
    enemy.setAttribute('enemy-health', `maxHealth: ${this.data.enemyHealth}`);
    
    // Spawn at random position around player
    const spawnPos = this.getRandomSpawnPosition();
    enemy.setAttribute('position', spawnPos);
    
    this.el.sceneEl.appendChild(enemy);
    this.enemies.push(enemy);
    
    // Listen for enemy death
    enemy.addEventListener('enemy-died', () => {
      this.removeEnemy(enemy);
    });
  },

  getRandomSpawnPosition() {
    if (!this.cameraRig) return { x: 10, y: 0.5, z: -10 };
    
    const playerPos = this.cameraRig.getAttribute('position');
    const angle = Math.random() * Math.PI * 2;
    const distance = this.data.spawnDistance + Math.random() * 10;
    
    return {
      x: playerPos.x + Math.cos(angle) * distance,
      y: 0.5, // Ground level
      z: playerPos.z + Math.sin(angle) * distance
    };
  },

  removeEnemy(enemy) {
    const index = this.enemies.indexOf(enemy);
    if (index > -1) {
      this.enemies.splice(index, 1);
    }
    
    if (enemy.parentNode) {
      enemy.parentNode.removeChild(enemy);
    }
    
    // Increase score
    this.score += 10;
    if (this.scoreText) {
      this.scoreText.setAttribute('value', `Score: ${this.score}`);
    }
  }
});

// Enemy AI component - moves toward player
AFRAME.registerComponent('enemy-ai', {
  schema: {
    speed: { type: 'number', default: 2 },
    damage: { type: 'number', default: 10 },
    attackCooldown: { type: 'number', default: 1000 }
  },

  init() {
    this.cameraRig = document.getElementById('camera-rig');
    this.treasurePosition = { x: 0.16, y: 0, z: -2 }; // Treasure chest position
    this.lastAttack = 0;
    
    // Listen for hit events
    this.el.addEventListener('enemy-hit', (evt) => {
      // Handled by enemy-health component
    });
  },

  tick(time, delta) {
    const dt = delta / 1000;
    const enemyPos = this.el.getAttribute('position');
    
    // Calculate direction to treasure
    const direction = new THREE.Vector3(
      this.treasurePosition.x - enemyPos.x,
      0, // Keep on ground
      this.treasurePosition.z - enemyPos.z
    );
    
    const distance = direction.length();
    direction.normalize();
    
    // Move toward treasure
    if (distance > 1.5) {
      enemyPos.x += direction.x * this.data.speed * dt;
      enemyPos.z += direction.z * this.data.speed * dt;
      this.el.setAttribute('position', enemyPos);
    } else {
      // Attack treasure if close enough
      this.attackTreasure();
    }
    
    // Make enemy face treasure
    const angle = Math.atan2(direction.x, direction.z);
    this.el.setAttribute('rotation', { x: 0, y: THREE.MathUtils.radToDeg(angle), z: 0 });
  },

  attackTreasure() {
    const now = Date.now();
    if (now - this.lastAttack < this.data.attackCooldown) return;
    this.lastAttack = now;
    
    // Damage player (treasure defense)
    if (this.cameraRig) {
      this.cameraRig.emit('player-damaged', { damage: this.data.damage });
    }
  }
});

// Enemy health component
AFRAME.registerComponent('enemy-health', {
  schema: {
    maxHealth: { type: 'number', default: 50 },
    currentHealth: { type: 'number', default: 50 }
  },

  init() {
    // Listen for hit events from bullets
    this.el.addEventListener('enemy-hit', (evt) => {
      this.takeDamage(evt.detail.damage || 25);
    });
  },

  takeDamage(amount) {
    this.data.currentHealth -= amount;
    
    // Flash effect when hit - scale up briefly
    const originalScale = this.el.getAttribute('scale') || { x: 1, y: 1, z: 1 };
    this.el.setAttribute('scale', { x: 1.2, y: 1.2, z: 1.2 });
    setTimeout(() => {
      this.el.setAttribute('scale', originalScale);
    }, 100);
    
    if (this.data.currentHealth <= 0) {
      this.die();
    }
  },

  die() {
    // Emit death event for spawner to handle
    this.el.emit('enemy-died');
  }
});
