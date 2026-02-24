import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';

interface UseTwitchChatProps {
  channelName: string;
  accessToken?: string;
  sessionId?: string;
}

export function useTwitchChat({ channelName, accessToken, sessionId }: UseTwitchChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!channelName) return;

    let isMounted = true;

    const connectToChat = async () => {
      try {
        // 1. Start the chat proxy on the server
        const startRes = await fetch('/api/twitch/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'start',
            channelName,
            accessToken,
            sessionId,
          }),
        });

        const startData = await startRes.json();

        if (!startData.success) {
          throw new Error(startData.error || 'Failed to start chat connection');
        }

        if (!isMounted) return;

        // 2. Connect via SSE to receive messages
        const sseUrl = `/api/twitch/chat?channel=${encodeURIComponent(channelName)}`;
        const eventSource = new EventSource(sseUrl);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log('SSE connection opened');
          setIsConnected(true);
          setError(null);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'message') {
              setMessages((prev) => {
                // Keep only the last 100 messages to prevent memory issues
                const newMessages = [...prev, {
                  id: data.id || `${data.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
                  username: data.username,
                  message: data.message,
                  timestamp: data.timestamp,
                  color: data.color,
                }];
                return newMessages.slice(-100);
              });
            } else if (data.type === 'connected') {
              setIsConnected(true);
            } else if (data.type === 'disconnected') {
              setIsConnected(false);
            }
          } catch (e) {
            console.error('Error parsing SSE message:', e);
          }
        };

        eventSource.onerror = (err) => {
          console.error('SSE connection error:', err);
          setIsConnected(false);
          // EventSource will automatically try to reconnect
        };

      } catch (err: any) {
        console.error('Error connecting to chat:', err);
        if (isMounted) {
          setError(err.message);
          setIsConnected(false);
        }
      }
    };

    connectToChat();

    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      // Optionally stop the proxy connection if this was the last client
      // For simplicity, we'll leave it running or handle cleanup on the server
    };
  }, [channelName, accessToken, sessionId]);

  return { messages, isConnected, error };
}
