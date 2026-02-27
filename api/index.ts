import { Server } from 'socket.io';

// Note: This is a hack for Vercel Serverless Functions to support Socket.IO
// It works by attaching the Socket.IO instance to the global HTTP server object
// so it persists across function invocations (which reuse the same container)
export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...');
    const io = new Server(res.socket.server, {
      path: '/api/socket.io',
      addTrailingSlash: false,
      cors: {
        origin: "*", 
        methods: ["GET", "POST"]
      }
    });
    
    // Attach the IO instance to the server so we don't recreate it
    res.socket.server.io = io;

    // --- GAME LOGIC START ---
    // Copying the game logic from server.ts here because server.ts 
    // creates its own unrelated HTTP server which won't work in Vercel.
    
    // Constants for card deck
    const CARDS = ["Kings", "Queens", "Aces", "Joker"];
    const DECK = [
        ...Array(6).fill("Kings"),
        ...Array(6).fill("Queens"),
        ...Array(6).fill("Aces"),
        ...Array(2).fill("Joker")
    ];

    const rooms = new Map();

    io.on("connection", (socket) => {
        console.log("New client connected", socket.id);
      
        socket.on("join_room", ({ roomId, name, isStreamer, character }) => {
          socket.join(roomId);
          let room = rooms.get(roomId);
          
          if (!room) {
            room = {
              players: [],
              currentTurn: 0,
              targetCard: "Kings", // Default target
              tableCards: [],
              lastPlay: null,
              status: 'waiting',
              winner: null,
              loserId: null
            };
            rooms.set(roomId, room);
          }
      
          // Check if player already exists
          const existingPlayer = room.players.find((p) => p.name === name); // Simple check by name for now
          if (!existingPlayer) {
              const newPlayer = {
                id: socket.id,
                name,
                cards: [], // Will be dealt on game start
                lives: 3,
                shotsTaken: 0,
                isStreamer: !!isStreamer,
                character: character || 'detective'
              };
              room.players.push(newPlayer);
          } else {
             // Reconnect logic if needed, or just update ID
             existingPlayer.id = socket.id;
          }
          
          io.to(roomId).emit("state_update", room);
        });
      
        socket.on("start_game", (roomId) => {
           console.log("Starting game for room", roomId);
           const room = rooms.get(roomId);
           if(room) {
               // Reset game state
               room.status = 'playing';
               room.currentTurn = 0;
               room.winner = null;
               room.loserId = null;
               room.tableCards = [];
               room.lastPlay = null;
               
               // Shuffle and Deal
               const shuffledDeck = [...DECK].sort(() => Math.random() - 0.5);
               room.players.forEach(player => {
                   player.cards = shuffledDeck.splice(0, 5); // Deal 5 cards
                   player.shotsTaken = 0; // Reset shots? Rules vary.
               });
               
               io.to(roomId).emit("state_update", room);
           }
        });
      
        socket.on("play_cards", ({ roomId, cards, declaredType }) => {
            const room = rooms.get(roomId);
            if (!room) return;
            
            const player = room.players.find(p => p.id === socket.id);
            if (!player) return;

            // Remove played cards from player's hand
            // Logic: remove the first instance of each card type found in hand
            // (Assuming clients send actual card values they want to play? 
            // Usually Liar's Dice/Bar involves playing cards face down)
            
            // In Liar's Bar, you select cards from hand and declare they are 'declaredType'.
            // The cards sent here are the ACTUAL cards being played.
            
            cards.forEach((cardVal) => {
                const idx = player.cards.indexOf(cardVal);
                if (idx > -1) player.cards.splice(idx, 1);
            });
            
            room.lastPlay = {
                playerId: player.id,
                count: cards.length,
                actualCards: cards // Hidden from others until revealed
            };
            
            // Allow next player
            room.currentTurn = (room.currentTurn + 1) % room.players.length;
            
            // Notify everyone (hiding actual cards in general update if needed, 
            // but our room state has them visible - ideally we should filter this for clients)
            io.to(roomId).emit("state_update", room);
            io.to(roomId).emit("cards_played", { name: player.name, count: cards.length });
        });
      
        socket.on("call_liar", (roomId) => {
            const room = rooms.get(roomId);
            if (!room || !room.lastPlay) return;
            
            const challenger = room.players.find(p => p.id === socket.id);
            const accusedPlayerId = room.lastPlay.playerId;
            const accused = room.players.find(p => p.id === accusedPlayerId);
            
            if (!challenger || !accused) return;
            
            const actualCards = room.lastPlay.actualCards;
            const isLying = actualCards.some(card => card !== "Joker" && card !== room.targetCard);
            
            const loser = isLying ? accused : challenger;
            room.loserId = loser.id;
            room.status = 'roulette'; // Proceed to Russian Roulette phase
            
            io.to(roomId).emit("liar_result", { 
                isLying, 
                loserName: loser.name,
                actualCards: actualCards
            });
            io.to(roomId).emit("state_update", room);
        });
      
        socket.on("pull_trigger", (roomId) => {
             const room = rooms.get(roomId);
             if (!room || room.status !== 'roulette' || !room.loserId) return;
             
             if (room.loserId !== socket.id) return; // Only loser pulls trigger
             
             const loser = room.players.find(p => p.id === room.loserId);
             if (!loser) return;

             // 1 in 6 chance of death? Or cumulative?
             // Game usually keeps track of chamber.
             // Visuals show 1/6.
             const isDead = Math.random() < (1 / (6 - loser.shotsTaken)); 
             
             if (isDead) {
                 loser.lives -= 1;
                 loser.shotsTaken = 0; // Reset cylinder
                 io.to(roomId).emit("shot_fired", { dead: true, name: loser.name });
                 
                 if (loser.lives <= 0) {
                     // Player eliminated
                     room.players = room.players.filter(p => p.id !== loser.id);
                     if (room.players.length === 1) {
                         room.status = 'game_over';
                         room.winner = room.players[0].name;
                     } else {
                         room.status = 'playing';
                     }
                 } else {
                     room.status = 'playing';
                 }
                 
             } else {
                 loser.shotsTaken += 1;
                 io.to(roomId).emit("shot_fired", { dead: false, name: loser.name });
                 room.status = 'playing';
             }
             
             // Reset round specific things
             room.lastPlay = null;
             room.tableCards = []; // Clear table?
             
             io.to(roomId).emit("state_update", room);
        });
      
        socket.on("disconnect", () => {
          console.log("Client disconnected", socket.id);
          // Optional: Handle player leaving
        });
    });
    // --- GAME LOGIC END ---
  }
  res.end();
}
