AFRAME.registerComponent('plasma-anim', {
  schema: {
    colorScheme: {type: 'string', default: 'hot'},
    animatePosition: {type: 'boolean', default: true}
  },

  init: function() {
    // grab or create the canvas based on color scheme
    const canvasId = this.data.colorScheme === 'cold' ? 'plasma-canvas-tex-cold' : 'plasma-canvas-tex';
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.warn('Canvas not found:', canvasId);
      this.canvas = document.createElement('canvas');
      this.canvas.width = 256;
      this.canvas.height = 256;
    }
    this.ctx = this.canvas.getContext('2d');
    this.t = 0;
    console.log('plasma-anim initialized for:', this.el.id, 'canvas:', canvasId);
  },

  tick: function(time, delta) {
    this.t += delta * 0.001;
    const t = this.t;
    const w = 256, h = 256;
    const ctx = this.ctx;
    const img = ctx.createImageData(w, h);
    const d = img.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = x / w, py = y / h;
        let v = Math.sin(px * 10 + t);
        v += Math.sin(py * 8 + t * 1.2);
        v += Math.sin((px + py) * 7 + t * 0.8);
        const cx = px + 0.5 * Math.sin(t * 0.5);
        const cy = py + 0.5 * Math.cos(t * 0.4);
        v += Math.sin(Math.sqrt(cx*cx + cy*cy + 0.001) * 12 - t * 1.5);
        v = (v + 4) / 8;

        let r, g, b;
        if (this.data.colorScheme === 'cold') {
          // Blue tones for cold orb
          r = Math.floor(Math.abs(Math.sin(v * Math.PI)) * 50 + 20);
          g = Math.floor(Math.abs(Math.sin(v * Math.PI + 1.5)) * 100 + 50);
          b = Math.floor(Math.abs(Math.sin(v * Math.PI + 3)) * 205 + 50);
        } else {
          // Original hot colors
          r = Math.floor(Math.abs(Math.sin(v * Math.PI)) * 200 + 55);
          g = Math.floor(Math.abs(Math.sin(v * Math.PI + 2.1)) * 100);
          b = Math.floor(Math.abs(Math.sin(v * Math.PI + 4.2)) * 255);
        }
        const i = (y * w + x) * 4;
        d[i] = r; d[i+1] = g; d[i+2] = b; d[i+3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    // push updated canvas to Three.js texture
    const mat = this.el.components.material;
    if (mat && mat.material && mat.material.map) {
      mat.material.map.image = this.canvas;
      mat.material.map.needsUpdate = true;
    }

    // gentle float animation (only if enabled)
    if (this.data.animatePosition) {
      const pos = this.el.getAttribute('position');
      this.el.setAttribute('position', {
        x: pos.x,
        y: 2.8 + Math.sin(t * 0.9) * 0.15,
        z: pos.z
      });
      this.el.setAttribute('rotation', {
        x: Math.sin(t * 0.3) * 10,
        y: t * 30,
        z: Math.cos(t * 0.25) * 8
      });
    }
  }
});