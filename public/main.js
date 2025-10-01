// main.js
// Creates a singleton socket and exposes it as window.__hq_socket
// so other front-end pages can just use `const socket = window.__hq_socket;`

(function () {
  if (window.__hq_socket) return;
  const socket = io(); // connects to same origin
  window.__hq_socket = socket;

  // Optional: basic logging
  socket.on('connect', () => {
    console.log('Connected to queue socket, id=', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from socket');
  });
})();
