const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 游戏状态
let gameState = {
  players: [],
  gameStarted: false,
  deck: [],
  communityCards: [],
  stage: 'waiting' // waiting, pre-flop, flop, turn, river
};

// 创建一副扑克牌
function createDeck() {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];
  
  for (const suit of suits) {
    for (const value of values) {
      deck.push({
        suit,
        value,
        code: `${value}${suit.charAt(0).toUpperCase()}`
      });
    }
  }
  
  return deck;
}

// 洗牌函数
function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// 开始游戏
function startGame() {
  gameState.deck = shuffleDeck(createDeck());
  gameState.communityCards = [];
  gameState.stage = 'pre-flop';
  
  // 给每位玩家发两张牌
  gameState.players.forEach(player => {
    player.cards = [
      gameState.deck.pop(),
      gameState.deck.pop()
    ];
    player.bet = 0;
    player.ready = false;
  });
  
  // 通知所有玩家游戏开始
  io.emit('game-started', {
    players: gameState.players.map(p => ({ id: p.id, name: p.name })),
    communityCards: gameState.communityCards
  });
  
  // 给每位玩家发送自己的底牌
  gameState.players.forEach(player => {
    io.to(player.id).emit('deal-cards', player.cards);
  });
}

// 发出公共牌
function dealCommunityCards() {
  if (gameState.stage === 'pre-flop') {
    // 发3张牌（翻牌）
    gameState.communityCards.push(...[
      gameState.deck.pop(),
      gameState.deck.pop(),
      gameState.deck.pop()
    ]);
    gameState.stage = 'flop';
  } else if (gameState.stage === 'flop') {
    // 发1张牌（转牌）
    gameState.communityCards.push(gameState.deck.pop());
    gameState.stage = 'turn';
  } else if (gameState.stage === 'turn') {
    // 发1张牌（河牌）
    gameState.communityCards.push(gameState.deck.pop());
    gameState.stage = 'river';
  }
  
  io.emit('community-cards', gameState.communityCards);
}

// 处理玩家准备状态
function checkAllReady() {
  const allReady = gameState.players.length > 1 && 
                  gameState.players.every(p => p.ready);
  
  if (allReady && !gameState.gameStarted) {
    gameState.gameStarted = true;
    startGame();
  }
}

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('新玩家连接:', socket.id);
  
  // 新玩家加入
  socket.on('join-game', (playerName) => {
    if (gameState.gameStarted) {
      socket.emit('game-already-started');
      return;
    }
    
    const newPlayer = {
      id: socket.id,
      name: playerName,
      ready: false,
      cards: []
    };
    
    gameState.players.push(newPlayer);
    socket.emit('player-joined', newPlayer);
    io.emit('update-players', gameState.players.map(p => ({ 
      id: p.id, 
      name: p.name,
      ready: p.ready
    })));
  });
  
  // 玩家准备
  socket.on('player-ready', () => {
    const player = gameState.players.find(p => p.id === socket.id);
    if (player) {
      player.ready = true;
      io.emit('update-players', gameState.players.map(p => ({ 
        id: p.id, 
        name: p.name,
        ready: p.ready
      })));
      checkAllReady();
    }
  });
  
  socket.on('player-bet', (bet) => {
    const player = gameState.players.find(p => p.id === socket.id);
    if (player) {
      player.bet = player.bet+ Number(bet);
      io.emit('player-bet', gameState.players.map(p => ({ 
        id: p.id, 
        name: p.name,
        ready: p.ready,
        bet: p.bet
      })));
    }
  });

  // 请求发公共牌
  socket.on('request-community-cards', () => {
    if (gameState.stage !== 'river') {
      dealCommunityCards();
    }
  });
  
  socket.on('re-start', () => {
    startGame();
  })

  // 断开连接
  socket.on('disconnect', () => {
    gameState.players = gameState.players.filter(p => p.id !== socket.id);
    io.emit('update-players', gameState.players.map(p => ({ 
      id: p.id, 
      name: p.name,
      ready: p.ready
    })));
    
    if (gameState.players.length === 0) {
      // 重置游戏
      gameState = {
        players: [],
        gameStarted: false,
        deck: [],
        communityCards: [],
        stage: 'waiting'
      };
    }
    
    console.log('玩家断开:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});