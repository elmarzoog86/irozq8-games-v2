import React, { useState } from 'react';
import { TwitchChat } from './components/TwitchChat';
import { TriviaGame } from './components/TriviaGame';
import { FruitWar } from './components/FruitWar';
import { ChairsGame } from './components/ChairsGame';
import { useTwitchChat } from './hooks/useTwitchChat';
import { motion } from 'motion/react';
import { Gamepad2, ArrowLeft, HelpCircle, Swords, Armchair } from 'lucide-react';

export default function App() {
  const [channelNameInput, setChannelNameInput] = useState('');
  const [activeChannel, setActiveChannel] = useState('');
  const [activeGame, setActiveGame] = useState<string | null>(null);
  
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
      <div className="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Video Background */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover z-0 blur-md scale-105"
        >
          <source src="/color Matte.webM" type="video/webm" />
        </video>
        <div className="absolute inset-0 bg-black/40 z-0" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 rounded-3xl p-8 shadow-2xl z-10"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-yellow-500/30 transform rotate-12">
              <Gamepad2 className="w-8 h-8 text-yellow-400 -rotate-12" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Twitch Interactive</h1>
            <p className="text-yellow-500/70">Connect your channel to start playing with viewers.</p>
          </div>

          <form onSubmit={handleConnect} className="space-y-6">
            <div>
              <label htmlFor="channel" className="block text-sm font-medium text-yellow-500/70 mb-2">
                Twitch Channel Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-yellow-600/50 font-mono">twitch.tv/</span>
                </div>
                <input
                  type="text"
                  id="channel"
                  value={channelNameInput}
                  onChange={(e) => setChannelNameInput(e.target.value)}
                  className="block w-full pl-24 pr-4 py-3 bg-black/50 border border-yellow-900/50 rounded-xl text-white placeholder-yellow-700/50 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all outline-none"
                  placeholder="username"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Connect & Play
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Full screen games
  if (activeGame === 'trivia') {
    return (
      <div className="min-h-screen text-white p-8 font-sans relative overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0 blur-md scale-105">
          <source src="/color Matte.webM" type="video/webm" />
        </video>
        <div className="absolute inset-0 bg-black/40 z-0" />
        <div className="relative z-10 h-full">
          <TriviaGame messages={messages} onLeave={leaveGame} channelName={activeChannel} isConnected={isConnected} error={error} />
        </div>
      </div>
    );
  }

  if (activeGame === 'fruitwar') {
    return (
      <div className="min-h-screen text-white p-8 font-sans relative overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0 blur-md scale-105">
          <source src="/color Matte.webM" type="video/webm" />
        </video>
        <div className="absolute inset-0 bg-black/40 z-0" />
        <div className="relative z-10 h-full">
          <FruitWar messages={messages} onLeave={leaveGame} channelName={activeChannel} isConnected={isConnected} error={error} />
        </div>
      </div>
    );
  }

  if (activeGame === 'chairs') {
    return (
      <div className="min-h-screen text-white p-8 font-sans relative overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0 blur-md scale-105">
          <source src="/color Matte.webM" type="video/webm" />
        </video>
        <div className="absolute inset-0 bg-black/40 z-0" />
        <div className="relative z-10 h-full">
          <ChairsGame messages={messages} onLeave={leaveGame} channelName={activeChannel} isConnected={isConnected} error={error} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-8 font-sans flex flex-col items-center relative overflow-hidden">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0 blur-md scale-105">
        <source src="/color Matte.webM" type="video/webm" />
      </video>
      <div className="absolute inset-0 bg-black/40 z-0" />

      <div className="w-full max-w-6xl flex gap-8 h-[85vh] relative z-10">
        
        {/* Main Content Area */}
        <div className="flex-1 bg-black/60 backdrop-blur-xl rounded-3xl border border-yellow-900/30 p-8 flex flex-col relative overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.1)]">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-amber-500/5" />
          
          <div className="relative z-10 w-full h-full flex flex-col">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">Game Lobby</h1>
                  <p className="text-yellow-500/70 mt-1">Select a game to play with your chat</p>
                </div>
                <button 
                  onClick={() => setActiveChannel('')} 
                  className="text-yellow-500/70 hover:text-yellow-400 transition-colors text-sm flex items-center gap-2 bg-yellow-900/20 px-4 py-2 rounded-lg border border-yellow-900/30"
                >
                  <ArrowLeft className="w-4 h-4" /> Disconnect
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                <button 
                  onClick={() => { setActiveGame('trivia'); }} 
                  className="bg-black/40 backdrop-blur-md border border-yellow-900/30 hover:border-yellow-500/50 hover:bg-yellow-900/20 p-6 rounded-2xl text-left transition-all group flex flex-col h-full shadow-lg"
                >
                  <div className="w-full h-40 mb-4 rounded-xl overflow-hidden shrink-0 border border-yellow-900/50">
                    <img 
                      src="/trivia.png" 
                      alt="Trivia Game" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Questions & Answers</h3>
                  <p className="text-yellow-500/70 text-sm flex-1">A real-time trivia game where viewers answer questions for points.</p>
                </button>

                <button 
                  onClick={() => { setActiveGame('fruitwar'); }} 
                  className="bg-black/40 backdrop-blur-md border border-yellow-900/30 hover:border-yellow-500/50 hover:bg-yellow-900/20 p-6 rounded-2xl text-left transition-all group flex flex-col h-full shadow-lg"
                >
                  <div className="w-full h-40 mb-4 rounded-xl overflow-hidden shrink-0 border border-yellow-900/50">
                    <img 
                      src="/fruitwar.png" 
                      alt="Fruit War" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Fruit War</h3>
                  <p className="text-yellow-500/70 text-sm flex-1">Players get assigned fruits and battle it out in Voting or Roulette modes!</p>
                </button>

                <button 
                  onClick={() => { setActiveGame('chairs'); }} 
                  className="bg-black/40 backdrop-blur-md border border-yellow-900/30 hover:border-yellow-500/50 hover:bg-yellow-900/20 p-6 rounded-2xl text-left transition-all group flex flex-col h-full shadow-lg"
                >
                  <div className="w-12 h-12 bg-yellow-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Armchair className="w-6 h-6 text-yellow-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Chairs Game</h3>
                  <p className="text-yellow-500/70 text-sm flex-1">Musical chairs! Type the chair number in chat to sit down.</p>
                </button>
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
    </div>
  );
}
