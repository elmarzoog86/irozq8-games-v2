import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Trophy, Timer, MessageSquare, XCircle, Search, Key, Shield, Eye, EyeOff, Info } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { ChatSidebar } from './ChatSidebar';

interface Player {
  id: string;
  name: string;
  team: 'gold' | 'black' | null;
}

interface GameState {
  players: Player[];
  status: 'waiting' | 'playing' | 'results';
  data: {
    board: { word: string; type: 'gold' | 'black' | 'neutral' | 'assassin'; revealed: boolean }[];
    currentTurn: 'gold' | 'black';
    scores: { gold: number; black: number };
    winner?: 'gold' | 'black';
  };
}

export const CodeNamesGame: React.FC<{ onLeave: () => void; messages: any[] }> = ({ onLeave, messages }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [roomId] = useState(() => Math.random().toString(36).substring(7));
  const [isSpymaster, setIsSpymaster] = useState(true);
  const processedMessages = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!socket) return;
    
    messages.forEach(msg => {
      const messageText = msg.message || msg.text;
      const messageUser = msg.username || msg.user;
      if (messageText && !processedMessages.current.has(msg.id)) {
        processedMessages.current.add(msg.id);
        const text = messageText.trim().toLowerCase();
        if (text === '!gold') {
          socket.emit('switch_team', { roomId, team: 'gold', name: messageUser });
        } else if (text === '!black') {
          socket.emit('switch_team', { roomId, team: 'black', name: messageUser });
        }
      }
    });
  }, [messages, socket, roomId]);

  useEffect(() => {
    const newSocket = io({
      path: '/api/socket.io',
      addTrailingSlash: false,
    });
    setSocket(newSocket);
    newSocket.on('connect', () => {
      newSocket.emit('join_team_game', { roomId, name: 'Streamer', gameType: 'codenames' });
    });
    newSocket.on('team_game_state', (newState: GameState) => setState(newState));
    return () => { newSocket.disconnect(); };
  }, [roomId]);

  const switchTeam = (playerId: string, team: 'gold' | 'black' | null) => {
    socket?.emit('switch_team', { roomId, playerId, team });
  };

  const startGame = () => socket?.emit('start_team_game', roomId);

  const resetGame = () => socket?.emit('reset_team_game', roomId);

  const revealCard = (index: number) => {
    socket?.emit('submit_team_action', { roomId, action: 'reveal', payload: { index } });
  };

  if (!state) return <div className="flex items-center justify-center h-full text-white">جاري الاتصال...</div>;

  return (
    <div className="flex h-full w-full bg-black/60 backdrop-blur-xl rounded-[40px] border border-brand-gold/20 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] font-arabic text-white" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/5 to-transparent pointer-events-none" />
      {/* Main Game Area */}
      <div className="flex-1 relative p-8 overflow-y-auto z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1">
            <h1 className="text-4xl font-black italic tracking-tighter text-brand-gold uppercase glow-gold-text">لعبة الشفرة</h1>
            <p className="text-brand-gold/60">ابحث عن الكلمات السرية لفريقك</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsSpymaster(!isSpymaster)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${isSpymaster ? 'bg-brand-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'bg-black/40 text-brand-gold/40 border border-brand-gold/20'}`}
            >
              {isSpymaster ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              وضع القائد: {isSpymaster ? 'مفعل' : 'معطل'}
            </button>
            <div className="bg-black/40 border border-brand-gold/20 px-4 py-2 rounded-xl text-sm font-bold text-brand-gold/50 flex items-center gap-2">
              <span>{window.location.origin}/team/{roomId}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/team/${roomId}`);
                  alert('تم نسخ الرابط!');
                }}
                className="ml-2 bg-brand-gold/20 hover:bg-brand-gold/40 text-brand-gold px-2 py-1 rounded transition-colors"
                title="نسخ الرابط"
              >
                نسخ
              </button>
            </div>
            <button onClick={resetGame} className="bg-black/40 border border-brand-gold/20 px-4 py-2 rounded-xl text-sm font-bold text-brand-gold hover:bg-brand-gold/10 transition-all">
              إعادة تعيين
            </button>
            <button onClick={onLeave} className="bg-black/40 border border-brand-gold/20 px-4 py-2 rounded-xl text-sm font-bold text-brand-gold/70 hover:text-brand-gold transition-all flex items-center gap-2">
              <XCircle className="w-4 h-4" /> خروج
            </button>
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
                <h3 className="font-black text-lg text-white">انضم الآن للعب!</h3>
                <p className="text-brand-gold/70 text-sm">استخدم الرابط أعلاه للانضمام</p>
              </div>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/team/${roomId}`);
                alert('تم نسخ الرابط!');
              }}
              className="bg-brand-gold hover:bg-brand-gold-light text-black font-bold px-6 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]"
            >
              نسخ الرابط
            </button>
          </motion.div>
        )}

        <div className="min-h-[calc(100%-120px)] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {state.status === 'waiting' && (
            <motion.div key="waiting" className="grid grid-cols-2 gap-12 w-full max-w-6xl">
              <div className="bg-black/40 border border-brand-gold/20 p-8 rounded-[40px] text-center shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                <Shield className="w-16 h-16 text-brand-gold mx-auto mb-4 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
                <h2 className="text-3xl font-black text-brand-gold mb-6">الفريق الذهبي</h2>
                <div className="space-y-2 min-h-[200px]">
                  {state.players.filter(p => p.team === 'gold').map(p => (
                    <div key={p.id} className="bg-brand-gold/10 p-3 rounded-xl flex justify-between items-center border border-brand-gold/20">
                      <span className="font-bold">{p.name}</span>
                      <button onClick={() => switchTeam(p.id, 'black')} className="text-[10px] bg-black/40 hover:bg-black/60 px-2 py-1 rounded border border-brand-gold/30 transition-colors">نقل للأسود</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-black/40 border border-brand-gold/10 p-8 rounded-[40px] text-center opacity-80">
                <Shield className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
                <h2 className="text-3xl font-black text-white mb-6">الفريق الأسود</h2>
                <div className="space-y-2 min-h-[200px]">
                  {state.players.filter(p => p.team === 'black').map(p => (
                    <div key={p.id} className="bg-black/40 p-3 rounded-xl flex justify-between items-center border border-zinc-700">
                      <span className="font-bold text-white">{p.name}</span>
                      <button onClick={() => switchTeam(p.id, 'gold')} className="text-[10px] bg-brand-gold/10 hover:bg-brand-gold/20 px-2 py-1 rounded border border-brand-gold/20 transition-colors">نقل للذهبي</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-2 flex flex-col items-center gap-6">
                <button onClick={startGame} className="bg-brand-gold hover:bg-brand-gold-light text-black font-black px-16 py-5 rounded-2xl text-2xl transition-all shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                  ابدأ اللعبة
                </button>
              </div>
            </motion.div>
          )}

          {state.status === 'playing' && (
            <motion.div key="playing" className="w-full max-w-6xl space-y-6">
              <div className="flex justify-between items-center">
                <div className={`p-4 rounded-2xl border-2 ${state.data.currentTurn === 'gold' ? 'border-brand-gold bg-brand-gold/10' : 'border-brand-gold/10'}`}>
                  <span className="text-xl font-bold text-brand-gold">الذهبي: {state.data.scores.gold}</span>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-black italic text-white">دور الفريق {state.data.currentTurn === 'gold' ? 'الذهبي' : 'الأسود'}</h2>
                </div>
                <div className={`p-4 rounded-2xl border-2 ${state.data.currentTurn === 'black' ? 'border-zinc-400 bg-zinc-800/50' : 'border-zinc-800'}`}>
                  <span className="text-xl font-bold text-white">الأسود: {state.data.scores.black}</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4">
                {state.data.board.map((card, i) => {
                  let bgColor = 'bg-black/60';
                  let textColor = 'text-brand-gold/40';
                  let borderColor = 'border-brand-gold/10';

                  if (card.revealed || isSpymaster) {
                    if (card.type === 'gold') { bgColor = 'bg-brand-gold'; textColor = 'text-black'; borderColor = 'border-brand-gold-light'; }
                    else if (card.type === 'black') { bgColor = 'bg-zinc-800'; textColor = 'text-white'; borderColor = 'border-zinc-600'; }
                    else if (card.type === 'assassin') { bgColor = 'bg-zinc-950'; textColor = 'text-red-500'; borderColor = 'border-red-900'; }
                    else { bgColor = 'bg-black/80'; textColor = 'text-zinc-500'; borderColor = 'border-zinc-800'; }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => revealCard(i)}
                      disabled={card.revealed}
                      className={`h-24 rounded-2xl border-b-4 transition-all flex items-center justify-center p-2 text-center font-bold text-lg ${bgColor} ${textColor} ${borderColor} ${card.revealed ? 'opacity-50 scale-95' : 'hover:scale-105 shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]'}`}
                    >
                      {card.word}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>

    {/* Sidebar */}
      <ChatSidebar 
        messages={messages} 
        instructions={[
          "اكتب !gold للانضمام للفريق الذهبي",
          "اكتب !black للانضمام للفريق الأسود",
          "انضم عبر الرابط للعب",
        ]} 
      />
    </div>
  );
};
