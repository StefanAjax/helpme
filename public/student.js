const socket = io();
const nameInput = document.getElementById("name");
const codeInput = document.getElementById("code");
const joinBtn = document.getElementById("joinBtn");
const queueList = document.getElementById("queueList");

let currentCode = null;
let myEntryId = null;

// Load persisted name
const savedName = localStorage.getItem("studentName");
if (savedName) nameInput.value = savedName;

const form = document.getElementById("queueForm");
const codeField = document.getElementById("code");

form.onsubmit = (e) => {
  e.preventDefault(); // Prevent page reload

  const code = codeInput.value.trim().toUpperCase();
  const name = nameInput.value.trim();

  if (!code || !name) {
    alert("Ange både namn och kö-ID.");
    return;
  }

  localStorage.setItem("studentName", name);

  // Leave previous queue room if exists
  if (currentCode) {
    socket.emit("queue:leave", currentCode);
    socket.off("queue:update");
  }

  currentCode = code;

  // Join the new queue
  socket.emit("queue:add", { code, name });

  // Listen to updates for this queue
  socket.on("queue:update", renderQueue);
};

function renderQueue(entries) {
  if (!entries.length) {
    queueList.innerHTML = '<div class="italic text-gray-500">Kön är tom</div>';
    myEntryId = null;
    return;
  }

  queueList.innerHTML = entries
    .map((e) => {
      const selfButton =
        e.socketId === socket.id
          ? `<button class="ml-2 text-red-500 hover:text-red-700 font-medium" onclick="removeSelf(${e.id})">Ta bort mig</button>`
          : "";
      if (e.socketId === socket.id) myEntryId = e.id;
      return `<div class="flex justify-between items-center bg-white border border-gray-200 rounded px-3 py-2 shadow-sm">
                  <span><b>${e.name}</b></span>
                  ${selfButton}
                </div>`;
    })
    .join("");
}

function removeSelf(id) {
  if (!currentCode) return;
  socket.emit("queue:remove:self", { code: currentCode, id });
}

socket.on("queue:error", (err) => {
  codeField.value = "";
  queueList.innerHTML = "Väntar på kö-ID…";
  currentCode = null;
  alert(err.message);
});
