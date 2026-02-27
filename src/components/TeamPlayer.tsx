import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Swords, CheckCircle2, XCircle, Bomb, Key, Crown } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  team: 'gold' | 'black' | null;
}

interface GameState {
  players: Player[];
  status: 'waiting' | 'playing' | 'results';
  gameType: 'teamfeud' | 'codenames' | 'bombrelay';
  data: any;
}

export const TeamPlayer: React.FC = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [name, setName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    const newSocket = io({
      path: '/api/socket.io',
      addTrailingSlash: false,
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
    });

    newSocket.on('team_game_state', (newState: GameState) => {
      console.log('Received team_game_state:', newState);
      setState(newState);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && roomId) {
      socket?.emit('join_team_game', { roomId, name: name.trim() });
      setIsJoined(true);
    }
  };

  const switchTeam = (team: 'gold' | 'black') => {
    if (roomId) {
      socket?.emit('switch_team', { roomId, playerId: socket.id, team, name });
    }
  };

  const submitAction = (action: string, payload: any) => {
    if (roomId) {
      socket?.emit('submit_team_action', { roomId, action, payload });
    }
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-arabic" dir="rtl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-black/40 border border-brand-gold/20 p-8 rounded-[32px] shadow-[0_0_50px_rgba(212,175,55,0.1)] backdrop-blur-xl">
          <h1 className="text-3xl font-black mb-8 text-center text-brand-gold italic glow-gold-text">انضم للعبة الفريق</h1>
          <form onSubmit={joinGame} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-brand-gold/50 mb-2 mr-2">اسمك المستعار</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ادخل اسمك..."
                className="w-full bg-black/40 border-2 border-brand-gold/20 p-4 rounded-2xl outline-none focus:border-brand-gold transition-all text-center font-bold text-xl text-white"
                required
              />
            </div>
            <button type="submit" className="w-full bg-brand-gold hover:bg-brand-gold-light text-black font-black py-4 rounded-2xl text-xl transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              دخول
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (!state) return <div className="min-h-screen bg-black text-white flex items-center justify-center">جاري التحميل...</div>;

  const myPlayer = state.players.find(p => p.id === socket?.id || p.name === name);

  return (
    <div className="min-h-screen bg-black text-white p-6 font-arabic" dir="rtl">
      <div className="max-w-md mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black italic text-brand-gold glow-gold-text">
            {state.gameType === 'teamfeud' ? 'تحدي الفرق' : state.gameType === 'codenames' ? 'لعبة الشفرة' : 'سباق القنبلة'}
          </h2>
          <div className="flex items-center gap-2 bg-black/40 border border-brand-gold/20 px-3 py-1 rounded-full text-xs font-bold text-brand-gold/70">
            {state.gameType === 'teamfeud' && myPlayer?.team && state.data?.leaders?.[myPlayer.team] === myPlayer.id && (
              <Crown className="w-4 h-4 text-brand-gold" />
            )}
            {name}
          </div>
        </div>

        {state.status === 'waiting' && (
          <div className="space-y-6">
            <h3 className="text-center text-xl font-bold text-brand-gold">اختر فريقك</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => switchTeam('gold')}
                className={`p-8 rounded-3xl border-4 transition-all flex flex-col items-center gap-4 ${myPlayer?.team === 'gold' ? 'border-brand-gold bg-brand-gold/20 shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'border-brand-gold/10 bg-black/40 opacity-50 hover:opacity-80'}`}
              >
                <Shield className="w-12 h-12 text-brand-gold" />
                <span className="font-black text-brand-gold">ذهبي</span>
              </button>
              <button 
                onClick={() => switchTeam('black')}
                className={`p-8 rounded-3xl border-4 transition-all flex flex-col items-center gap-4 ${myPlayer?.team === 'black' ? 'border-zinc-400 bg-zinc-800/50 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'border-zinc-800 bg-black/40 opacity-50 hover:opacity-80'}`}
              >
                <Shield className="w-12 h-12 text-white" />
                <span className="font-black text-white">أسود</span>
              </button>
            </div>
            <p className="text-center text-brand-gold/40 text-sm">انتظر الستريمر لبدء اللعبة...</p>
          </div>
        )}

        {state.status === 'playing' && (
          <div className="space-y-8">
            {state.gameType === 'teamfeud' && (
              <div className="space-y-6">
                {!state.data.currentTurn ? (
                  <div className="text-center space-y-6">
                    <h3 className="text-2xl font-black text-brand-gold mb-4">{state.data.question}</h3>
                    {myPlayer?.team && state.data.leaders?.[myPlayer.team] === myPlayer.id ? (
                      <button
                        onClick={() => submitAction('buzzer', { team: myPlayer.team })}
                        disabled={!state.data.buzzersOpen}
                        className={`w-full aspect-square max-w-[200px] mx-auto rounded-full border-8 flex items-center justify-center text-4xl font-black transition-all transform active:scale-95 ${
                          state.data.buzzersOpen 
                            ? 'bg-red-500 border-red-700 text-white shadow-[0_0_50px_rgba(239,68,68,0.6)] hover:bg-red-400' 
                            : 'bg-zinc-800 border-zinc-900 text-zinc-600 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {state.data.buzzersOpen ? 'اضغط!' : state.data.timer}
                      </button>
                    ) : (
                      <div className="bg-black/40 border border-brand-gold/20 p-6 rounded-2xl">
                        <p className="text-brand-gold font-bold text-xl">استعد...</p>
                        <p className="text-white/60 mt-2">القائد فقط من يمكنه ضغط الزر</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className={`p-6 rounded-3xl border-4 text-center ${state.data.currentTurn === myPlayer?.team ? 'border-brand-gold bg-brand-gold/10 shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'border-brand-gold/10 opacity-50'}`}>
                      <h3 className="text-xl font-bold text-brand-gold">{state.data.currentTurn === myPlayer?.team ? 'دور فريقك!' : 'دور الفريق الآخر'}</h3>
                      <p className="text-3xl font-black mt-2 text-white">{state.data.question}</p>
                    </div>

                    {state.data.currentTurn === myPlayer?.team && (
                      state.data.leaders?.[myPlayer.team] === myPlayer.id ? (
                        <form onSubmit={(e) => { e.preventDefault(); submitAction('guess', { guess: answer }); setAnswer(''); }} className="space-y-4">
                          <input 
                            type="text" 
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="أنت القائد! اكتب إجابة فريقك..."
                            className="w-full bg-black/40 border-2 border-brand-gold/20 p-4 rounded-2xl text-center font-bold focus:border-brand-gold outline-none text-white"
                          />
                          <button type="submit" className="w-full bg-brand-gold hover:bg-brand-gold-light text-black py-4 rounded-2xl font-black shadow-[0_0_15px_rgba(212,175,55,0.3)]">إرسال</button>
                        </form>
                      ) : (
                        <div className="bg-brand-gold/10 border border-brand-gold/20 p-6 rounded-2xl text-center">
                          <p className="text-brand-gold font-bold">أخبر القائد بإجابتك!</p>
                          <p className="text-sm text-brand-gold/60 mt-2">القائد فقط من يمكنه كتابة الإجابة النهائية</p>
                        </div>
                      )
                    )}
                  </>
                )}
              </div>
            )}

            {state.gameType === 'codenames' && (
              <div className="text-center space-y-6">
                <Key className="w-20 h-20 text-brand-gold mx-auto drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
                <h3 className="text-2xl font-black text-brand-gold">شاهد شاشة الستريمر!</h3>
                <p className="text-brand-gold/60">تواصل مع فريقك لاختيار الكلمات الصحيحة.</p>
              </div>
            )}

            {state.gameType === 'bombrelay' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-6xl font-black font-mono text-brand-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">{state.data.timer}s</div>
                </div>
                {state.data.tasks.map((task: any) => (
                  <div key={task.id} className={`p-6 rounded-2xl border-2 ${task.completed ? 'bg-brand-gold/20 border-brand-gold' : 'bg-black/40 border-brand-gold/20'}`}>
                    <h4 className="font-bold mb-4 text-white">{task.text}</h4>
                    {!task.completed && (
                      task.target ? (
                        <button onClick={() => submitAction('task_progress', { taskId: task.id })} className="w-full bg-brand-gold hover:bg-brand-gold-light text-black py-3 rounded-xl font-black shadow-[0_0_15px_rgba(212,175,55,0.3)]">تفكيك!</button>
                      ) : (
                        <input 
                          type="text" 
                          placeholder="الإجابة..."
                          className="w-full bg-black/40 border border-brand-gold/20 p-3 rounded-xl text-center focus:border-brand-gold outline-none text-white"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              submitAction('task_progress', { taskId: task.id, answer: (e.target as HTMLInputElement).value });
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                      )
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
