import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { api } from "../api";
import { useAuth } from "../AuthContext";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5002";
const ROOMS = ["general", "javascript", "random"];

export default function Chat() {
  const { token, user } = useAuth();
  const [room, setRoom] = useState("general");
  const [messages, setMessages] = useState([]);
  const [online, setOnline] = useState([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const roomRef = useRef(room);
  const bottomRef = useRef(null);

  roomRef.current = room;

  // connect once
  useEffect(() => {
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("online");
      socket.emit("join", roomRef.current);
    });
    socket.on("disconnect", () => setStatus("reconnecting"));
    socket.on("connect_error", () => setStatus("offline"));
    socket.on("message", msg => {
      if (msg.room === roomRef.current) setMessages(m => [...m, msg]);
    });
    socket.on("presence", data => {
      if (data.room === roomRef.current) setOnline(data.users);
    });

    return () => socket.disconnect();
  }, [token]);

  // change room: join + load history
  useEffect(() => {
    setMessages([]);
    setOnline([]);
    setError("");
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("join", room);
    }
    api(`/rooms/${room}/messages`, { token })
      .then(setMessages)
      .catch(err => setError(err.message));
  }, [room, token]);

  // scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = e => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean || !socketRef.current) return;
    socketRef.current.emit("send", { room, text: clean });
    setText("");
  };

  const time = iso =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <main className="chat">
      <aside className="rooms">
        <h3>Rooms</h3>
        {ROOMS.map(r => (
          <button
            key={r}
            className={"room" + (r === room ? " active" : "")}
            onClick={() => setRoom(r)}
          >
            # {r}
          </button>
        ))}
        <h3 className="online-title">Online ({online.length})</h3>
        <ul className="online">
          {online.map(n => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <small className={"status " + status}>{status}</small>
      </aside>

      <section className="pane">
        <div className="pane-head"># {room}</div>
        <div className="messages">
          {error && <p className="error">{error}</p>}
          {messages.length === 0 && !error && (
            <p className="empty">No messages yet. Say hello!</p>
          )}
          {messages.map(m => (
            <div
              key={m._id}
              className={"bubble" + (m.userName === user.name ? " mine" : "")}
            >
              <div className="meta">
                <strong>{m.userName}</strong> <span>{time(m.createdAt)}</span>
              </div>
              <div>{m.text}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <form className="composer" onSubmit={send}>
          <input
            placeholder={`Message #${room}`}
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={500}
          />
          <button className="primary">Send</button>
        </form>
      </section>
    </main>
  );
}