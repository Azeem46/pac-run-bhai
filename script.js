const gridSize = 15;
const grid = [];
let playerPos = { x: 1, y: 1 };
let chaserPos = { x: 13, y: 9 };
let gameStarted = false;
let playerImg = '';
let chaserImg = 'chaser.jpg'; // Default chaser image
let moveInterval;
let crownPos = null;
let crownTimeout = null;
let startTime = null;
let timerInterval = null;
let powerUpPos = null;
let powerUpTimeout = null;
let playerSpeedBoost = false;
let playerSpeedBoostTimeout = null;
let playerSlowed = false;
let chaserSlowed = false;
let gameMode = 'classic';
let chasers = [];
let movingObstacles = [];
let teleporters = [];
let timedEventTimeout = null;
let bgAudio = null;
let soundEnabled = true;

// Touch controls for mobile
let touchStartX = null, touchStartY = null;

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

// Animate player/chaser on move
function animateMove(type, pos) {
  const cell = getCell(pos.x, pos.y);
  if (!cell) return;
  const img = cell.querySelector(type === 'player' ? '.player' : '.chaser');
  if (img) {
    img.classList.remove('bounce');
    void img.offsetWidth; // force reflow
    img.classList.add('bounce');
    setTimeout(() => img.classList.remove('bounce'), 250);
  }
}

// Patch placeCharacters to animate on move
let lastPlayerPos = { x: 1, y: 1 };
let lastChaserPos = { x: 13, y: 9 };
function placeCharacters() {
  grid.forEach(cell => (cell.innerHTML = ''));

  const playerCell = getCell(playerPos.x, playerPos.y);
  const chaserCell = getCell(chaserPos.x, chaserPos.y);
  const crownCell = crownPos ? getCell(crownPos.x, crownPos.y) : null;
  const powerUpCell = powerUpPos ? getCell(powerUpPos.x, powerUpPos.y) : null;

  // Render obstacles
  grid.forEach(cell => {
    const x = +cell.dataset.x, y = +cell.dataset.y;
    if (map[y][x] === 2) {
      const obs = document.createElement('div');
      obs.className = 'obstacle';
      cell.appendChild(obs);
    }
  });

  if (playerCell) {
    const playerEl = document.createElement('img');
    playerEl.src = playerImg;
    playerEl.classList.add('player');
    playerCell.appendChild(playerEl);
    if (playerPos.x !== lastPlayerPos.x || playerPos.y !== lastPlayerPos.y) {
      animateMove('player', playerPos);
    }
  }

  if (chaserCell) {
    const chaserEl = document.createElement('img');
    chaserEl.src = chaserImg;
    chaserEl.classList.add('chaser');
    chaserCell.appendChild(chaserEl);
    if (chaserPos.x !== lastChaserPos.x || chaserPos.y !== lastChaserPos.y) {
      animateMove('chaser', chaserPos);
    }
  }

  if (crownCell) {
    const crownEl = document.createElement('img');
    crownEl.src = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f451.png';
    crownEl.alt = 'Crown';
    crownEl.classList.add('crown');
    crownCell.appendChild(crownEl);
  }

  if (powerUpCell) {
    const powerEl = document.createElement('img');
    powerEl.src = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/26a1.png';
    powerEl.alt = 'Power-Up';
    powerEl.className = 'powerup';
    powerUpCell.appendChild(powerEl);
  }
  lastPlayerPos = { ...playerPos };
  lastChaserPos = { ...chaserPos };
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
      moveInterval = setInterval(moveChasers, 300);
      if (crownTimeout) clearTimeout(crownTimeout);
      crownPos = null;
      crownTimeout = setTimeout(placeCrown, 10000);
      startTime = Date.now();
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        const now = Date.now();
        const survived = Math.floor((now - startTime) / 1000);
      }, 1000);
      if (powerUpTimeout) clearTimeout(powerUpTimeout);
      powerUpPos = null;
      powerUpTimeout = setTimeout(placePowerUp, 7000);
    }
  }, 1000);
}

// Touch controls for mobile
function handleTouchStart(e) {
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
}
function handleTouchEnd(e) {
  if (touchStartX === null || touchStartY === null) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
    // Horizontal swipe
    if (dx > 0) movePlayer('right');
    else movePlayer('left');
  } else if (Math.abs(dy) > 30) {
    // Vertical swipe
    if (dy > 0) movePlayer('down');
    else movePlayer('up');
  }
  touchStartX = null;
  touchStartY = null;
}
function movePlayer(direction) {
  if (!gameStarted) return;
  if (playerSlowed) {
    playerSlowed = false;
    return; // Skip this turn
  }
  let nextX = playerPos.x;
  let nextY = playerPos.y;
  if (direction === 'up') nextY--;
  if (direction === 'down') nextY++;
  if (direction === 'left') nextX--;
  if (direction === 'right') nextX++;
  if (map[nextY] && (map[nextY][nextX] === 0 || map[nextY][nextX] === 2)) {
    playerPos = { x: nextX, y: nextY };
    // Teleporter logic (advanced mode)
    if (gameMode === 'advanced') {
      const tp = teleporters.find(t => t.x === playerPos.x && t.y === playerPos.y);
      if (tp) {
        playerPos = { x: tp.tx, y: tp.ty };
      }
    }
    // Power-up collection
    if (powerUpPos && playerPos.x === powerUpPos.x && playerPos.y === powerUpPos.y) {
      playerSpeedBoost = true;
      if (playerSpeedBoostTimeout) clearTimeout(playerSpeedBoostTimeout);
      playerSpeedBoostTimeout = setTimeout(() => { playerSpeedBoost = false; }, 5000);
      powerUpPos = null;
      placeCharacters();
      // TODO: Add sound/effect
    }
    // If stepped on obstacle, slow next move
    if (map[nextY][nextX] === 2) {
      playerSlowed = true;
    }
    placeCharacters();
  }
}

// Patch keyboard to use movePlayer
document.addEventListener('keydown', (e) => {
  if (!gameStarted) return;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
    e.preventDefault();
    if (e.key === 'ArrowUp') movePlayer('up');
    if (e.key === 'ArrowDown') movePlayer('down');
    if (e.key === 'ArrowLeft') movePlayer('left');
    if (e.key === 'ArrowRight') movePlayer('right');
  }
});

// Add touch listeners to both game-container and game-grid
document.getElementById('game-container').addEventListener('touchstart', handleTouchStart, { passive: false });
document.getElementById('game-container').addEventListener('touchend', handleTouchEnd, { passive: false });
document.getElementById('game-grid').addEventListener('touchstart', handleTouchStart, { passive: false });
document.getElementById('game-grid').addEventListener('touchend', handleTouchEnd, { passive: false });

// Basic AI chaser
function moveChaser() {
  if (chaserSlowed) {
    chaserSlowed = false;
    placeCharacters();
    // Still check for win/lose
    if (playerPos.x === chaserPos.x && playerPos.y === chaserPos.y) {
      endGame(false);
      return;
    }
    if (crownPos && playerPos.x === crownPos.x && playerPos.y === crownPos.y) {
      endGame(true);
      return;
    }
    return; // Skip this turn
  }
  // Use BFS to find the shortest path from chaser to player
  function bfs(start, goal) {
    const queue = [[start]];
    const visited = Array(map.length).fill().map(() => Array(map[0].length).fill(false));
    visited[start.y][start.x] = true;
    const dirs = [
      { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
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
    const next = path[1];
    // If next cell is obstacle, slow chaser next turn
    if (map[next.y][next.x] === 2) {
      chaserSlowed = true;
    }
    chaserPos = { ...next };
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

// Listen for mode change
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', e => {
      gameMode = e.target.value;
    });
  });
});

function setupAdvancedMode() {
  // Add a second chaser with different AI
  chasers = [
    { x: 13, y: 9, type: 'normal' },
    { x: 1, y: 9, type: 'random' }
  ];
  // Example: add a moving obstacle
  movingObstacles = [{ x: 7, y: 5, dir: 1 }];
  // Teleporter setup: avoid player/chaser spawn points
  function safeTeleporterCell(avoid) {
    let emptyCells = [];
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[0].length; x++) {
        if (
          map[y][x] === 0 &&
          !avoid.some(pos => pos.x === x && pos.y === y)
        ) {
          emptyCells.push({ x, y });
        }
      }
    }
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }
  const avoid = [
    { x: playerPos.x, y: playerPos.y },
    ...chasers.map(c => ({ x: c.x, y: c.y }))
  ];
  const tp1 = safeTeleporterCell(avoid);
  avoid.push(tp1);
  const tp2 = safeTeleporterCell(avoid);
  teleporters = [
    { x: tp1.x, y: tp1.y, tx: tp2.x, ty: tp2.y },
    { x: tp2.x, y: tp2.y, tx: tp1.x, ty: tp1.y }
  ];
  // Timed event: double speed for 10 seconds every 20 seconds
  function triggerTimedEvent() {
    playerSpeedBoost = true;
    if (playerSpeedBoostTimeout) clearTimeout(playerSpeedBoostTimeout);
    playerSpeedBoostTimeout = setTimeout(() => { playerSpeedBoost = false; }, 10000);
    timedEventTimeout = setTimeout(triggerTimedEvent, 20000);
  }
  if (timedEventTimeout) clearTimeout(timedEventTimeout);
  timedEventTimeout = setTimeout(triggerTimedEvent, 20000);
}

function clearAdvancedMode() {
  chasers = [];
  movingObstacles = [];
  teleporters = [];
  if (timedEventTimeout) clearTimeout(timedEventTimeout);
}

function updateSoundIcon() {
  const btn = document.getElementById('sound-toggle-btn');
  if (btn) btn.innerHTML = '<span class="sr-only">Toggle sound</span>' + (soundEnabled ? '🔊' : '🔇');
}
function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem('soundEnabled', soundEnabled ? '1' : '0');
  updateSoundIcon();
  if (bgAudio) bgAudio.muted = !soundEnabled;
}
window.addEventListener('DOMContentLoaded', () => {
  soundEnabled = localStorage.getItem('soundEnabled') !== '0';
  updateSoundIcon();
});

function playClassicMusic() {
  if (bgAudio) {
    bgAudio.pause();
    bgAudio.currentTime = 0;
  }
  bgAudio = new Audio('audio/robot.mp3');
  bgAudio.loop = true;
  bgAudio.volume = 0.5;
  bgAudio.muted = !soundEnabled;
  bgAudio.play();
}
function playAdvancedMusic() {
  if (bgAudio) {
    bgAudio.pause();
    bgAudio.currentTime = 0;
  }
  bgAudio = new Audio('audio/robot.mp3');
  bgAudio.loop = true;
  bgAudio.volume = 0.5;
  bgAudio.muted = !soundEnabled;
  bgAudio.playbackRate = 1.5;
  bgAudio.play();
}

function startGame() {
  document.getElementById('home-screen').style.display = 'none';
  document.getElementById('game-container').style.display = 'flex';
  createGrid();
  if (moveInterval) clearInterval(moveInterval);
  if (crownTimeout) clearTimeout(crownTimeout);
  crownPos = null;
  gameStarted = false;
  if (gameMode === 'advanced') {
    clearAdvancedMode();
    setupAdvancedMode();
    playAdvancedMusic();
  } else {
    clearAdvancedMode();
    playClassicMusic();
  }
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
  if (bgAudio) bgAudio.pause();
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

// Power-up spawn logic
function placePowerUp() {
  let emptyCells = [];
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      if (
        map[y][x] === 0 &&
        !(playerPos.x === x && playerPos.y === y) &&
        !(chaserPos.x === x && chaserPos.y === y) &&
        !(crownPos && crownPos.x === x && crownPos.y === y)
      ) {
        emptyCells.push({ x, y });
      }
    }
  }
  powerUpPos = emptyCells.length ? emptyCells[Math.floor(Math.random() * emptyCells.length)] : null;
  placeCharacters();
}

// High-contrast mode toggle
function toggleHighContrast() {
  document.body.classList.toggle('high-contrast');
  localStorage.setItem('highContrast', document.body.classList.contains('high-contrast') ? '1' : '0');
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.innerHTML = '<span class="sr-only">Toggle high contrast mode</span>' + (document.body.classList.contains('high-contrast') ? '🌙' : '🌞');
}

// On load, restore high-contrast
window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('highContrast') === '1') document.body.classList.add('high-contrast');
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.innerHTML = '<span class="sr-only">Toggle high contrast mode</span>' + (document.body.classList.contains('high-contrast') ? '🌙' : '🌞');
  document.querySelectorAll('.character, .character-user, .character-delete, #start-game-btn, .share-btn, .high-contrast-btn').forEach(el => {
    el.setAttribute('tabindex', '0');
  });
});

// Share feature
function shareBestTime() {
  const hs = localStorage.getItem('highscore') || '0';
  const text = `My best time in Pac-Run Bhai: ${hs} seconds! Can you beat me?`;
  if (navigator.share) {
    navigator.share({ title: 'Pac-Run Bhai', text });
  } else {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  }
}

function moveChasers() {
  if (gameMode !== 'advanced') {
    moveChaser();
    return;
  }
  // Timed event: double chaser speed
  let chaserMoves = 1;
  if (window.chaserSpeedBoost) chaserMoves = 2;
  for (let m = 0; m < chaserMoves; m++) {
    for (let i = 0; i < chasers.length; i++) {
      let chaser = chasers[i];
      if (chaser.type === 'normal') {
        // BFS to player
        function bfs(start, goal) {
          const queue = [[start]];
          const visited = Array(map.length).fill().map(() => Array(map[0].length).fill(false));
          visited[start.y][start.x] = true;
          const dirs = [
            { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
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
                map[ny][nx] !== 1 &&
                !visited[ny][nx] &&
                !chasers.some((c, idx) => idx !== i && c.x === nx && c.y === ny)
              ) {
                visited[ny][nx] = true;
                queue.push([...path, { x: nx, y: ny }]);
              }
            }
          }
          return null;
        }
        const path = bfs(chaser, playerPos);
        if (path && path.length > 1) {
          const next = path[1];
          // Teleporters
          const tp = teleporters.find(t => t.x === next.x && t.y === next.y);
          if (tp) {
            chaser.x = tp.tx;
            chaser.y = tp.ty;
          } else {
            chaser.x = next.x;
            chaser.y = next.y;
          }
          // Obstacle slow
          if (map[chaser.y][chaser.x] === 2) chaser.slowed = true;
        }
      } else if (chaser.type === 'random') {
        // Random valid move
        const dirs = [
          { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
        ];
        const moves = dirs.map(d => ({ x: chaser.x + d.x, y: chaser.y + d.y }))
          .filter(pos =>
            pos.y >= 0 && pos.y < map.length &&
            pos.x >= 0 && pos.x < map[0].length &&
            map[pos.y][pos.x] !== 1 &&
            !chasers.some((c, idx) => idx !== i && c.x === pos.x && c.y === pos.y)
          );
        if (moves.length) {
          const next = moves[Math.floor(Math.random() * moves.length)];
          // Teleporters
          const tp = teleporters.find(t => t.x === next.x && t.y === next.y);
          if (tp) {
            chaser.x = tp.tx;
            chaser.y = tp.ty;
          } else {
            chaser.x = next.x;
            chaser.y = next.y;
          }
          if (map[chaser.y][chaser.x] === 2) chaser.slowed = true;
        }
      }
      // Obstacle slow
      if (chaser.slowed) {
        chaser.slowed = false;
        break; // skip this chaser's move this turn
      }
      // Check for player caught
      if (playerPos.x === chaser.x && playerPos.y === chaser.y) {
        endGame(false);
        return;
      }
    }
  }
  placeCharacters();
  // Check for player win
  if (crownPos && playerPos.x === crownPos.x && playerPos.y === crownPos.y) {
    endGame(true);
    return;
  }
}

// Move moving obstacles every second in advanced mode
setInterval(() => {
  if (gameMode !== 'advanced' || !movingObstacles.length) return;
  for (let obs of movingObstacles) {
    // Move horizontally, bounce at walls
    let nx = obs.x + obs.dir;
    if (nx < 0 || nx >= map[0].length || map[obs.y][nx] === 1) {
      obs.dir *= -1;
      nx = obs.x + obs.dir;
    }
    if (map[obs.y][nx] === 0) obs.x = nx;
  }
  placeCharacters();
}, 1000);

// Patch placeCharacters to render all chasers, moving obstacles, and teleporters
function placeCharacters() {
  grid.forEach(cell => (cell.innerHTML = ''));
  // Render obstacles
  grid.forEach(cell => {
    const x = +cell.dataset.x, y = +cell.dataset.y;
    if (map[y][x] === 2) {
      const obs = document.createElement('div');
      obs.className = 'obstacle';
      cell.appendChild(obs);
    }
  });
  // Render moving obstacles
  if (gameMode === 'advanced') {
    for (let obs of movingObstacles) {
      const cell = getCell(obs.x, obs.y);
      if (cell) {
        const mob = document.createElement('div');
        mob.className = 'obstacle';
        mob.style.background = 'repeating-linear-gradient(45deg,#f44336 0 10px,#b71c1c 10px 20px)';
        mob.style.borderColor = '#f44336';
        cell.appendChild(mob);
      }
    }
  }
  // Render teleporters
  if (gameMode === 'advanced') {
    for (let tp of teleporters) {
      const cell = getCell(tp.x, tp.y);
      if (cell) {
        const tel = document.createElement('div');
        tel.className = 'teleporter';
        tel.title = 'Teleporter';
        cell.appendChild(tel);
      }
    }
  }
  // Player
  const playerCell = getCell(playerPos.x, playerPos.y);
  if (playerCell) {
    const playerEl = document.createElement('img');
    playerEl.src = playerImg;
    playerEl.classList.add('player');
    playerCell.appendChild(playerEl);
    if (playerPos.x !== lastPlayerPos.x || playerPos.y !== lastPlayerPos.y) {
      animateMove('player', playerPos);
    }
  }
  // Chasers
  if (gameMode === 'advanced') {
    for (let chaser of chasers) {
      const chaserCell = getCell(chaser.x, chaser.y);
      if (chaserCell) {
        const chaserEl = document.createElement('img');
        chaserEl.src = chaserImg;
        chaserEl.classList.add('chaser');
        chaserCell.appendChild(chaserEl);
        if (chaser.x !== lastChaserPos.x || chaser.y !== lastChaserPos.y) {
          animateMove('chaser', chaser);
        }
      }
    }
  } else {
    const chaserCell = getCell(chaserPos.x, chaserPos.y);
    if (chaserCell) {
      const chaserEl = document.createElement('img');
      chaserEl.src = chaserImg;
      chaserEl.classList.add('chaser');
      chaserCell.appendChild(chaserEl);
      if (chaserPos.x !== lastChaserPos.x || chaserPos.y !== lastChaserPos.y) {
        animateMove('chaser', chaserPos);
      }
    }
  }
  // Crown
  const crownCell = crownPos ? getCell(crownPos.x, crownPos.y) : null;
  if (crownCell) {
    const crownEl = document.createElement('img');
    crownEl.src = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f451.png';
    crownEl.alt = 'Crown';
    crownEl.classList.add('crown');
    crownCell.appendChild(crownEl);
  }
  // Power-up
  const powerUpCell = powerUpPos ? getCell(powerUpPos.x, powerUpPos.y) : null;
  if (powerUpCell) {
    const powerEl = document.createElement('img');
    powerEl.src = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/26a1.png';
    powerEl.alt = 'Power-Up';
    powerEl.className = 'powerup';
    powerUpCell.appendChild(powerEl);
  }
  lastPlayerPos = { ...playerPos };
  lastChaserPos = { ...chaserPos };
}

// Joystick controls for mobile
function setupJoystick() {
  if (window.innerWidth >= 700) return;
  const joy = document.getElementById('joystick');
  if (!joy) return;
  joy.querySelector('.joy-up').addEventListener('touchstart', e => { e.preventDefault(); movePlayer('up'); });
  joy.querySelector('.joy-down').addEventListener('touchstart', e => { e.preventDefault(); movePlayer('down'); });
  joy.querySelector('.joy-left').addEventListener('touchstart', e => { e.preventDefault(); movePlayer('left'); });
  joy.querySelector('.joy-right').addEventListener('touchstart', e => { e.preventDefault(); movePlayer('right'); });
  // Also support click for accessibility
  joy.querySelector('.joy-up').addEventListener('click', () => movePlayer('up'));
  joy.querySelector('.joy-down').addEventListener('click', () => movePlayer('down'));
  joy.querySelector('.joy-left').addEventListener('click', () => movePlayer('left'));
  joy.querySelector('.joy-right').addEventListener('click', () => movePlayer('right'));
}
window.addEventListener('DOMContentLoaded', setupJoystick);
  