import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Trophy, Timer, MessageSquare, XCircle, Shield, Swords, AlertCircle, CheckCircle2, Info, Crown, Play } from 'lucide-react';
// Remove ChatSidebar import
import { io, Socket } from 'socket.io-client';
import { TEAM_FEUD_QUESTIONS } from '../data/team-feud-questions';

interface Player {
  id: string;
  name: string;
  team: 'gold' | 'black' | null;
}

interface GameState {
  players: Player[];
  status: 'waiting' | 'playing' | 'results' | 'game_over';
  data: {
    question: string;
    answers: { text: string; points: number; revealed: boolean }[];
    strikes: { gold: number; black: number };
    scores: { gold: number; black: number };
    currentTurn: 'gold' | 'black';
    roundPoints: number;
    isStealOpportunity: boolean;
    leaders: { gold: string | null; black: string | null };
    buzzersOpen?: boolean;
    buzzerWinner?: 'gold' | 'black' | null;
    timer?: number;
    pointLimit?: number;
    winner?: 'gold' | 'black' | null;
  };
}

export const TeamFeudGame: React.FC<{ onLeave: () => void; messages: any[] }> = ({ onLeave, messages }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [roomId] = useState(() => Math.random().toString(36).substring(7));
  const [guess, setGuess] = useState('');
  const [pointLimit, setPointLimit] = useState(300);
  const processedMessages = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!socket) return;
    
    // We need to loop through messages, but avoid reprocessing old ones
    // AND ensure we don't try to process messages if we haven't even joined the room yet?
    // Actually, socket connection is separate from room joining logic on server side for 'switch_team',
    // but switch_team needs roomId.
    
    messages.forEach(msg => {
      if (processedMessages.current.has(msg.id)) return;
      processedMessages.current.add(msg.id);

      const text = msg.message.trim().toLowerCase();
      
      // Team joining commands
      // if (text === '!gold') {
      //   console.log('Emitting switch_team gold for:', msg.username);
      //   socket.emit('switch_team', { roomId, name: msg.username, team: 'gold' });
      // } else if (text === '!black') {
      //   console.log('Emitting switch_team black for:', msg.username);
      //   socket.emit('switch_team', { roomId, name: msg.username, team: 'black' });
      // }

      // Handle leader answers - check if playing and leaders exist
      // We check safe access to state properties
      if (state?.status === 'playing' && state.data?.currentTurn && state.data?.leaders) {
        const currentTeam = state.data.currentTurn;
        const leaderId = state.data.leaders[currentTeam];
        
        if (leaderId) {
          const leader = state.players.find(p => p.id === leaderId);
          if (leader && leader.name.toLowerCase() === msg.username.toLowerCase()) {
              socket.emit('submit_team_action', { roomId, action: 'guess', payload: { guess: msg.message.trim() } });
          }
        }
      }
    });
  }, [messages, socket, roomId, state]);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to socket server, joining room:', roomId);
      newSocket.emit('join_team_game', { roomId, name: 'Streamer', gameType: 'teamfeud' });
    });

    newSocket.on('team_game_state', (newState: GameState) => {
      console.log('Received team_game_state:', newState);
      setState(newState);
      if (newState.data?.pointLimit) {
        setPointLimit(newState.data.pointLimit);
      }
    });

    // Cleanup function
    return () => {
      newSocket.off('connect');
      newSocket.off('team_game_state');
      newSocket.disconnect();
    };
  }, [roomId]); // Only run when roomId changes (which is essentially on mount)

  const switchTeam = (playerId: string, team: 'gold' | 'black' | null) => {
    socket?.emit('switch_team', { roomId, playerId, team });
  };

  const setLeader = (playerId: string, team: 'gold' | 'black') => {
    socket?.emit('submit_team_action', { roomId, action: 'set_leader', payload: { playerId, team } });
  };

  const startGame = () => {
    socket?.emit('start_team_game', { roomId, pointLimit });
  };

  const resetGame = () => {
    socket?.emit('reset_team_game', roomId);
  };

  const submitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim()) {
      socket?.emit('submit_team_action', { roomId, action: 'guess', payload: { guess: guess.trim() } });
      setGuess('');
    }
  };

  if (!state) return <div className="flex items-center justify-center h-full text-white">جاري الاتصال...</div>;

// Internal Chat Sidebar removed as it is now handled by App.tsx
  return (
    <div className="flex flex-col h-full w-full bg-black/60 backdrop-blur-xl rounded-[40px] border border-brand-gold/20 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] font-arabic text-white" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/5 to-transparent pointer-events-none" />
      {/* Main Game Area */}
      <div className="flex-1 relative p-8 overflow-y-auto z-10 text-center">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1">
            <h1 className="text-4xl font-black italic tracking-tighter text-brand-gold uppercase glow-gold-text">تحدي الفرق</h1>
            <p className="text-brand-gold/60">لعبة تخمين الإجابات الأكثر شيوعاً</p>
          </div>
          <div className="flex gap-4">
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

        <div className="min-h-[calc(100%-180px)] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {state.status === 'waiting' && (
            <motion.div key="waiting" className="grid grid-cols-2 gap-12 w-full max-w-7xl">
              <div className="bg-black/40 border border-brand-gold/20 p-8 rounded-[40px] text-center shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                <Shield className="w-16 h-16 text-brand-gold mx-auto mb-4 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
                <h2 className="text-3xl font-black text-brand-gold mb-6">الفريق الذهبي</h2>
                <div className="space-y-2 min-h-[200px] max-h-[300px] overflow-y-auto custom-scrollbar">
                  {state.players.filter(p => p.team === 'gold').map(p => (
                    <div key={p.id} className="bg-brand-gold/10 p-3 rounded-xl flex justify-between items-center border border-brand-gold/20">
                      <div className="flex items-center gap-2">
                        {state.data?.leaders?.gold === p.id && <Crown className="w-4 h-4 text-brand-gold" />}
                        <span className="font-bold">{p.name}</span>
                      </div>
                      <div className="flex gap-2">
                        {state.data?.leaders?.gold === p.id ? (
                          <span className="text-[10px] bg-brand-gold text-black px-2 py-1 rounded font-bold">القائد</span>
                        ) : (
                          <button onClick={() => setLeader(p.id, 'gold')} className="text-[10px] bg-brand-gold/20 hover:bg-brand-gold/40 px-2 py-1 rounded border border-brand-gold/30 transition-colors">تعيين قائد</button>
                        )}
                        <button onClick={() => switchTeam(p.id, 'black')} className="text-[10px] bg-black/40 hover:bg-black/60 px-2 py-1 rounded border border-brand-gold/30 transition-colors">نقل للأسود</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-black/40 border border-brand-gold/10 p-8 rounded-[40px] text-center opacity-80">
                <Shield className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
                <h2 className="text-3xl font-black text-white mb-6">الفريق الأسود</h2>
                <div className="space-y-2 min-h-[200px] max-h-[300px] overflow-y-auto custom-scrollbar">
                  {state.players.filter(p => p.team === 'black').map(p => (
                    <div key={p.id} className="bg-black/40 p-3 rounded-xl flex justify-between items-center border border-zinc-700">
                      <div className="flex items-center gap-2">
                        {state.data?.leaders?.black === p.id && <Crown className="w-4 h-4 text-white" />}
                        <span className="font-bold text-white">{p.name}</span>
                      </div>
                      <div className="flex gap-2">
                        {state.data?.leaders?.black === p.id ? (
                          <span className="text-[10px] bg-white text-black px-2 py-1 rounded font-bold">القائد</span>
                        ) : (
                          <button onClick={() => setLeader(p.id, 'black')} className="text-[10px] bg-white/20 hover:bg-white/40 px-2 py-1 rounded border border-white/30 transition-colors">تعيين قائد</button>
                        )}
                        <button onClick={() => switchTeam(p.id, 'gold')} className="text-[10px] bg-brand-gold/10 hover:bg-brand-gold/20 px-2 py-1 rounded border border-brand-gold/20 transition-colors">نقل للذهبي</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-2 flex flex-col items-center gap-6 mt-8">
                <div className="bg-black/40 border border-brand-gold/20 p-6 rounded-2xl w-full max-w-md text-center">
                  <h3 className="text-xl font-bold mb-4 text-brand-gold">نقاط الفوز</h3>
                  <div className="flex items-center justify-center gap-4">
                    <button onClick={() => setPointLimit(p => Math.max(100, p - 50))} className="bg-brand-gold/20 hover:bg-brand-gold/40 text-brand-gold w-10 h-10 rounded-full font-bold flex items-center justify-center transition-all">-</button>
                    <span className="text-3xl font-black text-white w-24">{pointLimit}</span>
                    <button onClick={() => setPointLimit(p => p + 50)} className="bg-brand-gold/20 hover:bg-brand-gold/40 text-brand-gold w-10 h-10 rounded-full font-bold flex items-center justify-center transition-all">+</button>
                  </div>
                </div>

                <div className="bg-black/40 border border-brand-gold/20 p-6 rounded-2xl w-full max-w-md text-center">
                  <h3 className="text-xl font-bold mb-4 text-brand-gold">لاعبين بدون فريق</h3>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {state.players.filter(p => !p.team).map(p => (
                      <div key={p.id} className="bg-black/40 p-2 rounded-lg flex gap-2 items-center border border-brand-gold/10">
                        <span>{p.name}</span>
                        <button onClick={() => switchTeam(p.id, 'gold')} className="bg-brand-gold w-4 h-4 rounded-full shadow-[0_0_10px_rgba(212,175,55,0.5)]"></button>
                        <button onClick={() => switchTeam(p.id, 'black')} className="bg-zinc-400 w-4 h-4 rounded-full border border-zinc-500"></button>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={startGame} className="bg-brand-gold hover:bg-brand-gold-light text-black font-black px-16 py-5 rounded-2xl text-2xl transition-all shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                  ابدأ اللعبة
                </button>
              </div>
            </motion.div>
          )}

          {state.status === 'playing' && (
            <motion.div key="playing" className="w-full max-w-7xl space-y-8">
              {!state.data.currentTurn && (
                <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center backdrop-blur-xl">
                   <div className="text-center relative w-full h-full flex flex-col items-center justify-center">
                     <h2 className="text-4xl font-black text-brand-gold mb-12 max-w-4xl mx-auto leading-relaxed px-8">{state.data.question}</h2>
                     
                     {state.data.buzzersOpen ? (
                       <div className="flex gap-8">
                         <motion.button 
                           onClick={() => socket?.emit('submit_team_action', { roomId, action: 'buzzer', payload: { team: 'gold' } })}
                           whileHover={{ scale: 1.05 }}
                           whileTap={{ scale: 0.95 }}
                           className="bg-brand-gold text-black px-12 py-8 rounded-[40px] shadow-[0_0_50px_rgba(212,175,55,0.6)] border-4 border-white"
                         >
                           <h1 className="text-6xl font-black">الذهبي أسرع!</h1>
                         </motion.button>
                         <motion.button 
                           onClick={() => socket?.emit('submit_team_action', { roomId, action: 'buzzer', payload: { team: 'black' } })}
                           whileHover={{ scale: 1.05 }}
                           whileTap={{ scale: 0.95 }}
                           className="bg-white text-black px-12 py-8 rounded-[40px] shadow-[0_0_50px_rgba(255,255,255,0.6)] border-4 border-brand-gold"
                         >
                           <h1 className="text-6xl font-black">الأسود أسرع!</h1>
                         </motion.button>
                       </div>
                     ) : (
                       <>
                         <div className="text-[12rem] font-black text-white mb-4 tabular-nums leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                           {state.data.timer}
                         </div>
                         <p className="text-2xl text-brand-gold/60 font-bold tracking-widest uppercase">
                            استعد...
                         </p>
                       </>
                     )}
                   </div>
                </div>
              )}

              {/* Leaders Display */}
              <div className="flex justify-center gap-12 mb-4">
                <div className="flex items-center gap-3 bg-brand-gold/10 border border-brand-gold/30 px-6 py-3 rounded-2xl">
                  <Crown className="w-6 h-6 text-brand-gold" />
                  <div className="text-right">
                    <p className="text-[10px] text-brand-gold/60 uppercase font-black">قائد الفريق الذهبي</p>
                    <p className="text-lg font-black text-white">
                      {state.players.find(p => p.id === state.data.leaders.gold)?.name || 'لم يتم التعيين'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 border border-white/20 px-6 py-3 rounded-2xl">
                  <Crown className="w-6 h-6 text-white" />
                  <div className="text-right">
                    <p className="text-[10px] text-white/40 uppercase font-black">قائد الفريق الأسود</p>
                    <p className="text-lg font-black text-white">
                      {state.players.find(p => p.id === state.data.leaders.black)?.name || 'لم يتم التعيين'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className={`p-6 rounded-3xl border-4 transition-all ${state.data.currentTurn === 'gold' ? 'border-brand-gold bg-brand-gold/10 scale-110' : 'border-brand-gold/10 opacity-50'}`}>
                  <h3 className="text-2xl font-black text-brand-gold">ذهبي: {state.data.scores.gold}</h3>
                  <div className="flex gap-1 mt-2">
                    {[...Array(state.data.isStealOpportunity && state.data.currentTurn === 'gold' ? 1 : 3)].map((_, i) => (
                      <XCircle key={i} className={`w-6 h-6 ${i < state.data.strikes.gold ? 'text-brand-gold fill-brand-gold' : 'text-brand-gold/10'}`} />
                    ))}
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <h2 className="text-5xl font-black italic text-brand-gold glow-gold-text">{state.data.question}</h2>
                  {state.data.currentTurn && (
                    <div className="bg-black/40 border border-brand-gold/20 p-4 rounded-2xl inline-block">
                      <span className="text-xl font-bold text-white">
                        {state.data.isStealOpportunity ? 'فرصة سرقة - ' : ''}دور الفريق {state.data.currentTurn === 'gold' ? 'الذهبي' : 'الأسود'}
                      </span>
                    </div>
                  )}
                  {state.data.roundPoints > 0 && (
                    <div className="text-2xl font-black text-brand-gold mt-2">
                      النقاط المجمعة: {state.data.roundPoints}
                    </div>
                  )}
                </div>

                <div className={`p-6 rounded-3xl border-4 transition-all ${state.data.currentTurn === 'black' ? 'border-zinc-400 bg-zinc-800/50 scale-110' : 'border-zinc-800 opacity-50'}`}>
                  <h3 className="text-2xl font-black text-white">أسود: {state.data.scores.black}</h3>
                  <div className="flex gap-1 mt-2">
                    {[...Array(state.data.isStealOpportunity && state.data.currentTurn === 'black' ? 1 : 3)].map((_, i) => (
                      <XCircle key={i} className={`w-6 h-6 ${i < state.data.strikes.black ? 'text-white fill-white' : 'text-white/10'}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto">
                {state.data.answers.map((ans, i) => (
                  <div key={i} className={`p-6 rounded-2xl border-2 transition-all flex justify-between items-center ${ans.revealed ? 'bg-brand-gold border-brand-gold-light text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'bg-black/60 border-brand-gold/20'}`}>
                    <span className="text-2xl font-black">{ans.revealed ? ans.text : `${i + 1} . . . . . . . . .`}</span>
                    {ans.revealed && <span className="text-xl font-bold">{ans.points}</span>}
                  </div>
                ))}
              </div>

              <form onSubmit={submitGuess} className="max-w-md mx-auto mt-12">
                <div className="relative">
                  <input 
                    type="text" 
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="اكتب الإجابة هنا..."
                    className="w-full bg-black/40 border-2 border-brand-gold/20 p-6 rounded-3xl text-xl font-bold focus:border-brand-gold outline-none transition-all text-white"
                  />
                  <button type="submit" className="absolute left-4 top-1/2 -translate-y-1/2 bg-brand-gold text-black p-3 rounded-2xl hover:bg-brand-gold-light">
                    <CheckCircle2 className="w-6 h-6" />
                  </button>
                </div>
              </form>
              {/* Team Management during game */}
              <div className="grid grid-cols-2 gap-8 mt-12 pt-12 border-t border-brand-gold/10">
                <div className="bg-black/20 p-4 rounded-2xl">
                  <h4 className="text-brand-gold font-bold mb-2">إدارة الفريق الذهبي</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                    {state.players.filter(p => p.team === 'gold').map(p => (
                      <div key={p.id} className="flex justify-between items-center text-xs bg-black/40 p-2 rounded-lg">
                        <span className="flex items-center gap-1">
                          {state.data.leaders.gold === p.id && <Crown className="w-3 h-3 text-brand-gold" />}
                          {p.name}
                        </span>
                        <button onClick={() => setLeader(p.id, 'gold')} className="text-[8px] bg-brand-gold/20 px-2 py-1 rounded">قائد</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-black/20 p-4 rounded-2xl">
                  <h4 className="text-white font-bold mb-2">إدارة الفريق الأسود</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                    {state.players.filter(p => p.team === 'black').map(p => (
                      <div key={p.id} className="flex justify-between items-center text-xs bg-black/40 p-2 rounded-lg">
                        <span className="flex items-center gap-1">
                          {state.data.leaders.black === p.id && <Crown className="w-3 h-3 text-white" />}
                          {p.name}
                        </span>
                        <button onClick={() => setLeader(p.id, 'black')} className="text-[8px] bg-white/20 px-2 py-1 rounded">قائد</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {state.status === 'results' && (
            <motion.div key="results" className="text-center p-8 bg-black/40 border-2 border-brand-gold/20 rounded-[40px] shadow-[0_0_50px_rgba(212,175,55,0.2)] w-full max-w-4xl">
              <Trophy className="w-24 h-24 text-brand-gold mx-auto mb-6 drop-shadow-[0_0_20px_rgba(212,175,55,0.6)]" />
              <h2 className="text-4xl font-black text-white mb-2">انتهت الجولة!</h2>
              
              <div className="my-8 bg-black/60 border border-brand-gold/20 p-6 rounded-3xl">
                <h3 className="text-2xl font-black text-brand-gold mb-6">{state.data.question}</h3>
                <div className="grid grid-cols-1 gap-3 max-w-2xl mx-auto">
                  {state.data.answers.map((ans, i) => (
                    <div key={i} className="p-4 rounded-xl border border-brand-gold/30 bg-brand-gold/10 flex justify-between items-center">
                      <span className="text-xl font-bold text-white">{ans.text}</span>
                      <span className="text-lg font-bold text-brand-gold">{ans.points}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-8 justify-center my-8">
                <div className="text-center">
                  <h3 className="text-brand-gold text-2xl font-black mb-2">الفريق الذهبي</h3>
                  <p className="text-4xl font-bold bg-brand-gold/10 p-4 rounded-2xl border border-brand-gold/20">{state.data.scores.gold}</p>
                </div>
                <div className="text-center">
                  <h3 className="text-white text-2xl font-black mb-2">الفريق الأسود</h3>
                  <p className="text-4xl font-bold bg-white/10 p-4 rounded-2xl border border-white/20">{state.data.scores.black}</p>
                </div>
              </div>
              <p className="text-lg text-brand-gold/70 mb-8">
                {state.data.scores.gold > state.data.scores.black ? 'الفريق الذهبي متقدم!' : state.data.scores.black > state.data.scores.gold ? 'الفريق الأسود متقدم!' : 'تعادل!'}
              </p>
              <button 
                onClick={startGame}
                className="bg-brand-gold hover:bg-brand-gold-light text-black font-black px-12 py-4 rounded-xl text-xl transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center gap-2 mx-auto"
              >
                <Play className="w-6 h-6 fill-black" />
                جولة جديدة
              </button>
            </motion.div>
          )}
          
          {state.status === 'game_over' && (
             <motion.div key="game_over" className="text-center p-8 bg-black/40 border-2 border-brand-gold/20 rounded-[40px] shadow-[0_0_50px_rgba(212,175,55,0.2)] w-full max-w-4xl" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
               <Trophy className="w-40 h-40 text-brand-gold mx-auto mb-6 drop-shadow-[0_0_50px_rgba(212,175,55,0.8)] animate-bounce" />
               <h2 className="text-6xl font-black text-white mb-8">الفائز!</h2>
               
               <div className={`p-12 rounded-3xl border-4 mb-12 ${state.data.winner === 'gold' ? 'bg-brand-gold text-black border-white' : 'bg-white text-black border-brand-gold'}`}>
                  <h3 className="text-5xl font-black mb-4">
                    {state.data.winner === 'gold' ? 'الفريق الذهبي' : 'الفريق الأسود'}
                  </h3>
                  <p className="text-3xl font-bold opacity-80">
                    {state.data.winner === 'gold' ? state.data.scores.gold : state.data.scores.black} نقطة
                  </p>
               </div>

               <div className="flex justify-center gap-6">
                 <button onClick={resetGame} className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-2xl transition-all border border-white/20">
                   إنهاء اللعبة
                 </button>
                 <button onClick={startGame} className="bg-brand-gold hover:bg-brand-gold-light text-black font-black px-12 py-4 rounded-2xl transition-all shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                   لعبة جديدة
                 </button>
               </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>
  );
};
