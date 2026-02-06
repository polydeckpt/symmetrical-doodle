const canvas = document.getElementById("game");
if (!canvas) {
  throw new Error("Canvas #game não encontrado.");
}
const context = canvas.getContext("2d");
if (!context) {
  throw new Error("Contexto 2D indisponível.");
}
const ctx = context;
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlaySubtitle = document.getElementById("overlay-subtitle");
const startButton = document.getElementById("start-button");
const scoreLabel = document.getElementById("score");
const bestLabel = document.getElementById("best");
const statusLabel = document.getElementById("status");
if (!overlay || !overlayTitle || !overlaySubtitle || !startButton) {
  throw new Error("Overlay incompleto. Verifica o HTML.");
}
if (!scoreLabel || !bestLabel || !statusLabel) {
  throw new Error("HUD incompleto. Verifica o HTML.");
}
const world = {
  width: canvas.width,
  height: canvas.height,
};
const player = {
  x: 120,
  y: 980,
  size: 56,
  velocityY: 0,
  gravity: 1.35,
  jumpStrength: -22,
  grounded: true,
};
let obstacles = [];
let stars = [];
let score = 0;
let best = 0;
let running = false;
let speed = 7;
let lastTime = 0;
let spawnTimer = 0;
let starTimer = 0;
function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const width = 720;
  const height = 1280;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  world.width = width;
  world.height = height;
}
function resetGame() {
  obstacles = [];
  stars = [];
  score = 0;
  speed = 7;
  player.y = 980;
  player.velocityY = 0;
  player.grounded = true;
  spawnTimer = 0;
  starTimer = 0;
  updateScore();
}
function startGame() {
  resetGame();
  running = true;
  overlay.classList.add("hidden");
  statusLabel.textContent = "A jogar";
}
function endGame() {
  running = false;
  best = Math.max(best, score);
  bestLabel.textContent = String(best);
  overlayTitle.textContent = "Perdeste o ritmo";
  overlaySubtitle.textContent = "Tenta novamente. Podes ajustar o salto se quiseres.";
  startButton.textContent = "Recomeçar";
  overlay.classList.remove("hidden");
  statusLabel.textContent = "Pausa";
}
function updateScore() {
  scoreLabel.textContent = String(score);
}
function jump() {
  if (!running) {
    startGame();
    return;
  }
  if (player.grounded) {
    player.velocityY = player.jumpStrength;
    player.grounded = false;
  }
}
function spawnObstacle() {
  const height = 80 + Math.random() * 120;
  obstacles.push({
    x: world.width + 80,
    y: world.height - height - 120,
    width: 70 + Math.random() * 40,
    height,
  });
}
function spawnStar() {
  stars.push({
    x: world.width + 120,
    y: 400 + Math.random() * 320,
    radius: 18,
    collected: false,
  });
}
function update(delta) {
  if (!running) {
    draw();
    return;
  }
  player.velocityY += player.gravity;
  player.y += player.velocityY;
  const groundY = world.height - 120 - player.size;
  if (player.y >= groundY) {
    player.y = groundY;
    player.velocityY = 0;
    player.grounded = true;
  }
  spawnTimer += delta;
  starTimer += delta;
  if (spawnTimer > 1000) {
    spawnObstacle();
    spawnTimer = 0;
  }
  if (starTimer > 1800) {
    spawnStar();
    starTimer = 0;
  }
  obstacles.forEach((obstacle) => {
    obstacle.x -= speed;
  });
  stars.forEach((star) => {
    star.x -= speed * 0.8;
  });
  obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.width > -50);
  stars = stars.filter((star) => star.x + star.radius > -50 && !star.collected);
  obstacles.forEach((obstacle) => {
    const hitX = player.x < obstacle.x + obstacle.width && player.x + player.size > obstacle.x;
    const hitY = player.y < obstacle.y + obstacle.height && player.y + player.size > obstacle.y;
    if (hitX && hitY) {
      endGame();
    }
  });
  stars.forEach((star) => {
    const dx = player.x + player.size / 2 - star.x;
    const dy = player.y + player.size / 2 - star.y;
    const distance = Math.hypot(dx, dy);
    if (distance < player.size / 2 + star.radius) {
      star.collected = true;
      score += 3;
      updateScore();
    }
  });
  score += Math.floor(delta / 120);
  speed = 7 + score / 50;
  updateScore();
  draw();
}
function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, world.height);
  gradient.addColorStop(0, "#1a1740");
  gradient.addColorStop(1, "#09090f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, world.width, world.height);
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  for (let i = 0; i < 6; i += 1) {
    ctx.fillRect(i * 140 + (Date.now() / 20) % 140, world.height - 120, 90, 120);
  }
}
function drawPlayer() {
  ctx.save();
  ctx.fillStyle = "#7c5cff";
  ctx.shadowColor = "rgba(124, 92, 255, 0.9)";
  ctx.shadowBlur = 24;
  ctx.fillRect(player.x, player.y, player.size, player.size);
  ctx.restore();
}
function drawObstacles() {
  obstacles.forEach((obstacle) => {
    ctx.save();
    ctx.fillStyle = "#ff4d8d";
    ctx.shadowColor = "rgba(255, 77, 141, 0.8)";
    ctx.shadowBlur = 18;
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    ctx.restore();
  });
}
function drawStars() {
  stars.forEach((star) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd166";
    ctx.shadowColor = "rgba(255, 209, 102, 0.8)";
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.restore();
  });
}
function drawHUD() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.font = "24px sans-serif";
  ctx.fillText(`Velocidade: ${speed.toFixed(1)}`, 40, 60);
}
function draw() {
  drawBackground();
  drawStars();
  drawObstacles();
  drawPlayer();
  drawHUD();
}
function loop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  update(delta);
  requestAnimationFrame(loop);
}
function handleKey(event) {
  if (event.code === "Space") {
    event.preventDefault();
    jump();
  }
}
function handleOverlayTap(event) {
  const target = event.target;
  if (target && target.closest("button")) {
    return;
  }
  jump();
}
startButton.addEventListener("click", startGame);
window.addEventListener("keydown", handleKey);
canvas.addEventListener("pointerdown", jump);
overlay.addEventListener("pointerdown", handleOverlayTap);
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
requestAnimationFrame(loop);
