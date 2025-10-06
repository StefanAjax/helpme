// Simple modal system for displaying messages
// Usage: showModal('Message text')

function showModal(message) {
  let modal = document.getElementById("customModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "customModal";
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
          <div class="mb-4 text-lg">${message}</div>
          <button id="closeModalBtn" class="bg-red-500 text-white px-4 py-2 rounded">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById("closeModalBtn").onclick = () => {
      modal.remove();
    };
  }
}

window.showModal = showModal;
