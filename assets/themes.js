// Theme renderers for the RRT canvas.
// Each theme owns: drawBg, drawPlanet, drawRocket, plus visual params.
window.RRT_THEMES = {
  // ============================================================
  // VAPORWAVE TUI — moody synthwave terminal, Stranger Things palette
  // ============================================================
  vapor: {
    name: 'vapor',
    cfg: { skyZone: 0.70 },
    treeColor: 'rgba(120, 90, 180, 0.32)',
    treeWidth: 1,
    pathColor: '#ff2d95',
    pathWidth: 2,
    _gridOffset: 0,
    drawBg(ctx, canvas) {
      const W = canvas.width, H = canvas.height;
      const hor = H * (window.RRT ? RRT.cfg.skyZone : this.cfg.skyZone);

      // ── Sky gradient ─────────────────────────────────────────
      const sky = ctx.createLinearGradient(0, 0, 0, hor);
      sky.addColorStop(0,   '#050018');
      sky.addColorStop(0.6, '#18003a');
      sky.addColorStop(1,   'rgba(255, 45, 149, 0.4)');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, hor);

      // ── Floor background ─────────────────────────────────────
      const floor = ctx.createLinearGradient(0, hor, 0, H);
      floor.addColorStop(0, '#220055');
      floor.addColorStop(1, '#0a0414');
      ctx.fillStyle = floor;
      ctx.fillRect(0, hor, W, H - hor);

      // ── Sun glow ─────────────────────────────────────────────
      const sunR = Math.min(W, H) * 0.13;
      const sunX = W / 2;
      const sunY = hor + sunR * 0.15;
      const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 2.2);
      glow.addColorStop(0,   'rgba(255, 200, 0, 0.35)');
      glow.addColorStop(0.4, 'rgba(255, 45, 149, 0.2)');
      glow.addColorStop(1,   'rgba(255, 45, 149, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // ── Retrowave sun (arc strips with transparent gaps) ─────
      const stripColors = ['#ffee00', '#ffcc00', '#ff9900', '#ff6600', '#ff3d44', '#ff2d80', '#ff2d95'];
      const numStrips = stripColors.length;
      const totalBands = numStrips * 2 - 1; // alternating color/gap = 13
      ctx.save();
      // Clip to upper half of circle so we don't draw below horizon
      ctx.beginPath();
      ctx.rect(sunX - sunR, sunY - sunR, sunR * 2, sunR);
      ctx.clip();
      for (let i = 0; i < totalBands; i++) {
        if (i % 2 === 1) continue; // skip gap bands
        const stripIdx = i / 2;
        const y0 = sunY - sunR + (i / totalBands) * sunR;
        const y1 = sunY - sunR + ((i + 1) / totalBands) * sunR;
        const hw0 = Math.sqrt(Math.max(0, sunR * sunR - (sunY - y0) * (sunY - y0)));
        const hw1 = Math.sqrt(Math.max(0, sunR * sunR - (sunY - y1) * (sunY - y1)));
        ctx.beginPath();
        ctx.moveTo(sunX - hw0, y0);
        ctx.lineTo(sunX + hw0, y0);
        ctx.lineTo(sunX + hw1, y1);
        ctx.lineTo(sunX - hw1, y1);
        ctx.closePath();
        ctx.fillStyle = stripColors[stripIdx];
        ctx.fill();
      }
      ctx.restore();

      // ── Grid floor ───────────────────────────────────────────
      this._gridOffset += 0.003;

      const vp = { x: W / 2, y: hor }; // vanishing point
      const numVLines = 15;
      const numHLines = 7;

      ctx.save();
      ctx.globalAlpha = 0.65;

      // Vertical lines
      for (let i = 0; i <= numVLines; i++) {
        const t = i / numVLines; // 0..1
        const bx = W * t;       // spread at bottom
        const vLineGrad = ctx.createLinearGradient(vp.x, vp.y, bx, H);
        vLineGrad.addColorStop(0, 'rgba(255, 45, 149, 0.2)');
        vLineGrad.addColorStop(0.3, 'rgba(255, 45, 149, 0.5)');
        vLineGrad.addColorStop(1, 'rgba(0, 240, 255, 0.7)');
        ctx.strokeStyle = vLineGrad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(vp.x, vp.y);
        ctx.lineTo(bx, H);
        ctx.stroke();
      }

      // Horizontal lines with perspective squish + scroll animation
      const offset = this._gridOffset % 1;
      for (let r = 0; r < numHLines; r++) {
        const frac = (r + offset) / numHLines;
        const y = hor + (H - hor) * frac * frac;
        if (y < hor || y > H) continue;
        // Interpolate color from magenta (near horizon) to cyan (near bottom)
        const mix = frac;
        const hLineGrad = ctx.createLinearGradient(0, y, W, y);
        hLineGrad.addColorStop(0,   'rgba(0, 240, 255, 0)');
        hLineGrad.addColorStop(0.15, `rgba(${Math.round(255*(1-mix))}, ${Math.round(45*mix + 240*(1-mix))}, ${Math.round(149*(1-mix) + 255*mix)}, 0.60)`);
        hLineGrad.addColorStop(0.85, `rgba(${Math.round(255*(1-mix))}, ${Math.round(45*mix + 240*(1-mix))}, ${Math.round(149*(1-mix) + 255*mix)}, 0.60)`);
        hLineGrad.addColorStop(1,   'rgba(0, 240, 255, 0)');
        ctx.strokeStyle = hLineGrad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      ctx.restore();

      // ── Palm tree silhouettes ─────────────────────────────────
      const drawPalm = (x, baseY, lean, color, glowColor) => {
        const trunkH = H * 0.22;
        const tipX = x + lean * trunkH * 0.6;
        const tipY = baseY - trunkH;
        ctx.save();
        ctx.shadowBlur = 14;
        ctx.shadowColor = glowColor;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        // Curved trunk
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.quadraticCurveTo(x + lean * trunkH * 0.3, baseY - trunkH * 0.55, tipX, tipY);
        ctx.stroke();
        // Fronds
        const numFronds = 6;
        for (let f = 0; f < numFronds; f++) {
          const angle = (f / numFronds) * Math.PI - Math.PI * 0.1 + (lean > 0 ? 0.15 : -0.15);
          const fLen = trunkH * 0.45;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(tipX, tipY);
          ctx.quadraticCurveTo(
            tipX + Math.cos(angle) * fLen * 0.55,
            tipY + Math.sin(angle) * fLen * 0.55 - fLen * 0.15,
            tipX + Math.cos(angle) * fLen,
            tipY + Math.sin(angle) * fLen
          );
          ctx.stroke();
        }
        ctx.restore();
      };

      // Left palm — magenta
      drawPalm(W * 0.04, H, 0.45, '#ff2d95', 'rgba(255,45,149,0.6)');
      // Right palm — cyan (leaning left)
      drawPalm(W * 0.96, H, -0.45, '#00f0ff', 'rgba(0,240,255,0.6)');
      // Second right palm, slightly inset — magenta tint
      drawPalm(W * 0.88, H * 0.97, -0.3, 'rgba(255,45,149,0.55)', 'rgba(255,45,149,0.3)');
    },
    drawPlanet(ctx, pos, phi) {
      const tip = 18;   // center-to-tip of diamond
      const box = 28;   // half-size of corner-bracket bounding box
      const bLen = 8;   // bracket arm length

      // Outer glow
      const grd = ctx.createRadialGradient(pos.x, pos.y, 2, pos.x, pos.y, box * 1.8);
      grd.addColorStop(0,   'rgba(0, 240, 255, 0.4)');
      grd.addColorStop(0.5, 'rgba(255, 45, 149, 0.15)');
      grd.addColorStop(1,   'rgba(255, 45, 149, 0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(pos.x, pos.y, box * 1.8, 0, Math.PI * 2); ctx.fill();

      ctx.save();
      ctx.translate(pos.x, pos.y);

      // Diamond shape
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00f0ff';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -tip);
      ctx.lineTo(tip, 0);
      ctx.lineTo(0, tip);
      ctx.lineTo(-tip, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Corner brackets (subtle phi-driven rotation)
      ctx.save();
      ctx.rotate(phi * 0.25);
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#00f0ff';
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.75)';
      ctx.lineWidth = 1.2;
      const corners = [
        [-box, -box, 1, 1],
        [ box, -box,-1, 1],
        [ box,  box,-1,-1],
        [-box,  box, 1,-1],
      ];
      for (const [cx, cy, sx, sy] of corners) {
        ctx.beginPath();
        ctx.moveTo(cx + sx * bLen, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + sy * bLen);
        ctx.stroke();
      }
      ctx.restore();

      // Center dot — magenta
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ff2d95';
      ctx.fillStyle = '#ff2d95';
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      ctx.restore();
    },
    drawRocket(ctx, pos) {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(pos.yaw + Math.PI * 0.5);
      // Glow
      const grd = ctx.createRadialGradient(0, 0, 1, 0, 0, 22);
      grd.addColorStop(0, 'rgba(255, 45, 149, 0.5)');
      grd.addColorStop(1, 'rgba(255, 45, 149, 0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
      // Triangular rocket — clean wireframe
      ctx.strokeStyle = '#ff2d95';
      ctx.fillStyle = 'rgba(255, 45, 149, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(6, 8);
      ctx.lineTo(0, 5);
      ctx.lineTo(-6, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Cyan trail dot
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath(); ctx.arc(0, 9, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },
  },

  // ============================================================
  // MISSION CONTROL — JPL operator console, deep amber
  // ============================================================
  mission: {
    name: 'mission',
    treeColor: 'rgba(180, 140, 80, 0.28)',
    treeWidth: 1,
    pathColor: '#ffb648',
    pathWidth: 1.6,
    drawBg(ctx, canvas) {
      // Faint grid
      ctx.strokeStyle = 'rgba(180, 140, 80, 0.06)';
      ctx.lineWidth = 1;
      const step = 60;
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += step) {
        ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();
    },
    drawPlanet(ctx, pos, phi) {
      const r = 14;
      // Reticle ring
      ctx.strokeStyle = '#ffb648';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2); ctx.stroke();
      // Crosshair
      ctx.beginPath();
      ctx.moveTo(pos.x - r - 6, pos.y); ctx.lineTo(pos.x - r + 4, pos.y);
      ctx.moveTo(pos.x + r - 4, pos.y); ctx.lineTo(pos.x + r + 6, pos.y);
      ctx.moveTo(pos.x, pos.y - r - 6); ctx.lineTo(pos.x, pos.y - r + 4);
      ctx.moveTo(pos.x, pos.y + r - 4); ctx.lineTo(pos.x, pos.y + r + 6);
      ctx.stroke();
      // Inner dot
      ctx.fillStyle = '#ffb648';
      ctx.beginPath(); ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2); ctx.fill();
      // Label
      ctx.fillStyle = 'rgba(255, 182, 72, 0.7)';
      ctx.font = "9px 'IBM Plex Mono', monospace";
      ctx.fillText('TARGET-01', pos.x + r + 10, pos.y - r);
    },
    drawRocket(ctx, pos) {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(pos.yaw + Math.PI * 0.5);
      // Schematic line-art rocket
      ctx.strokeStyle = '#ffb648';
      ctx.fillStyle = 'rgba(255, 182, 72, 0.1)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(4, 5);
      ctx.lineTo(0, 3);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Center dot
      ctx.fillStyle = '#ffb648';
      ctx.beginPath(); ctx.arc(0, -3, 1, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },
  },

  // ============================================================
  // CLASSIC — original site aesthetic: stars, Saturn, rocket SVG
  // ============================================================
  classic: {
    name: 'classic',
    treeColor: 'rgba(200, 169, 110, 0.18)',
    treeWidth: 1,
    pathColor: '#c8a96e',
    pathWidth: 1.5,
    _planet: null,
    _rocket: null,
    _stars: null,
    _loadImages() {
      if (!this._planet) {
        this._planet = new Image();
        this._planet.src = 'assets/planet.png';
      }
      if (!this._rocket) {
        this._rocket = new Image();
        this._rocket.src = 'assets/rocket.svg';
      }
    },
    _initStars(canvas) {
      if (this._stars && this._stars.w === canvas.width && this._stars.h === canvas.height) return;
      var list = [];
      var count = Math.floor(canvas.width * canvas.height / 2500);
      for (var i = 0; i < count; i++) {
        list.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.1 + 0.2,
          a: Math.random() * 0.55 + 0.2,
        });
      }
      this._stars = { w: canvas.width, h: canvas.height, list: list };
    },
    drawBg(ctx, canvas) {
      this._loadImages();
      this._initStars(canvas);
      var list = this._stars.list;
      for (var i = 0; i < list.length; i++) {
        var s = list[i];
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + s.a + ')';
        ctx.fill();
      }
    },
    drawPlanet(ctx, pos, phi) {
      var img = this._planet;
      if (img && img.complete && img.naturalWidth > 0) {
        var w = 52, h = 52;
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(phi);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
    },
    drawRocket(ctx, pos) {
      var img = this._rocket;
      if (img && img.complete && img.naturalWidth > 0) {
        var w = 28, h = 28;
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(pos.yaw + Math.PI / 4);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
    },
  },
};
