document.addEventListener('DOMContentLoaded', () => {
  // DOM元素
  const joinScreen = document.getElementById('join-screen');
  const waitingScreen = document.getElementById('waiting-screen');
  const gameScreen = document.getElementById('game-screen');
  const playerNameInput = document.getElementById('player-name');
  const joinBtn = document.getElementById('join-btn');
  const readyBtn = document.getElementById('ready-btn');
  const playersList = document.querySelector('.players-list');
  const playerCount = document.getElementById('player-count');
  const playerCards = document.querySelector('.player-cards');
  const communityCards = document.querySelector('.cards-container');
  const dealFlopBtn = document.getElementById('deal-flop-btn');
  const dealTurnBtn = document.getElementById('deal-turn-btn');
  const dealRiverBtn = document.getElementById('deal-river-btn');
  // const compareBtn = document.getElementById('compare-btn');
  const newGameBtn = document.getElementById('new-game-btn');
  // const betBtn = document.getElementById('deal-bet-btn');
  
  // 连接Socket.IO
  const socket = io();
  let currentPlayerId = null;

// 初始化游戏
let isDealer = false;

document.getElementById('become-dealer-btn').addEventListener('click', function() {
    socket.emit('player-become');
});

// 初始化游戏
  
  // 加入游戏按钮点击事件
  joinBtn.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim();
    if (playerName.length < 2) {
      alert('请输入至少2个字符的名字');
      return;
    }
    
    socket.emit('join-game', playerName);
  });
  
  // 下注按钮点击事件
  // betBtn.addEventListener('click', () => {
  //   socket.emit('player-bet', 500);
  // });
  
  document.querySelectorAll('.btn-bet').forEach(button => {
    button.addEventListener('click', () => {
      const betAmount = parseInt(button.dataset.bet);
      socket.emit('player-bet', betAmount);
    });
  });


  // 准备按钮点击事件
  readyBtn.addEventListener('click', () => {
    socket.emit('player-ready');
  });
  
  // 发牌按钮事件
  dealFlopBtn.addEventListener('click', () => socket.emit('request-community-cards'));
  dealTurnBtn.addEventListener('click', () => socket.emit('request-community-cards'));
  dealRiverBtn.addEventListener('click', () => socket.emit('request-community-cards'));
  // 新游戏按钮事件
  newGameBtn.addEventListener('click', () => {
    socket.emit('re-start')
  });
  
  // // 比较按钮点击事件
  // compareBtn.addEventListener('click', () => {
  //   compareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 比较中...';
  //   compareBtn.disabled = true;
  //     showGameResult();
  //     socket.emit('request-community-cards')
  // });
  // Socket.IO事件处理
  
  // 玩家加入游戏成功
  socket.on('player-joined', (player) => {
    currentPlayerId = player.id;
    joinScreen.classList.add('hidden');
    waitingScreen.classList.remove('hidden');
  });
  
  // 游戏已经开始
  socket.on('game-already-started', () => {
    alert('游戏已经开始，无法加入新玩家');
  });
  
  // 更新玩家列表
  socket.on('update-players', (players) => {
    playerCount.textContent = players.length;
    
    // 清空玩家列表
    playersList.innerHTML = '';
    
    // 添加玩家
    players.forEach((player,index) => {

      const playerCard = document.createElement('div');
      playerCard.className = 'player-card';
      
      playerCard.innerHTML = `
        <div class="player-avatar">
          <span>${index + 1}</span>
          <i class="fas fa-user"></i>
        </div>
        <div class="player-info">
          <span class="player-name">${player.name}</span>
          <span class="player-status ${player.ready ? 'ready' : 'waiting'}">
            ${player.ready ? '已准备' : '等待中'}
          </span>
        </div>
      `;
      
      playersList.appendChild(playerCard);
    });
  });
  
  socket.on('player-bet', (players) => {
    const playersContainer = document.getElementById('players-list')
    playersContainer.innerHTML = '';
    // 添加玩家
    players.forEach((player,index) => {
      const inPlayerCard = document.createElement('div');
      inPlayerCard.className = 'player-cardIn';
      inPlayerCard.innerHTML = `
        <div class="player-avatar">
                  <span>${index + 1}</span>
          <i class="fas fa-user"></i>
        </div>
        <div class="player-info">
          <span class="player-name">${player.name}</span>
          <span class="player-name">下注：${player.bet}</span>
          ${player.crown ? '<i class="fas fa-crown crown-icon crownCss"></i>' : ''}
        </div>
      `;
      playersContainer.appendChild(inPlayerCard);
    });
    gameScreen.insertBefore(playersContainer, gameScreen.firstChild);

  })

  // 游戏开始
  socket.on('game-started', (data) => {
    waitingScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    // 更新玩家列表
    const playersContainer = document.getElementById('players-list') ? document.getElementById('players-list') :document.createElement('div');
    playersContainer.className = 'players-list';
    playersContainer.id = 'players-list';
    playersContainer.innerHTML = '';
    data.players.forEach((player,index) => {

      const playerCard = document.createElement('div');
      playerCard.className = 'player-cardIn';
      playerCard.innerHTML = `
        <div class="player-avatar">
          <span>${index + 1}</span>
          <i class="fas fa-user"></i>
        </div>
        <div class="player-info">
          <span class="player-name">${player.name}</span>
        </div>
      `;
      playersContainer.appendChild(playerCard);
    });
    const cardElement = document.getElementsByClassName('cards-container')[0]
    cardElement.innerHTML = `
     <div class="card-placeholder flop">翻牌圈</div>
            <div class="card-placeholder flop">翻牌圈</div>
            <div class="card-placeholder flop">翻牌圈</div>
            <div class="card-placeholder turn">转牌圈</div>
            <div class="card-placeholder river">河牌圈</div>
    `;
    gameScreen.insertBefore(playersContainer, gameScreen.firstChild);
  });
  
  // 发牌给玩家
  socket.on('deal-cards', (cards) => {
    playerCards.innerHTML = '';
    
    cards.forEach(card => {
      const cardElement = document.createElement('div');
      cardElement.className = `card ${card.suit}`;
      cardElement.innerHTML = `
        <div class="top-value">${card.value}</div>
        <div class="suit">${getSuitSymbol(card.suit)}</div>
        <div class="bottom-value">${card.value}</div>
      `;
      playerCards.appendChild(cardElement);
    });
  });
  
  // 更新公共牌
  socket.on('community-cards', (cards) => {
    communityCards.innerHTML = '';
    
    cards.forEach((card, index) => {
      const cardElement = document.createElement('div');
      cardElement.className = `card ${card.suit}`;
      cardElement.innerHTML = `
        <div class="top-value">${card.value}</div>
        <div class="suit">${getSuitSymbol(card.suit)}</div>
        <div class="bottom-value">${card.value}</div>
      `;
      communityCards.appendChild(cardElement);
    });
    
    // 添加占位符
    for (let i = cards.length; i < 5; i++) {
      const placeholder = document.createElement('div');
      placeholder.className = 'card-placeholder';
      
      if (i < 3) {
        placeholder.classList.add('flop');
        placeholder.textContent = '翻牌圈';
      } else if (i === 3) {
        placeholder.classList.add('turn');
        placeholder.textContent = '转牌圈';
      } else {
        placeholder.classList.add('river');
        placeholder.textContent = '河牌圈';
      }
      
      communityCards.appendChild(placeholder);
    }
  });

  // 获取花色符号
  function getSuitSymbol(suit) {
    switch(suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  }
});