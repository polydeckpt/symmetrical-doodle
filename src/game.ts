const canvas = document.getElementById("game") as HTMLCanvasElement | null;

if (!canvas) throw new Error("Canvas #game não encontrado.");

const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Contexto 2D indisponível.");

const overlay = document.getElementById("overlay") as HTMLDivElement | null;
const overlayTitle = document.getElementById("overlay-title") as HTMLHeadingElement | null;
const overlaySubtitle = document.getElementById("overlay-subtitle") as HTMLParagraphElement | null;
const startButton = document.getElementById("start-button") as HTMLButtonElement | null;
const scoreLabel = document.getElementById("score") as HTMLSpanElement | null;
const bestLabel = document.getElementById("best") as HTMLSpanElement | null;
const statusLabel = document.getElementById("status") as HTMLSpanElement | null;

if (!overlay || !overlayTitle || !overlaySubtitle || !startButton || !scoreLabel || !bestLabel || !statusLabel) {
  throw new Error("Elementos de UI em falta no HTML.");
}

type Lane = 0 | 1 | 2;

type Block = {
  lane: Lane;
  y: number;
  height: number;
  passed: boolean;
};

type Coin = {
  lane: Lane;
  y: number;
  radius: number;
  collected: boolean;
};

const world = { width: 720, height: 1280, groundY: 1040 };
const laneX = [220, 360, 500] as const;

const player = {
  lane: 1 as Lane,
  x: laneX[1],
  y: 920,
  size: 78,
  velocityY: 0,
  gravity: 1.5,
  jumpStrength: -24,
  grounded: true,
};

let blocks: Block[] = [];
let coins: Coin[] = [];
let score = 0;
let best = Number(localStorage.getItem("neon-hop-best") || 0);
let running = false;
let speed = 9;
let lastTime = 0;
let blockTimer = 0;
let coinTimer = 0;
let touchStartX = 0;
let touchStartY = 0;

bestLabel.textContent = String(best);

function resizeCanvas(): void {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = world.width * ratio;
  canvas.height = world.height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function showOverlay(title: string, subtitle: string, buttonText: string): void {
  overlayTitle.textContent = title;
  overlaySubtitle.textContent = subtitle;
  startButton.textContent = buttonText;
  overlay.classList.remove("hidden");
}

function hideOverlay(): void {
  overlay.classList.add("hidden");
}

function resetGame(): void {
  blocks = [];
  coins = [];
  score = 0;
  speed = 9;
  player.lane = 1;
  player.x = laneX[1];
  player.y = 920;
  player.velocityY = 0;
  player.grounded = true;
  blockTimer = 0;
  coinTimer = 0;
  scoreLabel.textContent = "0";
}

function startGame(): void {
  resetGame();
  running = true;
  statusLabel.textContent = "A jogar";
  hideOverlay();
}

function gameOver(): void {
  running = false;
  statusLabel.textContent = "Game over";
  if (score > best) {
    best = score;
    localStorage.setItem("neon-hop-best", String(best));
    bestLabel.textContent = String(best);
  }
  showOverlay("Fim do jogo", "Desvia dos blocos e recolhe moedas ✨", "Tentar novamente");
}

function moveLane(direction: -1 | 1): void {
  const next = Math.max(0, Math.min(2, player.lane + direction)) as Lane;
  player.lane = next;
}

function jump(): void {
  if (!running) {
    startGame();
    return;
  }

  if (player.grounded) {
    player.velocityY = player.jumpStrength;
    player.grounded = false;
  }
}

function spawnBlock(): void {
  const lane = Math.floor(Math.random() * 3) as Lane;
  blocks.push({ lane, y: -140, height: 120 + Math.random() * 80, passed: false });
}

function spawnCoin(): void {
  const lane = Math.floor(Math.random() * 3) as Lane;
  coins.push({ lane, y: -100, radius: 24, collected: false });
}

function update(delta: number): void {
  if (!running) {
    draw();
    return;
  }

  player.x += (laneX[player.lane] - player.x) * 0.24;
  player.velocityY += player.gravity;
  player.y += player.velocityY;

  if (player.y >= 920) {
    player.y = 920;
    player.velocityY = 0;
    player.grounded = true;
  }

  blockTimer += delta;
  coinTimer += delta;

  if (blockTimer > 900) {
    spawnBlock();
    blockTimer = 0;
  }

  if (coinTimer > 1300) {
    spawnCoin();
    coinTimer = 0;
  }

  blocks.forEach((block) => {
    block.y += speed;
    if (!block.passed && block.y > world.groundY + 120) {
      block.passed = true;
      score += 1;
    }
  });

  coins.forEach((coin) => {
    coin.y += speed * 0.92;
  });

  blocks = blocks.filter((block) => block.y < world.height + 180);
  coins = coins.filter((coin) => coin.y < world.height + 80 && !coin.collected);

  for (const block of blocks) {
    const bx = laneX[block.lane] - 50;
    const by = block.y;
    const bw = 100;
    const bh = block.height;

    const hitX = player.x - player.size / 2 < bx + bw && player.x + player.size / 2 > bx;
    const hitY = player.y < by + bh && player.y + player.size > by;
    if (hitX && hitY) {
      gameOver();
      return;
    }
  }

  coins.forEach((coin) => {
    const dx = player.x - laneX[coin.lane];
    const dy = player.y + player.size / 2 - coin.y;
    if (Math.hypot(dx, dy) < coin.radius + player.size / 2 - 6) {
      coin.collected = true;
      score += 3;
    }
  });

  speed = 9 + score * 0.04;
  scoreLabel.textContent = String(score);
  draw();
}

function drawBackground(): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, world.height);
  gradient.addColorStop(0, "#1d1552");
  gradient.addColorStop(1, "#0a0a12");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.strokeStyle = "rgba(124, 92, 255, 0.22)";
  ctx.lineWidth = 4;
  for (const x of laneX) {
    ctx.beginPath();
    ctx.moveTo(x, 260);
    ctx.lineTo(x, world.groundY + 100);
    ctx.stroke();
  }

  ctx.fillStyle = "#141427";
  ctx.fillRect(80, world.groundY + 100, world.width - 160, 60);
}

function drawPlayer(): void {
  ctx.save();
  ctx.fillStyle = "#66d9ff";
  ctx.shadowColor = "rgba(102, 217, 255, 0.9)";
  ctx.shadowBlur = 20;
  ctx.fillRect(player.x - player.size / 2, player.y, player.size, player.size);
  ctx.restore();
}

function drawBlocks(): void {
  blocks.forEach((block) => {
    ctx.save();
    ctx.fillStyle = "#ff4d8d";
    ctx.shadowColor = "rgba(255, 77, 141, 0.8)";
    ctx.shadowBlur = 18;
    ctx.fillRect(laneX[block.lane] - 50, block.y, 100, block.height);
    ctx.restore();
  });
}

function drawCoins(): void {
  coins.forEach((coin) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(laneX[coin.lane], coin.y, coin.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd166";
    ctx.shadowColor = "rgba(255, 209, 102, 0.9)";
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.restore();
  });
}

function drawHudInsideCanvas(): void {
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "22px sans-serif";
  ctx.fillText(`Velocidade ${speed.toFixed(1)}`, 32, 52);
  ctx.fillText("Swipe ← → para trocar faixa, swipe ↑ para saltar", 32, 86);
}

function draw(): void {
  drawBackground();
  drawCoins();
  drawBlocks();
  drawPlayer();
  drawHudInsideCanvas();
}

function loop(timestamp: number): void {
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  update(delta || 16);
  requestAnimationFrame(loop);
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.code === "ArrowLeft") moveLane(-1);
  if (event.code === "ArrowRight") moveLane(1);
  if (event.code === "ArrowUp" || event.code === "Space") {
    event.preventDefault();
    jump();
  }
}

function onPointerDown(event: PointerEvent): void {
  touchStartX = event.clientX;
  touchStartY = event.clientY;
}

function onPointerUp(event: PointerEvent): void {
  const dx = event.clientX - touchStartX;
  const dy = event.clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
    moveLane(dx > 0 ? 1 : -1);
    return;
  }

  if (dy < -30) {
    jump();
    return;
  }

  jump();
}

startButton.addEventListener("click", startGame);
window.addEventListener("keydown", onKeyDown);
canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointerup", onPointerUp);
overlay.addEventListener("pointerup", () => jump());
window.addEventListener("resize", resizeCanvas);

showOverlay("Neon Hop", "Faz swipe para desviar e saltar. Funciona super bem em mobile.", "Começar");
resizeCanvas();
requestAnimationFrame(loop);
