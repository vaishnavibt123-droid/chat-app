require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const User = require("./models/User");
const Message = require("./models/Message");
const ROOMS = require("./rooms");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/rooms", require("./routes/rooms"));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Only logged-in users may connect
io.use(async (socket, next) => {
  try {
    const payload = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return next(new Error("Unauthorized"));
    socket.data.user = { id: String(user._id), name: user.name };
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

async function sendPresence(room) {
  try {
    const sockets = await io.in(room).fetchSockets();
    const users = [...new Set(sockets.map(s => s.data.user.name))];
    io.to(room).emit("presence", { room, users });
  } catch (err) {
    console.error("presence error:", err.message);
  }
}

io.on("connection", socket => {
  let lastSent = 0;

  socket.on("join", room => {
    if (!ROOMS.includes(room)) return;
    for (const r of [...socket.rooms]) {
      if (r !== socket.id && r !== room) {
        socket.leave(r);
        sendPresence(r);
      }
    }
    socket.join(room);
    sendPresence(room);
  });

  socket.on("send", async (data = {}) => {
    try {
      const now = Date.now();
      if (now - lastSent < 300) return; // simple flood protection
      lastSent = now;

      const { room, text } = data;
      if (!ROOMS.includes(room) || !socket.rooms.has(room)) return;
      const clean = String(text || "").trim().slice(0, 500);
      if (!clean) return;

      const msg = await Message.create({
        room,
        user: socket.data.user.id,
        userName: socket.data.user.name,
        text: clean,
      });
      io.to(room).emit("message", msg);
    } catch (err) {
      console.error("send error:", err.message);
    }
  });

  socket.on("disconnecting", () => {
    for (const r of socket.rooms) {
      if (r !== socket.id) setTimeout(() => sendPresence(r), 0);
    }
  });
});

const PORT = process.env.PORT || 5002;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });