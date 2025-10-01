const socket = io();
const createBtn = document.getElementById("createBtn");
const queueCodeEl = document.getElementById("queueCode");
const queueBody = document.getElementById("queueBody");

let currentCode = null;

// Restore queue code if saved
const savedCode = localStorage.getItem("teacherQueueCode");
if (savedCode) attachToQueue(savedCode);

createBtn.onclick = () => socket.emit("queue:create");

socket.on("queue:created", (code) => {
  localStorage.setItem("teacherQueueCode", code);
  attachToQueue(code);
});

function attachToQueue(code) {
  currentCode = code;
  queueCodeEl.textContent = code;

  socket.offAny();
  socket.on(`queue:update:${code}`, renderQueue);

  // Fetch current state
  socket.emit("queue:get", code);
}

function renderQueue(entries) {
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
