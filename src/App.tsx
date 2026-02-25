import React, { useState } from 'react';
import { TwitchChat } from './components/TwitchChat';
import { TriviaGame } from './components/TriviaGame';
import { FruitWar } from './components/FruitWar';
import { ChairsGame } from './components/ChairsGame';
import { RouletteGame } from './components/RouletteGame';
import { WordChainGame } from './components/WordChainGame';
import { ChatInvadersGame } from './components/ChatInvadersGame';
import { PriceIsRightGame } from './components/PriceIsRightGame';
import { useTwitchChat } from './hooks/useTwitchChat';
import { motion } from 'motion/react';
import { ArrowLeft, HelpCircle, Swords, Armchair, Hourglass, Twitch, Heart, MessageCircle, MessageSquareText, Rocket, Tag } from 'lucide-react';

export default function App() {
  const [channelNameInput, setChannelNameInput] = useState('');
  const [activeChannel, setActiveChannel] = useState('');
  const [activeGame, setActiveGame] = useState<string | null>(null);
  
  // Check for join link
  const urlParams = new URLSearchParams(window.location.search);
  const joinId = urlParams.get('join');

  const { messages, isConnected, error } = useTwitchChat({ 
    channelName: activeChannel 
  });

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (channelNameInput.trim()) {
      setActiveChannel(channelNameInput.trim().toLowerCase());
    }
  };

  const leaveGame = () => {
    setActiveGame(null);
  };

  if (!activeChannel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 font-arabic relative overflow-hidden" dir="rtl">
        {/* Video Background */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/background.webm" type="video/webm" />
          <source src="/background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40 z-0" />

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-20 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
              <img src="/roz.png" alt="Logo" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-yellow-500 tracking-wider glow-gold-text">iRozQ8</h1>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://www.twitch.tv/irozq8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#9146FF]/20 hover:bg-[#9146FF]/40 text-white px-4 py-2 rounded-xl border border-[#9146FF]/50 transition-all font-bold text-sm backdrop-blur-md"
            >
              <Twitch className="w-4 h-4 text-[#9146FF]" />
              <span className="hidden sm:inline">قناتي في تويتش</span>
            </a>
            <a 
              href="https://streamlabs.com/irozq8/tip" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-white px-4 py-2 rounded-xl border border-emerald-500/50 transition-all font-bold text-sm backdrop-blur-md"
            >
              <Heart className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline">دعم القناة</span>
            </a>
            <a 
              href="https://discord.com/users/StigQ8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#5865F2]/20 hover:bg-[#5865F2]/40 text-white px-4 py-2 rounded-xl border border-[#5865F2]/50 transition-all font-bold text-sm backdrop-blur-md"
            >
              <MessageCircle className="w-4 h-4 text-[#5865F2]" />
              <span className="hidden sm:inline">الدعم الفني (StigQ8)</span>
            </a>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 rounded-3xl p-8 shadow-2xl z-10"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-yellow-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-yellow-500/20 transform rotate-12 overflow-hidden">
              <img 
                src="/roz.png" 
                alt="Roz Logo" 
                className="w-full h-full object-cover -rotate-12 scale-[1.6]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex flex-col items-center text-yellow-500/50"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg></div>';
                }}
              />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">منصة روز للألعاب التفاعلية</h1>
            <p className="text-yellow-500/70">اربط قناتك للبدء باللعب مع المتابعين.</p>
          </div>

          <form onSubmit={handleConnect} className="space-y-6">
            <div>
              <label htmlFor="channel" className="block text-sm font-medium text-yellow-500/70 mb-2">
                اسم قناة تويتش
              </label>
              <div className="relative" dir="ltr">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-yellow-600/50 font-mono">twitch.tv/</span>
                </div>
                <input
                  type="text"
                  id="channel"
                  value={channelNameInput}
                  onChange={(e) => setChannelNameInput(e.target.value)}
                  className="block w-full pl-28 pr-4 py-3 bg-black/50 border border-yellow-900/50 rounded-xl text-white placeholder-yellow-700/50 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all outline-none"
                  placeholder="اسم المستخدم"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              اتصال ولعب
            </button>
          </form>
        </motion.div>

        {/* Credits */}
        <div className="absolute bottom-6 left-0 right-0 text-center z-20 pointer-events-none">
          <p className="text-yellow-500/40 text-sm font-mono flex items-center justify-center gap-2" dir="ltr">
            <span>Done by:</span>
            <span className="text-yellow-500/60 font-bold">iRozQ8</span>
            <span>•</span>
            <span className="text-yellow-500/60 font-bold">iSari9</span>
            <span>•</span>
            <span className="text-yellow-500/60 font-bold">iMythQ8</span>
          </p>
        </div>
      </div>
    );
  }

  // Full screen games
  if (activeGame === 'trivia') {
    return (
      <div className="min-h-screen text-white p-8 font-arabic flex flex-col items-center relative overflow-hidden" dir="rtl">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
          <source src="/background.webm" type="video/webm" />
          <source src="/background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40 z-0" />
        
        {/* Top Bar */}
        <div className="w-full max-w-6xl flex items-center justify-between mb-8 relative z-20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
              <img src="/roz.png" alt="Logo" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-yellow-500 tracking-wider glow-gold-text">iRozQ8</h1>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://www.twitch.tv/irozq8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#9146FF]/20 hover:bg-[#9146FF]/40 text-white px-4 py-2 rounded-xl border border-[#9146FF]/50 transition-all font-bold text-sm backdrop-blur-md"
            >
              <Twitch className="w-4 h-4 text-[#9146FF]" />
              <span className="hidden sm:inline">قناتي في تويتش</span>
            </a>
            <a 
              href="https://streamlabs.com/irozq8/tip" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-white px-4 py-2 rounded-xl border border-emerald-500/50 transition-all font-bold text-sm backdrop-blur-md"
            >
              <Heart className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline">دعم القناة</span>
            </a>
            <a 
              href="https://discord.com/users/StigQ8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#5865F2]/20 hover:bg-[#5865F2]/40 text-white px-4 py-2 rounded-xl border border-[#5865F2]/50 transition-all font-bold text-sm backdrop-blur-md"
            >
              <MessageCircle className="w-4 h-4 text-[#5865F2]" />
              <span className="hidden sm:inline">الدعم الفني (StigQ8)</span>
            </a>
          </div>
        </div>

        <div className="relative z-10 h-full w-full">
          <TriviaGame messages={messages} onLeave={leaveGame} channelName={activeChannel} isConnected={isConnected} error={error} />
        </div>
      </div>
    );
  }

  if (activeGame === 'fruitwar') {
    return (
      <div className="min-h-screen text-white p-8 font-arabic flex flex-col items-center relative overflow-hidden" dir="rtl">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
          <source src="/background.webm" type="video/webm" />
          <source src="/background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40 z-0" />

        {/* Top Bar */}
        <div className="w-full max-w-6xl flex items-center justify-between mb-8 relative z-20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
              <img src="/roz.png" alt="Logo" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-yellow-500 tracking-wider glow-gold-text">iRozQ8</h1>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://www.twitch.tv/irozq8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#9146FF]/20 hover:bg-[#9146FF]/40 text-white px-4 py-2 rounded-xl border border-[#9146FF]/50 transition-all font-bold text-sm backdrop-blur-md"
            >
              <Twitch className="w-4 h-4 text-[#9146FF]" />
              <span className="hidden sm:inline">قناتي في تويتش</span>
            </a>
            <a 
              href="https://streamlabs.com/irozq8/tip" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-white px-4 py-2 rounded-xl border border-emerald-500/50 transition-all font-bold text-sm backdrop-blur-md"
            >
              <Heart className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline">دعم القناة</span>
            </a>
            <a 
              href="https://discord.com/users/StigQ8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#5865F2]/20 hover:bg-[#5865F2]/40 text-white px-4 py-2 rounded-xl border border-[#5865F2]/50 transition-all font-bold text-sm backdrop-blur-md"
            >
              <MessageCircle className="w-4 h-4 text-[#5865F2]" />
              <span className="hidden sm:inline">الدعم الفني (StigQ8)</span>
            </a>
          </div>
        </div>

        <div className="relative z-10 h-full w-full">
          <FruitWar messages={messages} onLeave={leaveGame} channelName={activeChannel} isConnected={isConnected} error={error} />
        </div>
      </div>
    );
  }

  if (activeGame === 'chairs') {
    return (
      <div className="min-h-screen text-white p-8 font-arabic flex flex-col items-center relative overflow-hidden" dir="rtl">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
          <source src="/background.webm" type="video/webm" />
          <source src="/background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40 z-0" />

        {/* Top Bar */}
        <div className="w-full max-w-6xl flex items-center justify-between mb-8 relative z-20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
              <img src="/roz.png" alt="Logo" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-yellow-500 tracking-wider glow-gold-text">iRozQ8</h1>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://www.twitch.tv/irozq8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#9146FF]/20 hover:bg-[#9146FF]/40 text-white px-4 py-2 rounded-xl border border-[#9146FF]/50 transition-all font-bold text-sm backdrop-blur-md"
            >
              <Twitch className="w-4 h-4 text-[#9146FF]" />
              <span className="hidden sm:inline">قناتي في تويتش</span>
            </a>
            <a 
              href="https://streamlabs.com/irozq8/tip" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-white px-4 py-2 rounded-xl border border-emerald-500/50 transition-all font-bold text-sm backdrop-blur-md"
            >
              <Heart className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline">دعم القناة</span>
            </a>
            <a 
              href="https://discord.com/users/StigQ8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#5865F2]/20 hover:bg-[#5865F2]/40 text-white px-4 py-2 rounded-xl border border-[#5865F2]/50 transition-all font-bold text-sm backdrop-blur-md"
            >
              <MessageCircle className="w-4 h-4 text-[#5865F2]" />
              <span className="hidden sm:inline">الدعم الفني (StigQ8)</span>
            </a>
          </div>
        </div>

        <div className="relative z-10 h-full w-full">
          <ChairsGame messages={messages} onLeave={leaveGame} channelName={activeChannel} isConnected={isConnected} error={error} />
        </div>
      </div>
    );
  }

  if (activeGame === 'roulette') {
    return (
      <div className="min-h-screen text-white p-8 font-arabic flex flex-col items-center relative overflow-hidden" dir="rtl">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
          <source src="/background.webm" type="video/webm" />
          <source src="/background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40 z-0" />

        {/* Top Bar */}
        <div className="w-full max-w-6xl flex items-center justify-between mb-8 relative z-20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
              <img src="/roz.png" alt="Logo" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-yellow-500 tracking-wider glow-gold-text">iRozQ8</h1>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://www.twitch.tv/irozq8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#9146FF]/20 hover:bg-[#9146FF]/40 text-white px-4 py-2 rounded-xl border border-[#9146FF]/50 transition-all font-bold text-sm backdrop-blur-md"
            >
              <Twitch className="w-4 h-4 text-[#9146FF]" />
              <span className="hidden sm:inline">قناتي في تويتش</span>
            </a>
            <a 
              href="https://streamlabs.com/irozq8/tip" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-white px-4 py-2 rounded-xl border border-emerald-500/50 transition-all font-bold text-sm backdrop-blur-md"
            >
              <Heart className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline">دعم القناة</span>
            </a>
            <a 
              href="https://discord.com/users/StigQ8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#5865F2]/20 hover:bg-[#5865F2]/40 text-white px-4 py-2 rounded-xl border border-[#5865F2]/50 transition-all font-bold text-sm backdrop-blur-md"
            >
              <MessageCircle className="w-4 h-4 text-[#5865F2]" />
              <span className="hidden sm:inline">الدعم الفني (StigQ8)</span>
            </a>
          </div>
        </div>

        <div className="relative z-10 h-full w-full">
          <RouletteGame messages={messages} onLeave={leaveGame} channelName={activeChannel} isConnected={isConnected} error={error} />
        </div>
      </div>
    );
  }

  if (activeGame === 'wordchain') {
    return (
      <div className="min-h-screen text-white p-8 font-arabic flex flex-col items-center relative overflow-hidden" dir="rtl">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
          <source src="/background.webm" type="video/webm" />
          <source src="/background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40 z-0" />
        <div className="relative z-10 h-full w-full mt-16">
          <WordChainGame messages={messages} onLeave={leaveGame} />
        </div>
      </div>
    );
  }

  if (activeGame === 'chatinvaders') {
    return (
      <div className="min-h-screen text-white p-8 font-arabic flex flex-col items-center relative overflow-hidden" dir="rtl">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
          <source src="/background.webm" type="video/webm" />
          <source src="/background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40 z-0" />
        <div className="relative z-10 h-full w-full mt-16">
          <ChatInvadersGame messages={messages} onLeave={leaveGame} />
        </div>
      </div>
    );
  }

  if (activeGame === 'priceisright') {
    return (
      <div className="min-h-screen text-white p-8 font-arabic flex flex-col items-center relative overflow-hidden" dir="rtl">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
          <source src="/background.webm" type="video/webm" />
          <source src="/background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40 z-0" />
        <div className="relative z-10 h-full w-full mt-16">
          <PriceIsRightGame messages={messages} onLeave={leaveGame} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-8 font-arabic flex flex-col items-center relative overflow-hidden" dir="rtl">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
        <source src="/background.webm" type="video/webm" />
        <source src="/background.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/40 z-0" />

      {/* Top Bar */}
      <div className="w-full max-w-6xl flex items-center justify-between mb-8 relative z-20">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
            <img src="/roz.png" alt="Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-yellow-500 tracking-wider glow-gold-text">iRozQ8</h1>
        </div>
        <div className="flex items-center gap-4">
          <a 
            href="https://www.twitch.tv/irozq8" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#9146FF]/20 hover:bg-[#9146FF]/40 text-white px-4 py-2 rounded-xl border border-[#9146FF]/50 transition-all font-bold text-sm backdrop-blur-md"
          >
            <Twitch className="w-4 h-4 text-[#9146FF]" />
            <span className="hidden sm:inline">قناتي في تويتش</span>
          </a>
          <a 
            href="https://streamlabs.com/irozq8/tip" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-white px-4 py-2 rounded-xl border border-emerald-500/50 transition-all font-bold text-sm backdrop-blur-md"
          >
            <Heart className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">دعم القناة</span>
          </a>
          <a 
            href="https://discord.com/users/StigQ8" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#5865F2]/20 hover:bg-[#5865F2]/40 text-white px-4 py-2 rounded-xl border border-[#5865F2]/50 transition-all font-bold text-sm backdrop-blur-md"
          >
            <MessageCircle className="w-4 h-4 text-[#5865F2]" />
            <span className="hidden sm:inline">الدعم الفني (StigQ8)</span>
          </a>
        </div>
      </div>

      <div className="w-full max-w-6xl flex gap-8 h-[85vh] relative z-10">
        
        {/* Main Content Area */}
        <div className="flex-1 bg-black/60 backdrop-blur-md rounded-3xl border border-yellow-900/30 p-8 flex flex-col relative overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.1)]">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-amber-500/5" />
          
          <div className="relative z-10 w-full h-full flex flex-col">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">ردهة الألعاب</h1>
                  <p className="text-yellow-500/70 mt-1">اختر لعبة للعبها مع الدردشة</p>
                </div>
                <button 
                  onClick={() => setActiveChannel('')} 
                  className="text-yellow-500/70 hover:text-yellow-400 transition-colors text-sm flex items-center gap-2 bg-yellow-900/20 px-4 py-2 rounded-lg border border-yellow-900/30"
                >
                  <ArrowLeft className="w-4 h-4 rotate-180" /> قطع الاتصال
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 mt-4 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                  <button 
                    onClick={() => { setActiveGame('trivia'); }} 
                    className="bg-black/40 backdrop-blur-md border border-yellow-900/30 hover:border-yellow-500/50 hover:bg-yellow-900/20 p-6 rounded-2xl text-left transition-all group flex flex-col h-full shadow-lg"
                  >
                    <div className="w-full h-40 mb-4 rounded-xl overflow-hidden shrink-0 border border-yellow-900/50 bg-yellow-500/5 flex items-center justify-center">
                      <img 
                        src="/trivia.png" 
                        alt="لعبة الأسئلة" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex flex-col items-center text-yellow-500/50"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><span class="text-xs mt-2">قم برفع trivia.png إلى public/</span></div>';
                        }}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">سين جيم</h3>
                    <p className="text-yellow-500/70 text-sm flex-1">لعبة أسئلة مباشرة حيث يجيب المتابعون على الأسئلة لجمع النقاط.</p>
                  </button>

                  <button 
                    onClick={() => { setActiveGame('priceisright'); }} 
                    className="bg-black/40 backdrop-blur-md border border-green-900/30 hover:border-green-500/50 hover:bg-green-900/20 p-6 rounded-2xl text-right transition-all group flex flex-col h-full shadow-lg"
                  >
                    <div className="w-full h-40 mb-4 rounded-xl overflow-hidden shrink-0 border border-green-900/50 bg-green-500/5 flex items-center justify-center relative">
                      <img 
                        src="/priceisright.png" 
                        alt="خمن السعر" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex flex-col items-center text-green-500/50"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg><span class="text-xs mt-2">قم برفع priceisright.png إلى public/</span></div>';
                        }}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">خمن السعر</h3>
                    <p className="text-green-400/70 text-sm flex-1">اعرض منتجاً، ودع المتابعين يخمنون سعره في الشات. أقرب تخمين للسعر الحقيقي بدون تجاوزه يفوز!</p>
                  </button>

                  <div className="bg-black/20 backdrop-blur-sm border border-yellow-900/10 p-6 rounded-2xl text-right flex flex-col h-full shadow-lg opacity-60 grayscale group">
                    <div className="w-full h-40 mb-4 rounded-xl overflow-hidden shrink-0 border border-yellow-900/20 bg-yellow-500/5 flex items-center justify-center">
                      <img 
                        src="/fruitwar.png" 
                        alt="حرب الفواكه" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex flex-col items-center text-yellow-500/50"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg><span class="text-xs mt-2">قم برفع fruitwar.png إلى public/</span></div>';
                        }}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">حرب الفواكه</h3>
                    <p className="text-yellow-500/50 text-xs font-bold uppercase tracking-widest mb-2">قريباً</p>
                    <p className="text-yellow-500/40 text-sm flex-1">يتم تعيين فواكه للاعبين والمعركة تكون عبر التصويت أو وضع الروليت!</p>
                  </div>

                  <div className="bg-black/20 backdrop-blur-sm border border-yellow-900/10 p-6 rounded-2xl text-right flex flex-col h-full shadow-lg opacity-60 grayscale group">
                    <div className="w-full h-40 mb-4 rounded-xl overflow-hidden shrink-0 border border-yellow-900/20 bg-yellow-500/5 flex items-center justify-center">
                      <img 
                        src="/chairs.png" 
                        alt="لعبة الكراسي" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex flex-col items-center text-yellow-500/50"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"></path><path d="M2 20h20"></path><path d="M14 12v.01"></path></svg><span class="text-xs mt-2">قم برفع chairs.png إلى public/</span></div>';
                        }}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">لعبة الكراسي</h3>
                    <p className="text-yellow-500/50 text-xs font-bold uppercase tracking-widest mb-2">قريباً</p>
                    <p className="text-yellow-500/40 text-sm flex-1">الكراسي الموسيقية! اكتب رقم الكرسي في الدردشة للجلوس.</p>
                  </div>

                  <div className="bg-black/20 backdrop-blur-sm border border-yellow-900/10 p-6 rounded-2xl text-right flex flex-col h-full shadow-lg opacity-60 grayscale group">
                    <div className="w-full h-40 mb-4 rounded-xl overflow-hidden shrink-0 border border-yellow-900/20 bg-yellow-500/5 flex items-center justify-center">
                      <img 
                        src="/roulette.png" 
                        alt="روليت" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex flex-col items-center text-yellow-500/50"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v4"></path><path d="M12 18v4"></path><path d="M4.93 4.93l2.83 2.83"></path><path d="M16.24 16.24l2.83 2.83"></path><path d="M2 12h4"></path><path d="M18 12h4"></path><path d="M4.93 19.07l2.83-2.83"></path><path d="M16.24 7.76l2.83-2.83"></path></svg><span class="text-xs mt-2">قم برفع roulette.png إلى public/</span></div>';
                        }}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">روليت</h3>
                    <p className="text-yellow-500/50 text-xs font-bold uppercase tracking-widest mb-2">قريباً</p>
                    <p className="text-yellow-500/40 text-sm flex-1">لعبة بقاء تعتمد على الحظ! انضم للردهة ليظهر اسمك على العجلة. اللاعب المختار يحصل على قوة الإقصاء.</p>
                  </div>

                  <div className="bg-black/20 backdrop-blur-sm border border-yellow-900/10 p-6 rounded-2xl text-right flex flex-col h-full shadow-lg opacity-60 grayscale group">
                    <div className="w-full h-40 mb-4 rounded-xl overflow-hidden shrink-0 border border-yellow-900/20 bg-yellow-500/5 flex items-center justify-center relative">
                      <img 
                        src="/wordchain.png" 
                        alt="سلسلة الكلمات" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex flex-col items-center text-blue-500/50"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg><span class="text-xs mt-2">قم برفع wordchain.png إلى public/</span></div>';
                        }}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">سلسلة الكلمات</h3>
                    <p className="text-yellow-500/50 text-xs font-bold uppercase tracking-widest mb-2">قريباً</p>
                    <p className="text-yellow-500/40 text-sm flex-1">لعبة سرعة بديهة! ابدأ بكلمة، وعلى المتابعين كتابة كلمة تبدأ بآخر حرف من الكلمة السابقة.</p>
                  </div>

                  <div className="bg-black/20 backdrop-blur-sm border border-yellow-900/10 p-6 rounded-2xl text-right flex flex-col h-full shadow-lg opacity-60 grayscale group">
                    <div className="w-full h-40 mb-4 rounded-xl overflow-hidden shrink-0 border border-yellow-900/20 bg-yellow-500/5 flex items-center justify-center relative">
                      <img 
                        src="/chatinvaders.png" 
                        alt="غزاة الشات" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex flex-col items-center text-red-500/50"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-5c1.62-2.2 5-3 5-3"></path><path d="M12 15v5s3.03-.55 5-2c2.2-1.62 3-5 3-5"></path></svg><span class="text-xs mt-2">قم برفع chatinvaders.png إلى public/</span></div>';
                        }}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">غزاة الشات</h3>
                    <p className="text-yellow-500/50 text-xs font-bold uppercase tracking-widest mb-2">قريباً</p>
                    <p className="text-yellow-500/40 text-sm flex-1">دافع عن سفينتك! كل رسالة في الشات تتحول إلى عدو يهبط نحوك. استخدم الأسهم للحركة و Space لإطلاق النار.</p>
                  </div>

                  <div className="bg-black/20 backdrop-blur-sm border border-yellow-900/10 p-6 rounded-2xl text-right flex flex-col h-full shadow-lg opacity-60 grayscale group">
                    <div className="w-full h-40 mb-4 rounded-xl overflow-hidden shrink-0 border border-yellow-900/20 bg-yellow-500/5 flex items-center justify-center relative">
                      <img 
                        src="/guessmusic.png" 
                        alt="خمن الموسيقى" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex flex-col items-center text-yellow-500/50"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><span class="text-xs mt-2">قم برفع guessmusic.png إلى public/</span></div>';
                        }}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">خمن الموسيقى</h3>
                    <p className="text-yellow-500/50 text-xs font-bold uppercase tracking-widest mb-2">قريباً</p>
                    <p className="text-yellow-500/40 text-sm flex-1">اختبر معلومات مجتمعك الموسيقية! قم بتشغيل مقاطع من الأغاني ودع المتابعين يتسابقون لتحديد الفنان والعنوان.</p>
                  </div>

                  <div className="bg-black/20 backdrop-blur-sm border border-yellow-900/10 p-6 rounded-2xl text-right flex flex-col h-full shadow-lg opacity-60 grayscale group">
                    <div className="w-full h-40 mb-4 rounded-xl overflow-hidden shrink-0 border border-yellow-900/20 bg-yellow-500/5 flex items-center justify-center relative">
                      <img 
                        src="/bankrobbery.png" 
                        alt="سطو على البنك" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex flex-col items-center text-yellow-500/50"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg><span class="text-xs mt-2">قم برفع bankrobbery.png إلى public/</span></div>';
                        }}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">سطو على البنك</h3>
                    <p className="text-yellow-500/50 text-xs font-bold uppercase tracking-widest mb-2">قريباً</p>
                    <p className="text-yellow-500/40 text-sm flex-1">لعبة استراتيجية تعاونية حيث يجب على الستريمر والدردشة العمل معاً لتجاوز الأمن، وفتح الخزنة، وتأمين الغنيمة.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Sidebar Chat */}
        <div className="w-96 flex flex-col gap-4">
          <div className="flex-1 min-h-0">
            <TwitchChat 
              channelName={activeChannel} 
              messages={messages}
              isConnected={isConnected}
              error={error}
            />
          </div>
        </div>
      </div>

      {/* Credits */}
      <div className="absolute bottom-4 left-0 right-0 text-center z-20 pointer-events-none">
        <p className="text-yellow-500/40 text-sm font-mono flex items-center justify-center gap-2" dir="ltr">
          <span>Done by:</span>
          <span className="text-yellow-500/60 font-bold">iRozQ8</span>
          <span>•</span>
          <span className="text-yellow-500/60 font-bold">iSari9</span>
          <span>•</span>
          <span className="text-yellow-500/60 font-bold">iMythQ8</span>
        </p>
      </div>
    </div>
  );
}
