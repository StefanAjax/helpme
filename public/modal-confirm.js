// Modal confirm system
// Usage: showConfirm(message, callback)

function showConfirm(message, callback) {
  let modal = document.getElementById("customConfirmModal");
  if (modal) modal.remove();
  modal = document.createElement("div");
  modal.id = "customConfirmModal";
  modal.innerHTML = `
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
        <div class="mb-4 text-lg">${message}</div>
        <div class="flex justify-center gap-4">
          <button id="confirmYesBtn" class="bg-green-500 text-white px-4 py-2 rounded">Ja</button>
          <button id="confirmNoBtn" class="bg-gray-400 text-white px-4 py-2 rounded">Nej</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById("confirmYesBtn").onclick = () => {
    modal.remove();
    callback(true);
  };
  document.getElementById("confirmNoBtn").onclick = () => {
    modal.remove();
    callback(false);
  };
}

window.showConfirm = showConfirm;
