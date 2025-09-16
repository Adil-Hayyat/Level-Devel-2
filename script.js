// Dungeon Runner — Browser version (2 levels)
// Save as script.js

(() => {
  // DOM
  const el = id => document.getElementById(id);
  const logEl = el('log');
  const startBtn = el('start-btn');
  const attackBtn = el('attack-btn');
  const potionBtn = el('potion-btn');
  const fleeBtn = el('flee-btn');
  const nextLevelBtn = el('next-level-btn');
  const nameInput = el('name-input');

  // HUD
  const playerNameEl = el('player-name');
  const playerHpEl = el('player-hp');
  const playerMaxHpEl = el('player-maxhp');
  const playerAttackEl = el('player-attack');
  const playerPotionsEl = el('player-potions');
  const playerLevelEl = el('player-level');

  const enemyNameEl = el('enemy-name');
  const enemyHpEl = el('enemy-hp');
  const enemyAttackEl = el('enemy-attack');

  // Game state
  let state = {
    player: null,
    enemy: null,
    level: 1,
    enemiesRemaining: 0,
    inBattle: false,
    gameOver: false
  };

  function randRange(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

  function initialPlayer(name) {
    return {
      name: name || 'Hero',
      maxHp: 40,
      hp: 40,
      attack: 6,
      level: 1,
      potions: 2
    };
  }

  function makeEnemyForLevel(lvl, idx) {
    if (lvl === 1) {
      return {
        name: `Goblin #${idx+1}`,
        hp: randRange(10, 20),
        attack: randRange(3, 6)
      };
    } else {
      const names = ['Orc', 'Bandit', 'Warrior'];
      const n = names[idx % names.length];
      return {
        name: `${n} #${idx+1}`,
        hp: randRange(18, 32),
        attack: randRange(5, 9)
      };
    }
  }

  function writeLog(text) {
    const d = document.createElement('div');
    d.className = 'log-line';
    d.textContent = text;
    logEl.appendChild(d);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function updateHUD() {
    const p = state.player;
    const e = state.enemy;
    playerNameEl.textContent = p.name;
    playerHpEl.textContent = Math.max(0, p.hp);
    playerMaxHpEl.textContent = p.maxHp;
    playerAttackEl.textContent = p.attack;
    playerPotionsEl.textContent = p.potions;
    playerLevelEl.textContent = p.level;

    if (e) {
      enemyNameEl.textContent = e.name;
      enemyHpEl.textContent = Math.max(0, e.hp);
      enemyAttackEl.textContent = e.attack;
    } else {
      enemyNameEl.textContent = '—';
      enemyHpEl.textContent = '0';
      enemyAttackEl.textContent = '0';
    }
  }

  function enableControls(battle) {
    attackBtn.disabled = !battle;
    potionBtn.disabled = !battle;
    fleeBtn.disabled = !battle;
    nextLevelBtn.disabled = state.inBattle || state.enemiesRemaining > 0 || state.gameOver;
  }

  function startGame() {
    // set up player & level
    const name = nameInput.value.trim();
    state.player = initialPlayer(name);
    state.level = 1;
    state.player.level = 1;
    state.enemiesRemaining = 3;
    state.inBattle = false;
    state.gameOver = false;
    logEl.innerHTML = '';
    writeLog(`Welcome ${state.player.name}! Level 1 begins. There are ${state.enemiesRemaining} enemies.`);
    spawnEnemy();
    updateHUD();
    enableControls(true);
  }

  function spawnEnemy() {
    if (state.enemiesRemaining <= 0) {
      writeLog(`No more enemies in Level ${state.level}.`);
      state.enemy = null;
      updateHUD();
      enableControls(false);
      nextLevelBtn.disabled = false;
      return;
    }
    const idx = 3 - state.enemiesRemaining;
    state.enemy = makeEnemyForLevel(state.level, idx);
    state.inBattle = true;
    writeLog(`A ${state.enemy.name} appears! (HP ${state.enemy.hp}, Attack ${state.enemy.attack})`);
    updateHUD();
    enableControls(true);
  }

  function playerAttack() {
    if (!state.inBattle || state.gameOver) return;
    const p = state.player, e = state.enemy;
    const dmg = Math.max(1, randRange(p.attack - 1, p.attack + 2));
    e.hp -= dmg;
    writeLog(`${p.name} attacks ${e.name} for ${dmg} damage.`);
    if (e.hp <= 0) {
      writeLog(`${e.name} was defeated!`);
      afterEnemyDefeat();
    } else {
      enemyTurn();
    }
    updateHUD();
  }

  function enemyTurn() {
    const p = state.player, e = state.enemy;
    const dmg = Math.max(1, randRange(e.attack - 1, e.attack + 1));
    p.hp -= dmg;
    writeLog(`${e.name} hits ${p.name} for ${dmg} damage.`);
    if (p.hp <= 0) {
      p.hp = 0;
      writeLog(`${p.name} has been defeated... Game Over.`);
      state.gameOver = true;
      state.inBattle = false;
      enableControls(false);
    }
    updateHUD();
  }

  function afterEnemyDefeat() {
    // reward
    const heal = randRange(2, 6);
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
    const chance = randRange(1,100);
    if (chance <= (state.level === 1 ? 40 : 25)) {
      state.player.potions += 1;
      writeLog(`You found a potion!`);
    }
    writeLog(`You recovered ${heal} HP after the fight.`);
    state.enemiesRemaining -= 1;
    state.inBattle = false;
    state.enemy = null;
    updateHUD();
    enableControls(false);

    if (state.enemiesRemaining > 0 && !state.gameOver) {
      // small delay then spawn next enemy
      setTimeout(() => {
        if (!state.gameOver) spawnEnemy();
      }, 700);
    } else if (!state.gameOver) {
      writeLog(`Level ${state.level} cleared!`);
      // level-up
      state.player.level += 1;
      state.player.maxHp += (state.level === 1 ? 5 : 8);
      state.player.attack += (state.level === 1 ? 1 : 2);
      state.player.hp = state.player.maxHp; // heal fully
      writeLog(`You leveled up! Now Level ${state.player.level}. Max HP: ${state.player.maxHp}, Attack: ${state.player.attack}`);
      nextLevelBtn.disabled = false;
      updateHUD();
    }
  }

  function usePotion() {
    const p = state.player;
    if (p.potions <= 0) {
      writeLog('No potions available!');
      return;
    }
    const heal = randRange(8, 15);
    p.hp = Math.min(p.maxHp, p.hp + heal);
    p.potions -= 1;
    writeLog(`${p.name} uses a potion and heals ${heal} HP.`);
    // enemy still attacks after you use potion
    if (state.inBattle && state.enemy) {
      setTimeout(enemyTurn, 300);
    }
    updateHUD();
  }

  function tryFlee() {
    if (!state.inBattle || !state.enemy) return;
    const roll = randRange(1,100);
    if (roll <= 50) {
      writeLog(`${state.player.name} successfully fled from ${state.enemy.name}!`);
      // small penalty
      const penalty = randRange(2, 5);
      state.player.hp = Math.max(0, state.player.hp - penalty);
      writeLog(`While fleeing you lost ${penalty} HP.`);
      state.enemy = null;
      state.inBattle = false;
      // ask to continue (here we default to continue automatic spawn)
      if (state.player.hp <= 0) {
        writeLog(`${state.player.name} collapsed from wounds... Game Over.`);
        state.gameOver = true;
        enableControls(false);
        return;
      }
      // choose to continue or retreat -> to keep UI simple we spawn next enemy automatically
      state.enemiesRemaining -= 1; // fleeing counts as skipping one enemy
      updateHUD();
      enableControls(false);
      setTimeout(() => {
        if (!state.gameOver) {
          if (state.enemiesRemaining > 0) spawnEnemy();
          else afterEnemyDefeat();
        }
      }, 700);
    } else {
      writeLog('Flee failed! Enemy attacks you as you try to run.');
      enemyTurn();
      updateHUD();
    }
  }

  function goToNextLevel() {
    if (state.level >= 2) {
      writeLog('No more levels. You already finished both levels!');
      return;
    }
    state.level = 2;
    state.enemiesRemaining = 4;
    state.inBattle = false;
    state.enemy = null;
    state.gameOver = false;
    writeLog('Entering Level 2 — harder enemies ahead!');
    nextLevelBtn.disabled = true;
    setTimeout(spawnEnemy, 600);
    enableControls(true);
    updateHUD();
  }

  // Event listeners
  startBtn.addEventListener('click', () => {
    startGame();
  });
  attackBtn.addEventListener('click', () => playerAttack());
  potionBtn.addEventListener('click', () => usePotion());
  fleeBtn.addEventListener('click', () => tryFlee());
  nextLevelBtn.addEventListener('click', () => goToNextLevel());

  // init display
  updateHUD();
  enableControls(false);

})();
