const socket = io();
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
  socket.emit("queue:create");
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

  // Fetch current state
  socket.emit("queue:get", code);
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
  socket.emit("queue:remove", { code: currentCode, id });
};

socket.on("queue:error", (err) => alert(err.message));
