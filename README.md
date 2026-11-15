# Huddle

A real-time chat app built with the MERN stack and Socket.io as a portfolio project. Users sign up, join a room and talk with everyone in it live, with message history and an online users list.

**Live demo:** https://chat-app-roan-zeta-79.vercel.app
**API health check:**  https://chat-app-api-iada.onrender.com/api/health

> **Demo project.** Sign up with any email, for example `demo@example.com`. No verification email is sent. Please don't enter personal data, and open the link in two windows (one normal, one private) to see messages arrive live.

> The API runs on a free hosting tier, so the first request after a period of inactivity can take up to a minute while the server wakes up.

## Screenshots

| Sign up | Chat room |
|---|---|
| ![Sign up](screenshots/signup.png) | ![Chat room](screenshots/chat.png) |

## Features

- Sign up and log in with JWT authentication and bcrypt-hashed passwords
- Three chat rooms (general, javascript, random); switching rooms loads that room's history
- Messages are delivered instantly to everyone in the room over WebSockets (Socket.io)
- Messages are saved in MongoDB; the last 50 are loaded when you open a room
- Live "Online" list for the current room
- Connection status indicator (connecting, online, reconnecting)
- Sockets are authenticated: the server rejects connections without a valid token
- Server-side checks: room whitelist, 500-character limit, empty messages ignored and basic flood protection
- Responsive layout

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Context API, socket.io-client, plain CSS |
| Backend | Node.js, Express, Socket.io |
| Database | MongoDB Atlas with Mongoose |
| Auth | JSON Web Tokens, bcryptjs |
| Hosting | Vercel (client), Render (server) |

## Run it locally

Requirements: Node.js and a free MongoDB Atlas cluster.

```bash
git clone https://github.com/vaishnavibt123-droid/chat-app.git
cd chat-app

# server
cd server
npm install
# create server/.env (see below), then:
npm run dev        # http://localhost:5002

# client (in a second terminal)
cd client
npm install
# create client/.env (see below)
npm run dev        # http://localhost:5173
```

`server/.env` (names only, never commit real values):

```
MONGO_URI=
JWT_SECRET=
PORT=5002
```

`client/.env`:

```
VITE_API_URL=http://localhost:5002/api
VITE_SOCKET_URL=http://localhost:5002
```

## How it works

- The client logs in over REST and receives a JWT.
- It then opens a Socket.io connection, sending the token in the handshake. A server middleware verifies it before allowing the connection.
- `join` puts the socket in a room; `send` validates and saves the message, then broadcasts it to that room with `io.to(room).emit`.
- Presence is recalculated on join, leave and disconnect and broadcast to the room.

## API overview

| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/signup` | Create an account |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Current user (auth) |
| GET | `/api/rooms` | List rooms (auth) |
| GET | `/api/rooms/:room/messages` | Last 50 messages in a room (auth) |

Socket events: `join`, `send` (client to server); `message`, `presence` (server to client).

## Project structure

```
chat-app/
  client/            React app (chat UI, auth context, styles)
  server/
    models/          User, Message
    routes/          auth, rooms
    middleware/      JWT auth
    index.js         Express + Socket.io server
```

## What I learned

- How WebSockets differ from normal HTTP requests, and how to use Socket.io rooms
- Authenticating socket connections with JWT
- Keeping client state in sync with events from the server
- Deploying a WebSocket server on a free hosting tier

## Possible next steps

- Typing indicator
- Image and file sharing
- Private direct messages
- Tests for the API and socket events
