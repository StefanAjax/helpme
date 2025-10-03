const socket = io();
// Persistent teacher ID
function getTeacherId() {
  let id = localStorage.getItem('teacherId');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
    localStorage.setItem('teacherId', id);
  }
  return id;
}
const teacherId = getTeacherId();
const createBtn = document.getElementById("createBtn");
const queueCodeEl = document.getElementById("queueCode");
const queueBody = document.getElementById("queueBody");

let currentCode = null;
let currentQueueEntries = [];

// Restore queue code if saved
const savedCode = localStorage.getItem("teacherQueueCode");
if (savedCode) attachToQueue(savedCode);


createBtn.onclick = () => {
  if (currentQueueEntries.length > 0) {
    const confirmNew = confirm(
      "Kön innehåller fortfarande elever. Vill du verkligen skapa en ny kö? Detta kommer rensa den nuvarande kön."
    );
    if (!confirmNew) return;
  }
  socket.emit("queue:create", { teacherId });
};

socket.on("queue:created", (code) => {
  localStorage.setItem("teacherQueueCode", code);
  attachToQueue(code);
});

function attachToQueue(code) {
  currentCode = code;
  queueCodeEl.textContent = code;

  // Leave any old queue room and stop listening
  socket.off("queue:update");

  // Join new queue room updates
  socket.on("queue:update", renderQueue);

  // Rejoin the queue room to receive live updates
  socket.emit("queue:get", code); // fetch current state
  socket.emit("queue:join:teacher", { code, teacherId });
}

function renderQueue(entries) {
  currentQueueEntries = entries; // keep track of current entries

  if (!entries.length) {
    queueBody.innerHTML =
      '<tr><td colspan="4" class="text-center py-4 text-gray-500">Kön är tom</td></tr>';
    return;
  }

  queueBody.innerHTML = entries
    .map(
      (e, i) => `
        <tr class="hover:bg-gray-50">
          <td class="px-4 py-2 border-b">${i + 1}</td>
          <td class="px-4 py-2 border-b">${e.name}</td>
          <td class="px-4 py-2 border-b">
            <button onclick="removeEntry(${
              e.id
            })" class="text-red-500 hover:text-red-700 font-medium">Ta bort</button>
          </td>
        </tr>
      `
    )
    .join("");
}

window.removeEntry = (id) => {
  if (!currentCode) return;
  socket.emit("queue:remove", { code: currentCode, id, teacherId });
};

socket.on("queue:error", (err) => alert(err.message));
