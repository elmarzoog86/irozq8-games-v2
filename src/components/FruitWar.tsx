import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Play, Clock, Trophy, ArrowRight, Settings, ArrowLeft, Swords, Dices, Skull, XCircle } from 'lucide-react';
import { TwitchChat } from './TwitchChat';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
}

interface FruitWarProps {
  messages: ChatMessage[];
  onLeave: () => void;
  channelName: string;
  isConnected: boolean;
  error: string | null;
}

type GameMode = 'voting' | 'roulette';
type GamePhase = 'config' | 'joining' | 'playing' | 'winner';

interface Fruit {
  name: string;
  emoji: string;
}

interface Player {
  username: string;
  fruit: Fruit;
  isAlive: boolean;
}

const ALL_FRUITS: Fruit[] = [
  { name: 'Apple', emoji: '🍎' },
  { name: 'Banana', emoji: '🍌' },
  { name: 'Orange', emoji: '🍊' },
  { name: 'Grape', emoji: '🍇' },
  { name: 'Strawberry', emoji: '🍓' },
  { name: 'Watermelon', emoji: '🍉' },
  { name: 'Pineapple', emoji: '🍍' },
  { name: 'Mango', emoji: '🥭' },
  { name: 'Cherry', emoji: '🍒' },
  { name: 'Peach', emoji: '🍑' },
  { name: 'Pear', emoji: '🍐' },
  { name: 'Kiwi', emoji: '🥝' },
  { name: 'Lemon', emoji: '🍋' },
  { name: 'Coconut', emoji: '🥥' },
  { name: 'Avocado', emoji: '🥑' },
  { name: 'Melon', emoji: '🍈' },
  { name: 'Blueberry', emoji: '🫐' },
  { name: 'Tomato', emoji: '🍅' },
  { name: 'Eggplant', emoji: '🍆' },
  { name: 'Carrot', emoji: '🥕' },
  { name: 'Corn', emoji: '🌽' },
  { name: 'Broccoli', emoji: '🥦' },
  { name: 'Cucumber', emoji: '🥒' },
  { name: 'Bell Pepper', emoji: '🫑' },
  { name: 'Hot Pepper', emoji: '🌶️' },
  { name: 'Potato', emoji: '🥔' },
  { name: 'Garlic', emoji: '🧄' },
  { name: 'Onion', emoji: '🧅' },
  { name: 'Mushroom', emoji: '🍄' },
  { name: 'Peanut', emoji: '🥜' },
  { name: 'Chestnut', emoji: '🌰' },
];

export const FruitWar: React.FC<FruitWarProps> = ({ messages, onLeave, channelName, isConnected, error }) => {
  const [phase, setPhase] = useState<GamePhase>('config');
  const [mode, setMode] = useState<GameMode>('voting');
  const [players, setPlayers] = useState<Record<string, Player>>({});
  
  // Voting State
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [votes, setVotes] = useState<Record<string, string>>({}); // voter -> target fruit name
  const [eliminatedThisRound, setEliminatedThisRound] = useState<Player | null>(null);
  const [showRoundResult, setShowRoundResult] = useState(false);

  // Roulette State
  const [rouletteState, setRouletteState] = useState<'idle' | 'spinning' | 'waiting'>('idle');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const processedMessageIds = useRef<Set<string>>(new Set());

  const activePlayers = (Object.values(players) as Player[]).filter(p => p.isAlive);
  const allPlayersList = Object.values(players) as Player[];

  useEffect(() => {
    messages.forEach(msg => {
      if (!processedMessageIds.current.has(msg.id)) {
        processedMessageIds.current.add(msg.id);
        
        const text = msg.message.trim().toLowerCase();
        
        if (phase === 'joining' && text === '!join') {
          setPlayers(prev => {
            if (!prev[msg.username]) {
              const usedFruits = (Object.values(prev) as Player[]).map(p => p.fruit.name);
              const availableFruits = ALL_FRUITS.filter(f => !usedFruits.includes(f.name));
              
              if (availableFruits.length > 0) {
                const randomFruit = availableFruits[Math.floor(Math.random() * availableFruits.length)];
                return { 
                  ...prev, 
                  [msg.username]: { username: msg.username, fruit: randomFruit, isAlive: true } 
                };
              }
            }
            return prev;
          });
        } else if (phase === 'playing' && mode === 'voting' && timeLeft !== null && timeLeft > 0 && !showRoundResult) {
          // Voting mode: players type fruit name or emoji to vote
          const targetFruit = ALL_FRUITS.find(f => text.includes(f.name.toLowerCase()) || text.includes(f.emoji));
          if (targetFruit) {
            // Check if target is alive
            const targetPlayer = activePlayers.find(p => p.fruit.name === targetFruit.name);
            if (targetPlayer) {
              setVotes(prev => ({ ...prev, [msg.username]: targetFruit.name }));
            }
          }
        } else if (phase === 'playing' && mode === 'roulette' && rouletteState === 'waiting' && selectedPlayer?.username === msg.username) {
          // Roulette mode: selected player types fruit to eliminate
          const targetFruit = ALL_FRUITS.find(f => text.includes(f.name.toLowerCase()) || text.includes(f.emoji));
          if (targetFruit) {
            const targetPlayer = activePlayers.find(p => p.fruit.name === targetFruit.name);
            if (targetPlayer && targetPlayer.username !== selectedPlayer.username) {
              eliminatePlayer(targetPlayer.username);
              setRouletteState('idle');
            }
          }
        }
      }
    });
  }, [messages, phase, mode, timeLeft, showRoundResult, rouletteState, selectedPlayer, activePlayers]);

  // Voting Timer
  useEffect(() => {
    if (phase === 'playing' && mode === 'voting' && timeLeft !== null && timeLeft > 0 && !showRoundResult) {
      const timer = setTimeout(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'playing' && mode === 'voting' && timeLeft === 0 && !showRoundResult) {
      handleVotingRoundEnd();
    }
  }, [phase, mode, timeLeft, showRoundResult]);

  const startGame = () => {
    setPhase('playing');
    if (mode === 'voting') {
      startVotingRound();
    } else {
      setRouletteState('idle');
    }
  };

  const startVotingRound = () => {
    setVotes({});
    setTimeLeft(30);
    setShowRoundResult(false);
    setEliminatedThisRound(null);
  };

  const handleVotingRoundEnd = () => {
    // Tally votes
    const voteCounts: Record<string, number> = {};
    (Object.values(votes) as string[]).forEach(fruitName => {
      voteCounts[fruitName] = (voteCounts[fruitName] || 0) + 1;
    });

    let maxVotes = 0;
    let eliminatedFruitName: string | null = null;

    Object.entries(voteCounts).forEach(([fruitName, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedFruitName = fruitName;
      }
    });

    if (eliminatedFruitName) {
      const playerToEliminate = activePlayers.find(p => p.fruit.name === eliminatedFruitName);
      if (playerToEliminate) {
        setEliminatedThisRound(playerToEliminate);
        eliminatePlayer(playerToEliminate.username);
      }
    } else {
      // Tie or no votes, pick random
      if (activePlayers.length > 0) {
        const randomPlayer = activePlayers[Math.floor(Math.random() * activePlayers.length)];
        setEliminatedThisRound(randomPlayer);
        eliminatePlayer(randomPlayer.username);
      }
    }

    setShowRoundResult(true);
  };

  const eliminatePlayer = (username: string) => {
    setPlayers(prev => {
      const next = { ...prev };
      if (next[username]) {
        next[username].isAlive = false;
      }
      return next;
    });

    // Check win condition
    setTimeout(() => {
      setPlayers(currentPlayers => {
        const alive = (Object.values(currentPlayers) as Player[]).filter(p => p.isAlive);
        if (alive.length <= 1) {
          setPhase('winner');
        }
        return currentPlayers;
      });
    }, 100);
  };

  const spinRoulette = () => {
    if (activePlayers.length === 0) return;
    setRouletteState('spinning');
    
    // Fake spinning effect
    let spins = 0;
    const maxSpins = 20;
    const interval = setInterval(() => {
      const randomPlayer = activePlayers[Math.floor(Math.random() * activePlayers.length)];
      setSelectedPlayer(randomPlayer);
      spins++;
      
      if (spins >= maxSpins) {
        clearInterval(interval);
        setRouletteState('waiting');
      }
    }, 100);
  };

  const getVoteCount = (fruitName: string) => {
    return Object.values(votes).filter(v => v === fruitName).length;
  };

  const renderPhase = () => {
    if (phase === 'config') {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-2xl mx-auto">
          <div className="bg-zinc-800/50 border border-zinc-700 p-8 rounded-2xl w-full">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Swords className="w-8 h-8 text-rose-400" />
              Fruit War Settings
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-4">Select Game Mode</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setMode('voting')}
                    className={`p-6 rounded-xl border-2 text-left transition-all ${
                      mode === 'voting' 
                        ? 'bg-rose-500/20 border-rose-500 text-white' 
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    <Users className={`w-8 h-8 mb-3 ${mode === 'voting' ? 'text-rose-400' : 'text-zinc-500'}`} />
                    <h3 className="text-lg font-bold mb-1">Voting Mode</h3>
                    <p className="text-sm opacity-80">Chat votes to eliminate a fruit each round.</p>
                  </button>
                  
                  <button
                    onClick={() => setMode('roulette')}
                    className={`p-6 rounded-xl border-2 text-left transition-all ${
                      mode === 'roulette' 
                        ? 'bg-amber-500/20 border-amber-500 text-white' 
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    <Dices className={`w-8 h-8 mb-3 ${mode === 'roulette' ? 'text-amber-400' : 'text-zinc-500'}`} />
                    <h3 className="text-lg font-bold mb-1">Roulette Mode</h3>
                    <p className="text-sm opacity-80">Random player is chosen to eliminate someone.</p>
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => setPhase('joining')}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 mt-8"
              >
                <Play className="w-5 h-5" /> Open Lobby
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (phase === 'joining') {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full">
          <h2 className="text-4xl font-bold text-white mb-4">Waiting for Players</h2>
          <p className="text-xl text-zinc-400 mb-8">
            Type <span className="text-rose-400 font-mono bg-rose-500/10 px-3 py-1 rounded-lg">!join</span> in chat to get your fruit!
          </p>
          
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 w-full max-w-4xl mb-8 min-h-[300px] max-h-[500px] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-zinc-300">Joined Players</h3>
              <span className="bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full text-sm font-bold">
                {allPlayersList.length} / {ALL_FRUITS.length} Max
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {allPlayersList.map((p) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={p.username} 
                    className="bg-zinc-900 border border-zinc-700 p-3 rounded-xl flex items-center gap-3"
                  >
                    <span className="text-3xl">❓</span>
                    <div className="overflow-hidden">
                      <p className="text-zinc-200 font-bold truncate">{p.username}</p>
                      <p className="text-zinc-500 text-xs">Fruit Hidden</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {allPlayersList.length === 0 && (
                <div className="col-span-full text-zinc-500 italic text-center py-12">No players joined yet...</div>
              )}
            </div>
          </div>

          <button 
            onClick={startGame}
            disabled={allPlayersList.length < 2}
            className="bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-4 px-12 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
          >
            Start War <Swords className="w-5 h-5" />
          </button>
        </div>
      );
    }

    if (phase === 'playing') {
      return (
        <div className="flex flex-col h-full w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-white flex items-center gap-3">
                <Swords className="w-8 h-8 text-rose-500" />
                Fruit War: {mode === 'voting' ? 'Voting Mode' : 'Roulette Mode'}
              </h2>
              <p className="text-zinc-400 mt-1">{activePlayers.length} Fruits Remaining</p>
            </div>

            {mode === 'voting' && (
              <div className={`flex items-center gap-2 text-3xl font-bold font-mono px-6 py-3 rounded-xl border ${timeLeft !== null && timeLeft <= 5 ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' : 'bg-zinc-800/80 border-zinc-700 text-white'}`}>
                <Clock className="w-6 h-6" /> 00:{timeLeft?.toString().padStart(2, '0') || '00'}
              </div>
            )}
          </div>

          {/* Main Action Area */}
          <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-2xl p-8 mb-8 flex flex-col items-center justify-center min-h-[200px]">
            {mode === 'voting' ? (
              showRoundResult ? (
                <div className="text-center">
                  <Skull className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-white mb-2">
                    {eliminatedThisRound?.fruit.emoji} {eliminatedThisRound?.fruit.name} was eliminated!
                  </h3>
                  <p className="text-zinc-400 mb-6">They received the most votes.</p>
                  <button 
                    onClick={startVotingRound}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-8 py-3 rounded-xl font-bold"
                  >
                    Next Round
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-white mb-4">Vote to Eliminate!</h3>
                  <p className="text-xl text-zinc-400">
                    Type a <span className="text-rose-400 font-bold">fruit name</span> or <span className="text-rose-400 font-bold">emoji</span> in chat to vote.
                  </p>
                </div>
              )
            ) : (
              // Roulette Mode
              <div className="text-center w-full max-w-md">
                {rouletteState === 'idle' && (
                  <>
                    <h3 className="text-3xl font-bold text-white mb-6">Spin to Choose the Executioner</h3>
                    <button 
                      onClick={spinRoulette}
                      className="bg-amber-600 hover:bg-amber-500 text-white px-12 py-4 rounded-xl font-bold text-xl w-full flex items-center justify-center gap-3"
                    >
                      <Dices className="w-6 h-6" /> Spin Roulette
                    </button>
                  </>
                )}
                
                {rouletteState === 'spinning' && selectedPlayer && (
                  <div className="py-8">
                    <motion.div 
                      key={selectedPlayer.username}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.2, opacity: 1 }}
                      className="text-6xl mb-4"
                    >
                      {selectedPlayer.fruit.emoji}
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white">{selectedPlayer.fruit.name}</h3>
                  </div>
                )}

                {rouletteState === 'waiting' && selectedPlayer && (
                  <div className="py-4">
                    <div className="text-6xl mb-4 animate-bounce">{selectedPlayer.fruit.emoji}</div>
                    <h3 className="text-3xl font-bold text-amber-400 mb-2">{selectedPlayer.fruit.name}</h3>
                    <p className="text-lg text-zinc-300">
                      You have the power! Type a fruit name or emoji in chat to eliminate them.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Alive Players Grid */}
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-lg font-medium text-zinc-400 mb-4">Battlefield</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <AnimatePresence>
                {allPlayersList.map((p) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: p.isAlive ? 1 : 0.3, 
                      scale: p.isAlive ? 1 : 0.95,
                      filter: p.isAlive ? 'grayscale(0%)' : 'grayscale(100%)'
                    }}
                    key={p.username} 
                    className={`bg-zinc-900 border p-4 rounded-xl flex flex-col items-center text-center relative overflow-hidden ${
                      p.isAlive ? 'border-zinc-700' : 'border-red-900/50'
                    } ${mode === 'roulette' && rouletteState === 'waiting' && selectedPlayer?.username === p.username ? 'ring-2 ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : ''}`}
                  >
                    {!p.isAlive && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <XCircle className="w-16 h-16 text-red-500/80" />
                      </div>
                    )}
                    <span className="text-5xl mb-2 relative z-0">{p.fruit.emoji}</span>
                    <p className={`font-bold truncate w-full relative z-0 ${p.isAlive ? 'text-zinc-200' : 'text-zinc-600'}`}>
                      {p.fruit.name}
                    </p>
                    <p className={`text-xs relative z-0 ${p.isAlive ? 'text-zinc-400' : 'text-zinc-700'}`}>
                      {p.isAlive ? 'Unknown Player' : p.username}
                    </p>
                    
                    {/* Vote Count Badge */}
                    {mode === 'voting' && p.isAlive && getVoteCount(p.fruit.name) > 0 && !showRoundResult && (
                      <div className="absolute top-2 right-2 bg-rose-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                        {getVoteCount(p.fruit.name)}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      );
    }

    if (phase === 'winner') {
      const winner = activePlayers[0];
      return (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl mx-auto text-center">
          <Trophy className="w-24 h-24 text-yellow-400 mb-8" />
          <h2 className="text-6xl font-black text-white mb-4 tracking-tight">Fruit War Champion!</h2>
          
          {winner ? (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-zinc-800/80 border border-yellow-500/50 p-12 rounded-3xl mb-12 shadow-[0_0_50px_rgba(234,179,8,0.2)]"
            >
              <div className="text-9xl mb-6">{winner.fruit.emoji}</div>
              <h3 className="text-4xl font-bold text-yellow-400 mb-2">{winner.username}</h3>
              <p className="text-xl text-zinc-400">The last {winner.fruit.name} standing!</p>
            </motion.div>
          ) : (
            <p className="text-2xl text-zinc-400 mb-12">Everyone was eliminated! It's a draw!</p>
          )}

          <div className="flex gap-4">
            <button 
              onClick={() => {
                setPhase('config');
                setPlayers({});
              }}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 px-8 rounded-xl transition-colors text-lg"
            >
              Play Again
            </button>
            <button 
              onClick={onLeave}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 px-8 rounded-xl transition-colors text-lg"
            >
              Return to Games
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex gap-8 h-[85vh] w-full max-w-[1600px] mx-auto">
      {/* Main Game Area */}
      <div className="flex-1 bg-zinc-900 rounded-2xl border border-zinc-800 p-8 flex flex-col relative overflow-hidden">
        <button 
          onClick={onLeave} 
          className="absolute top-6 left-6 text-zinc-500 hover:text-white flex items-center gap-2 transition-colors z-10 bg-zinc-800/50 px-4 py-2 rounded-lg border border-zinc-700"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Lobby
        </button>
        
        <div className="h-full w-full pt-12 flex flex-col">
          {renderPhase()}
        </div>
      </div>

      {/* Twitch Chat Sidebar */}
      <div className="w-96 flex flex-col gap-4">
        <TwitchChat 
          channelName={channelName} 
          messages={messages} 
          isConnected={isConnected} 
          error={error} 
        />
      </div>
    </div>
  );
};
