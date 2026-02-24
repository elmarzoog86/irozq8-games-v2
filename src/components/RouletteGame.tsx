import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Play, Trophy, ArrowLeft, Dices, Skull, Heart, Shield, Zap } from 'lucide-react';
import { TwitchChat } from './TwitchChat';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
}

interface RouletteGameProps {
  messages: ChatMessage[];
  onLeave: () => void;
  channelName: string;
  isConnected: boolean;
  error: string | null;
}

type GamePhase = 'joining' | 'spinning' | 'action' | 'result' | 'winner';

interface Player {
  username: string;
  lives: number;
  isEliminated: boolean;
  isProtected?: boolean;
}

export const RouletteGame: React.FC<RouletteGameProps> = ({ messages, onLeave, channelName, isConnected, error }) => {
  const [phase, setPhase] = useState<GamePhase>('joining');
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{ type: 'kill' | 'protect' | 'revive', target?: string, actor: string } | null>(null);
  const [spinIndex, setSpinIndex] = useState(0);
  
  const processedMessageIds = useRef<Set<string>>(new Set());

  // Handle Chat Commands
  useEffect(() => {
    messages.forEach(msg => {
      if (!processedMessageIds.current.has(msg.id)) {
        processedMessageIds.current.add(msg.id);
        
        const text = msg.message.trim().toLowerCase();
        
        // Join Command
        if (phase === 'joining' && text === '!join') {
          setPlayers(prev => {
            if (!prev[msg.username]) {
              return { 
                ...prev, 
                [msg.username]: { username: msg.username, lives: 3, isEliminated: false } 
              };
            }
            return prev;
          });
        }

        // Action Commands (Only for the selected player)
        if (phase === 'action' && msg.username.toLowerCase() === selectedPlayer?.toLowerCase()) {
          if (text.startsWith('!kill ')) {
            const target = text.replace('!kill ', '').replace('@', '').trim();
            handleAction('kill', target);
          } else if (text === '!protect') {
            handleAction('protect');
          }
        }
      }
    });
  }, [messages, phase, selectedPlayer]);

  const handleAction = (type: 'kill' | 'protect', target?: string) => {
    const actor = selectedPlayer!;
    
    setPlayers(prev => {
      const next = { ...prev };
      
      if (type === 'kill' && target && next[target] && !next[target].isEliminated) {
        if (next[target].isProtected) {
          next[target].isProtected = false;
        } else {
          next[target].lives -= 1;
          if (next[target].lives <= 0) {
            next[target].isEliminated = true;
          }
        }
        setLastAction({ type: 'kill', target, actor });
      } else if (type === 'protect') {
        next[actor].isProtected = true;
        setLastAction({ type: 'protect', actor });
      } else {
        return prev; // Invalid target
      }
      
      return next;
    });

    setPhase('result');
    setTimeout(() => {
      checkWinnerOrNextRound();
    }, 3000);
  };

  const checkWinnerOrNextRound = () => {
    const alivePlayers = Object.values(players).filter(p => !p.isEliminated);
    if (alivePlayers.length <= 1) {
      setPhase('winner');
    } else {
      setPhase('spinning');
      startSpin();
    }
  };

  const startSpin = () => {
    setPhase('spinning');
    setLastAction(null);
    
    const alivePlayers = Object.values(players).filter(p => !p.isEliminated);
    let iterations = 0;
    const maxIterations = 20 + Math.floor(Math.random() * 10);
    
    const interval = setInterval(() => {
      setSpinIndex(Math.floor(Math.random() * alivePlayers.length));
      iterations++;
      
      if (iterations >= maxIterations) {
        clearInterval(interval);
        const winner = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
        setSelectedPlayer(winner.username);
        setPhase('action');
      }
    }, 100);
  };

  const activePlayers = Object.values(players) as Player[];
  const alivePlayers = activePlayers.filter(p => !p.isEliminated);

  return (
    <div className="flex gap-8 h-[85vh] w-full max-w-[1600px] mx-auto font-arabic" dir="rtl">
      <div className="flex-1 bg-zinc-900 rounded-2xl border border-zinc-800 p-8 flex flex-col relative overflow-hidden">
        <button onClick={onLeave} className="absolute top-6 right-6 text-zinc-500 hover:text-white flex items-center gap-2 transition-colors z-10 bg-zinc-800/50 px-4 py-2 rounded-lg border border-zinc-700">
          <ArrowLeft className="w-5 h-5 rotate-180" /> العودة للردهة
        </button>

        <div className="h-full w-full pt-12 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {phase === 'joining' && (
              <motion.div key="joining" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
                <Dices className="w-20 h-20 text-yellow-500 mx-auto mb-6 animate-bounce" />
                <h2 className="text-4xl font-black text-white mb-4">روليت النجاة</h2>
                <p className="text-xl text-zinc-400 mb-8">اكتب <span className="text-yellow-500 font-mono bg-yellow-500/10 px-3 py-1 rounded-lg">!join</span> للمشاركة</p>
                
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 w-full max-w-xl mb-8 min-h-[150px] max-h-[300px] overflow-y-auto">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {activePlayers.map(p => (
                      <span key={p.username} className="bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-zinc-300 text-sm">
                        {p.username}
                      </span>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => alivePlayers.length >= 2 ? startSpin() : null}
                  disabled={alivePlayers.length < 2}
                  className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-4 px-12 rounded-xl transition-all text-lg shadow-lg shadow-yellow-600/20"
                >
                  بدء اللعبة ({alivePlayers.length} لاعبين)
                </button>
              </motion.div>
            )}

            {(phase === 'spinning' || phase === 'action') && (
              <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full flex flex-col items-center">
                <div className="relative w-full max-w-2xl h-48 flex items-center justify-center mb-12 overflow-hidden bg-zinc-950 rounded-3xl border border-zinc-800 shadow-inner">
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-zinc-950 z-10" />
                  <div className="flex gap-4 transition-transform duration-100 px-12">
                    {alivePlayers.map((p, i) => (
                      <motion.div
                        key={p.username}
                        animate={{ 
                          scale: spinIndex === i ? 1.2 : 0.8,
                          opacity: spinIndex === i ? 1 : 0.3,
                          x: (i - spinIndex) * 160
                        }}
                        className={`min-w-[140px] h-24 rounded-2xl flex items-center justify-center text-xl font-bold border-2 transition-colors ${
                          spinIndex === i ? 'bg-yellow-500 border-yellow-400 text-yellow-950 shadow-[0_0_30px_rgba(234,179,8,0.4)]' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        {p.username}
                      </motion.div>
                    ))}
                  </div>
                  <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-yellow-500 z-20 shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                </div>

                {phase === 'action' && selectedPlayer && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-zinc-800/50 p-8 rounded-3xl border border-yellow-500/30 max-w-xl w-full">
                    <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">دور اللاعب: <span className="text-yellow-500">{selectedPlayer}</span></h3>
                    <p className="text-zinc-400 mb-6">لديك القوة الآن! اختر فعلك عبر الدردشة:</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                        <Skull className="w-6 h-6 text-red-500 mx-auto mb-2" />
                        <p className="text-xs text-zinc-500 mb-1">إقصاء لاعب</p>
                        <code className="text-red-400 text-sm">!kill @name</code>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
                        <Shield className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <p className="text-xs text-zinc-500 mb-1">حماية نفسك</p>
                        <code className="text-blue-400 text-sm">!protect</code>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {phase === 'result' && lastAction && (
              <motion.div key="result" initial={{ opacity: 0, scale: 1.5 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                {lastAction.type === 'kill' ? (
                  <>
                    <Skull className="w-24 h-24 text-red-500 mx-auto mb-6" />
                    <h2 className="text-5xl font-black text-white mb-4">تم الإقصاء!</h2>
                    <p className="text-2xl text-zinc-400">
                      <span className="text-yellow-500">{lastAction.actor}</span> قضى على <span className="text-red-500">{lastAction.target}</span>
                    </p>
                  </>
                ) : (
                  <>
                    <Shield className="w-24 h-24 text-blue-500 mx-auto mb-6" />
                    <h2 className="text-5xl font-black text-white mb-4">درع الحماية!</h2>
                    <p className="text-2xl text-zinc-400">
                      <span className="text-yellow-500">{lastAction.actor}</span> قام بتفعيل الدرع
                    </p>
                  </>
                )}
              </motion.div>
            )}

            {phase === 'winner' && (
              <motion.div key="winner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <Trophy className="w-32 h-32 text-yellow-500 mx-auto mb-8 shadow-2xl" />
                <h2 className="text-6xl font-black text-white mb-4">الناجي الأخير!</h2>
                <h3 className="text-4xl font-bold text-yellow-500 mb-12">{alivePlayers[0]?.username}</h3>
                <button onClick={() => setPhase('joining')} className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 px-12 rounded-xl transition-colors">
                  لعب مرة أخرى
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Leaderboard Sidebar */}
      <div className="w-96 flex flex-col gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col h-1/2">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-yellow-500" /> اللاعبون ({alivePlayers.length})
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
            {activePlayers.map(p => (
              <div key={p.username} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                p.isEliminated ? 'bg-zinc-950 border-zinc-900 opacity-40 grayscale' : 'bg-zinc-800/50 border-zinc-700'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${p.isEliminated ? 'bg-red-500' : 'bg-green-500'}`} />
                  <span className="font-medium text-zinc-200">{p.username}</span>
                  {p.isProtected && <Shield className="w-3 h-3 text-blue-400" />}
                </div>
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <Heart key={i} className={`w-3 h-3 ${i < p.lives ? 'text-red-500 fill-red-500' : 'text-zinc-700'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <TwitchChat channelName={channelName} messages={messages} isConnected={isConnected} error={error} />
        </div>
      </div>
    </div>
  );
};
