// Theme renderers for the RRT canvas.
// Each theme owns: drawBg, drawPlanet, drawRocket, plus visual params.
window.RRT_THEMES = {
  // ============================================================
  // VAPORWAVE TUI — moody synthwave terminal, Stranger Things palette
  // ============================================================
  vapor: {
    name: 'vapor',
    treeColor: 'rgba(120, 90, 180, 0.32)',
    treeWidth: 1,
    pathColor: '#ff2d95',
    pathWidth: 2,
    drawBg(ctx, canvas) {
      // Subtle vertical gradient
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
      g.addColorStop(0, 'rgba(20, 8, 40, 0)');
      g.addColorStop(1, 'rgba(60, 18, 90, 0.18)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    },
    drawPlanet(ctx, pos, phi) {
      const r = 18;
      // Outer glow
      const grd = ctx.createRadialGradient(pos.x, pos.y, 2, pos.x, pos.y, r * 2.4);
      grd.addColorStop(0, 'rgba(0, 240, 255, 0.55)');
      grd.addColorStop(0.5, 'rgba(255, 45, 149, 0.18)');
      grd.addColorStop(1, 'rgba(255, 45, 149, 0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(pos.x, pos.y, r * 2.4, 0, Math.PI * 2); ctx.fill();
      // Crosshair reticle
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      // Inner planet body
      ctx.fillStyle = '#ff2d95';
      ctx.beginPath(); ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2); ctx.fill();
      // Rotating tick
      ctx.save();
      ctx.translate(pos.x, pos.y); ctx.rotate(phi);
      ctx.strokeStyle = '#00f0ff';
      ctx.beginPath(); ctx.moveTo(r, 0); ctx.lineTo(r + 5, 0); ctx.stroke();
      ctx.restore();
      // Label
      ctx.fillStyle = 'rgba(0, 240, 255, 0.85)';
      ctx.font = "10px 'IBM Plex Mono', monospace";
      ctx.fillText('TGT', pos.x + r + 8, pos.y - r);
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
};
