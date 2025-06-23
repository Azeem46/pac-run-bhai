const gridSize = 15;
const grid = [];
let playerPos = { x: 1, y: 1 };
let chaserPos = { x: 13, y: 9 };
let gameStarted = false;
let playerImg = '';
let chaserImg = 'chaser.png'; // Default chaser image
let moveInterval;
let crownPos = null;
let crownTimeout = null;
let startTime = null;
let timerInterval = null;

const gridContainer = document.getElementById('game-grid');
const startMsg = document.getElementById('startMsg');

// Improved Open Map
const map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,1,0,0,0,1,0,0,0,1,0,1],
  [1,1,1,0,1,1,1,0,1,1,1,0,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
  [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
  [1,1,1,0,1,1,1,0,1,1,1,0,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Upload handler for runner & chaser
function handleUpload(e, type) {
    const file = e.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = function (evt) {
      if (type === 'player') {
        playerImg = evt.target.result;
        document.getElementById('player-preview').src = playerImg;
        document.getElementById('player-preview').style.display = 'block';
        alert("✅ Player image uploaded!");
      } else if (type === 'chaser') {
        chaserImg = evt.target.result;
        document.getElementById('chaser-preview').src = chaserImg;
        document.getElementById('chaser-preview').style.display = 'block';
        alert("✅ Chaser image uploaded!");
      }
  
      // Enable start button if both are uploaded
      if (playerImg && chaserImg) {
        document.getElementById('start-game-btn').disabled = false;
      }
    };
    reader.readAsDataURL(file);
  }
  

// Build grid from map
function createGrid() {
  grid.length = 0;
  gridContainer.innerHTML = '';
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.x = x;
      cell.dataset.y = y;
      if (map[y][x] === 1) {
        cell.classList.add('wall');
      } else {
        cell.classList.add('path');
      }
      grid.push(cell);
      gridContainer.appendChild(cell);
    }
  }
  placeCharacters();
}

// Select from face images
function selectCharacter(imgPath) {
  playerImg = imgPath;
  document.getElementById('home-screen').style.display = 'none';
  document.getElementById('game-container').style.display = 'flex';
  createGrid();
  startCountdown();
}

// Get cell at grid position
function getCell(x, y) {
  return grid.find(c => +c.dataset.x === x && +c.dataset.y === y);
}

// Draw runner & chaser
function placeCharacters() {
  grid.forEach(cell => (cell.innerHTML = ''));

  const playerCell = getCell(playerPos.x, playerPos.y);
  const chaserCell = getCell(chaserPos.x, chaserPos.y);
  const crownCell = crownPos ? getCell(crownPos.x, crownPos.y) : null;

  if (playerCell) {
    const playerEl = document.createElement('img');
    playerEl.src = playerImg;
    playerEl.classList.add('player');
    playerCell.appendChild(playerEl);
  }

  if (chaserCell) {
    const chaserEl = document.createElement('img');
    chaserEl.src = chaserImg;
    chaserEl.classList.add('chaser');
    chaserCell.appendChild(chaserEl);
  }

  if (crownCell) {
    const crownEl = document.createElement('img');
    crownEl.src = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f451.png';
    crownEl.alt = 'Crown';
    crownEl.classList.add('crown');
    crownCell.appendChild(crownEl);
  }
}

// Countdown to start
function startCountdown() {
  const countdown = ["3", "2", "1", "GO!"];
  let i = 0;
  startMsg.style.display = 'block';
  startMsg.innerText = countdown[i];

  const timer = setInterval(() => {
    i++;
    if (i < countdown.length) {
      startMsg.innerText = countdown[i];
    } else {
      clearInterval(timer);
      startMsg.style.display = 'none';
      gameStarted = true;
      if (moveInterval) clearInterval(moveInterval);
      moveInterval = setInterval(moveChaser, 300);
      if (crownTimeout) clearTimeout(crownTimeout);
      crownPos = null;
      crownTimeout = setTimeout(placeCrown, 10000);
      startTime = Date.now();
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        const now = Date.now();
        const survived = Math.floor((now - startTime) / 1000);
      }, 1000);
    }
  }, 1000);
}

// Movement control
document.addEventListener('keydown', (e) => {
  if (!gameStarted) return;

  let nextX = playerPos.x;
  let nextY = playerPos.y;

  if (e.key === 'ArrowUp') nextY--;
  if (e.key === 'ArrowDown') nextY++;
  if (e.key === 'ArrowLeft') nextX--;
  if (e.key === 'ArrowRight') nextX++;

  if (map[nextY] && map[nextY][nextX] === 0) {
    playerPos = { x: nextX, y: nextY };
    placeCharacters();
  }
});

// Basic AI chaser
function moveChaser() {
  // Use BFS to find the shortest path from chaser to player
  function bfs(start, goal) {
    const queue = [[start]];
    const visited = Array(map.length).fill().map(() => Array(map[0].length).fill(false));
    visited[start.y][start.x] = true;
    const dirs = [
      { x: 0, y: -1 }, // up
      { x: 0, y: 1 },  // down
      { x: -1, y: 0 }, // left
      { x: 1, y: 0 }   // right
    ];
    while (queue.length) {
      const path = queue.shift();
      const { x, y } = path[path.length - 1];
      if (x === goal.x && y === goal.y) return path;
      for (const d of dirs) {
        const nx = x + d.x, ny = y + d.y;
        if (
          ny >= 0 && ny < map.length &&
          nx >= 0 && nx < map[0].length &&
          map[ny][nx] === 0 &&
          !visited[ny][nx]
        ) {
          visited[ny][nx] = true;
          queue.push([...path, { x: nx, y: ny }]);
        }
      }
    }
    return null;
  }

  const path = bfs(chaserPos, playerPos);
  if (path && path.length > 1) {
    chaserPos = { ...path[1] };
  }

  placeCharacters();

  // Check for player caught
  if (playerPos.x === chaserPos.x && playerPos.y === chaserPos.y) {
    endGame(false);
    return;
  }

  // Check for player win
  if (crownPos && playerPos.x === crownPos.x && playerPos.y === crownPos.y) {
    endGame(true);
    return;
  }
}

function getRandomEmptyCell() {
  let emptyCells = [];
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      if (
        map[y][x] === 0 &&
        !(playerPos.x === x && playerPos.y === y) &&
        !(chaserPos.x === x && chaserPos.y === y)
      ) {
        emptyCells.push({ x, y });
      }
    }
  }
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function placeCrown() {
  crownPos = getRandomEmptyCell();
  placeCharacters();
}

function startGame() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    createGrid();
    if (moveInterval) clearInterval(moveInterval);
    if (crownTimeout) clearTimeout(crownTimeout);
    crownPos = null;
    gameStarted = false;
    startCountdown();
  }

function updateHighscoreDisplay() {
  const hs = localStorage.getItem('highscore') || '0';
  document.getElementById('highscore').textContent = hs;
}

function setHighscoreIfNeeded(timeSurvived) {
  const prev = parseInt(localStorage.getItem('highscore') || '0', 10);
  if (timeSurvived > prev) {
    localStorage.setItem('highscore', timeSurvived);
    updateHighscoreDisplay();
  }
}

function endGame(win) {
  if (moveInterval) clearInterval(moveInterval);
  if (timerInterval) clearInterval(timerInterval);
  const survived = Math.floor((Date.now() - startTime) / 1000);
  setHighscoreIfNeeded(survived);
  if (win) {
    alert("👑 You Win! You got the crown.\nTime survived: " + survived + " sec");
  } else {
    alert("😵 Game Over! You were caught.\nTime survived: " + survived + " sec");
  }
  location.reload();
}

function getRecentCharacters() {
  return JSON.parse(localStorage.getItem('recentCharacters') || '[]');
}
function setRecentCharacters(chars) {
  localStorage.setItem('recentCharacters', JSON.stringify(chars));
}
function addRecentCharacter(dataUrl, type) {
  let chars = getRecentCharacters();
  // Remove duplicate
  chars = chars.filter(c => c.dataUrl !== dataUrl);
  // Add new to front
  chars.unshift({ dataUrl, type });
  // Limit to 6
  if (chars.length > 6) chars = chars.slice(0, 6);
  setRecentCharacters(chars);
  renderRecentCharacters();
}
function deleteRecentCharacter(idx) {
  let chars = getRecentCharacters();
  chars.splice(idx, 1);
  setRecentCharacters(chars);
  renderRecentCharacters();
}
function renderRecentCharacters() {
  const container = document.getElementById('my-characters');
  if (!container) return;
  container.innerHTML = '';
  const chars = getRecentCharacters();
  chars.forEach((c, i) => {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    const img = document.createElement('img');
    img.src = c.dataUrl;
    img.className = 'character-user';
    img.title = c.type === 'player' ? 'Player' : 'Chaser';
    img.onclick = () => {
      if (c.type === 'player') {
        playerImg = c.dataUrl;
        document.getElementById('player-preview').src = playerImg;
        document.getElementById('player-preview').style.display = 'block';
      } else {
        chaserImg = c.dataUrl;
        document.getElementById('chaser-preview').src = chaserImg;
        document.getElementById('chaser-preview').style.display = 'block';
      }
      // Enable start if both
      if (playerImg && chaserImg) {
        document.getElementById('start-game-btn').disabled = false;
      }
    };
    const del = document.createElement('button');
    del.className = 'character-delete';
    del.innerHTML = '&times;';
    del.onclick = (e) => {
      e.stopPropagation();
      deleteRecentCharacter(i);
    };
    wrapper.appendChild(img);
    wrapper.appendChild(del);
    container.appendChild(wrapper);
  });
}
// Patch handleUpload to store recent characters
const origHandleUpload = handleUpload;
window.handleUpload = function(e, type) {
  origHandleUpload(e, type);
  setTimeout(() => {
    if (type === 'player' && playerImg) addRecentCharacter(playerImg, 'player');
    if (type === 'chaser' && chaserImg) addRecentCharacter(chaserImg, 'chaser');
  }, 100);
};
window.addEventListener('DOMContentLoaded', () => {
  updateHighscoreDisplay && updateHighscoreDisplay();
  renderRecentCharacters();
});
  