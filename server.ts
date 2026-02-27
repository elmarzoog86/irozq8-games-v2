
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { TEAM_FEUD_QUESTIONS } from "./src/data/team-feud-questions";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

const PORT = 3000;

app.use(express.json());

// Liar's Bar Game State
interface LiarsGameState {
  players: {
    id: string;
    name: string;
    cards: string[];
    lives: number;
    shotsTaken: number;
    isStreamer: boolean;
    character: string;
  }[];
  currentTurn: number;
  targetCard: string;
  tableCards: string[];
  lastPlay: {
    playerId: string;
    count: number;
    actualCards: string[];
  } | null;
  status: 'waiting' | 'playing' | 'roulette' | 'game_over';
  winner: string | null;
  loserId: string | null;
}

const rooms = new Map<string, LiarsGameState>();

// How Many Can You Name Game State
interface HowManyGameState {
  players: {
    id: string;
    name: string;
    isEliminated: boolean;
    isWebJoined: boolean;
    socketId: string | null;
  }[];
  status: 'waiting' | 'matchmaking' | 'category_selection' | 'gambling' | 'naming' | 'judging' | 'result' | 'game_over';
  currentMatch: [string, string] | null;
  categories: string[];
  selectedCategory: string | null;
  gamblerId: string | null;
  targetCount: number;
  currentCount: number;
  timer: number;
  answers: string[];
  winner: string | null;
  turn: string | null; // whose turn to bid
  bid: number;
}

const howManyRooms = new Map<string, HowManyGameState>();

// Team Games State
interface TeamGameState {
  players: {
    id: string;
    name: string;
    team: 'gold' | 'black' | null;
  }[];
  status: 'waiting' | 'playing' | 'results' | 'game_over';
  gameType: 'teamfeud' | 'codenames' | 'bombrelay';
  // Game specific data
  data: any;
}

const teamRooms = new Map<string, TeamGameState>();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", ({ roomId, name, isStreamer, character }) => {
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        players: [],
        currentTurn: 0,
        targetCard: "Kings",
        tableCards: [],
        lastPlay: null,
        status: 'waiting',
        winner: null,
        loserId: null
      });
    }

    const state = rooms.get(roomId)!;
    
    if (state.players.length >= 6 && !state.players.find(p => p.id === socket.id)) {
      socket.emit("error", "الغرفة ممتلئة (الحد الأقصى 6 لاعبين)");
      return;
    }
    
    // Check if player already exists
    const existingPlayer = state.players.find(p => p.id === socket.id);
    if (!existingPlayer) {
      state.players.push({
        id: socket.id,
        name: name || (isStreamer ? "Streamer" : `Player ${state.players.length + 1}`),
        cards: [],
        lives: 6, // 6 chambers
        shotsTaken: 0,
        isStreamer: !!isStreamer,
        character: character || "Dog"
      });
    }

    io.to(roomId).emit("state_update", state);
  });

  // How Many Can You Name Events
  socket.on("join_howmany_lobby", ({ roomId, name }) => {
    socket.join(roomId);
    if (!howManyRooms.has(roomId)) {
      howManyRooms.set(roomId, {
        players: [],
        status: 'waiting',
        currentMatch: null,
        categories: [],
        selectedCategory: null,
        gamblerId: null,
        targetCount: 0,
        currentCount: 0,
        timer: 30,
        answers: [],
        winner: null,
        turn: null,
        bid: 0
      });
    }
    const state = howManyRooms.get(roomId)!;
    if (!state.players.find(p => p.id === socket.id)) {
      state.players.push({
        id: socket.id,
        name: name || `Player ${state.players.length + 1}`,
        isEliminated: false,
        isWebJoined: true,
        socketId: socket.id
      });
    }
    io.to(roomId).emit("howmany_state", state);
  });

  socket.on("twitch_join", ({ roomId, username }) => {
    // Disabled joining via chat command
    // if (!howManyRooms.has(roomId)) return;
    // const state = howManyRooms.get(roomId)!;
    // if (!state.players.find(p => p.name === username)) {
    //   state.players.push({
    //     id: `twitch_${username}`,
    //     name: username,
    //     isEliminated: false,
    //     isWebJoined: false,
    //     socketId: null
    //   });
    // }
    // io.to(roomId).emit("howmany_state", state);
  });

  socket.on("start_howmany", (roomId) => {
    const state = howManyRooms.get(roomId);
    if (!state || state.players.length < 2) return;
    state.status = 'matchmaking';
    
    // Simple 1v1 matchmaking
    const active = state.players.filter(p => !p.isEliminated);
    if (active.length >= 2) {
      state.currentMatch = [active[0].id, active[1].id];
    } else {
      state.status = 'game_over';
      state.winner = active[0]?.name || "No one";
    }
    io.to(roomId).emit("howmany_state", state);
  });

  socket.on("select_categories", ({ roomId, categories }) => {
    const state = howManyRooms.get(roomId);
    if (!state) return;
    state.categories = categories;
    state.status = 'category_selection';
    io.to(roomId).emit("howmany_state", state);
  });

  socket.on("choose_category", ({ roomId, category }) => {
    const state = howManyRooms.get(roomId);
    if (!state) return;
    state.selectedCategory = category;
    state.status = 'gambling';
    state.turn = state.currentMatch![0];
    state.bid = 0;
    io.to(roomId).emit("howmany_state", state);
  });

  socket.on("place_bid", ({ roomId, amount }) => {
    const state = howManyRooms.get(roomId);
    if (!state || state.status !== 'gambling') return;
    state.bid = amount;
    state.turn = state.currentMatch!.find(id => id !== state.turn)!;
    io.to(roomId).emit("howmany_state", state);
  });

  socket.on("call_liar_howmany", (roomId) => {
    const state = howManyRooms.get(roomId);
    if (!state || state.status !== 'gambling') return;
    
    // The person who was just bid on is the gambler
    state.gamblerId = state.currentMatch!.find(id => id !== state.turn)!;
    state.targetCount = state.bid;
    state.currentCount = 0;
    state.answers = [];
    state.status = 'naming';
    state.timer = 30;
    
    io.to(roomId).emit("howmany_state", state);

    const interval = setInterval(() => {
      state.timer--;
      if (state.timer <= 0) {
        clearInterval(interval);
        state.status = 'judging';
        io.to(roomId).emit("howmany_state", state);
      } else {
        io.to(roomId).emit("howmany_timer", state.timer);
      }
    }, 1000);
  });

  socket.on("submit_answer", ({ roomId, answer }) => {
    const state = howManyRooms.get(roomId);
    if (!state || state.status !== 'naming') return;
    if (!state.answers.includes(answer.toLowerCase())) {
      state.answers.push(answer.toLowerCase());
      state.currentCount++;
      io.to(roomId).emit("howmany_state", state);
    }
  });

  socket.on("judge_howmany", ({ roomId, passed }) => {
    const state = howManyRooms.get(roomId);
    if (!state || state.status !== 'judging') return;
    
    state.status = 'result';
    const loserId = passed ? state.currentMatch!.find(id => id !== state.gamblerId)! : state.gamblerId!;
    const loser = state.players.find(p => p.id === loserId);
    if (loser) loser.isEliminated = true;
    
    if (passed && state.currentCount < state.targetCount) {
      state.currentCount = state.targetCount;
    } else if (!passed && state.currentCount >= state.targetCount) {
      state.currentCount = state.targetCount - 1;
    }
    
    io.to(roomId).emit("howmany_state", state);
  });

  socket.on("next_round_howmany", (roomId) => {
    const state = howManyRooms.get(roomId);
    if (!state) return;
    
    const active = state.players.filter(p => !p.isEliminated);
    if (active.length <= 1) {
      state.status = 'game_over';
      state.winner = active[0]?.name || "No one";
    } else {
      state.status = 'matchmaking';
      state.currentMatch = [active[0].id, active[1].id];
    }
    io.to(roomId).emit("howmany_state", state);
  });

  // --- Team Games Handlers ---
  socket.on("join_team_game", ({ roomId, name, gameType }) => {
    console.log("join_team_game called with:", { roomId, name, gameType });
    socket.join(roomId);
    let room = teamRooms.get(roomId);
    if (!room) {
      room = {
        players: [],
        status: 'waiting',
        gameType,
        data: {
          usedQuestions: [],
          pointLimit: 300 // Default point limit
        }
      };
      teamRooms.set(roomId, room);
    }
    
    const existingPlayer = room.players.find(p => p.name === name);
    if (existingPlayer) {
      existingPlayer.id = socket.id;
    } else {
      room.players.push({ id: socket.id, name, team: null });
    }
    
    io.to(roomId).emit("team_game_state", room);
  });

  socket.on("switch_team", ({ roomId, playerId, team, name }) => {
    console.log("switch_team called:", { roomId, playerId, team, name });
    const room = teamRooms.get(roomId);
    if (!room) {
      console.log("Room not found in switch_team:", roomId);
      console.log("Current rooms:", [...teamRooms.keys()]);
      return;
    }
    
    // Find player by ID or Name (case-insensitive for Twitch usernames)
    let player = room.players.find(p => 
      (playerId && p.id === playerId) || 
      (name && p.name.toLowerCase() === name.toLowerCase())
    );

    if (player) {
      player.team = team;
      if (playerId) player.id = playerId;
      console.log("Updated existing player team:", player.name, team);
    } else if (name) {
      // Disable joining via chat commands (!gold / !black)
      // const newPlayerId = playerId || `chat_${name}_${Date.now()}`;
      // room.players.push({ id: newPlayerId, name, team });
      // console.log("Added new player via switch_team:", name, team);
      console.log("Joining via chat commands is disabled. Player must join via link.");
    }
    
    io.to(roomId).emit("team_game_state", room);
  });

  socket.on("start_team_game", (arg) => {
    const roomId = typeof arg === 'string' ? arg : arg.roomId;
    const pointLimit = typeof arg === 'object' ? arg.pointLimit : undefined;
    const room = teamRooms.get(roomId);

    if (room) {
      if (pointLimit) {
        if (!room.data) room.data = {};
        room.data.pointLimit = pointLimit;
      }
      room.status = 'playing';
      
      if (room.gameType === 'teamfeud') {
        const questions = TEAM_FEUD_QUESTIONS;
        let availableQuestions = questions;
        if (room.data && room.data.usedQuestions) {
          availableQuestions = questions.filter(q => !room.data.usedQuestions.includes(q.question));
        }

        if (availableQuestions.length === 0) {
          if (room.data) room.data.usedQuestions = [];
          availableQuestions = questions;
        }

        const selected = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        
        if (!room.data) room.data = {};
        if (!room.data.usedQuestions) room.data.usedQuestions = [];
        room.data.usedQuestions.push(selected.question);

        const currentLeaders = room.data.leaders || { gold: null, black: null };
        const currentScores = room.data.scores || { gold: 0, black: 0 };
        const currentPointLimit = room.data.pointLimit || 300;
        const currentUsedQuestions = room.data.usedQuestions;

        room.data = {
          question: selected.question,
          answers: selected.answers.map((a: any) => ({ ...a, revealed: false })),
          strikes: { gold: 0, black: 0 },
          scores: currentScores,
          pointLimit: currentPointLimit,
          usedQuestions: currentUsedQuestions,
          currentTurn: null, // No one's turn until buzzer
          roundPoints: 0,
          isStealOpportunity: false,
          leaders: currentLeaders,
          buzzersOpen: false,
          buzzerWinner: null,
          timer: 3
        };

        // Start buzzer timer
        let buzzerInterval = setInterval(() => {
          const r = teamRooms.get(roomId);
          if (r && r.status === 'playing' && r.data.timer > 0) {
            r.data.timer--;
            if (r.data.timer === 0) {
              r.data.buzzersOpen = true;
              clearInterval(buzzerInterval);
            }
            io.to(roomId).emit("team_game_state", r);
          } else {
            clearInterval(buzzerInterval);
          }
        }, 1000);
      } else if (room.gameType === 'codenames') {
        const wordsPool = ["تفاحة", "سيارة", "بيت", "بحر", "شمس", "قمر", "كتاب", "قلم", "مكتب", "كرسي", "نافذة", "باب", "طائرة", "قطار", "دراجة", "هاتف", "حاسوب", "ساعة", "نظارة", "حقيبة", "حذاء", "قميص", "بنطال", "قبعة", "وشاح", "أسد", "نمر", "فيل", "زرافة", "قرد", "كلب", "قطة", "عصفور", "سمكة", "وردة", "شجرة", "جبل", "نهر", "صحراء", "ثلج", "نار", "ماء", "خبز", "حليب", "قهوة", "شاي", "سكر", "ملح", "فلفل", "ليمون"];
        const shuffledWords = wordsPool.sort(() => 0.5 - Math.random()).slice(0, 25);
        const board = shuffledWords.map((word, i) => ({
          word,
          type: i < 8 ? 'gold' : i < 16 ? 'black' : i === 16 ? 'assassin' : 'neutral',
          revealed: false
        })).sort(() => 0.5 - Math.random());
        
        room.data = {
          board,
          currentTurn: 'gold',
          scores: { gold: 8, black: 8 }
        };
      } else if (room.gameType === 'bombrelay') {
        const taskPool = [
          { text: "اكتب 'تفكيك' 5 مرات", target: 5 },
          { text: "حل المسألة: 15 + 27", answer: "42" },
          { text: "اكتب 'بوم' 3 مرات", target: 3 },
          { text: "حل المسألة: 12 * 4", answer: "48" },
          { text: "اكتب 'سرعة' 4 مرات", target: 4 },
          { text: "حل المسألة: 100 - 37", answer: "63" }
        ];
        const selectedTasks = taskPool.sort(() => 0.5 - Math.random()).slice(0, 3).map((t, i) => ({
          id: i + 1,
          ...t,
          count: t.target ? 0 : undefined,
          completed: false
        }));

        room.data = {
          timer: 60,
          tasks: selectedTasks,
          isDefused: false,
          isExploded: false
        };
        
        const interval = setInterval(() => {
          const r = teamRooms.get(roomId);
          if (r && r.status === 'playing' && r.gameType === 'bombrelay') {
            r.data.timer--;
            if (r.data.timer <= 0) {
              r.data.isExploded = true;
              r.status = 'results';
              clearInterval(interval);
            }
            io.to(roomId).emit("team_game_state", r);
          } else {
            clearInterval(interval);
          }
        }, 1000);
      }
      
      io.to(roomId).emit("team_game_state", room);
    }
  });

  socket.on("reset_team_game", (roomId) => {
    const room = teamRooms.get(roomId);
    if (room) {
      room.status = 'waiting';
      room.data = {};
      io.to(roomId).emit("team_game_state", room);
    }
  });

  socket.on("submit_team_action", ({ roomId, action, payload }) => {
    const room = teamRooms.get(roomId);
    if (!room) return;

    if (room.gameType === 'teamfeud') {
      if (action === 'set_leader') {
        if (!room.data.leaders) room.data.leaders = { gold: null, black: null };
        room.data.leaders[payload.team] = payload.playerId;
        io.to(roomId).emit("team_game_state", room);
        return;
      }

      if (action === 'buzzer') {
        if (room.data.buzzersOpen && !room.data.buzzerWinner) {
          room.data.buzzerWinner = payload.team;
          room.data.currentTurn = payload.team;
          room.data.buzzersOpen = false;
          io.to(roomId).emit("team_game_state", room);
        }
        return;
      }

      if (room.status !== 'playing') return;
      
      if (action === 'guess') {
        if (!room.data.currentTurn) return; // Wait for buzzer

        const answer = room.data.answers.find((a: any) => a.text === payload.guess);
        if (answer && !answer.revealed) {
          answer.revealed = true;
          room.data.roundPoints += answer.points;
          
          if (room.data.isStealOpportunity) {
            // Steal successful
            room.data.scores[room.data.currentTurn] += room.data.roundPoints;
            room.data.roundPoints = 0;
            room.status = 'results';
            
            // Start checking for final winner based on point limit
            const limit = room.data.pointLimit || 300;
            if (room.data.scores.gold >= limit) {
              room.data.winner = 'gold';
              room.status = 'game_over';
            } else if (room.data.scores.black >= limit) {
              room.data.winner = 'black';
              room.status = 'game_over';
            } else {
              room.status = 'results';
            }

            room.data.answers.forEach((a: any) => a.revealed = true);
          } else {
            // Check if all answers revealed
            if (room.data.answers.every((a: any) => a.revealed)) {
              room.data.scores[room.data.currentTurn] += room.data.roundPoints;
              room.data.roundPoints = 0;
              
              const limit = room.data.pointLimit || 300;
              if (room.data.scores.gold >= limit) {
                room.data.winner = 'gold';
                room.status = 'game_over';
              } else if (room.data.scores.black >= limit) {
                room.data.winner = 'black';
                room.status = 'game_over';
              } else {
                room.status = 'results';
              }
              
              room.data.answers.forEach((a: any) => a.revealed = true);
            }
          }
        } else {
          room.data.strikes[room.data.currentTurn]++;
          
          if (room.data.isStealOpportunity) {
            // Steal failed, original team gets points
            const originalTeam = room.data.currentTurn === 'gold' ? 'black' : 'gold';
            room.data.scores[originalTeam] += room.data.roundPoints;
            room.data.roundPoints = 0;
            
            const limit = room.data.pointLimit || 300;
            if (room.data.scores.gold >= limit) {
              room.data.winner = 'gold';
              room.status = 'game_over';
            } else if (room.data.scores.black >= limit) {
              room.data.winner = 'black';
              room.status = 'game_over';
            } else {
              room.status = 'results';
            }

            room.data.answers.forEach((a: any) => a.revealed = true);
          } else if (room.data.strikes[room.data.currentTurn] >= 3) {
            // 3 strikes, other team gets a chance to steal
            room.data.isStealOpportunity = true;
            room.data.currentTurn = room.data.currentTurn === 'gold' ? 'black' : 'gold';
            room.data.strikes[room.data.currentTurn] = 0; // Reset strikes for stealing team (they get 1 strike)
          }
        }
      }
    } else if (room.gameType === 'codenames') {
      if (action === 'reveal') {
        const card = room.data.board[payload.index];
        if (!card.revealed) {
          card.revealed = true;
          if (card.type === 'assassin') {
            room.status = 'results';
            room.data.winner = room.data.currentTurn === 'gold' ? 'black' : 'gold';
          } else if (card.type !== room.data.currentTurn) {
            room.data.currentTurn = room.data.currentTurn === 'gold' ? 'black' : 'gold';
          }
        }
      }
    } else if (room.gameType === 'bombrelay') {
      if (action === 'task_progress') {
        const task = room.data.tasks.find((t: any) => t.id === payload.taskId);
        if (task && !task.completed) {
          if (task.target) {
            task.count++;
            if (task.count >= task.target) task.completed = true;
          } else if (task.answer === payload.answer) {
            task.completed = true;
          }
          
          if (room.data.tasks.every((t: any) => t.completed)) {
            room.data.isDefused = true;
            room.status = 'results';
          }
        }
      }
    }
    
    io.to(roomId).emit("team_game_state", room);
  });

  socket.on("kick_player", ({ roomId, playerId }) => {
    const state = rooms.get(roomId);
    if (!state || !state.players.find(p => p.id === socket.id && p.isStreamer)) return;

    const playerIndex = state.players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
      const kickedPlayer = state.players[playerIndex];
      state.players.splice(playerIndex, 1);
      io.to(playerId).emit("kicked");
      io.to(roomId).emit("state_update", state);
      io.to(roomId).emit("message", `${kickedPlayer.name} تم طرده من الغرفة.`);
    }
  });

  socket.on("start_game", (roomId) => {
    const state = rooms.get(roomId);
    if (!state) return;

    state.status = 'playing';
    state.tableCards = [];
    state.lastPlay = null;
    state.currentTurn = 0;
    state.targetCard = ["Kings", "Queens", "Aces"][Math.floor(Math.random() * 3)];

    // Deal cards
    const deck = ["Kings", "Queens", "Aces", "Joker"];
    state.players.forEach(p => {
      p.cards = Array(5).fill(0).map(() => deck[Math.floor(Math.random() * deck.length)]);
      p.shotsTaken = 0;
      p.lives = 6;
    });

    io.to(roomId).emit("state_update", state);
  });

  socket.on("play_cards", ({ roomId, cards }) => {
    const state = rooms.get(roomId);
    if (!state || state.status !== 'playing') return;

    const player = state.players[state.currentTurn];
    if (player.id !== socket.id) return;

    // Remove cards from player hand
    cards.forEach((c: string) => {
      const idx = player.cards.indexOf(c);
      if (idx > -1) player.cards.splice(idx, 1);
    });

    state.lastPlay = {
      playerId: player.id,
      count: cards.length,
      actualCards: cards
    };

    state.tableCards.push(...cards);
    
    // Check if player played their last cards and only 2 players left
    const activePlayers = state.players.filter(p => p.lives > 0);
    if (player.cards.length === 0 && activePlayers.length === 2) {
      // Force call liar
      const otherPlayer = activePlayers.find(p => p.id !== player.id);
      if (otherPlayer) {
        // Trigger liar call logic
        const roomIdLocal = roomId; // Capture for timeout
        state.status = 'roulette';
        const isLying = state.lastPlay.actualCards.some(c => c !== state.targetCard && c !== "Joker");
        const loser = isLying ? player : otherPlayer;
        state.loserId = loser.id;
        
        io.to(roomId).emit("liar_result", { 
          isLying, 
          loserName: loser.name, 
          actualCards: state.lastPlay.actualCards,
          forced: true
        });
        io.to(roomId).emit("state_update", state);

        // Automatically pull trigger after suspense delay (copied from call_liar)
        setTimeout(() => {
          const currentState = rooms.get(roomIdLocal);
          if (!currentState || currentState.status !== 'roulette' || !currentState.loserId) return;

          const currentLoser = currentState.players.find(p => p.id === currentState.loserId);
          const dead = Math.random() < (1 / (6 - (currentLoser?.shotsTaken || 0)));
          
          if (dead) {
            if (currentLoser) {
              currentLoser.lives = 0;
              currentLoser.shotsTaken = 6;
            }
            io.to(roomIdLocal).emit("shot_fired", { dead: true, name: currentLoser?.name });
            
            setTimeout(() => {
              const survivors = currentState.players.filter(p => p.lives > 0);
              if (survivors.length <= 1) {
                currentState.status = 'game_over';
                currentState.winner = survivors[0]?.name || "No one";
              } else {
                currentState.status = 'playing';
                const deck = ["Kings", "Queens", "Aces", "Joker"];
                currentState.players.forEach(p => {
                  if (p.lives > 0) {
                    p.cards = Array(5).fill(0).map(() => deck[Math.floor(Math.random() * deck.length)]);
                    p.shotsTaken = 0;
                  }
                });
                currentState.tableCards = [];
                currentState.lastPlay = null;
                // The loser of the liar call skips their turn in the next round
                const loserIdx = currentState.players.findIndex(p => p.id === currentState.loserId);
                currentState.currentTurn = (loserIdx + 1) % currentState.players.length;
                
                while (currentState.players[currentState.currentTurn].lives <= 0) {
                  currentState.currentTurn = (currentState.currentTurn + 1) % currentState.players.length;
                }
              }
              io.to(roomIdLocal).emit("state_update", currentState);
            }, 2000);
          } else {
            if (currentLoser) currentLoser.shotsTaken++;
            io.to(roomIdLocal).emit("shot_fired", { dead: false, name: currentLoser?.name });
            setTimeout(() => {
              currentState.status = 'playing';
              if (currentState.players.some(p => p.lives > 0 && p.cards.length === 0)) {
                const deck = ["Kings", "Queens", "Aces", "Joker"];
                currentState.players.forEach(p => {
                  if (p.lives > 0) {
                    p.cards = Array(5).fill(0).map(() => deck[Math.floor(Math.random() * deck.length)]);
                    p.shotsTaken = 0;
                  }
                });
                currentState.tableCards = [];
                currentState.lastPlay = null;
              }
              
              // The loser of the liar call skips their turn in the next round
              const loserIdx = currentState.players.findIndex(p => p.id === currentState.loserId);
              currentState.currentTurn = (loserIdx + 1) % currentState.players.length;
              
              while (currentState.players[currentState.currentTurn].lives <= 0) {
                currentState.currentTurn = (currentState.currentTurn + 1) % currentState.players.length;
              }
              io.to(roomIdLocal).emit("state_update", currentState);
            }, 2000);
          }
          currentState.loserId = null;
        }, 4000); // 4 seconds of suspense

        return;
      }
    }

    state.currentTurn = (state.currentTurn + 1) % state.players.length;
    // Skip dead players or players with no cards (unless everyone has no cards)
    let attempts = 0;
    while (attempts < state.players.length && (state.players[state.currentTurn].lives <= 0 || (state.players[state.currentTurn].cards.length === 0 && state.players.some(p => p.lives > 0 && p.cards.length > 0)))) {
      state.currentTurn = (state.currentTurn + 1) % state.players.length;
      attempts++;
    }

    io.to(roomId).emit("state_update", state);
    io.to(roomId).emit("cards_played", { name: player.name, count: cards.length });
  });

  socket.on("call_liar", (roomId) => {
    const state = rooms.get(roomId);
    if (!state || !state.lastPlay || state.status !== 'playing') return;

    const lastPlayer = state.players.find(p => p.id === state.lastPlay!.playerId);
    const caller = state.players.find(p => p.id === socket.id);
    if (!lastPlayer || !caller) return;

    const isLying = state.lastPlay.actualCards.some(c => c !== state.targetCard && c !== "Joker");
    const loser = isLying ? lastPlayer : caller;

    state.status = 'roulette';
    state.loserId = loser.id;
    
    io.to(roomId).emit("state_update", state);
    io.to(roomId).emit("liar_result", { 
      isLying, 
      loserName: loser.name, 
      actualCards: state.lastPlay.actualCards 
    });

    // Automatically pull trigger after suspense delay
    setTimeout(() => {
      const currentState = rooms.get(roomId);
      if (!currentState || currentState.status !== 'roulette' || !currentState.loserId) return;

      const currentLoser = currentState.players.find(p => p.id === currentState.loserId);
      const dead = Math.random() < (1 / (6 - (currentLoser?.shotsTaken || 0)));
      
      if (dead) {
        if (currentLoser) {
          currentLoser.lives = 0;
          currentLoser.shotsTaken = 6;
        }
        io.to(roomId).emit("shot_fired", { dead: true, name: currentLoser?.name });
        
        setTimeout(() => {
          const survivors = currentState.players.filter(p => p.lives > 0);
          if (survivors.length <= 1) {
            currentState.status = 'game_over';
            currentState.winner = survivors[0]?.name || "No one";
          } else {
            currentState.status = 'playing';
            const deck = ["Kings", "Queens", "Aces", "Joker"];
            currentState.players.forEach(p => {
              if (p.lives > 0) {
                p.cards = Array(5).fill(0).map(() => deck[Math.floor(Math.random() * deck.length)]);
                p.shotsTaken = 0;
              }
            });
            currentState.tableCards = [];
            currentState.lastPlay = null;
            // The loser of the liar call skips their turn in the next round
            const loserIdx = currentState.players.findIndex(p => p.id === currentState.loserId);
            currentState.currentTurn = (loserIdx + 1) % currentState.players.length;
            
            while (currentState.players[currentState.currentTurn].lives <= 0) {
              currentState.currentTurn = (currentState.currentTurn + 1) % currentState.players.length;
            }
          }
          io.to(roomId).emit("state_update", currentState);
        }, 2000);
      } else {
        if (currentLoser) currentLoser.shotsTaken++;
        io.to(roomId).emit("shot_fired", { dead: false, name: currentLoser?.name });
        setTimeout(() => {
          currentState.status = 'playing';
          if (currentState.players.some(p => p.lives > 0 && p.cards.length === 0)) {
            const deck = ["Kings", "Queens", "Aces", "Joker"];
            currentState.players.forEach(p => {
              if (p.lives > 0) {
                p.cards = Array(5).fill(0).map(() => deck[Math.floor(Math.random() * deck.length)]);
                p.shotsTaken = 0;
              }
            });
            currentState.tableCards = [];
            currentState.lastPlay = null;
          }
          
          // The loser of the liar call skips their turn in the next round
          const loserIdx = currentState.players.findIndex(p => p.id === currentState.loserId);
          currentState.currentTurn = (loserIdx + 1) % currentState.players.length;
          
          while (currentState.players[currentState.currentTurn].lives <= 0) {
            currentState.currentTurn = (currentState.currentTurn + 1) % currentState.players.length;
          }
          io.to(roomId).emit("state_update", currentState);
        }, 2000);
      }
      currentState.loserId = null;
    }, 4000); // 4 seconds of suspense
  });

  socket.on("reset_to_lobby", (roomId) => {
    const state = rooms.get(roomId);
    if (!state) return;

    state.status = 'waiting';
    state.tableCards = [];
    state.lastPlay = null;
    state.winner = null;
    state.loserId = null;
    state.players.forEach(p => {
      p.cards = [];
      p.lives = 6;
      p.shotsTaken = 0;
    });

    io.to(roomId).emit("state_update", state);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    rooms.forEach((state, roomId) => {
      const playerIndex = state.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        if (state.status === 'waiting') {
          state.players.splice(playerIndex, 1);
          io.to(roomId).emit('state_update', state);
        }
      }
    });
  });
});

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Twitch OAuth URL Helper
app.get("/api/auth/url", (req, res) => {
  const host = req.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/auth/callback`;
  
  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'chat:read chat:edit whispers:read whispers:edit',
  });

  res.json({ url: `https://id.twitch.tv/oauth2/authorize?${params.toString()}` });
});

// OAuth Callback
app.get("/auth/callback", (req, res) => {
  res.send(`
    <html>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
        <p>تم تسجيل الدخول بنجاح. سيتم إغلاق هذه النافذة تلقائياً.</p>
      </body>
    </html>
  `);
});

// 404 handler for API routes
app.all("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.url}`,
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    // SPA fallback for production: serve index.html for any unknown routes
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  startServer();
}
