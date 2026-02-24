import express from "express";
import tmi from "tmi.js";

const app = express();
const PORT = 3000;

app.use(express.json());

// Store active chat clients (channelName -> {client, listeners})
interface ChatClient {
  client: tmi.Client;
  listeners: Set<(data: string) => void>;
}

const activeChatClients = new Map<string, ChatClient>();

/**
 * Helper to broadcast messages to all listeners of a channel
 */
function broadcastToListeners(channelName: string, data: string) {
  const chatClient = activeChatClients.get(channelName);
  if (chatClient) {
    chatClient.listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error("Error calling listener:", error);
      }
    });
  }
}

// API Routes
app.post("/api/twitch/chat", async (req, res) => {
  console.log(`📡 [API] POST /api/twitch/chat - Body:`, req.body);
  try {
    const { action, channelName, accessToken, sessionId } = req.body;

    if (!action || !channelName) {
      return res.status(400).json({
        success: false,
        error: "Missing action or channelName",
      });
    }

    if (action === "start") {
      if (activeChatClients.has(channelName)) {
        console.log(`✅ [CHAT PROXY] Already connected to channel: ${channelName}`);
        return res.json({
          success: true,
          message: "Already connected to channel",
          channelName,
        });
      }

      try {
        const client = new tmi.Client({
          options: {
            debug: false,
          },
          logger: {
            info: () => {},
            warn: () => {},
            error: (err) => console.error("TMI Error:", err),
          },
          connection: {
            secure: true,
            reconnect: true,
            maxReconnectAttempts: 5,
          },
          identity: accessToken
            ? {
                username: channelName,
                password: `oauth:${accessToken}`,
              }
            : undefined,
          channels: [channelName.startsWith('#') ? channelName : `#${channelName}`],
        });

        const chatClient: ChatClient = {
          client,
          listeners: new Set(),
        };

        client.on("connected", () => {
          console.log(`✅ [CHAT PROXY] Connected to ${channelName}'s chat`);
          broadcastToListeners(
            channelName,
            JSON.stringify({
              type: "connected",
              channel: channelName,
              message: `Connected to ${channelName}'s chat`,
            })
          );
        });

        client.on("message", (_channel: string, tags: tmi.ChatUserstate, message: string, self: boolean) => {
          if (self) return;

          const messageData = {
            type: "message",
            id: tags.id || Math.random().toString(36).substring(2, 15),
            username: tags["display-name"] || tags.username,
            message: message,
            timestamp: Date.now(),
            color: tags.color || '#818cf8', // Default indigo-400
          };

          console.log(`📨 [CHAT PROXY] ${messageData.username}: ${message}`);
          broadcastToListeners(channelName, JSON.stringify(messageData));
        });

        client.on("disconnected", () => {
          console.log(`❌ [CHAT PROXY] Disconnected from ${channelName}`);
          activeChatClients.delete(channelName);
          broadcastToListeners(
            channelName,
            JSON.stringify({
              type: "disconnected",
              channel: channelName,
            })
          );
        });

        activeChatClients.set(channelName, chatClient);
        await client.connect();

        console.log(`🎉 [CHAT PROXY] Successfully started chat connection for ${channelName}`);
        return res.json({
          success: true,
          message: "Chat connection started",
          channelName,
        });
      } catch (error: any) {
        console.error(`❌ [CHAT PROXY] Failed to create client:`, error.message);
        activeChatClients.delete(channelName);
        return res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    } else if (action === "stop") {
      const chatClient = activeChatClients.get(channelName);

      if (chatClient) {
        try {
          await chatClient.client.disconnect();
          activeChatClients.delete(channelName);
          console.log(`✅ [CHAT PROXY] Stopped chat connection for ${channelName}`);
          return res.json({
            success: true,
            message: "Chat connection stopped",
          });
        } catch (error: any) {
          console.error(`❌ [CHAT PROXY] Error disconnecting:`, error.message);
          activeChatClients.delete(channelName);
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: "No active connection for this channel",
        });
      }
    }

    return res.status(400).json({
      success: false,
      error: "Invalid action",
    });
  } catch (error: any) {
    console.error("❌ [CHAT PROXY] Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/twitch/chat", (req, res) => {
  const channelName = req.query.channel as string;

  if (!channelName) {
    return res.status(400).json({ error: "channel parameter required" });
  }

  console.log(`🔌 [CHAT SSE] Client connecting to channel: ${channelName}`);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  res.write(`data: ${JSON.stringify({ type: "connected", channel: channelName })}\n\n`);

  const listener = (data: string) => {
    try {
      res.write(`data: ${data}\n\n`);
    } catch (error) {
      console.error("Error sending SSE message:", error);
    }
  };

  const chatClient = activeChatClients.get(channelName);
  if (chatClient) {
    chatClient.listeners.add(listener);
    console.log(`➕ [CHAT SSE] Added listener for ${channelName}, total: ${chatClient.listeners.size}`);
  } else {
    console.log(`⚠️  [CHAT SSE] No chat client for channel: ${channelName}`);
  }

  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`:heartbeat\n\n`);
      console.log(`💓 [CHAT SSE] Heartbeat sent for ${channelName}`);
    } catch (error) {
      console.log(`Connection closed for ${channelName}`);
      clearInterval(heartbeatInterval);
    }
  }, 30000);

  req.on("close", () => {
    const client = activeChatClients.get(channelName);
    if (client) {
      client.listeners.delete(listener);
      console.log(`➖ [CHAT SSE] Removed listener for ${channelName}, total: ${client.listeners.size}`);
    }
    clearInterval(heartbeatInterval);
  });
});

// 404 handler for API routes
app.all("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.url}`,
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    // SPA fallback for production: serve index.html for any unknown routes
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  startServer();
}
