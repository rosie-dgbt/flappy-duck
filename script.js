// Screen & UI Elements
const mainScreen = document.getElementById("main-screen");
const gameScreen = document.getElementById("game-screen");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const scoreEl = document.getElementById("score");
const finalScoreEl = document.getElementById("final-score");
const gameOverBox = document.getElementById("game-over");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game State Variables
let frames = 0;
let score = 0;
let isGameOver = false;
let animationId;

// 1. SCREEN SWITCHING LOGIC
startBtn.addEventListener("click", () => {
  mainScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  resetGame();
});

restartBtn.addEventListener("click", () => {
  resetGame();
});

// 2. YELLOW DUCK OBJECT
const duck = {
  x: 85,
  y: 250,
  radius: 18,
  velocity: 0,
  gravity: 0.42,
  jumpStrength: -7.5,

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    // Tilt duck slightly based on velocity
    const tilt = Math.min(Math.max(this.velocity * 0.05, -0.4), 0.5);
    ctx.rotate(tilt);

    // Yellow Body
    ctx.fillStyle = "#f72bb0";
    ctx.beginPath();
    ctx.ellipse(0, 4, 20, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#7909589d";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Yellow Head
    ctx.beginPath();
    ctx.arc(10, -8, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Wing
    ctx.fillStyle = "#FFC107";
    ctx.beginPath();
    ctx.ellipse(-3, 5, 9, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Orange Beak
    ctx.fillStyle = "#FF6F00";
    ctx.beginPath();
    ctx.ellipse(22, -7, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(13, -10, 2.3, 0, Math.PI * 2);
    ctx.fill();

    // Eye Shine
    ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.arc(14, -11, 0.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  update() {
    this.velocity += this.gravity;
    this.y += this.velocity;

    // Floor collision (Bathtub rim)
    if (this.y + this.radius >= canvas.height - 55) {
      this.y = canvas.height - 55 - this.radius;
      triggerGameOver();
    }

    // Ceiling collision
    if (this.y - this.radius <= 0) {
      this.y = this.radius;
      this.velocity = 0;
    }
  },

  flap() {
    if (!isGameOver) {
      this.velocity = this.jumpStrength;
    }
  }
};

// 3. SILVER-GRAY PIPES & BUBBLES
const pipes = [];
const bubbles = [];
const pipeWidth = 62;
const pipeGap = 155;

function spawnPipe() {
  const minHeight = 70;
  const maxHeight = canvas.height - pipeGap - 120;
  const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

  pipes.push({
    x: canvas.width,
    top: topHeight,
    bottom: topHeight + pipeGap,
    passed: false
  });
}

function spawnBubble(x, y, direction) {
  bubbles.push({
    x: x + Math.random() * 30 - 15,
    y: y,
    radius: Math.random() * 5 + 3,
    vx: (Math.random() - 0.5) * 1.2,
    vy: direction * (Math.random() * 1.2 + 0.6),
    alpha: 0.85
  });
}

function drawMetallicPipe(x, y, width, height, isTop) {
  // Metallic Silver-Gray Gradient
  const grad = ctx.createLinearGradient(x, 0, x + width, 0);
  grad.addColorStop(0, "#7a8288");
  grad.addColorStop(0.3, "#d6dce0");
  grad.addColorStop(0.6, "#9aa2a8");
  grad.addColorStop(1, "#5c6368");

  ctx.fillStyle = grad;
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "#454b50";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  // Pipe Rim / Nozzle
  const rimHeight = 22;
  const rimY = isTop ? y + height - rimHeight : y;
  ctx.fillStyle = grad;
  ctx.fillRect(x - 5, rimY, width + 10, rimHeight);
  ctx.strokeRect(x - 5, rimY, width + 10, rimHeight);
}

function updateAndDrawPipes() {
  if (frames % 105 === 0) {
    spawnPipe();
  }

  for (let i = pipes.length - 1; i >= 0; i--) {
    const p = pipes[i];
    p.x -= 2.5;

    // Draw Top & Bottom Silver Pipes
    drawMetallicPipe(p.x, 0, pipeWidth, p.top, true);
    drawMetallicPipe(p.x, p.bottom, pipeWidth, canvas.height - 55 - p.bottom, false);

    // Blow bubbles out of the pipe openings periodically
    if (frames % 18 === 0) {
      spawnBubble(p.x + pipeWidth / 2, p.top, 1);     // Blows downward from top pipe
      spawnBubble(p.x + pipeWidth / 2, p.bottom, -1); // Blows upward from bottom pipe
    }

    // Collision Check
    if (
      duck.x + duck.radius - 4 > p.x &&
      duck.x - duck.radius + 4 < p.x + pipeWidth &&
      (duck.y - duck.radius + 4 < p.top || duck.y + duck.radius - 4 > p.bottom)
    ) {
      triggerGameOver();
    }

    // Score Check
    if (!p.passed && p.x + pipeWidth < duck.x) {
      p.passed = true;
      score++;
      scoreEl.textContent = score;
    }

    // Remove off-screen pipes
    if (p.x + pipeWidth < -10) {
      pipes.splice(i, 1);
    }
  }
}

function updateAndDrawBubbles() {
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.x += b.vx - 1.2; // Drift slightly with pipe movement
    b.y += b.vy;
    b.alpha -= 0.008;

    if (b.alpha <= 0) {
      bubbles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha * 0.45})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 255, 255, ${b.alpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Little bubble reflection dot
    ctx.beginPath();
    ctx.arc(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha})`;
    ctx.fill();
    ctx.restore();
  }
}

// 4. REAL-LIFE BLUE BATHROOM BACKGROUND
function drawBathroomBackground() {
  // Light blue bathroom wall base
  ctx.fillStyle = "#a8e0ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ceramic Bathroom Wall Tiles
  ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
  ctx.lineWidth = 2;
  const tileSize = 42;
  for (let x = 0; x < canvas.width; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Decoration 1: Bathroom Oval Mirror
  ctx.fillStyle = "#d9f4ff";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(110, 140, 42, 62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Mirror glass shine lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(92, 115);
  ctx.lineTo(118, 155);
  ctx.moveTo(104, 110);
  ctx.lineTo(125, 142);
  ctx.stroke();

  // Decoration 2: Wall Shelf with Soap & Shampoo Bottles
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(255, 185, 115, 10);
  // Pink Soap Dispenser
  ctx.fillStyle = "#ff8fa3";
  ctx.fillRect(270, 155, 22, 30);
  ctx.fillStyle = "#ccc";
  ctx.fillRect(278, 147, 6, 8);
  // Teal Shampoo Bottle
  ctx.fillStyle = "#2ec4b6";
  ctx.fillRect(305, 142, 24, 43);
  // Yellow Sponge
  ctx.fillStyle = "#ffe66d";
  ctx.fillRect(338, 170, 22, 15);

  // Decoration 3: Towel Rack & Hanging Towel
  ctx.fillStyle = "#8d99ae";
  ctx.fillRect(50, 310, 85, 6);
  ctx.fillStyle = "#ffccd5"; // Soft towel
  ctx.fillRect(62, 313, 60, 75);
  ctx.fillStyle = "#ffb3c1"; // Towel stripe
  ctx.fillRect(62, 370, 60, 8);

  // Decoration 4: White Bathtub / Water Floor at Bottom
  ctx.fillStyle = "#48cae4"; // Bath water
  ctx.fillRect(0, canvas.height - 55, canvas.width, 20);
  ctx.fillStyle = "#ffffff"; // White porcelain tub edge
  ctx.fillRect(0, canvas.height - 35, canvas.width, 35);
  ctx.strokeStyle = "#caf0f8";
  ctx.lineWidth = 3;
  ctx.strokeRect(0, canvas.height - 35, canvas.width, 35);
}

// 5. MAIN GAME LOOP & CONTROLS
function gameLoop() {
  if (isGameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBathroomBackground();
  updateAndDrawPipes();
  updateAndDrawBubbles();
  duck.update();
  duck.draw();

  frames++;
  animationId = requestAnimationFrame(gameLoop);
}

function triggerGameOver() {
  isGameOver = true;
  cancelAnimationFrame(animationId);
  finalScoreEl.textContent = score;
  gameOverBox.classList.remove("hidden");
}

function resetGame() {
  cancelAnimationFrame(animationId);
  duck.y = 250;
  duck.velocity = 0;
  pipes.length = 0;
  bubbles.length = 0;
  score = 0;
  frames = 0;
  isGameOver = false;
  scoreEl.textContent = "0";
  gameOverBox.classList.add("hidden");
  gameLoop();
}

// Keyboard & Mouse/Touch Controls
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !gameScreen.classList.contains("hidden")) {
    e.preventDefault();
    duck.flap();
  }
});

canvas.addEventListener("mousedown", () => {
  duck.flap();
});

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  duck.flap();
});