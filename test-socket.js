import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Connected to server with ID:", socket.id);
  socket.emit("join_team_game", { roomId: "test-room", name: "Streamer", gameType: "teamfeud" });
});

socket.on("team_game_state", (state) => {
  console.log("Received team_game_state:", state);
  process.exit(0);
});

socket.on("connect_error", (err) => {
  console.error("Connection error:", err);
  process.exit(1);
});

setTimeout(() => {
  console.error("Timeout waiting for state");
  process.exit(1);
}, 5000);
