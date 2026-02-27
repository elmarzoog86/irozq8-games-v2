import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Play, Skull, Shield, EyeOff, GripHorizontal, XCircle, Share2, Copy, CheckCircle2, Crown, Heart as HeartIcon, Star, Ghost } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

interface Player {
  id: string;
  name: string;
  cards: string[];
  lives: number;
  shotsTaken: number;
  isStreamer: boolean;
  character: string;
}

interface GameState {
  players: Player[];
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

const CHARACTERS = [
  { id: 'Dog', icon: '🐶', name: 'كلب', color: 'bg-brand-gold', phrase: 'أنا لا أكذب أبداً، صدقني!' },
  { id: 'Cat', icon: '🐱', name: 'قطة', color: 'bg-brand-gold/80', phrase: 'مياو... هل أنت متأكد من ذلك؟' },
  { id: 'Bear', icon: '🐻', name: 'دب', color: 'bg-brand-gold/60', phrase: 'سأحطمك إذا كنت تكذب!' },
  { id: 'Rabbit', icon: '🐰', name: 'أرنب', color: 'bg-brand-gold/40', phrase: 'أنا سريع جداً في كشف الكاذبين.' },
  { id: 'Fox', icon: '🦊', name: 'ثعلب', color: 'bg-brand-gold/20', phrase: 'المكر هو لعبتي المفضلة.' },
  { id: 'Wolf', icon: '🐺', name: 'ذئب', color: 'bg-brand-gold/10', phrase: 'رائحة الكذب تملأ المكان.' },
  { id: 'Lion', icon: '🦁', name: 'أسد', color: 'bg-brand-gold', phrase: 'أنا الملك هنا، لا أحد يجرؤ على الكذب!' },
  { id: 'Panda', icon: '🐼', name: 'باندا', color: 'bg-brand-gold/50', phrase: 'أبدو لطيفاً، لكني كاشف للكذب.' },
  { id: 'Pig', icon: '🐷', name: 'خنزير', color: 'bg-brand-gold/30', phrase: 'هل هذه بطاقة حقيقية أم مجرد وهم؟' },
];

const SOUNDS = {
  card_play: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  liar_call: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  click: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
  bang: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  suspense: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3', // Tension riser
  heartbeat: 'https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3', // Heartbeat loop
};

export const LiarsBarGame: React.FC<{ onLeave: () => void }> = ({ onLeave }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId] = useState(() => uuidv4().slice(0, 6));
  const [state, setState] = useState<GameState | null>(null);
  const [showSecret, setShowSecret] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [selectedChar, setSelectedChar] = useState(CHARACTERS[0].id);
  
  const suspenseAudio = useRef<HTMLAudioElement | null>(null);
  const heartbeatAudio = useRef<HTMLAudioElement | null>(null);

  const [firingResult, setFiringResult] = useState<{ dead: boolean, playerId: string } | null>(null);
  const [revealedCards, setRevealedCards] = useState<string[] | null>(null);

  const playerLink = `${window.location.origin}/join/${roomId}`;

  const playSound = useCallback((type: keyof typeof SOUNDS, loop = false) => {
    const audio = new Audio(SOUNDS[type]);
    audio.volume = type === 'heartbeat' ? 0.3 : 0.5;
    audio.loop = loop;
    audio.play().catch(() => {});
    return audio;
  }, []);

  const stopSuspense = useCallback(() => {
    if (suspenseAudio.current) {
      suspenseAudio.current.pause();
      suspenseAudio.current = null;
    }
    if (heartbeatAudio.current) {
      heartbeatAudio.current.pause();
      heartbeatAudio.current = null;
    }
  }, []);

  const stateRef = useRef<GameState | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.emit('join_room', { roomId, name: 'Streamer', isStreamer: true, character: selectedChar });

    newSocket.on('state_update', (newState: GameState) => {
      setState(newState);
    });

    newSocket.on('cards_played', ({ name, count }) => {
      playSound('card_play');
      setEventLog(prev => [`لعب ${name} ${count} بطاقات.`, ...prev].slice(0, 5));
      
      // Catch phrase logic
      const player = stateRef.current?.players.find(p => p.name === name);
      if (player) {
        const char = CHARACTERS.find(c => c.id === player.character);
        if (char && Math.random() > 0.5) {
          const utterance = new SpeechSynthesisUtterance(char.phrase);
          utterance.lang = 'ar-SA';
          window.speechSynthesis.speak(utterance);
        }
      }
    });

    newSocket.on('liar_result', ({ isLying, loserName, actualCards, forced }) => {
      playSound('liar_call');
      stopSuspense();
      
      // Reveal cards on the table
      setRevealedCards(actualCards);
      
      // Small delay before suspense music to let the buzzer be heard
      setTimeout(() => {
        suspenseAudio.current = playSound('suspense');
        heartbeatAudio.current = playSound('heartbeat', true);
      }, 500);
      
      setEventLog(prev => [
        `${forced ? '[إجباري] ' : ''}${isLying ? 'تم كشفه!' : 'آمن!'} ${loserName} يجب أن يسحب الزناد. (البطاقات كانت: ${actualCards.map(c => translateCard(c)).join(', ')})`,
        ...prev
      ].slice(0, 5));
    });

    newSocket.on('shot_fired', ({ dead, name }) => {
      const currentState = stateRef.current;
      const loser = currentState?.players.find(p => p.name === name) || currentState?.players.find(p => p.id === currentState.loserId);
      
      if (loser) {
        setFiringResult({ dead, playerId: loser.id });
        setTimeout(() => {
          setFiringResult(null);
          setRevealedCards(null); // Clear revealed cards after shot
          stopSuspense();
          playSound(dead ? 'bang' : 'click');
          setEventLog(prev => [dead ? `💥 بانغ! ${name} خرج من اللعبة.` : `💨 كليك... ${name} آمن.`, ...prev].slice(0, 5));
        }, 2000);
      } else {
        setRevealedCards(null);
        stopSuspense();
        playSound(dead ? 'bang' : 'click');
      }
    });

    return () => {
      newSocket.disconnect();
      stopSuspense();
    };
  }, [roomId, selectedChar]);

  const copyLink = () => {
    navigator.clipboard.writeText(playerLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = () => {
    socket?.emit('start_game', roomId);
  };

  const resetToLobby = () => {
    socket?.emit('reset_to_lobby', roomId);
  };

  const playCards = () => {
    if (selectedIndices.length === 0 || selectedIndices.length > 3 || !me) return;
    const cards = selectedIndices.map(idx => me.cards[idx]);
    socket?.emit('play_cards', { roomId, cards });
    setSelectedIndices([]);
  };

  const callLiar = () => {
    socket?.emit('call_liar', roomId);
  };

  const kickPlayer = (playerId: string) => {
    socket?.emit('kick_player', { roomId, playerId });
  };

  const translateCard = (card: string) => {
    switch (card) {
      case 'Kings': return 'ملوك';
      case 'Queens': return 'ملكات';
      case 'Aces': return 'آص';
      case 'Joker': return 'جوكر';
      default: return card;
    }
  };

  const getCardIcon = (card: string) => {
    switch (card) {
      case 'Kings': return <Crown className="w-4 h-4 text-brand-gold" />;
      case 'Queens': return <HeartIcon className="w-4 h-4 text-brand-gold/80" />;
      case 'Aces': return <Star className="w-4 h-4 text-brand-gold/60" />;
      case 'Joker': return <Ghost className="w-4 h-4 text-brand-gold/40" />;
      default: return null;
    }
  };

  if (!state) return <div className="flex items-center justify-center h-full text-white dir-rtl">جاري الاتصال بالخادم...</div>;

  const me = state.players.find(p => p.id === socket?.id);
  const isMyTurn = state.players[state.currentTurn]?.id === socket?.id;
  const isLoser = state.loserId === socket?.id;

  return (
    <div className="relative h-full w-full bg-[#0a0502] overflow-hidden font-sans text-white dir-rtl rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.8)]" dir="rtl">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1a1a1a_0%,#000000_100%)] pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.03)_0%,transparent_60%)]" />
      </div>

      {/* Header / Room Info */}
      <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-10 pointer-events-none">
        <div className="space-y-1 pointer-events-auto">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-brand-gold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">حانة الكاذبين</h1>
          <div className="flex items-center gap-2 text-sm text-zinc-400 font-mono bg-black/40 px-3 py-1 rounded-full border border-white/5 backdrop-blur-md inline-flex">
            <Users className="w-4 h-4" /> {state.players.length} لاعبين
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          <div className="flex gap-2">
            <button 
              onClick={onLeave}
              className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-xs font-bold text-red-400 hover:text-red-200 hover:bg-red-500/20 transition-all flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" /> خروج
            </button>
            <div className="bg-black/60 border border-brand-gold/20 p-2 rounded-xl flex items-center gap-3 backdrop-blur-md shadow-lg">
              <code className="text-brand-gold font-bold px-3 text-lg font-mono tracking-widest">{roomId}</code>
              <button 
                onClick={copyLink}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
                title="نسخ رابط الانضمام"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="h-full flex flex-col items-center justify-center p-20 perspective-[1200px]">
        {/* Table Structure */}
        <div className="relative w-full max-w-6xl aspect-[2/1] bg-[#1a0f0a] rounded-[200px] flex items-center justify-center shadow-[0_50px_150px_rgba(0,0,0,0.9),0_20px_40px_rgba(0,0,0,0.5),inset_0_5px_20px_rgba(255,255,255,0.05)] transform rotateX(25deg) border-8 border-[#2e1d15] ring-1 ring-white/5">
          {/* Wood Rim Texture */}
          <div className="absolute inset-0 rounded-[190px] border-[24px] border-[#3d261a] shadow-[inset_0_5px_15px_rgba(0,0,0,0.8)] pointer-events-none" />
          
          {/* Felt Surface */}
          <div className="absolute inset-6 rounded-[170px] bg-[#0c2e1f] shadow-[inset_0_0_100px_rgba(0,0,0,0.9)] overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-30 mix-blend-overlay" />
            
            {/* Table Logo/Decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-white/5 rounded-full opacity-20 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white/5 rounded-full" />
            </div>
          </div>
          
          {/* Target Card Display Area */}
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
            <div className="bg-black/40 backdrop-blur-sm px-6 py-2 rounded-full border border-white/5 mb-4 shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
              <p className="text-[10px] text-brand-gold/80 uppercase tracking-[0.3em] font-black">الورقة المطلوبة</p>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-brand-gold/5 blur-xl rounded-full" />
              <h2 className="relative text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-brand-gold to-[#8a7024] drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] transform -rotate-2">
                {state.status === 'waiting' ? '???' : translateCard(state.targetCard)}
              </h2>
            </div>
            
          </div>

          {/* Cards in the middle of the table */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-full h-full">
              <AnimatePresence>
                {state.tableCards.map((card, i) => {
                  const isRevealed = revealedCards && i >= state.tableCards.length - revealedCards.length;
                  const randomRotate = (i * 8) - (state.tableCards.length * 4) + (Math.random() * 5 - 2.5);
                  let randomX = (i * 2) - (state.tableCards.length);
                  
                  // Spread revealed cards
                  if (isRevealed && revealedCards) {
                    const revealedIndex = i - (state.tableCards.length - revealedCards.length);
                    const totalRevealed = revealedCards.length;
                    // Center the spread: (index - (total-1)/2) * gap
                    randomX = (revealedIndex - (totalRevealed - 1) / 2) * 60;
                  }
                  
                  return (
                    <motion.div 
                      key={i}
                      initial={{ y: -400, opacity: 0, scale: 0.5, rotateX: 90 }}
                      animate={{ 
                        y: isRevealed ? -50 : 0, // Lift up slightly when revealed
                        opacity: 1, 
                        scale: isRevealed ? 1.2 : 1, // Make revealed cards slightly larger
                        rotateX: 0,
                        rotateZ: isRevealed ? 0 : randomRotate, // Straighten revealed cards
                        x: randomX,
                        rotateY: isRevealed ? 180 : 0,
                        zIndex: isRevealed ? 100 + i : i // Bring revealed cards to front
                      }}
                      exit={{ opacity: 0, y: 100 }}
                      className="absolute top-1/2 left-1/2 -ml-6 -mt-9 w-12 h-18 preserve-3d"
                      style={{ 
                        zIndex: i,
                        transformStyle: 'preserve-3d'
                      }}
                    >
                      {/* Card Front (Revealed) */}
                      <div 
                        className="absolute inset-0 bg-[#e8e8e8] border border-gray-300 rounded-[4px] flex flex-col items-center justify-between p-1 backface-hidden shadow-md overflow-hidden"
                        style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                      >
                         <span className="text-[10px] font-bold text-gray-800 self-start leading-none">{card?.[0]}</span>
                         <div className="transform scale-75">{getCardIcon(card)}</div>
                         <span className="text-[10px] font-bold text-gray-800 self-end rotate-180 leading-none">{card?.[0]}</span>
                      </div>

                      {/* Card Back */}
                      <div className="absolute inset-0 bg-red-800 rounded-[4px] shadow-sm backface-hidden border border-white/10" style={{ backfaceVisibility: 'hidden' }}>
                        <div className="absolute inset-[2px] border border-white/20 rounded-[2px] bg-[repeating-linear-gradient(45deg,#8b0000,#8b0000_5px,#600000_5px,#600000_10px)]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Crown className="w-4 h-4 text-brand-gold/40" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Players Around Table */}
          {state.players.map((p, i) => {
            const angle = (i / state.players.length) * Math.PI * 2 - Math.PI / 2;
            const radius = 55; // Percentage
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius * 0.6; // Elliptical placement
            
            const isTurn = state.currentTurn === i;
            const char = CHARACTERS.find(c => c.id === p.character);
            const isFiring = firingResult?.playerId === p.id;
            const isDead = p.lives <= 0;

            return (
              <motion.div
                key={p.id}
                className="absolute flex flex-col items-center justify-center w-24 z-20"
                style={{ 
                  left: `calc(50% + ${x}%)`, 
                  top: `calc(50% + ${y}%)`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* Player Avatar Card */}
                <div className={`relative group transition-all duration-500 ${isTurn ? 'z-30 scale-110' : 'z-20 scale-100'} ${isDead ? 'grayscale opacity-60' : ''}`}>
                  {/* Turn Highlight Glow */}
                  {isTurn && (
                    <div className="absolute -inset-4 bg-brand-gold/20 rounded-full blur-xl animate-pulse" />
                  )}
                  
                  <div className={`relative w-20 h-20 bg-gradient-to-br from-gray-800 to-black rounded-2xl border-2 shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex items-col items-center justify-center overflow-hidden
                    ${isTurn ? 'border-brand-gold ring-2 ring-brand-gold/30' : 'border-gray-700'}`}>
                    
                    <span className="text-4xl filter drop-shadow-lg transform transition-transform group-hover:scale-110 duration-300">
                      {char?.icon}
                    </span>
                    
                    {/* Elimination Skull Overlay */}
                    {isDead && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                        <Skull className="w-10 h-10 text-red-600 animate-bounce" />
                      </div>
                    )}
                  </div>

                  {/* Name Tag */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 border border-white/10 px-3 py-0.5 rounded-full backdrop-blur-md shadow-lg">
                    <span className="text-[10px] font-bold text-gray-200 uppercase tracking-widest">{p.name}</span>
                  </div>
                  
                  {/* Turn Indicator Icon */}
                  {isTurn && !isDead && (
                    <motion.div 
                      className="absolute -top-3 -right-3 bg-brand-gold text-black rounded-full p-1 shadow-lg z-40 border border-white/20"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </motion.div>
                  )}

                  {/* Kick Button (Streamer Only) */}
                  {!p.isStreamer && state.status === 'waiting' && (
                    <button 
                      onClick={() => kickPlayer(p.id)}
                      className="absolute -top-2 -left-2 bg-red-600 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50 transform hover:scale-110"
                      title="طرد اللاعب"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Player Stats (Lives) */}
                <div className="mt-4 flex gap-1 justify-center bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm border border-white/5">
                   {Array(6).fill(0).map((_, idx) => {
                      const isShot = idx < (p.shotsTaken || 0);
                      return (
                        <div 
                          key={idx} 
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                             isShot ? 'bg-red-900 shadow-inner' : 'bg-brand-gold shadow-[0_0_5px_rgba(212,175,55,0.6)]'
                          }`}
                        />
                      );
                    })}
                </div>

                {/* Player Hand Visualization (Face Down) */}
                <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-12 h-16 pointer-events-none">
                   {p.cards.length > 0 && Array.from({ length: 3 }).map((_, i) => (
                      <div 
                        key={i}
                        className="absolute top-0 w-8 h-10 bg-red-900 border border-white/20 rounded-[2px] shadow-sm transform origin-bottom-left"
                        style={{ 
                          left: i * 3, 
                          top: i * -1,
                          transform: `rotate(${i * 5}deg)` 
                        }}
                      />
                   ))}
                   <div className="absolute top-12 left-0 text-[9px] font-mono text-white/50 bg-black/60 px-1 rounded">
                     {p.cards.length}
                   </div>
                </div>

                {/* Revolver Animation */}
                  <AnimatePresence>
                    {isFiring && (
                      <motion.div
                        initial={{ scale: 0, rotate: -90, opacity: 0, x: -50 }}
                        animate={{ scale: 1.5, rotate: 0, opacity: 1, x: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
                      >
                        <div className="relative">
                          <motion.div
                            animate={firingResult.dead ? { 
                              scale: [1, 1.2, 1],
                              rotate: [0, -25, 0],
                              x: [0, -10, 0]
                            } : {
                              x: [0, -2, 2, -2, 0],
                              rotate: [0, -2, 2, 0]
                            }}
                            transition={{ duration: 0.15 }}
                            className="text-6xl filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                          >
                            🔫
                          </motion.div>
                          {firingResult.dead && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 2.5 }}
                              className="absolute top-0 -left-4 w-12 h-12 bg-orange-500 rounded-full blur-xl mix-blend-screen"
                            />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Event Log */}
      <div className="absolute bottom-6 left-6 w-64 space-y-2 pointer-events-none">
        <AnimatePresence>
          {eventLog.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1 - (i * 0.2), x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-black/60 backdrop-blur-sm border-l-2 border-brand-gold p-2 text-[10px] uppercase font-bold tracking-wider"
            >
              {log}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Streamer Secret View (Draggable) */}
      {showSecret && (
        <motion.div
          drag
          dragMomentum={false}
          className="absolute z-50 bottom-12 right-12 w-96 bg-[#1a1a1a] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.1)] overflow-hidden cursor-move font-sans"
        >
          {/* Header */}
          <div className="bg-[#0f0f0f] p-3 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="bg-brand-gold/10 p-1.5 rounded-md">
                 <GripHorizontal className="w-4 h-4 text-brand-gold" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">لوحة التحكم</span>
            </div>
            <button 
              onClick={() => setShowSecret(false)} 
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
            {state.status === 'waiting' ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <span className="text-[10px] text-brand-gold/50 uppercase tracking-widest font-bold">اختر شخصيتك</span>
                  <div className="grid grid-cols-4 gap-2">
                    {CHARACTERS.map(char => (
                      <button
                        key={char.id}
                        onClick={() => setSelectedChar(char.id)}
                        className={`aspect-square rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                          selectedChar === char.id 
                            ? 'border-brand-gold bg-brand-gold/10 shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                            : 'border-white/5 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-2xl filter drop-shadow-md">{char.icon}</span>
                        <span className={`text-[8px] uppercase font-bold ${selectedChar === char.id ? 'text-brand-gold' : 'text-zinc-500'}`}>{char.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={startGame}
                  disabled={state.players.length < 2}
                  className="w-full bg-gradient-to-r from-brand-gold to-[#8a7024] hover:from-[#ffd700] hover:to-[#a0822b] disabled:opacity-20 disabled:cursor-not-allowed text-black font-black py-4 rounded-xl transition-all uppercase italic tracking-wider shadow-lg transform active:scale-95"
                >
                  ابدأ المغامرة
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                 <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">بطاقاتك</span>
                    <span className="text-[10px] font-mono text-brand-gold">{selectedIndices.length} مختارة</span>
                 </div>

                <div className="flex flex-wrap gap-2 justify-center py-2 min-h-[100px]">
                  {me?.cards.map((card, i) => {
                    const isSelected = selectedIndices.includes(i);
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedIndices(prev => prev.filter(idx => idx !== i));
                          } else if (selectedIndices.length < 3) {
                            setSelectedIndices(prev => [...prev, i]);
                          }
                        }}
                        className={`w-12 h-16 rounded-[4px] border border-gray-400 flex flex-col items-center justify-between p-0.5 transition-all text-gray-900 shadow-md ${
                          isSelected 
                            ? 'ring-2 ring-brand-gold ring-offset-2 ring-offset-black -translate-y-2 z-10' 
                            : 'hover:-translate-y-1 bg-gray-200'
                        }`}
                        style={{ backgroundColor: isSelected ? '#fff' : '#e5e5e5' }}
                      >
                        <span className="text-[8px] font-bold self-start leading-none">{card[0]}</span>
                        <div className="transform scale-75">{getCardIcon(card)}</div>
                        <span className="text-[8px] font-bold self-end rotate-180 leading-none">{card[0]}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={playCards}
                    disabled={!isMyTurn || selectedIndices.length === 0 || state.status !== 'playing'}
                    className="bg-brand-gold hover:bg-[#ffe066] disabled:opacity-20 disabled:cursor-not-allowed text-black font-black py-3 rounded-lg transition-all uppercase italic text-xs shadow-lg flex flex-col items-center justify-center leading-tight"
                  >
                    <span>لعب البطاقات</span>
                    <span className="text-[8px] opacity-60 font-normal">({selectedIndices.length})</span>
                  </button>
                  <button
                    onClick={callLiar}
                    disabled={!state.lastPlay || state.lastPlay.playerId === socket?.id || state.status !== 'playing'}
                    className="bg-red-600/20 hover:bg-red-600/40 disabled:opacity-20 text-red-500 font-black py-3 rounded-lg transition-all uppercase italic text-xs border border-red-500/30 hover:border-red-500 flex flex-col items-center justify-center"
                  >
                    <span>كاذب!</span>
                    <span className="text-[8px] opacity-60 font-normal">تحدي اللاعب</span>
                  </button>
                </div>

                {state.status === 'roulette' && (
                  <div className="bg-black/40 border border-white/5 text-zinc-400 w-full font-bold py-3 rounded-lg transition-all uppercase italic text-xs flex items-center justify-center gap-2 animate-pulse">
                    <Skull className="w-4 h-4" /> الروليت الروسي...
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Show Secret Toggle */}
      {!showSecret && (
        <button
          onClick={() => setShowSecret(true)}
          className="absolute bottom-6 right-6 bg-black/80 backdrop-blur-md border border-brand-gold/20 p-4 rounded-full text-brand-gold hover:bg-brand-gold/10 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:border-brand-gold/40 hover:scale-110"
        >
          <EyeOff className="w-6 h-6" />
        </button>
      )}

      {/* Status Overlays */}
      <AnimatePresence>
        {state.status === 'game_over' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-center p-10"
          >
            <Skull className="w-24 h-24 text-brand-gold mb-6 glow-gold" />
            <h2 className="text-6xl font-black italic uppercase tracking-tighter mb-2 text-white">انتهت اللعبة</h2>
            <p className="text-brand-gold/60 mb-8 uppercase tracking-widest">لقد فاز {state.winner}!</p>
            <div className="flex gap-4">
              <button 
                onClick={startGame}
                className="bg-brand-gold hover:bg-brand-gold-light text-black font-black px-12 py-4 rounded-xl transition-all uppercase italic text-xl shadow-[0_0_30px_rgba(212,175,55,0.3)]"
              >
                العب مرة أخرى
              </button>
              <button 
                onClick={resetToLobby}
                className="bg-black/40 hover:bg-black/60 text-brand-gold font-black px-12 py-4 rounded-xl transition-all uppercase italic text-xl border border-brand-gold/30 hover:border-brand-gold/60 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
              >
                العودة للردهة
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
