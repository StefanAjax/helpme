const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static assets like main.js, css, etc.
app.use(express.static(path.join(__dirname, 'public')));

// --- Routes ---
// Student view -> /
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student.html'));
});

// Teacher view -> /teach
app.get('/teach', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'teacher.html'));
});

// Store multiple queues
// queues = { CODE: { code: "AB12", entries: [], nextId: 1 } }
let queues = {};

// Utility: random 4-char code
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

io.on('connection', (socket) => {
  console.log('socket connected:', socket.id);

  // Teacher creates a new queue
  socket.on('queue:create', () => {
    let code;
    do {
      code = generateCode();
    } while (queues[code]); // avoid duplicates

    queues[code] = { code, entries: [], nextId: 1 };
    socket.emit('queue:created', code);
    console.log('New queue created with code:', code);
  });

// Student joins queue
socket.on('queue:add', ({ code, name }) => {
  code = String(code || '').trim().toUpperCase();
  name = String(name || '').trim();

  if (!code || !name) {
    socket.emit('queue:error', { message: 'Fyll i både kö-id och namn.' });
    return;
  }

  if (!queues[code]) {
    socket.emit('queue:error', { message: 'Felaktigt kö-id.' });
    return;
  }

  const q = queues[code];

  // --- Check if student already has an entry in this queue ---
  const existing = q.entries.find(e => e.socketId === socket.id);
  if (existing) {
    socket.emit('queue:error', { message: 'Du står redan i denna kö.' });
    return;
  }

  const entry = {
    id: q.nextId++,
    name,
    timestamp: Date.now(),
    socketId: socket.id
  };
  q.entries.push(entry);

  io.emit(`queue:update:${code}`, q.entries);
  console.log(`Added to queue ${code}:`, entry);
});

// Student removes themselves
socket.on('queue:remove:self', ({ code, id }) => {
  const q = queues[code];
  if (!q) return;

  const index = q.entries.findIndex(e => e.id === Number(id));
  if (index === -1) return;

  const entry = q.entries[index];
  if (entry.socketId !== socket.id) {
    socket.emit('queue:error', { message: 'You can only remove your own entry.' });
    return;
  }

  q.entries.splice(index, 1);
  io.emit(`queue:update:${code}`, q.entries);
  console.log(`Student removed themselves from queue ${code}:`, entry);
});

  // Teacher removes student from queue
  socket.on('queue:remove', ({ code, id }) => {
    const q = queues[code];
    if (!q) return;
    const index = q.entries.findIndex((e) => e.id === Number(id));
    if (index !== -1) {
      const removed = q.entries.splice(index, 1)[0];
      io.emit(`queue:update:${code}`, q.entries);
      console.log(`Removed from queue ${code}:`, removed);
    }
  });

  // Teacher clears queue
  socket.on('queue:clear', (code) => {
    const q = queues[code];
    if (!q) return;
    q.entries = [];
    io.emit(`queue:update:${code}`, q.entries);
    console.log(`Cleared queue ${code}`);
  });

  // Teacher requests current state of a queue
socket.on('queue:get', (code) => {
  if (queues[code]) {
    socket.emit(`queue:update:${code}`, queues[code].entries);
  } else {
    socket.emit('queue:error', { message: 'Queue not found' });
  }
});

  socket.on('disconnect', () => {
    console.log('socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});