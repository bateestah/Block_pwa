const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const grid = 20;
const cols = canvas.width / grid;
const rows = canvas.height / grid;

context.scale(grid, grid);

const shapes = [
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,0],[1,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]],
  [[1,1,0],[0,1,1]],
  [[0,1,1],[1,1,0]]
];

const colors = ['#FF0000','#FF7F00','#FFFF00','#00FF00','#0000FF','#4B0082','#8F00FF'];

const arena = Array.from({length: rows}, () => Array(cols).fill(0));

const player = {
  pos: {x:0, y:0},
  matrix: null,
  color: '#FFF'
};

function createPiece(typeIndex) {
  return shapes[typeIndex];
}

function playerReset() {
  const typeIndex = Math.floor(Math.random() * shapes.length);
  player.matrix = createPiece(typeIndex);
  player.color = colors[typeIndex];
  player.pos.y = 0;
  player.pos.x = (cols / 2 | 0) - (player.matrix[0].length / 2 | 0);
  if (collide(arena, player)) {
    arena.forEach(row => row.fill(0));
  }
}

function collide(arena, player) {
  const m = player.matrix;
  const o = player.pos;
  for (let y=0; y<m.length; ++y) {
    for (let x=0; x<m[y].length; ++x) {
      if (m[y][x] && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        arena[y + player.pos.y][x + player.pos.x] = player.color;
      }
    });
  });
}

function rotate(matrix) {
  const N = matrix.length;
  const result = matrix.map((row, y) =>
    row.map((_, x) => matrix[N - 1 - x][y])
  );
  return result;
}

function playerRotate() {
  const m = rotate(player.matrix);
  const oldX = player.pos.x;
  player.pos.x = Math.min(player.pos.x, cols - m[0].length);
  if (!collide(arena, {...player, matrix: m})) {
    player.matrix = m;
  } else {
    player.pos.x = oldX;
  }
}

function arenaSweep() {
  outer: for (let y = arena.length -1; y >=0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (!arena[y][x]) {
        continue outer;
      }
    }
    const row = arena.splice(y,1)[0].fill(0);
    arena.unshift(row);
    ++y;
  }
}

let dropCounter = 0;
const dropInterval = 500;

let lastTime = 0;
function update(time=0) {
  const delta = time - lastTime;
  lastTime = time;
  dropCounter += delta;
  if (dropCounter > dropInterval) {
    playerDrop();
  }
  draw();
  requestAnimationFrame(update);
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    arenaSweep();
    playerReset();
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        context.fillStyle = player.color;
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);

  arena.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        context.fillStyle = value;
        context.fillRect(x, y, 1, 1);
      }
    });
  });

  drawMatrix(player.matrix, player.pos);
}

let touchStartX = null;
let touchStartY = null;

canvas.addEventListener('touchstart', e => {
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
}, {passive:true});

canvas.addEventListener('touchend', e => {
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const threshold = 30;
  if (Math.max(absX, absY) > threshold) {
    if (absX > absY) {
      if (dx > 0) playerMove(1);
      else playerMove(-1);
    } else {
      if (dy > 0) playerDrop();
      else playerRotate();
    }
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') playerMove(-1);
  else if (e.key === 'ArrowRight') playerMove(1);
  else if (e.key === 'ArrowDown') playerDrop();
  else if (e.key === 'ArrowUp') playerRotate();
});

document.getElementById('left').addEventListener('click', () => playerMove(-1));
document.getElementById('right').addEventListener('click', () => playerMove(1));
document.getElementById('down').addEventListener('click', playerDrop);
document.getElementById('rotate').addEventListener('click', playerRotate);

playerReset();
update();
