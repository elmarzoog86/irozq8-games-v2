import React, { useEffect, useRef } from 'react';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
}

interface TwitchChatProps {
  channelName: string;
  messages: ChatMessage[];
  isConnected: boolean;
  error: string | null;
}

export const TwitchChat: React.FC<TwitchChatProps> = ({ channelName, messages, isConnected, error }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl font-arabic" dir="rtl">
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <h3 className="font-medium text-zinc-100">دردشة تويتش</h3>
        </div>
        <span className="text-xs text-zinc-400 font-mono" dir="ltr">#{channelName}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {messages.length === 0 && !error && (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            {isConnected ? 'بانتظار الرسائل...' : 'جاري الاتصال...'}
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="text-sm break-words animate-in fade-in slide-in-from-bottom-2">
            <span className="font-bold text-indigo-400 ml-2">{msg.username}</span>
            <span className="text-zinc-300">{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
