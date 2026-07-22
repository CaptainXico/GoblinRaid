// gun.js - Gun component for shooting sphere projectiles

AFRAME.registerComponent('gun-component', {
  schema: {
    bulletSpeed: { type: 'number', default: 20 },
    fireRate: { type: 'number', default: 200 }, // ms between shots
    bulletSize: { type: 'number', default: 0.1 },
    bulletColor: { type: 'color', default: '#ff0000' }
  },

  init() {
    this.camera = document.getElementById('camera');
    this.lastShot = 0;
    this.bullets = [];
    
    // Create gun visual
    this.createGunModel();
    
    // Desktop: Mouse click to shoot
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left click
        this.shoot();
      }
    });
    
    // VR: Trigger button to shoot
    this.el.sceneEl.addEventListener('triggerdown', (evt) => {
      this.shoot();
    });
  },

  createGunModel() {
    // Load GLB 3D model
    const gunModel = document.createElement('a-entity');
    gunModel.setAttribute('gltf-model', 'url(gun.glb)');
    gunModel.setAttribute('position', '0 0 0');
    gunModel.setAttribute('rotation', '0 180 0');
    gunModel.setAttribute('scale', '0.1 0.1 0.1');
    this.el.appendChild(gunModel);
  },

  shoot() {
    const now = Date.now();
    if (now - this.lastShot < this.data.fireRate) return;
    this.lastShot = now;
    
    this.createBullet();
  },

  createBullet() {
    const bullet = document.createElement('a-sphere');
    bullet.setAttribute('radius', this.data.bulletSize);
    bullet.setAttribute('segments-width', '48');
    bullet.setAttribute('segments-height', '48');
    bullet.setAttribute('class', 'bullet');
    bullet.setAttribute('bullet', `speed: ${this.data.bulletSpeed}`);
    
    // Get camera direction
    const cameraRotation = this.camera.getAttribute('rotation');
    const cameraPosition = this.camera.getAttribute('position');
    
    // Calculate bullet spawn position (slightly in front of gun)
    const direction = new THREE.Vector3(0, 0, -1);
    const euler = new THREE.Euler(
      THREE.MathUtils.degToRad(cameraRotation.x),
      THREE.MathUtils.degToRad(cameraRotation.y),
      THREE.MathUtils.degToRad(cameraRotation.z),
      'YXZ'
    );
    direction.applyEuler(euler);
    
    const spawnPos = new THREE.Vector3(
      cameraPosition.x + direction.x * 0.5,
      cameraPosition.y + direction.y * 0.5,
      cameraPosition.z + direction.z * 0.5
    );
    
    bullet.setAttribute('position', spawnPos);
    bullet.setAttribute('rotation', cameraRotation);
    
    // Store direction in bullet component
    bullet.setAttribute('bullet', `speed: ${this.data.bulletSpeed}; direction: ${direction.x},${direction.y},${direction.z}`);
    
    this.el.sceneEl.appendChild(bullet);
    this.bullets.push(bullet);
    
    // Apply plasma material after entity is in scene
    bullet.setAttribute('material', 'shader:flat; src:#plasma-canvas-tex; repeat:1 1');
    
    // Remove bullet after 3 seconds
    setTimeout(() => {
      if (bullet.parentNode) {
        bullet.parentNode.removeChild(bullet);
        const index = this.bullets.indexOf(bullet);
        if (index > -1) this.bullets.splice(index, 1);
      }
    }, 3000);
  }
});

// Bullet component for projectile movement and collision
AFRAME.registerComponent('bullet', {
  schema: {
    speed: { type: 'number', default: 20 },
    direction: { type: 'string', default: '0,0,-1' }
  },

  init() {
    this.direction = new THREE.Vector3();
    this.parseDirection();
    
    // Add collision detection
    this.el.addEventListener('collide', (evt) => {
      this.handleCollision(evt);
    });
  },

  parseDirection() {
    const parts = this.data.direction.split(',').map(parseFloat);
    if (parts.length === 3) {
      this.direction.set(parts[0], parts[1], parts[2]);
    } else {
      this.direction.set(0, 0, -1);
    }
  },

  tick(time, delta) {
    const dt = delta / 1000;
    const pos = this.el.getAttribute('position');
    
    pos.x += this.direction.x * this.data.speed * dt;
    pos.y += this.direction.y * this.data.speed * dt;
    pos.z += this.direction.z * this.data.speed * dt;
    
    this.el.setAttribute('position', pos);
    
    // Check for enemy collisions manually
    this.checkEnemyCollisions();
    
    // Remove if too far
    if (Math.abs(pos.x) > 100 || Math.abs(pos.y) > 100 || Math.abs(pos.z) > 100) {
      this.removeBullet();
    }
  },

  checkEnemyCollisions() {
    const enemies = document.querySelectorAll('.enemy');
    const bulletPos = this.el.getAttribute('position');
    const bulletRadius = parseFloat(this.el.getAttribute('radius')) || 0.1;
    
    enemies.forEach(enemy => {
      const enemyPos = enemy.getAttribute('position');
      const enemyRadius = parseFloat(enemy.getAttribute('radius')) || 0.5;
      
      const distance = Math.sqrt(
        Math.pow(bulletPos.x - enemyPos.x, 2) +
        Math.pow(bulletPos.y - enemyPos.y, 2) +
        Math.pow(bulletPos.z - enemyPos.z, 2)
      );
      
      const threshold = bulletRadius + enemyRadius + 0.5;
      
      if (distance < threshold) {
        // Hit enemy
        enemy.emit('enemy-hit', { damage: 25 });
        this.removeBullet();
      }
    });
  },

  handleCollision(evt) {
    this.removeBullet();
  },

  removeBullet() {
    if (this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
  }
});
