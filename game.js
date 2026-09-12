const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const world = {
  width: canvas.width,
  height: canvas.height,
};

const keys = {};
const game = {
  score: 0,
  targetScore: 10,
  health: 5,
  timeLeft: 45,
  over: false,
  won: false,
  lastTimestamp: 0,
  message: 'Collect 10 fruits before time runs out!'
};

const player = {
  x: 100,
  y: 120,
  radius: 20,
  speed: 240,
  color: '#d98d2b',
  flashlight: '#d9f5aa'
};

let fruits = [];
let enemies = [];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function spawnFruit() {
  const fruit = {
    x: randomBetween(60, world.width - 60),
    y: randomBetween(90, world.height - 90),
    radius: 12,
    color: ['#ff5a5f', '#ffb703', '#f72585'][Math.floor(Math.random() * 3)],
    pulse: randomBetween(0, Math.PI * 2),
  };

  return fruit;
}

function spawnEnemy(type = 'snake') {
  const enemy = {
    type,
    x: randomBetween(40, world.width - 40),
    y: randomBetween(70, world.height - 70),
    radius: type === 'snake' ? 16 : 14,
    speed: type === 'snake' ? 80 : 100,
    dir: Math.random() > 0.5 ? 1 : -1,
    drift: Math.random() > 0.5 ? 'horizontal' : 'vertical',
    color: type === 'snake' ? '#3f7d20' : '#7d4f24',
    phase: Math.random() * Math.PI * 2,
  };

  return enemy;
}

function resetGame() {
  game.score = 0;
  game.health = 5;
  game.timeLeft = 45;
  game.over = false;
  game.won = false;
  game.message = 'Collect 10 fruits before time runs out!';
  player.x = 100;
  player.y = 120;
  fruits = Array.from({ length: 10 }, () => spawnFruit());
  enemies = Array.from({ length: 5 }, () => spawnEnemy(Math.random() > 0.4 ? 'snake' : 'spider'));
}

function updatePlayer(dt) {
  let moveX = 0;
  let moveY = 0;

  if (keys.ArrowLeft || keys.a) moveX -= 1;
  if (keys.ArrowRight || keys.d) moveX += 1;
  if (keys.ArrowUp || keys.w) moveY -= 1;
  if (keys.ArrowDown || keys.s) moveY += 1;

  const length = Math.hypot(moveX, moveY) || 1;
  moveX /= length;
  moveY /= length;

  player.x += moveX * player.speed * dt;
  player.y += moveY * player.speed * dt;

  player.x = clamp(player.x, player.radius + 10, world.width - player.radius - 10);
  player.y = clamp(player.y, player.radius + 10, world.height - player.radius - 10);
}

function collectFruit() {
  for (let i = fruits.length - 1; i >= 0; i -= 1) {
    const fruit = fruits[i];
    const dx = player.x - fruit.x;
    const dy = player.y - fruit.y;
    const distance = Math.hypot(dx, dy);

    if (distance < player.radius + fruit.radius + 4) {
      fruits.splice(i, 1);
      game.score += 1;
      game.message = `Fruit collected! ${game.score}/${game.targetScore}`;

      if (game.score >= game.targetScore) {
        game.won = true;
        game.over = true;
        game.message = 'You won! Press R to play again.';
      }

      fruits.push(spawnFruit());
    }
  }
}

function damagePlayer() {
  if (!game.over) {
    game.health -= 1;
    game.message = `Ouch! Health: ${game.health}`;

    if (game.health <= 0) {
      game.over = true;
      game.message = 'The jungle wins. Press R to try again.';
    }
  }
}

function updateEnemies(dt) {
  enemies.forEach((enemy) => {
    if (enemy.drift === 'horizontal') {
      enemy.x += enemy.speed * enemy.dir * dt;
      if (enemy.x < 20 || enemy.x > world.width - 20) {
        enemy.dir *= -1;
      }
    } else {
      enemy.y += enemy.speed * enemy.dir * dt;
      if (enemy.y < 40 || enemy.y > world.height - 40) {
        enemy.dir *= -1;
      }
    }

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.hypot(dx, dy);

    if (distance < player.radius + enemy.radius + 2) {
      damagePlayer();
    }
  });
}

function updateGame(dt) {
  if (game.over) {
    return;
  }

  game.timeLeft -= dt;

  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    game.over = true;
    game.message = 'Time is up! Press R to try again.';
  }

  updatePlayer(dt);
  collectFruit();
  updateEnemies(dt);
}

function drawBackground() {
  ctx.clearRect(0, 0, world.width, world.height);

  const sky = ctx.createLinearGradient(0, 0, 0, world.height);
  sky.addColorStop(0, '#6bc26b');
  sky.addColorStop(0.38, '#4e9a53');
  sky.addColorStop(1, '#1d3d1a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.fillStyle = '#3a6d28';
  ctx.fillRect(0, world.height - 70, world.width, 70);

  for (let i = 0; i < 10; i += 1) {
    const treeX = 70 + i * 95;
    const treeHeight = 120 + (i % 3) * 30;

    ctx.fillStyle = '#4a2e1d';
    ctx.fillRect(treeX - 12, world.height - 70 - treeHeight, 24, treeHeight);

    ctx.fillStyle = '#1f6b3b';
    ctx.beginPath();
    ctx.arc(treeX, world.height - 70 - treeHeight, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(treeX - 28, world.height - 70 - treeHeight + 10, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(treeX + 32, world.height - 70 - treeHeight + 12, 38, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 18; i += 1) {
    const shrubX = i * 60 + 20;
    ctx.fillStyle = '#1a612a';
    ctx.beginPath();
    ctx.arc(shrubX, world.height - 32, 26, 0, Math.PI * 2);
    ctx.arc(shrubX + 18, world.height - 28, 22, 0, Math.PI * 2);
    ctx.arc(shrubX - 18, world.height - 30, 20, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);

  ctx.fillStyle = '#d8a643';
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3c2f1b';
  ctx.fillRect(-8, -2, 16, 8);

  ctx.fillStyle = '#1f1f1f';
  ctx.beginPath();
  ctx.arc(-6, -5, 2, 0, Math.PI * 2);
  ctx.arc(6, -5, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#1f1f1f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 2, 6, 0.2, Math.PI - 0.2);
  ctx.stroke();

  ctx.fillStyle = '#5a8f2f';
  ctx.beginPath();
  ctx.moveTo(-10, -20);
  ctx.quadraticCurveTo(-2, -38, 0, -18);
  ctx.quadraticCurveTo(8, -36, 12, -18);
  ctx.fill();

  ctx.restore();
}

function drawFruit(fruit) {
  const bob = Math.sin(fruit.pulse) * 4;
  ctx.save();
  ctx.translate(fruit.x, fruit.y + bob);

  ctx.fillStyle = fruit.color;
  ctx.beginPath();
  ctx.arc(0, 0, fruit.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#7a1f1f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-2, -fruit.radius - 4);
  ctx.lineTo(-2, -fruit.radius - 16);
  ctx.stroke();

  ctx.fillStyle = '#7a1f1f';
  ctx.beginPath();
  ctx.arc(-4, -fruit.radius - 18, 3, 0, Math.PI * 2);
  ctx.arc(4, -fruit.radius - 18, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawEnemy(enemy) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  if (enemy.type === 'snake') {
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.quadraticCurveTo(-8, -10, 0, 0);
    ctx.quadraticCurveTo(10, 10, 18, 0);
    ctx.stroke();

    ctx.fillStyle = '#171717';
    ctx.beginPath();
    ctx.arc(-6, -6, 2, 0, Math.PI * 2);
    ctx.arc(6, -6, 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#3b1d0c';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 5, 10);
      ctx.lineTo(i * 12, 18);
      ctx.moveTo(i * 5, -10);
      ctx.lineTo(i * 12, -18);
      ctx.stroke();
    }

    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-5, -2, 2, 0, Math.PI * 2);
    ctx.arc(5, -2, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawHud() {
  const hudY = 18;
  ctx.fillStyle = 'rgba(10, 22, 14, 0.55)';
  ctx.fillRect(18, 18, 260, 80);

  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#fdf3c7';
  ctx.fillText(`Score: ${game.score}/${game.targetScore}`, 32, hudY + 26);
  ctx.fillText(`Health: ${'❤ '.repeat(game.health)}`.trim(), 32, hudY + 52);
  ctx.fillText(`Time: ${Math.ceil(game.timeLeft)}s`, 32, hudY + 78);

  ctx.fillStyle = 'rgba(10, 22, 14, 0.55)';
  ctx.fillRect(world.width - 220, 18, 190, 60);
  ctx.fillStyle = '#f4f8d7';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Mission', world.width - 200, 42);
  ctx.fillText('Collect fruit', world.width - 200, 62);
}

function drawOverlay() {
  if (!game.over) {
    return;
  }

  ctx.fillStyle = 'rgba(10, 16, 12, 0.52)';
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.fillStyle = '#edf7d6';
  ctx.textAlign = 'center';
  ctx.font = 'bold 38px Arial';
  ctx.fillText(game.won ? 'YOU WIN!' : 'TRY AGAIN', world.width / 2, world.height / 2 - 12);

  ctx.font = '20px Arial';
  ctx.fillText(game.message, world.width / 2, world.height / 2 + 30);
  ctx.fillText('Press R to restart', world.width / 2, world.height / 2 + 60);
  ctx.textAlign = 'left';
}

function render() {
  drawBackground();
  fruits.forEach(drawFruit);
  enemies.forEach(drawEnemy);
  drawPlayer();
  drawHud();
  drawOverlay();
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - game.lastTimestamp) / 1000 || 0, 0.033);
  game.lastTimestamp = timestamp;

  updateGame(dt);
  render();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys[key] = true;

  if (event.key === 'r' || event.key === 'R') {
    resetGame();
  }
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys[key] = false;
});

resetGame();
requestAnimationFrame(gameLoop);
