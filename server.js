
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static assets like main.js, css, etc.
app.use(express.static(path.join(__dirname, "public")));

// --- Routes ---
// Student view -> /
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "student.html"));
});

// Teacher view -> /teach
app.get("/teach", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "teacher.html"));
});

app.get("/teacher", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "teacher.html"));
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

// Sanitize user input: strip HTML tags and unsafe characters
function sanitize(str, type = "text") {
  str = String(str || "");
  // Remove HTML tags
  str = str.replace(/<[^>]*>/g, "");
  // Remove control characters
  str = str.replace(/[\x00-\x1F\x7F]/g, "");
  if (type === "code") {
    // Only allow uppercase letters and numbers
    str = str.replace(/[^A-Z0-9]/g, "");
  } else {
    // Allow letters, numbers, spaces, and .,-'
    str = str.replace(/[^\w .,'-]/g, "");
  }
  return str;
}

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  // Teacher creates a new queue
  socket.on("queue:create", ({ teacherId }) => {
    if (!teacherId) {
      socket.emit("queue:error", { message: "Missing teacherId" });
      return;
    }
    // Remove any existing queue created by this teacher
    for (const code in queues) {
      const q = queues[code];
      if (q.teacherId === teacherId) {
        // Notify students in this queue that it is closed
        q.entries.forEach((entry) => {
          io.to(entry.socketId).emit("queue:error", {
            message:
              "Den gamla kön har stängts. Ange ny kökod för att delta igen.",
          });
        });
        delete queues[code]; // remove old queue
      }
    }

    // Generate new queue code
    let code;
    do {
      code = generateCode();
    } while (queues[code]);

    queues[code] = { code, entries: [], nextId: 1, teacherId };
    socket.join(code); // Teacher joins their own queue room
    socket.emit("queue:created", code);
    console.log("New queue created with code:", code);
  });

  // Student joins queue
  socket.on("queue:add", ({ code, name }) => {
    code = sanitize(code, "code").trim().toUpperCase();
    name = sanitize(name, "text").trim();

    if (!code || !name) {
      socket.emit("queue:error", { message: "Fyll i både kö-id och namn." });
      return;
    }
    if (name.length > 32) {
      socket.emit("queue:error", { message: "Namnet får max vara 32 tecken." });
      return;
    }

    const q = queues[code];
    if (!q) {
      socket.emit("queue:error", { message: "Felaktigt kö-id." });
      return;
    }

    // Check if student already has an entry
    if (q.entries.find((e) => e.socketId === socket.id)) {
      socket.emit("queue:error", { message: "Du står redan i denna kö." });
      return;
    }

    const entry = {
      id: q.nextId++,
      name,
      timestamp: Date.now(),
      socketId: socket.id,
    };
    q.entries.push(entry);

    socket.join(code); // Join the queue room
    io.to(code).emit("queue:update", q.entries);
    console.log(`Added to queue ${code}:`, entry);
  });

  // Student removes themselves
  socket.on("queue:remove:self", ({ code, id }) => {
    const q = queues[code];
    if (!q) return;

    const index = q.entries.findIndex((e) => e.id === Number(id));
    if (index === -1) return;

    const entry = q.entries[index];
    if (entry.socketId !== socket.id) {
      socket.emit("queue:error", {
        message: "You can only remove your own entry.",
      });
      return;
    }

    q.entries.splice(index, 1);
    io.to(code).emit("queue:update", q.entries);
    console.log(`Student removed themselves from queue ${code}:`, entry);
    console.log("Current queues:", queues);
  });

  // Teacher removes a student
  socket.on("queue:remove", ({ code, id, teacherId }) => {
    const q = queues[code];
    if (!q || q.teacherId !== teacherId) return; // Only teacher can remove

    const index = q.entries.findIndex((e) => e.id === Number(id));
    if (index !== -1) {
      const removed = q.entries.splice(index, 1)[0];
      io.to(code).emit("queue:update", q.entries);
      console.log(`Removed from queue ${code}:`, removed);
    }
  });

  // Teacher clears queue
  socket.on("queue:clear", ({ code, teacherId }) => {
    const q = queues[code];
    if (!q || q.teacherId !== teacherId) return; // Only teacher

    q.entries = [];
    io.to(code).emit("queue:update", q.entries);
    console.log(`Cleared queue ${code}`);
  });

  // Teacher requests current state of a queue
  socket.on("queue:get", (code) => {
    const q = queues[code];
    if (q) {
      socket.emit("queue:update", q.entries);
    } else {
      socket.emit("queue:error", { message: "Queue not found" });
    }
  });

  // Handle disconnect: remove student from any queue they were in
  socket.on("disconnect", () => {
    console.log("socket disconnected:", socket.id);

    for (const code in queues) {
      const q = queues[code];
      const index = q.entries.findIndex((e) => e.socketId === socket.id);
      if (index !== -1) {
        const removed = q.entries.splice(index, 1)[0];
        io.to(code).emit("queue:update", q.entries);
        console.log(
          `Removed disconnected student from queue ${code}:`,
          removed
        );
      }
    }
  });
      socket.on("queue:join:teacher", ({ code, teacherId }) => {
      const q = queues[code];
      if (q && q.teacherId === teacherId) {
        socket.join(code);
        socket.emit("queue:update", q.entries);
      } else {
        socket.emit("queue:error", { message: "Queue not found or unauthorized" });
      }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
