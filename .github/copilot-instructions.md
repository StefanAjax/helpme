# Copilot Instructions for help-queue

## Project Overview
This is a real-time help queue web app for classrooms, built with Node.js, Express, and Socket.IO. It provides separate views for students and teachers, allowing students to join a queue and teachers to manage it. The frontend is vanilla JS/HTML/CSS (Tailwind via CDN).

## Architecture
- **Backend (`server.js`)**: Express server with Socket.IO for real-time communication. Manages multiple queues, each identified by a 4-character code. Queues are stored in-memory.
- **Frontend (`public/`)**: Contains separate HTML/JS files for student and teacher views. Both connect to the backend via Socket.IO.
- **Entry Points**:
  - `/` → `student.html` (student queue UI)
  - `/teach` or `/teacher` → `teacher.html` (teacher queue management UI)


## Key Patterns & Conventions
- **Queue Codes**: 4-character, randomly generated, uppercase, excluding ambiguous characters.
- **Persistent Teacher Identity**: Teachers are identified by a UUID stored in `localStorage` (`teacherId`). All teacher actions send this ID to the backend, allowing teachers to reconnect to their queue after refresh or tab reopen. Backend associates queues with this persistent ID, not socket ID.
- **Socket Events**:
  - Students: `queue:add`, `queue:remove:self`, `queue:update`, `queue:error`
  - Teachers: `queue:create` (payload: `{ teacherId }`), `queue:remove` (payload: `{ code, id, teacherId }`), `queue:clear` (payload: `{ code, teacherId }`), `queue:get`, `queue:update`, `queue:error`
- **Frontend Socket**: Always use `window.__hq_socket` (from `main.js`) for socket communication.
- **State Persistence**: Frontend uses `localStorage` for persisting student name, teacher queue code, and teacherId.
- **Error Handling**: Errors are sent via `queue:error` socket event and displayed as alerts in the UI.
- **No Database**: All queue data is stored in-memory; restarting the server clears all queues.

## Developer Workflows
- **Start Server**: `npm start` (runs `server.js`)
- **Debugging**: Console logs in both backend and frontend provide real-time feedback on queue actions and socket connections.
- **No Tests**: There are currently no automated tests or test scripts.
- **Static Assets**: Served from `/public` via Express static middleware.

## External Dependencies
- `express` (web server)
- `socket.io` (real-time communication)
- `tailwindcss` (CDN only, for styling)

## Examples
- To add a student to a queue:
  ```js
  socket.emit('queue:add', { code: 'AB12', name: 'Alice' });
  ```
- To create a new queue (teacher):
  ```js
  socket.emit('queue:create');
  ```

## Important Files
- `server.js`: Backend logic and socket event handling
- `public/student.js`, `public/teacher.js`: Frontend logic for each role
- `public/main.js`: Singleton socket setup
- `public/student.html`, `public/teacher.html`: UI for each role

## Conventions
- All socket event names and payloads should match those in `server.js`.
- UI updates are driven by `queue:update` events.
- Only teachers can create/clear queues and remove students; students can only remove themselves.

---
For questions about project structure or conventions, review `server.js` and the relevant frontend JS files in `public/`.
