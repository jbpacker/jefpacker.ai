/* -----------------------------------------------
/* Author : Jef Packer  - jefpacker.ai
/* Apache license: https://www.apache.org/licenses/LICENSE-2.0.html
/* Github : github.com/jbpacker/paths
/* Adapted: themed rendering, exposed stats
/* ----------------------------------------------- */

(function() {
  function stepCurv(p, curvature, dist) {
    var dx_local = dist, dy_local = 0.0, theta = 0.0;
    if (Math.abs(curvature) > 0.0001) {
      var R = 1 / curvature;
      theta = dist * curvature;
      dx_local = R * Math.sin(theta);
      dy_local = R * (1 - Math.cos(theta));
    }
    var c = Math.cos(-p.yaw), s = Math.sin(-p.yaw);
    var x = dx_local * c + dy_local * s + p.x;
    var y = -dx_local * s + dy_local * c + p.y;
    return new Position(x, y, p.yaw + theta);
  }
  function curvToPoint(p, target) {
    var s = Math.sin(p.yaw), c = Math.cos(p.yaw);
    var dx = (target.x - p.x) * c + (target.y - p.y) * s;
    var dy = -(target.x - p.x) * s + (target.y - p.y) * c;
    return (2 * dy) / (dx * dx + dy * dy);
  }
  function distance(p, target) {
    var dx = target.x - p.x, dy = target.y - p.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  class Position {
    constructor(x, y, yaw) { this.x = x; this.y = y; this.yaw = yaw; }
  }

  class Branch {
    constructor(parent, curvature, distance) {
      this.parent = parent; this.curvature = curvature; this.distance = distance;
      this.child = new Node(parent, this, stepCurv(parent.position, curvature, distance));
    }
    drawSeg(ctx, color, width) {
      ctx.strokeStyle = color; ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(this.parent.position.x, this.parent.position.y);
      var p = this.parent.position, i = 0, ds = 1.0;
      while (i < this.distance) { i += ds; p = stepCurv(p, this.curvature, ds); ctx.lineTo(p.x, p.y); }
      ctx.lineTo(this.child.position.x, this.child.position.y);
      ctx.stroke();
    }
  }

  class Node {
    constructor(parent, branch, position) {
      this.parent = parent; this.branch = branch; this.position = position;
      this.children = [];
      this.curvature = (Math.random() * 2 * RRT.cfg.curvature_sample) - RRT.cfg.curvature_sample;
      this.distance = Math.random() * RRT.cfg.distance_sample + RRT.cfg.distance_sample_offset;
    }
    sample() { let b = new Branch(this, this.curvature, this.distance); this.children.push(b); return b; }
    drawTree(ctx) {
      for (const b of this.children) {
        b.drawSeg(ctx, RRT.theme.treeColor, RRT.theme.treeWidth);
        b.child.drawTree(ctx);
      }
    }
    drawFromChild(ctx) {
      if (this.branch) this.branch.drawSeg(ctx, RRT.theme.pathColor, RRT.theme.pathWidth);
      if (this.parent) this.parent.drawFromChild(ctx);
    }
    distanceTo(target) { return distance(this.position, target); }
    containsParent(t, up) {
      if (this == t) return true;
      if (up == 0 || !this.parent) return false;
      return this.parent.containsParent(t, up - 1);
    }
  }

  const sleepNow = (d) => new Promise((r) => setTimeout(r, d));

  class Tree {
    constructor(start, target) {
      this.root = new Node(null, null, start);
      this.node_queue = [this.root];
      this.running = false;
      this.closest_node = this.root;
      this.target = target;
      this.totalNodes = 1;
    }
    async rollout() {
      this.running = true;
      while (this.node_queue.length > 0) {
        let node = this.node_queue.shift();
        var branch = node.sample();
        this.totalNodes++;
        var d_close = this.closest_node.distanceTo(this.target.position);
        var d_child = branch.child.distanceTo(this.target.position);
        if (d_child < d_close) { this.closest_node = branch.child; this.node_queue.push(branch.child); }
        else if (d_child < d_close + RRT.cfg.explore_distance) this.node_queue.push(branch.child);
        if (node.distanceTo(this.target.position) < d_close + RRT.cfg.explore_distance) this.node_queue.push(node);
        if (d_child < RRT.cfg.finish_distance && !this.target.circle) { this.running = false; return; }
        await sleepNow(RRT.cfg.search_sleep);
        if (this.node_queue.length == 0) { this.node_queue.push(this.root); this.closest_node = this.root; }
      }
    }
    chopTrunk(t) { if (t.parent) { this.root = t.parent; this.prune(this.root); this.root.parent = null; } }
    prune(t) {
      let q = [];
      while (this.node_queue.length > 0) {
        var n = this.node_queue.shift();
        if (n.containsParent(t, RRT.cfg.draw_depth)) q.push(n);
      }
      this.node_queue = q;
    }
    update() { if (!this.running) this.rollout(); }
    draw(ctx) { this.root.drawTree(ctx); this.closest_node.drawFromChild(ctx); }
  }

  class Robot {
    constructor(start, tree) {
      this.position = start; this.tree = tree;
      this.target_node = tree.root; this.moving = false; this.path = [];
    }
    constructPath() {
      var n = this.tree.closest_node; this.path = [];
      while (n != this.target_node) { this.path.push(n); if (n.parent) n = n.parent; else break; }
    }
    async move() {
      while (this.moving) {
        this.constructPath();
        if (this.atTarget() && this.path.length > 0) {
          this.target_node = this.path.pop();
          this.tree.prune(this.target_node);
          this.tree.chopTrunk(this.target_node);
        }
        var dist = RRT.cfg.robot_step;
        if (this.atTarget() && this.path.length == 0) {
          dist = 0;
          if (!this.tree.target.circle) { this.moving = false; return; }
        }
        var curv = curvToPoint(this.position, this.target_node.position);
        this.position = stepCurv(this.position, curv, dist);
        await sleepNow(RRT.cfg.robot_sleep);
      }
    }
    atTarget() { return distance(this.target_node.position, this.position) < RRT.cfg.finish_move; }
    needToMove() { return this.tree.closest_node != this.target_node || this.tree.target.circle; }
    update() { if (!this.moving && this.tree.running && this.needToMove()) { this.moving = true; this.move(); } }
    draw(ctx) {
      if (RRT.theme.drawRocket) RRT.theme.drawRocket(ctx, this.position);
    }
  }

  class Target {
    constructor() {
      this.circle = true;
      this.theta = RRT.cfg.planet_start_theta;
      this.position = new Position(0, 0, 0);
      this.updatePosition(this.theta);
      this.phi = 0;
    }
    clickUpdate(p) { this.position = p; this.circle = false; }
    async update() {
      while (this.circle) {
        var r = 0.25 * RRT.cfg.planet_pct * (window.innerWidth + window.innerHeight);
        this.theta += RRT.cfg.planet_step / r;
        this.updatePosition(this.theta);
        await sleepNow(RRT.cfg.target_sleep);
      }
    }
    updatePosition(theta) {
      var w = RRT.canvas.width, h = RRT.canvas.height;
      this.position.x = 0.5 * w * (1 + RRT.cfg.planet_pct * Math.sin(theta));
      this.position.y = 0.5 * h * (1 + RRT.cfg.planet_pct * Math.cos(theta));
    }
    draw(ctx) {
      this.phi += RRT.cfg.planet_spin;
      if (RRT.theme.drawPlanet) RRT.theme.drawPlanet(ctx, this.position, this.phi);
    }
  }

  // Public namespace
  const RRT = {
    cfg: {
      planet_pct: 0.6,
      planet_step: 1.5,
      planet_spin: Math.PI / 500,
      planet_start_theta: 1/8 * Math.PI,
      curvature_sample: 0.035,
      distance_sample: 60,
      distance_sample_offset: 25,
      explore_distance: 75,
      finish_distance: 40,
      draw_depth: 30,
      search_sleep: 80,
      draw_sleep: 50,
      robot_sleep: 40,
      target_sleep: 40,
      finish_move: 5,
      robot_step: 1.5,
    },
    theme: null,
    canvas: null, ctx: null,
    tree: null, robot: null, target: null,
    container: null,
    onStats: null,

    init(container, theme) {
      this.container = container;
      this._defaultCfg = Object.assign({}, this.cfg);
      this.theme = theme;
      if (theme.cfg) Object.assign(this.cfg, theme.cfg);
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
      if (window.ResizeObserver) {
        new ResizeObserver(() => this.resize()).observe(container);
      }
      this.canvas.addEventListener('click', (e) => this.click(e));
      container.appendChild(this.canvas);
      this.start();
      this.loop();
    },
    resize() {
      const r = this.container.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const wasEmpty = this.canvas.width === 0 || this.canvas.height === 0;
      this.canvas.width = r.width; this.canvas.height = r.height;
      if (wasEmpty) this.start();
    },
    start() {
      this.target = new Target();
      const sx = 0.5 * this.canvas.width;
      const sy = this.canvas.height - 80;
      const sp = new Position(sx, sy, Math.atan2(this.target.position.y - sy, this.target.position.x - sx));
      this.tree = new Tree(sp, this.target);
      this.robot = new Robot(sp, this.tree);
      this.target.update();
      this.tree.update();
      this.robot.update();
    },
    setTheme(theme) {
      this.theme = theme;
      Object.assign(this.cfg, this._defaultCfg, theme.cfg || {});
    },
    click(e) {
      const r = this.canvas.getBoundingClientRect();
      const p = new Position(e.clientX - r.left, e.clientY - r.top, 0);
      this.target.clickUpdate(p);
      this.tree.update();
      this.robot.update();
    },
    async loop() {
      while (true) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.theme.drawBg) this.theme.drawBg(this.ctx, this.canvas);
        this.target.draw(this.ctx);
        this.tree.draw(this.ctx);
        this.robot.draw(this.ctx);
        if (this.onStats) {
          this.onStats({
            nodes: this.tree.totalNodes,
            queue: this.tree.node_queue.length,
            dist: Math.round(this.robot.position ? distance(this.robot.position, this.target.position) : 0),
            running: this.tree.running ? 1 : 0,
          });
        }
        await sleepNow(this.cfg.draw_sleep);
      }
    },
  };

  window.RRT = RRT;
})();
