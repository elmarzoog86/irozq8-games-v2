import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Users, Play, Clock, CheckCircle2, XCircle, Trophy, ArrowRight, Settings, ArrowLeft, Dices, GripHorizontal, EyeOff } from 'lucide-react';
import { TwitchChat } from './TwitchChat';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
}

interface TriviaGameProps {
  messages: ChatMessage[];
  onLeave: () => void;
  channelName: string;
  isConnected: boolean;
  error: string | null;
}

type GamePhase = 'config' | 'joining' | 'playing' | 'round_results' | 'final_results';

interface Player {
  username: string;
  score: number;
  currentAnswer?: string;
  answerTime?: number;
  roundPoints?: number;
}

interface QuestionData {
  q: string;
  a: string;
  options: string[];
}

const ARABIC_QUESTIONS = [
  { q: "كم عدد سور القرآن الكريم؟", a: "114", options: ["110", "112", "114", "120"] },
  { q: "ما هي أطول سورة في القرآن الكريم؟", a: "البقرة", options: ["آل عمران", "النساء", "البقرة", "الكهف"] },
  { q: "من هو أول الخلفاء الراشدين؟", a: "أبو بكر", options: ["عمر بن الخطاب", "علي بن أبي طالب", "عثمان بن عفان", "أبو بكر"] },
  { q: "في أي شهر يصوم المسلمون؟", a: "رمضان", options: ["شعبان", "رجب", "رمضان", "شوال"] },
  { q: "ما هو أسرع حيوان بري في العالم؟", a: "الفهد", options: ["الأسد", "النمر", "الفهد", "الغزال"] },
  { q: "ما هو الغاز الذي نتنفسه لنعيش؟", a: "الأكسجين", options: ["النيتروجين", "الهيدروجين", "الأكسجين", "ثاني أكسيد الكربون"] },
  { q: "كم عدد حواس الإنسان؟", a: "5", options: ["4", "5", "6", "7"] },
  { q: "ما هو الحيوان الذي يسمى سفينة الصحراء؟", a: "الجمل", options: ["الحصان", "الجمل", "الفيل", "النعامة"] },
  { q: "ما هي الشركة المصنعة لسيارة موستانج؟", a: "فورد", options: ["شيفروليه", "دودج", "فورد", "تويوتا"] },
  { q: "أي دولة تصنع سيارات فيراري؟", a: "إيطاليا", options: ["ألمانيا", "فرنسا", "إيطاليا", "إسبانيا"] },
  { q: "ما هي الشركة التي تنتج سيارة كامري؟", a: "تويوتا", options: ["هوندا", "نيسان", "تويوتا", "مازدا"] },
  { q: "ما هو الكوكب الأحمر؟", a: "المريخ", options: ["الزهرة", "المشتري", "المريخ", "زحل"] },
  { q: "ما هو أكبر كوكب في المجموعة الشمسية؟", a: "المشتري", options: ["زحل", "المشتري", "أورانوس", "نبتون"] },
  { q: "ما هو أقرب كوكب للشمس؟", a: "عطارد", options: ["الزهرة", "المريخ", "عطارد", "الأرض"] },
  { q: "ما هو الكوكب الذي نعيش عليه؟", a: "الأرض", options: ["المريخ", "الزهرة", "الأرض", "المشتري"] },
  { q: "ما هي عاصمة اليابان؟", a: "طوكيو", options: ["بكين", "سيول", "طوكيو", "بانكوك"] },
  { q: "ما هو أطول نهر في العالم؟", a: "النيل", options: ["الأمازون", "المسيسيبي", "النيل", "الفرات"] },
  { q: "في أي قارة تقع دولة البرازيل؟", a: "أمريكا الجنوبية", options: ["أفريقيا", "أمريكا الشمالية", "أمريكا الجنوبية", "أوروبا"] },
  { q: "ما هي عاصمة مصر؟", a: "القاهرة", options: ["الإسكندرية", "دمشق", "القاهرة", "بغداد"] },
  { q: "ما هي أصغر دولة في العالم؟", a: "الفاتيكان", options: ["موناكو", "سان مارينو", "الفاتيكان", "ليختنشتاين"] },
  { q: "ما هو لون الدم النقي؟", a: "أحمر", options: ["أزرق", "أخضر", "أحمر", "أصفر"] },
  { q: "كم عدد قارات العالم؟", a: "7", options: ["5", "6", "7", "8"] },
  { q: "ما هو الحيوان الأكبر في العالم؟", a: "الحوت الأزرق", options: ["الفيل", "القرش الأبيض", "الحوت الأزرق", "الزرافة"] },
  { q: "ما هي لغة القرآن الكريم؟", a: "العربية", options: ["الإنجليزية", "الفارسية", "الأردية", "العربية"] },
  { q: "ما هو المعدن السائل في درجة حرارة الغرفة؟", a: "الزئبق", options: ["الحديد", "النحاس", "الزئبق", "الذهب"] }
];

export const TriviaGame: React.FC<TriviaGameProps> = ({ messages, onLeave, channelName, isConnected, error }) => {
  const [phase, setPhase] = useState<GamePhase>('config');
  const [settings, setSettings] = useState({ numQuestions: 10, timePerQuestion: 15 });
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [streamerSecretAnswer, setStreamerSecretAnswer] = useState('');
  const [lockedStreamerAnswer, setLockedStreamerAnswer] = useState('');
  const [showStreamerBox, setShowStreamerBox] = useState(true);
  
  const processedMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    messages.forEach(msg => {
      if (!processedMessageIds.current.has(msg.id)) {
        processedMessageIds.current.add(msg.id);
        
        const text = msg.message.trim();
        
        if (phase === 'joining' && text.toLowerCase() === '!join') {
          setPlayers(prev => {
            if (!prev[msg.username]) {
              return { ...prev, [msg.username]: { username: msg.username, score: 0 } };
            }
            return prev;
          });
        } else if (phase === 'playing' && timeLeft !== null && timeLeft > 0) {
          setPlayers(prev => {
            const player = prev[msg.username];
            if (player && !player.currentAnswer) {
              let answer = text;
              if (text.toLowerCase().startsWith('answer:')) {
                answer = text.substring(7).trim();
              }
              return {
                ...prev,
                [msg.username]: {
                  ...player,
                  currentAnswer: answer,
                  answerTime: timeLeft
                }
              };
            }
            return prev;
          });
        }
      }
    });
  }, [messages, phase, timeLeft]);

  useEffect(() => {
    if (phase === 'playing' && timeLeft !== null && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'playing' && timeLeft === 0) {
      handleRoundEnd();
    }
  }, [phase, timeLeft]);

  const setRandomQuestion = () => {
    const randomQ = ARABIC_QUESTIONS[Math.floor(Math.random() * ARABIC_QUESTIONS.length)];
    const shuffledOptions = [...randomQ.options].sort(() => Math.random() - 0.5);
    setQuestionData({
      q: randomQ.q,
      a: randomQ.a,
      options: shuffledOptions
    });
  };

  const startGame = () => {
    setPhase('joining');
  };

  const startFirstQuestion = () => {
    setPhase('playing');
    setCurrentQuestion(1);
    setTimeLeft(settings.timePerQuestion);
    setStreamerSecretAnswer('');
    setLockedStreamerAnswer('');
    setRandomQuestion();
    setPlayers(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        next[k].currentAnswer = undefined;
        next[k].answerTime = undefined;
        next[k].roundPoints = 0;
      });
      return next;
    });
  };

  const startNextQuestion = () => {
    if (currentQuestion >= settings.numQuestions) {
      setPhase('final_results');
      return;
    }
    setPhase('playing');
    setCurrentQuestion(prev => prev + 1);
    setTimeLeft(settings.timePerQuestion);
    setStreamerSecretAnswer('');
    setLockedStreamerAnswer('');
    setRandomQuestion();
    setPlayers(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        next[k].currentAnswer = undefined;
        next[k].answerTime = undefined;
        next[k].roundPoints = 0;
      });
      return next;
    });
  };

  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (streamerSecretAnswer.trim() && timeLeft !== null && timeLeft > 0) {
      setLockedStreamerAnswer(streamerSecretAnswer.trim().toLowerCase());
      
      setPlayers(prev => {
        const streamerName = channelName || 'Streamer';
        const player = prev[streamerName] || { username: streamerName, score: 0 };
        
        if (!player.currentAnswer) {
          return {
            ...prev,
            [streamerName]: {
              ...player,
              currentAnswer: streamerSecretAnswer.trim(),
              answerTime: timeLeft
            }
          };
        }
        return prev;
      });
    }
  };

  const checkAnswer = (playerAnswer: string | undefined): boolean => {
    if (!playerAnswer || !questionData) return false;
    const ans = playerAnswer.toLowerCase().trim();
    const correctText = questionData.a.toLowerCase().trim();
    const correctIndex = (questionData.options.findIndex(o => o.toLowerCase().trim() === correctText) + 1).toString();
    
    return ans.includes(correctText) || correctText.includes(ans) || ans === correctIndex;
  };

  const handleRoundEnd = () => {
    setPlayers(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        const p = next[k];
        let points = 0;
        if (checkAnswer(p.currentAnswer)) {
          const timeTaken = settings.timePerQuestion - (p.answerTime || 0);
          // Highest is 86 points, drops by 3 points every second
          points = Math.max(0, 86 - (timeTaken * 3));
        }
        p.roundPoints = points;
        p.score += points;
      });
      return next;
    });
    setPhase('round_results');
  };

  const sortedPlayers = (Object.values(players) as Player[]).sort((a, b) => b.score - a.score);
  const activePlayers = Object.values(players) as Player[];

  const renderPhase = () => {
    if (phase === 'config') {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-2xl mx-auto">
          <div className="bg-zinc-800/50 border border-zinc-700 p-8 rounded-2xl w-full">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Settings className="w-8 h-8 text-indigo-400" />
              Game Settings
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Number of Questions (5-20)</label>
                <input 
                  type="number" 
                  min="5" max="20" 
                  value={settings.numQuestions}
                  onChange={e => setSettings({...settings, numQuestions: parseInt(e.target.value) || 10})}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Time per Question (10-60s)</label>
                <input 
                  type="number" 
                  min="10" max="60" 
                  value={settings.timePerQuestion}
                  onChange={e => setSettings({...settings, timePerQuestion: parseInt(e.target.value) || 15})}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              
              <button 
                onClick={startGame}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 mt-8"
              >
                <Play className="w-5 h-5" /> Start Game
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
            Type <span className="text-indigo-400 font-mono bg-indigo-500/10 px-3 py-1 rounded-lg">!join</span> in chat to enter
          </p>
          
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 w-full max-w-2xl mb-8 min-h-[200px] max-h-[400px] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-zinc-300">Joined Players</h3>
              <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-sm font-bold">
                {activePlayers.length} Total
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {activePlayers.map((p, i) => (
                <div key={p.username} className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-lg flex items-center gap-2">
                  <span className="text-zinc-500 text-sm">#{i + 1}</span>
                  <span className="text-zinc-200 font-medium">{p.username}</span>
                </div>
              ))}
              {activePlayers.length === 0 && (
                <div className="text-zinc-500 italic w-full text-center py-8">No players joined yet...</div>
              )}
            </div>
          </div>

          <button 
            onClick={startFirstQuestion}
            disabled={activePlayers.length === 0}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-4 px-12 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
          >
            Start Round 1 <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      );
    }

    if (phase === 'playing') {
      return (
        <div className="flex h-full w-full gap-6 relative">
          
          {/* Draggable Streamer Secret Box */}
          {showStreamerBox && (
            <motion.div
              drag
              dragMomentum={false}
              className="absolute z-50 top-4 left-4 bg-zinc-900/95 backdrop-blur-md border-2 border-purple-500/50 rounded-xl p-4 shadow-2xl w-80 cursor-move"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
                  <GripHorizontal className="w-4 h-4" /> Streamer Secret Control
                </h3>
                <button onClick={() => setShowStreamerBox(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSecretSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Your Answer (Hidden from stream)</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={streamerSecretAnswer}
                      onChange={e => setStreamerSecretAnswer(e.target.value)}
                      placeholder="Type your answer..."
                      className="w-full bg-zinc-950 border border-purple-500/30 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      onPointerDownCapture={e => e.stopPropagation()} // Prevent drag when typing
                    />
                    <EyeOff className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  </div>
                </div>
                {lockedStreamerAnswer ? (
                  <div className="text-xs text-emerald-400 text-center bg-emerald-500/10 py-2 rounded-lg border border-emerald-500/20">
                    Answer submitted!
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 leading-tight text-center">
                    Press Enter to submit your answer.
                  </p>
                )}
              </form>
            </motion.div>
          )}

          {!showStreamerBox && (
            <button
              onClick={() => setShowStreamerBox(true)}
              className="absolute top-4 left-4 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30 px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors z-10"
            >
              <EyeOff className="w-4 h-4" /> Show Secret Box
            </button>
          )}

          {/* Main Question Area */}
          <div className="flex-1 flex flex-col relative">
            <div className="flex items-center justify-between mb-6">
              <div className="bg-zinc-800/80 border border-zinc-700 px-4 py-2 rounded-lg text-zinc-300 font-medium ml-auto">
                Question {currentQuestion} / {settings.numQuestions}
              </div>
              <div className={`flex items-center gap-2 text-3xl font-bold font-mono px-6 py-3 rounded-xl border ml-4 ${timeLeft !== null && timeLeft <= 5 ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' : 'bg-zinc-800/80 border-zinc-700 text-white'}`}>
                <Clock className="w-6 h-6" /> 00:{timeLeft?.toString().padStart(2, '0') || '00'}
              </div>
            </div>

            <div className="flex-1 bg-zinc-800/30 border border-zinc-700/50 rounded-2xl p-8 flex flex-col items-center justify-center relative">
              <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-12 leading-tight" dir="rtl">
                {questionData?.q}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                {questionData?.options.map((opt, i) => (
                  <div key={i} className="bg-zinc-800/80 border border-zinc-700 p-6 rounded-xl text-center text-2xl font-bold text-white flex items-center justify-end gap-4 shadow-lg" dir="rtl">
                    <span className="bg-indigo-500/20 text-indigo-400 w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-right">{opt}</span>
                  </div>
                ))}
              </div>
              
              <p className="mt-8 text-zinc-400 text-lg">
                Type the <span className="text-indigo-400 font-bold">number</span> or the <span className="text-indigo-400 font-bold">answer</span> in chat!
              </p>
            </div>
          </div>

          {/* Live Leaderboard Sidebar */}
          <div className="w-80 flex flex-col gap-4">
            <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col min-h-0">
              <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" /> Live Leaderboard
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {sortedPlayers.map((p, i) => (
                  <div key={p.username} className="flex items-center justify-between bg-zinc-800/50 px-3 py-2 rounded-lg border border-zinc-700/50">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className={`font-bold text-sm ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-600' : 'text-zinc-500'}`}>
                        #{i + 1}
                      </span>
                      <span className="text-zinc-200 text-sm truncate">{p.username}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-indigo-400 font-mono text-sm">{p.score}</span>
                      {p.currentAnswer ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-zinc-600 border-t-zinc-400 animate-spin shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (phase === 'round_results') {
      const correctPlayers = activePlayers.filter(p => checkAnswer(p.currentAnswer));
      const fastestPlayer = [...correctPlayers].sort((a, b) => (b.answerTime || 0) - (a.answerTime || 0))[0];

      return (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-2">Round {currentQuestion} Results</h2>
          {questionData && <p className="text-xl text-zinc-300 mb-6 text-center" dir="rtl">"{questionData.q}"</p>}
          
          <div className="bg-zinc-800/80 border border-zinc-700 rounded-2xl p-6 w-full mb-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-zinc-400 mb-1">Correct Answer</p>
              <p className="text-2xl font-bold text-emerald-400" dir="rtl">{questionData?.a}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-400 mb-1">Correct Answers</p>
              <p className="text-2xl font-bold text-white">{correctPlayers.length} / {activePlayers.length}</p>
            </div>
            {fastestPlayer && (
              <div className="text-right">
                <p className="text-sm text-zinc-400 mb-1">Fastest</p>
                <p className="text-xl font-bold text-amber-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {fastestPlayer.username} ({(settings.timePerQuestion - (fastestPlayer.answerTime || 0))}s)
                </p>
              </div>
            )}
          </div>

          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col mb-6">
            <div className="grid grid-cols-4 gap-4 p-4 bg-zinc-800/50 border-b border-zinc-800 text-sm font-medium text-zinc-400">
              <div>Player</div>
              <div>Answer</div>
              <div>Time</div>
              <div className="text-right">Points</div>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {activePlayers.map((p, i) => {
                const isCorrect = checkAnswer(p.currentAnswer);
                const hasAnswered = !!p.currentAnswer;
                
                return (
                  <div key={p.username} className={`grid grid-cols-4 gap-4 p-3 rounded-lg items-center ${isCorrect ? 'bg-emerald-500/10 border border-emerald-500/20' : hasAnswered ? 'bg-red-500/10 border border-red-500/20' : 'bg-zinc-800/30 border border-zinc-800'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 text-xs">#{i + 1}</span>
                      <span className="text-zinc-200 font-medium truncate">{p.username}</span>
                    </div>
                    <div className="truncate" dir="rtl">
                      {hasAnswered ? (
                        <span className={isCorrect ? 'text-emerald-400' : 'text-red-400'}>
                          {isCorrect ? <CheckCircle2 className="w-4 h-4 inline ml-1" /> : <XCircle className="w-4 h-4 inline ml-1" />}
                          {p.currentAnswer}
                        </span>
                      ) : (
                        <span className="text-zinc-500 italic">Skipped</span>
                      )}
                    </div>
                    <div className="text-zinc-400 text-sm">
                      {hasAnswered ? `${settings.timePerQuestion - (p.answerTime || 0)}s` : '-'}
                    </div>
                    <div className={`text-right font-bold ${p.roundPoints && p.roundPoints > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      +{p.roundPoints || 0}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            onClick={startNextQuestion}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-12 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg w-full max-w-md"
            dir="rtl"
          >
            {currentQuestion >= settings.numQuestions ? 'إنهاء اللعبة' : 'السؤال التالي'} <ArrowRight className="w-5 h-5 mr-2" />
          </button>
        </div>
      );
    }

    if (phase === 'final_results') {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl mx-auto">
          <Trophy className="w-20 h-20 text-yellow-400 mb-6" />
          <h2 className="text-5xl font-black text-white mb-2 tracking-tight">Final Leaderboard</h2>
          <p className="text-xl text-zinc-400 mb-12">Game Over! Here are the final results.</p>
          
          <div className="w-full max-w-2xl space-y-3 mb-12">
            {sortedPlayers.map((p, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={p.username} 
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  i === 0 ? 'bg-yellow-500/20 border-yellow-500/50' :
                  i === 1 ? 'bg-zinc-300/20 border-zinc-300/50' :
                  i === 2 ? 'bg-amber-600/20 border-amber-600/50' :
                  'bg-zinc-800/50 border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    i === 0 ? 'bg-yellow-500 text-yellow-950' :
                    i === 1 ? 'bg-zinc-300 text-zinc-900' :
                    i === 2 ? 'bg-amber-600 text-amber-950' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {i + 1}
                  </div>
                  <span className={`text-xl font-bold ${
                    i === 0 ? 'text-yellow-400' :
                    i === 1 ? 'text-zinc-300' :
                    i === 2 ? 'text-amber-500' :
                    'text-zinc-200'
                  }`}>{p.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black font-mono text-white">{p.score}</span>
                  <span className="text-sm text-zinc-400 uppercase tracking-wider">pts</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setPhase('config')}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-8 rounded-xl transition-colors"
            >
              Play Again
            </button>
            <button 
              onClick={onLeave}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl transition-colors"
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
      {/* Main Trivia Area */}
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
