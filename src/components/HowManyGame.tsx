import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Play, Trophy, Timer, Swords, MessageSquare, Share2, Copy, CheckCircle2, XCircle, ArrowRight, Info } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { ChatSidebar } from './ChatSidebar';

interface Player {
  id: string;
  name: string;
  isEliminated: boolean;
  isWebJoined: boolean;
  socketId: string | null;
}

interface GameState {
  players: Player[];
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
  turn: string | null;
  bid: number;
}

const CATEGORY_POOL = [
  'فواكه', 'دول', 'ماركات سيارات', 'لاعبين كرة قدم', 'أفلام ديزني', 
  'عواصم', 'حيوانات', 'خضروات', 'ألوان', 'رياضات', 
  'تطبيقات', 'أجهزة إلكترونية', 'مهن', 'أدوات مطبخ', 'ماركات ملابس'
];

const SOUNDS = {
  tick: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
  success: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  fail: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  match: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
};

export const HowManyGame: React.FC<{ onLeave: () => void; channelName: string; messages: any[] }> = ({ onLeave, channelName, messages }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId] = useState(() => uuidv4().slice(0, 6));
  const [state, setState] = useState<GameState | null>(null);
  const [copied, setCopied] = useState(false);
  const [bidInput, setBidInput] = useState(0);
  const [streamerAnswer, setStreamerAnswer] = useState('');

  const processedMessages = useRef<Set<string>>(new Set());

  const playerLink = `${window.location.origin}/howmany/${roomId}`;

  const playSound = (type: keyof typeof SOUNDS) => {
    const audio = new Audio(SOUNDS[type]);
    audio.play().catch(() => {});
  };

  useEffect(() => {
    if (state?.status === 'matchmaking') playSound('match');
    if (state?.status === 'result') {
      playSound(state.currentCount >= state.targetCount ? 'success' : 'fail');
    }
  }, [state?.status]);

  useEffect(() => {
    if (state?.status === 'naming' && state.timer <= 5 && state.timer > 0) {
      playSound('tick');
    }
  }, [state?.timer]);

  useEffect(() => {
    if (!socket) return;

    messages.forEach(msg => {
      if (msg.text && !processedMessages.current.has(msg.id)) {
        processedMessages.current.add(msg.id);
        if (msg.text.trim().toLowerCase() === '!join') {
          socket.emit('twitch_join', { roomId, username: msg.user });
        }
      }
    });
  }, [messages, socket, roomId]);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.emit('join_howmany_lobby', { roomId, name: 'Streamer' });

    newSocket.on('howmany_state', (newState: GameState) => {
      setState(newState);
    });

    newSocket.on('howmany_timer', (timer: number) => {
      setState(prev => prev ? { ...prev, timer } : null);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  // Listen to Twitch chat for !join (simulated via local socket if needed, but here we assume the streamer view handles it)
  // In a real scenario, the streamer's useTwitchChat hook in App.tsx would pass messages.
  // For this implementation, we'll assume the streamer view can emit twitch_join when it sees !join.
  // Since we don't have the messages prop here, we'll rely on the server handling it if we had a twitch integration.
  // Let's assume the streamer manually adds players or we use a mock for now.

  const copyLink = () => {
    navigator.clipboard.writeText(playerLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = () => {
    socket?.emit('start_howmany', roomId);
  };

  const generateCategories = () => {
    const shuffled = [...CATEGORY_POOL].sort(() => 0.5 - Math.random());
    socket?.emit('select_categories', { roomId, categories: shuffled.slice(0, 3) });
  };

  const chooseCategory = (category: string) => {
    socket?.emit('choose_category', { roomId, category });
  };

  const placeBid = () => {
    socket?.emit('place_bid', { roomId, amount: bidInput });
    setBidInput(0);
  };

  const callLiar = () => {
    socket?.emit('call_liar_howmany', roomId);
  };

  const nextRound = () => {
    socket?.emit('next_round_howmany', roomId);
  };

  const submitStreamerAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (streamerAnswer.trim() && roomId) {
      socket?.emit('submit_answer', { roomId, answer: streamerAnswer.trim() });
      setStreamerAnswer('');
    }
  };

  const judgePlayer = (passed: boolean) => {
    socket?.emit('judge_howmany', { roomId, passed });
  };

  if (!state) return <div className="flex items-center justify-center h-full text-white">جاري الاتصال...</div>;

  return (
    <div className="flex h-full w-full bg-[#050505] overflow-hidden font-arabic text-white" dir="rtl">
      {/* Main Game Area */}
      <div className="flex-1 relative p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1">
            <h1 className="text-4xl font-black italic tracking-tighter text-brand-gold uppercase">كم تقدر تسمي؟</h1>
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
              <Users className="w-3 h-3" /> {state.players.length} لاعبين متصلين
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <button 
                onClick={onLeave}
                className="bg-black/40 border border-brand-gold/20 px-4 py-2 rounded-xl text-sm font-bold text-zinc-400 hover:text-white transition-all flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" /> خروج
              </button>
              <div className="bg-black/40 border border-brand-gold/20 p-2 rounded-xl flex items-center gap-3">
                <code className="text-brand-gold font-bold px-2">{window.location.origin}/howmany/{roomId}</code>
                <button 
                  onClick={copyLink}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-brand-gold" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Join Instructions Banner */}
        {state.status === 'waiting' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-brand-gold/10 border border-brand-gold/30 p-4 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="bg-brand-gold p-2 rounded-xl">
                <Users className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-black text-lg">انضم الآن للعب!</h3>
                <p className="text-brand-gold/60 text-sm">استخدم الرابط أعلاه للانضمام للمنافسة</p>
              </div>
            </div>
            <button 
              onClick={copyLink}
              className="bg-brand-gold hover:bg-brand-gold-light text-black font-bold px-6 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]"
            >
              نسخ الرابط
            </button>
          </motion.div>
        )}

        <div className="min-h-[calc(100%-120px)] flex flex-col items-center justify-center relative z-50">
        <AnimatePresence mode="wait">
          {state.status === 'waiting' && (
            <motion.div 
              key="waiting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-center space-y-8"
            >
              <div className="bg-brand-gold/5 border border-brand-gold/20 p-12 rounded-[40px] shadow-2xl">
                <Users className="w-20 h-20 text-brand-gold mx-auto mb-6" />
                <h2 className="text-5xl font-black mb-4 italic">ردهة الانتظار</h2>
                <p className="text-zinc-400 text-xl max-w-md mx-auto">
                  استخدم الرابط أعلاه للانضمام.
                </p>
                
                <div className="mt-12 grid grid-cols-4 gap-4 max-w-2xl mx-auto">
                  {state.players.map(p => (
                    <motion.div 
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-black/40 border border-brand-gold/10 p-4 rounded-2xl flex flex-col items-center gap-2"
                    >
                      <div className="w-12 h-12 bg-brand-gold/20 rounded-full flex items-center justify-center text-xl">
                        👤
                      </div>
                      <span className="text-xs font-bold truncate w-full text-center">{p.name}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <button 
                onClick={startGame}
                disabled={state.players.length < 2}
                className="bg-brand-gold hover:bg-brand-gold-light disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black px-16 py-5 rounded-2xl text-2xl transition-all uppercase italic tracking-tighter shadow-[0_0_30px_rgba(212,175,55,0.3)]"
              >
                ابدأ اللعبة
              </button>
            </motion.div>
          )}

          {state.status === 'matchmaking' && (
            <motion.div 
              key="matchmaking"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="text-center space-y-12"
            >
              <h2 className="text-6xl font-black italic text-brand-gold">من سيواجه من؟</h2>
              <div className="flex items-center gap-12">
                <div className="bg-black/40 border-2 border-brand-gold/50 p-12 rounded-[40px] w-80 shadow-2xl">
                  <div className="text-8xl mb-6">👤</div>
                  <h3 className="text-3xl font-black">{state.players.find(p => p.id === state.currentMatch?.[0])?.name}</h3>
                </div>
                <Swords className="w-24 h-24 text-brand-gold animate-pulse" />
                <div className="bg-black/40 border-2 border-brand-gold/50 p-12 rounded-[40px] w-80 shadow-2xl">
                  <div className="text-8xl mb-6">👤</div>
                  <h3 className="text-3xl font-black">{state.players.find(p => p.id === state.currentMatch?.[1])?.name}</h3>
                </div>
              </div>
              <button 
                onClick={generateCategories}
                className="bg-brand-gold text-black font-black px-12 py-4 rounded-2xl text-xl hover:bg-brand-gold-light transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]"
              >
                اختر الفئات
              </button>
            </motion.div>
          )}

          {state.status === 'category_selection' && (
            <motion.div 
              key="category_selection"
              className="text-center space-y-12"
            >
              <h2 className="text-5xl font-black italic">اختر الفئة لهذه الجولة</h2>
              <div className="grid grid-cols-3 gap-8">
                {state.categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => chooseCategory(cat)}
                    className="bg-black/40 border-2 border-brand-gold/10 hover:border-brand-gold p-12 rounded-[40px] transition-all group"
                  >
                    <span className="text-3xl font-black group-hover:text-brand-gold">{cat}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {state.status === 'gambling' && (
            <motion.div 
              key="gambling"
              className="text-center space-y-12 w-full max-w-4xl"
            >
              <div className="bg-brand-gold/10 border border-brand-gold/20 p-8 rounded-3xl inline-block mb-8">
                <span className="text-2xl font-bold text-brand-gold">الفئة: {state.selectedCategory}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-12">
                {state.currentMatch?.map(pid => {
                  const p = state.players.find(pl => pl.id === pid);
                  const isTurn = state.turn === pid;
                  const isMe = p?.id === socket?.id;
                  return (
                    <div key={pid} className={`p-12 rounded-[40px] border-4 transition-all ${isTurn ? 'border-brand-gold bg-brand-gold/5 scale-105 shadow-2xl' : 'border-zinc-900 bg-zinc-950 opacity-50'}`}>
                      <div className="text-6xl mb-4">👤</div>
                      <h3 className="text-2xl font-black mb-6">{p?.name}</h3>
                      {isTurn && !isMe && (
                        <div className="text-2xl font-black text-brand-gold animate-pulse">
                          جاري المزايدة...
                        </div>
                      )}
                      {isTurn && isMe && (
                        <div className="space-y-4 mt-4">
                          <input 
                            type="number" 
                            value={bidInput}
                            onChange={(e) => setBidInput(parseInt(e.target.value) || 0)}
                            placeholder="كم تقدر تسمي؟"
                            className="w-full bg-black/40 border-2 border-brand-gold/50 p-4 rounded-2xl text-2xl font-black text-center focus:ring-4 focus:ring-brand-gold/20 outline-none transition-all text-white"
                            min={state.bid + 1}
                          />
                          <button 
                            onClick={placeBid}
                            className="w-full bg-brand-gold hover:bg-brand-gold-light text-black font-black py-3 rounded-2xl text-xl transition-all"
                          >
                            تأكيد المزايدة
                          </button>
                        </div>
                      )}
                      {!isTurn && state.bid > 0 && (
                        <div className="text-4xl font-black text-brand-gold">
                          المزايدة الحالية: {state.bid}
                        </div>
                      )}
                      {!isTurn && isMe && state.bid > 0 && (
                        <button 
                          onClick={callLiar}
                          className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white font-black py-3 rounded-2xl text-xl transition-all"
                        >
                          تحداه!
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {state.status === 'naming' && (
            <motion.div 
              key="naming"
              className="text-center space-y-8 w-full max-w-4xl"
            >
              <div className="flex justify-between items-center mb-12">
                <div className="bg-black/40 p-8 rounded-3xl border border-brand-gold/20 w-64">
                  <Timer className="w-12 h-12 text-brand-gold mx-auto mb-2" />
                  <span className="text-6xl font-black font-mono">{state.timer}</span>
                </div>
                <div className="text-center">
                  <h2 className="text-4xl font-black mb-2">{state.selectedCategory}</h2>
                  <p className="text-zinc-500 uppercase tracking-widest">الهدف: {state.targetCount}</p>
                </div>
                <div className="bg-black/40 p-8 rounded-3xl border border-brand-gold/20 w-64">
                  <CheckCircle2 className="w-12 h-12 text-brand-gold mx-auto mb-2" />
                  <span className="text-6xl font-black font-mono">{state.currentCount}</span>
                </div>
              </div>

              <div className="bg-black/40 border border-brand-gold/10 p-12 rounded-[40px] min-h-[300px] flex flex-wrap gap-4 justify-center content-start relative">
                <AnimatePresence>
                  {state.answers.map((ans, i) => (
                    <motion.div 
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-brand-gold text-black font-black px-6 py-3 rounded-2xl text-xl italic"
                    >
                      {ans}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              
              <div className="text-3xl font-black text-brand-gold animate-pulse">
                {state.players.find(p => p.id === state.gamblerId)?.name} يكتب الآن...
              </div>
              {state.gamblerId === socket?.id && (
                <form onSubmit={submitStreamerAnswer} className="mt-8 flex gap-4 max-w-xl mx-auto">
                  <input 
                    type="text" 
                    value={streamerAnswer}
                    onChange={(e) => setStreamerAnswer(e.target.value)}
                    placeholder="اكتب إجابتك هنا..."
                    className="flex-1 bg-black/40 border-2 border-brand-gold/50 p-4 rounded-2xl text-2xl font-black text-center focus:ring-4 focus:ring-brand-gold/20 outline-none transition-all text-white"
                    autoFocus
                  />
                  <button 
                    type="submit"
                    className="bg-brand-gold hover:bg-brand-gold-light text-black font-black px-8 py-4 rounded-2xl text-xl transition-all"
                  >
                    إرسال
                  </button>
                </form>
              )}
            </motion.div>
          )}

          {state.status === 'judging' && (
            <motion.div 
              key="judging"
              className="text-center space-y-12 w-full max-w-4xl relative z-50"
            >
              <h2 className="text-6xl font-black italic text-brand-gold">وقت التقييم!</h2>
              <div className="text-3xl text-zinc-400 mb-8">
                هل تمكن {state.players.find(p => p.id === state.gamblerId)?.name} من تسمية {state.targetCount} في {state.selectedCategory}؟
              </div>
              
              <div className="bg-black/40 border border-brand-gold/10 p-12 rounded-[40px] min-h-[200px] flex flex-wrap gap-4 justify-center content-start mb-12">
                {state.answers.map((ans, i) => (
                  <div key={i} className="bg-brand-gold text-black font-black px-6 py-3 rounded-2xl text-xl italic">
                    {ans}
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-8 relative z-[100]">
                <button 
                  onClick={() => judgePlayer(true)}
                  className="bg-green-500 hover:bg-green-600 text-white font-black px-16 py-5 rounded-2xl text-2xl shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all cursor-pointer pointer-events-auto"
                >
                  نجح التحدي
                </button>
                <button 
                  onClick={() => judgePlayer(false)}
                  className="bg-red-500 hover:bg-red-600 text-white font-black px-16 py-5 rounded-2xl text-2xl shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all cursor-pointer pointer-events-auto"
                >
                  فشل التحدي
                </button>
              </div>
            </motion.div>
          )}

          {state.status === 'result' && (
            <motion.div 
              key="result"
              className="text-center space-y-12"
            >
              <Trophy className="w-32 h-32 text-brand-gold mx-auto glow-gold" />
              <h2 className="text-7xl font-black italic">
                {state.currentCount >= state.targetCount ? 'نجح التحدي!' : 'فشل التحدي!'}
              </h2>
              <div className="text-3xl text-zinc-400">
                {state.currentCount} من أصل {state.targetCount} في {state.selectedCategory}
              </div>
              <button 
                onClick={nextRound}
                className="bg-brand-gold hover:bg-brand-gold-light text-black font-black px-16 py-5 rounded-2xl text-2xl shadow-[0_0_20px_rgba(212,175,55,0.2)]"
              >
                الجولة التالية
              </button>
            </motion.div>
          )}

          {state.status === 'game_over' && (
            <motion.div 
              key="game_over"
              className="text-center space-y-8"
            >
              <Trophy className="w-48 h-48 text-brand-gold mx-auto animate-bounce glow-gold" />
              <h2 className="text-8xl font-black italic text-white tracking-tighter">البطل هو</h2>
              <h3 className="text-9xl font-black text-brand-gold drop-shadow-[0_0_50px_rgba(212,175,55,0.5)]">{state.winner}</h3>
              <button 
                onClick={() => window.location.reload()}
                className="bg-brand-gold hover:bg-brand-gold-light text-black font-black px-12 py-4 rounded-2xl text-xl mt-12 shadow-[0_0_30px_rgba(212,175,55,0.3)]"
              >
                العودة للرئيسية
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>

    {/* Sidebar */}
      <ChatSidebar 
        messages={messages} 
        instructions={[
          "اكتب !join للانضمام للعبة",
          "يمكنك أيضاً الانضمام عبر الرابط"
        ]} 
      />
    </div>
  );
};
