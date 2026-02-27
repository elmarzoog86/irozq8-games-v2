import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Skull, Shield, Play, User, LogIn, Users, Crown, Heart as HeartIcon, Star, Ghost } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

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
  suspense: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
  heartbeat: 'https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3',
};

export const LiarsBarPlayer: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [name, setName] = useState('');
  const [selectedChar, setSelectedChar] = useState(CHARACTERS[0].id);
  const [joined, setJoined] = useState(false);
  const [state, setState] = useState<GameState | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [message, setMessage] = useState('');

  const suspenseAudio = React.useRef<HTMLAudioElement | null>(null);
  const heartbeatAudio = React.useRef<HTMLAudioElement | null>(null);

  const [firingResult, setFiringResult] = useState<{ dead: boolean, playerId: string } | null>(null);
  const [revealedCards, setRevealedCards] = useState<string[] | null>(null);

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

  const stateRef = React.useRef<GameState | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('state_update', (newState: GameState) => {
      setState(newState);
    });

    newSocket.on('kicked', () => {
      alert('لقد تم طردك من الغرفة.');
      window.location.href = '/';
    });

    newSocket.on('error', (err: string) => {
      alert(err);
      window.location.href = '/';
    });

    newSocket.on('liar_result', ({ isLying, loserName, actualCards }) => {
      playSound('liar_call');
      stopSuspense();
      setRevealedCards(actualCards);
      setTimeout(() => {
        suspenseAudio.current = playSound('suspense');
        heartbeatAudio.current = playSound('heartbeat', true);
      }, 500);
      setMessage(isLying ? `تم كشفه! ${loserName} كاذب!` : `آمن! ${loserName} كان يقول الحقيقة!`);
      setTimeout(() => setMessage(''), 5000);
    });

    newSocket.on('shot_fired', ({ dead, name }) => {
      const currentState = stateRef.current;
      const loser = currentState?.players.find(p => p.name === name) || currentState?.players.find(p => p.id === currentState.loserId);
      if (loser) {
        setFiringResult({ dead, playerId: loser.id });
        setTimeout(() => {
          setFiringResult(null);
          setRevealedCards(null);
          stopSuspense();
          playSound(dead ? 'bang' : 'click');
          setMessage(dead ? `💥 بانغ! مات ${name}.` : `💨 كليك... ${name} آمن.`);
          setTimeout(() => setMessage(''), 3000);
        }, 2000);
      } else {
        setRevealedCards(null);
        stopSuspense();
        playSound(dead ? 'bang' : 'click');
      }
    });

    newSocket.on('cards_played', ({ name }: { name: string }) => {
      playSound('card_play');
      
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

    return () => {
      newSocket.disconnect();
      stopSuspense();
    };
  }, []);

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    socket?.emit('join_room', { roomId, name, isStreamer: false, character: selectedChar });
    setJoined(true);
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
      case 'Kings': return <Crown className="w-8 h-8 text-brand-gold" />;
      case 'Queens': return <HeartIcon className="w-8 h-8 text-brand-gold/80" />;
      case 'Aces': return <Star className="w-8 h-8 text-brand-gold/60" />;
      case 'Joker': return <Ghost className="w-8 h-8 text-brand-gold/40" />;
      default: return null;
    }
  };

  if (!joined) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans dir-rtl" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center space-y-2">
            <h1 className="text-5xl font-black italic tracking-tighter text-brand-gold uppercase glow-gold-text">حانة الكاذبين</h1>
            <p className="text-brand-gold/60 uppercase tracking-widest text-xs">ادخل وكر الخداع</p>
          </div>

          <form onSubmit={joinRoom} className="bg-black/40 border border-brand-gold/20 p-8 rounded-3xl space-y-6 backdrop-blur-xl">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-brand-gold/50">اسمك</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="من أنت؟"
                  className="w-full bg-black/40 border border-brand-gold/20 rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-brand-gold outline-none transition-all text-right"
                  autoFocus
                />
                <User className="absolute left-4 top-4 text-brand-gold/30 w-5 h-5" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-brand-gold/50">اختر شخصيتك</label>
              <div className="grid grid-cols-3 gap-3">
                {CHARACTERS.map(char => (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => setSelectedChar(char.id)}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      selectedChar === char.id ? 'border-brand-gold bg-brand-gold/10' : 'border-brand-gold/10 bg-black/40 hover:border-brand-gold/30'
                    }`}
                  >
                    <span className="text-3xl">{char.icon}</span>
                    <span className="text-[10px] uppercase font-bold text-brand-gold/50">{char.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-black/40 border border-brand-gold/20 hover:bg-brand-gold/5 text-white font-black py-4 rounded-xl transition-all uppercase italic tracking-tighter flex items-center justify-center gap-2 text-lg"
              >
                رجوع
              </button>
              <button
                type="submit"
                className="flex-[2] bg-brand-gold hover:bg-brand-gold-light text-black font-black py-4 rounded-xl transition-all uppercase italic tracking-tighter flex items-center justify-center gap-2 text-lg shadow-[0_0_20px_rgba(212,175,55,0.3)]"
              >
                <LogIn className="w-5 h-5" /> انضم للطاولة
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  if (!state) return <div className="min-h-screen bg-[#0a0502] flex items-center justify-center text-white dir-rtl">جاري الاتصال...</div>;

  const me = state.players.find(p => p.id === socket?.id);
  const isMyTurn = state.players[state.currentTurn]?.id === socket?.id;
  const isRoulette = state.status === 'roulette';
  const isLoser = state.loserId === socket?.id;

  return (
    <div className="min-h-screen bg-black flex flex-col text-white font-sans overflow-hidden relative dir-rtl" dir="rtl">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-gold/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-gold/5 rounded-full blur-[120px]" />
      </div>

      {/* Game Header */}
      <div className="p-6 flex justify-between items-center bg-brand-gold/5 border-b border-brand-gold/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{CHARACTERS.find(c => c.id === me?.character)?.icon}</div>
          <div>
            <p className="text-[10px] text-brand-gold/50 uppercase tracking-widest text-right">البطاقة الهدف</p>
            <h2 className="text-2xl font-black italic text-brand-gold text-right glow-gold-text">{translateCard(state.targetCard)}</h2>
          </div>
        </div>
        <div className="text-left">
          <p className="text-[10px] text-brand-gold/50 uppercase tracking-widest text-left">أرواحك</p>
          <div className="flex gap-1 mt-1 justify-end">
            {Array(6).fill(0).map((_, i) => {
              const isShot = i < (me?.shotsTaken || 0);
              const isDead = me?.lives === 0;
              return (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                    isDead ? 'bg-brand-gold/10' : isShot ? 'bg-brand-gold/40' : 'bg-brand-gold'
                  }`} 
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative perspective-[1000px]">
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-4 bg-brand-gold text-black font-black px-6 py-3 rounded-2xl text-sm uppercase italic z-50 shadow-[0_0_50px_rgba(212,175,55,0.5)] border-2 border-white/20"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {state.status === 'waiting' ? (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-black/40 rounded-full flex items-center justify-center mx-auto border-2 border-brand-gold/20 animate-pulse">
              <Users className="w-8 h-8 text-brand-gold/30" />
            </div>
            <p className="text-brand-gold/40 uppercase tracking-widest text-xs">بانتظار بدء البث...</p>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            {/* Full Table View (Same as Streamer) */}
            <div className="relative w-full max-w-4xl aspect-[2.2/1] bg-black border-[8px] border-brand-gold/20 rounded-[100px] flex items-center justify-center shadow-[0_30px_80px_rgba(0,0,0,0.8),inset_0_0_50px_rgba(212,175,55,0.05)] transform rotateX(20deg) mb-12">
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] rounded-[92px]" />
              
              {/* Target Card Display */}
              <div className="text-center space-y-1 z-10">
                <p className="text-[10px] text-brand-gold/50 uppercase tracking-[0.4em] font-black">الهدف</p>
                <h2 className="text-5xl font-black italic text-white drop-shadow-[0_0_15px_rgba(212,175,55,0.3)] tracking-tighter">
                  {translateCard(state.targetCard)}
                </h2>
                
                {/* Cards in middle */}
                <div className="flex justify-center gap-1 mt-6 h-16 relative">
                  <AnimatePresence>
                {state.tableCards.map((card, i) => {
                  const isRevealed = revealedCards && i >= state.tableCards.length - revealedCards.length;
                  return (
                    <motion.div 
                      key={i}
                      initial={{ y: -100, opacity: 0, rotate: -90 }}
                      animate={{ 
                        y: 0, 
                        opacity: 1, 
                        rotate: isRevealed ? 0 : (i * 10) - (state.tableCards.length * 5) + (Math.random() * 6 - 3),
                        x: isRevealed && revealedCards 
                          ? ((i - (state.tableCards.length - revealedCards.length)) - ((revealedCards.length - 1) / 2)) * 40 // Spread revealed cards
                          : (i * 4) - (state.tableCards.length * 2), // Keep others stacked
                        rotateY: isRevealed ? 180 : 0,
                        zIndex: isRevealed ? 100 + i : i
                      }}
                      transition={{ 
                        rotateY: { duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }
                      }}
                      className="w-10 h-14 absolute preserve-3d"
                      style={{ zIndex: i }}
                    >
                      {/* Card Front */}
                      <div 
                        className="absolute inset-0 bg-white border border-zinc-200 rounded-md flex flex-col items-center justify-between p-0.5 backface-hidden"
                        style={{ transform: 'rotateY(180deg)' }}
                      >
                        <span className="text-[8px] font-black text-black self-start">{card?.[0]}</span>
                        <div className="scale-[0.6]">{getCardIcon(card)}</div>
                        <span className="text-[8px] font-black text-black self-end rotate-180">{card?.[0]}</span>
                      </div>

                      {/* Card Back */}
                      <div className="absolute inset-0 bg-black border border-brand-gold/20 rounded-md shadow-xl backface-hidden">
                        <div className="absolute inset-1 border border-brand-gold/10 rounded flex items-center justify-center">
                          <Skull className="w-4 h-4 text-brand-gold/10" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                  </AnimatePresence>
                </div>
              </div>

              {/* Players around table */}
              {state.players.map((p, i) => {
                const angle = (i / state.players.length) * Math.PI * 2 - Math.PI / 2;
                const x = Math.cos(angle) * 130;
                const y = Math.sin(angle) * 70;
                const isTurn = state.currentTurn === i;
                const char = CHARACTERS.find(c => c.id === p.character);
                const isFiring = firingResult?.playerId === p.id;
                const isMe = p.id === socket?.id;

                return (
                  <motion.div
                    key={p.id}
                    className="absolute flex flex-col items-center gap-1 z-20"
                    style={{ left: `calc(50% + ${x}%)`, top: `calc(50% + ${y}%)` }}
                  >
                    <div className={`relative p-1 rounded-full border-2 transition-all duration-700 ${isTurn ? 'border-brand-gold scale-110 shadow-[0_0_20px_rgba(212,175,55,0.5)]' : 'border-brand-gold/10 bg-black/40'}`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border border-brand-gold/10 ${p.lives <= 0 ? 'grayscale opacity-40' : ''}`}>
                        <span className="text-2xl">{char?.icon}</span>
                      </div>
                      
                      {isTurn && (
                        <div className="absolute -top-1 -right-1 bg-brand-gold text-black p-0.5 rounded-full border border-black">
                          <Play className="w-2.5 h-2.5 fill-current" />
                        </div>
                      )}
                      
                      {p.lives <= 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                          <Skull className="w-6 h-6 text-brand-gold/40" />
                        </div>
                      )}

                      {/* Revolver Animation */}
                      <AnimatePresence>
                        {isFiring && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0, y: -20 }}
                            animate={{ scale: 2, opacity: 1, y: -40 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute z-50 pointer-events-none left-1/2 -translate-x-1/2"
                          >
                            <motion.div
                              animate={firingResult.dead ? { 
                                scale: [1, 1.2, 1],
                                filter: ['brightness(1)', 'brightness(3)', 'brightness(1)']
                              } : {
                                x: [0, -2, 2, -2, 0]
                              }}
                            >
                              🔫
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <div className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${isMe ? 'bg-brand-gold/20 border-brand-gold/50 text-brand-gold' : 'bg-black/40 border-brand-gold/10 text-white/70'}`}>
                      {p.name} {isMe && '(أنت)'}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <HeartIcon className="w-2 h-2 text-brand-gold fill-current" />
                      <span className="text-[8px] font-bold text-brand-gold/70">الأرواح: {p.lives > 0 ? 1 : 0}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Hand */}
            <div className="w-full space-y-4">
              <div className="text-center">
                <p className={`text-xs font-black uppercase italic tracking-widest ${isMyTurn ? 'text-brand-gold glow-gold-text' : 'text-brand-gold/30'}`}>
                  {isMyTurn ? "دورك الآن!" : `دور ${state.players[state.currentTurn]?.name}`}
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2">
                {me?.cards.map((card, i) => {
                  const isSelected = selectedIndices.includes(i);
                  return (
                    <motion.button
                      key={i}
                      layout
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedIndices(prev => prev.filter(idx => idx !== i));
                        } else if (selectedIndices.length < 3) {
                          setSelectedIndices(prev => [...prev, i]);
                        }
                      }}
                      className={`w-20 h-32 rounded-xl border-2 flex flex-col items-center justify-between p-2 transition-all relative overflow-hidden ${
                        isSelected
                          ? 'border-brand-gold bg-brand-gold/20 -translate-y-6 shadow-[0_0_30px_rgba(212,175,55,0.4)]'
                          : 'border-brand-gold/10 bg-black/40'
                      }`}
                    >
                      {/* Shimmer Effect for Selected Cards */}
                      {isSelected && (
                        <motion.div
                          initial={{ x: '-100%' }}
                          animate={{ x: '200%' }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
                        />
                      )}

                      <div className="self-start text-[10px] font-bold opacity-50">{card[0]}</div>
                      <motion.div 
                        animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ repeat: isSelected ? Infinity : 0, duration: 2 }}
                        className="scale-75"
                      >
                        {getCardIcon(card)}
                      </motion.div>
                      <div className="self-end text-[10px] font-bold opacity-50 rotate-180">{card[0]}</div>
                      
                      {/* Card Pattern Overlay */}
                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:10px_10px]" />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="p-6 bg-black/40 border-t border-brand-gold/10 backdrop-blur-xl space-y-4">
        {isRoulette ? (
          <div className="w-full bg-brand-gold/5 text-brand-gold/40 font-black py-4 rounded-xl transition-all uppercase italic tracking-tighter flex items-center justify-center gap-2 text-xl border border-brand-gold/10">
            <Skull className="w-6 h-6" /> بانتظار النتيجة...
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={playCards}
              disabled={!isMyTurn || selectedIndices.length === 0 || state.status !== 'playing'}
              className="bg-brand-gold hover:bg-brand-gold-light disabled:bg-brand-gold/5 disabled:text-brand-gold/20 text-black font-black py-4 rounded-xl transition-all uppercase italic tracking-tighter text-lg shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            >
              العب {selectedIndices.length} بطاقات
            </button>
            <button
              onClick={callLiar}
              disabled={!state.lastPlay || state.lastPlay.playerId === socket?.id || state.status !== 'playing'}
              className="bg-black/40 hover:bg-brand-gold/5 disabled:bg-brand-gold/5 disabled:text-brand-gold/20 text-brand-gold font-black py-4 rounded-xl transition-all uppercase italic tracking-tighter text-lg border border-brand-gold/20"
            >
              كاذب!
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
