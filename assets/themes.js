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

      // ── Sun (clipped to sky zone so it never bleeds below horizon) ────
      const sunR = Math.min(W, H) * 0.13;
      const sunX = W / 2;
      const sunY = hor;  // center sits exactly at horizon

      ctx.save();
      // Clip everything sun-related to sky zone only (y < hor)
      // This makes the sun appear behind the floor/grid with a clean horizon cut
      ctx.beginPath();
      ctx.rect(0, 0, W, hor);
      ctx.clip();

      // Glow behind sun
      const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 2.4);
      glow.addColorStop(0,   'rgba(255, 200, 0, 0.35)');
      glow.addColorStop(0.4, 'rgba(255, 45, 149, 0.2)');
      glow.addColorStop(1,   'rgba(255, 45, 149, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 2.4, 0, Math.PI * 2);
      ctx.fill();

      // Sun: clip to half-circle, fill gradient, then draw gap lines
      ctx.save();
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, Math.PI, 0);  // upper half-circle path
      ctx.closePath();
      ctx.clip();

      // Gradient fill (yellow → orange → magenta top to bottom)
      const sunGrad = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY);
      sunGrad.addColorStop(0,    '#ffee00');
      sunGrad.addColorStop(0.45, '#ff8800');
      sunGrad.addColorStop(1,    '#ff2d95');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR);

      // 4 horizontal gap lines — color sampled from sky gradient at each line's y
      const numGaps = 4;
      for (let i = 0; i < numGaps; i++) {
        const t = 0.4 + (i + 1) / (numGaps + 1) * 0.6;
        const lineY = sunY - sunR * (1 - t);
        // Sky gradient: y=0 → #050018, y=0.6*hor → #18003a, y=hor → rgba(255,45,149,0.4) over dark
        const gt = lineY / hor;  // 0..1 position in sky gradient
        let sr, sg, sb;
        if (gt <= 0.6) {
          const f = gt / 0.6;
          sr = Math.round(5  + 19 * f);
          sg = 0;
          sb = Math.round(24 + 34 * f);
        } else {
          const f = (gt - 0.6) / 0.4;
          sr = Math.round(24 + (255 - 24) * f * 0.4);
          sg = Math.round(45 * f * 0.4);
          sb = Math.round(58 + (149 - 58) * f * 0.4);
        }
        ctx.fillStyle = `rgb(${sr},${sg},${sb})`;
        ctx.fillRect(sunX - sunR, lineY - 1.5, sunR * 2, 3);
      }
      ctx.restore(); // inner half-circle clip

      ctx.restore(); // outer sky-zone clip

      // ── Grid floor ───────────────────────────────────────────────
      this._gridOffset += 0.015;

      const vp = { x: W / 2, y: hor };
      const floorH = H - hor;

      ctx.save();
      ctx.globalAlpha = 0.7;

      // Horizontal lines — true 1/Z perspective projection
      // K = floorH so Z=1 lands exactly at the canvas bottom.
      // Animating by subtracting offset from Z makes near lines rush forward fast,
      // far lines creep slowly — correct perspective speed behaviour.
      const K = floorH;
      const numHLines = 200;
      const hOffset = this._gridOffset % 1;

      // Static horizon seam — closes the gap between farthest animated line and horizon
      ctx.strokeStyle = 'rgba(255,45,149,0.65)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, hor);
      ctx.lineTo(W, hor);
      ctx.stroke();

      for (let i = 1; i <= numHLines; i++) {
        const Z = i - hOffset;
        if (Z < 0.05) continue;        // behind camera
        const y = hor + K / Z;
        if (y > H + 2 || y < hor) continue;

        // Lines near bottom (large y) are brighter/more cyan; near horizon = dimmer/magenta
        const d = (y - hor) / floorH;  // 0 = horizon, 1 = bottom
        const r = Math.round(255 * (1 - d));
        const g = Math.round(45  * (1 - d) + 240 * d);
        const b = Math.round(149 * (1 - d) + 255 * d);
        const a = (0.45 + d * 0.4).toFixed(2);

        // Bottom 40% of floor (d > 0.6): no fade, full edge-to-edge.
        const full_edge_percent = 0.7;
        const fade_percent = 1 - full_edge_percent;
        // Top 60% (d <= 0.6): linear taper toward horizon, max 0.4 at VP.
        const fade = d > fade_percent ? 0 : (fade_percent - d) / fade_percent * full_edge_percent;
        ctx.lineWidth = 1;
        if (fade < 0.005) {
          ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
        } else {
          const hGrad = ctx.createLinearGradient(0, y, W, y);
          hGrad.addColorStop(0,          'rgba(0,0,0,0)');
          hGrad.addColorStop(fade,       `rgba(${r},${g},${b},${a})`);
          hGrad.addColorStop(1 - fade,   `rgba(${r},${g},${b},${a})`);
          hGrad.addColorStop(1,          'rgba(0,0,0,0)');
          ctx.strokeStyle = hGrad;
        }
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Vertical lines — equally spaced in world space at the bottom (S px apart),
      // converging to VP. Side columns that miss the bottom edge are projected to
      // the left/right walls via ray-vs-wall intersection.
      const numBottomLines = 20;
      const S = W / numBottomLines;  // equal column spacing at bottom

      for (let n = -80; n <= 80; n++) {
        const bottomX = W / 2 + n * S;
        let ex, ey;

        if (bottomX >= 0 && bottomX <= W) {
          ex = bottomX;
          ey = H;
        } else if (bottomX < 0) {
          // Ray from VP to (bottomX, H) — find where it crosses x=0
          const t = (W / 2) / (W / 2 - bottomX);
          ey = hor + t * floorH;
          if (ey < hor + 3) continue;
          ex = 0;
        } else {
          // Ray crosses x=W
          const t = (W / 2) / (bottomX - W / 2);
          ey = hor + t * floorH;
          if (ey < hor + 3) continue;
          ex = W;
        }

        const onBottom = ey >= H - 1;
        const endAlpha = onBottom ? 0.65 : 0.35;
        const vGrad = ctx.createLinearGradient(vp.x, vp.y, ex, ey);
        vGrad.addColorStop(0,   'rgba(255, 45, 149, 0.05)');
        vGrad.addColorStop(0.3, 'rgba(255, 45, 149, 0.35)');
        vGrad.addColorStop(1,   `rgba(0, 240, 255, ${endAlpha})`);
        ctx.strokeStyle = vGrad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(vp.x, vp.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }

      ctx.restore();

      // // ── Palm tree silhouettes ─────────────────────────────────
      // const drawPalm = (x, baseY, lean, color, glowColor) => {
      //   const trunkH = H * 0.22;
      //   const tipX = x + lean * trunkH * 0.6;
      //   const tipY = baseY - trunkH;
      //   ctx.save();
      //   ctx.shadowBlur = 14;
      //   ctx.shadowColor = glowColor;
      //   ctx.strokeStyle = color;
      //   ctx.lineWidth = 2;
      //   // Curved trunk
      //   ctx.beginPath();
      //   ctx.moveTo(x, baseY);
      //   ctx.quadraticCurveTo(x + lean * trunkH * 0.3, baseY - trunkH * 0.55, tipX, tipY);
      //   ctx.stroke();
      //   // Fronds
      //   const numFronds = 6;
      //   for (let f = 0; f < numFronds; f++) {
      //     const angle = (f / numFronds) * Math.PI - Math.PI * 0.1 + (lean > 0 ? 0.15 : -0.15);
      //     const fLen = trunkH * 0.45;
      //     ctx.lineWidth = 1.2;
      //     ctx.beginPath();
      //     ctx.moveTo(tipX, tipY);
      //     ctx.quadraticCurveTo(
      //       tipX + Math.cos(angle) * fLen * 0.55,
      //       tipY + Math.sin(angle) * fLen * 0.55 - fLen * 0.15,
      //       tipX + Math.cos(angle) * fLen,
      //       tipY + Math.sin(angle) * fLen
      //     );
      //     ctx.stroke();
      //   }
      //   ctx.restore();
      // };

      // // Left palm — magenta
      // drawPalm(W * 0.04, H, 0.45, '#ff2d95', 'rgba(255,45,149,0.6)');
      // // Right palm — cyan (leaning left)
      // drawPalm(W * 0.96, H, -0.45, '#00f0ff', 'rgba(0,240,255,0.6)');
      // // Second right palm, slightly inset — magenta tint
      // drawPalm(W * 0.88, H * 0.97, -0.3, 'rgba(255,45,149,0.55)', 'rgba(255,45,149,0.3)');
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
