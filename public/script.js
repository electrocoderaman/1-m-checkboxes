const socket = io();
const container = document.getElementById("container");
const notification = document.getElementById("notification");
let hideTimeout;

function showError(message) {
  if (!notification) {
    console.error("Notification container is missing");
    return;
  }

  notification.innerHTML = "";

  const messageElement = document.createElement("div");
  messageElement.className = "notification-message notification-error visible";
  messageElement.setAttribute("role", "alert");
  messageElement.textContent = message || "An unknown server error occurred.";

  notification.appendChild(messageElement);
  console.error("Server error:", messageElement.textContent);

  clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => {
    messageElement.classList.remove("visible");
  }, 5000);
}

socket.on("server:checkbox:change", (data) => {
  console.log(`socket server event`, data);
  const { index, checked } = data;
  const input = document.getElementById(`checkbox-${index}`);
  if (input) {
    input.checked = checked;
  }
});

socket.on("server:error", (data) => {
  const errorMessage = data?.error || "Server error received.";
  showError(errorMessage);
});

async function fetchStateFromServer() {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const response = await fetch("/checkboxes");
  const data = await response.json();

  if (data && data.checkboxes) {
    data.checkboxes.forEach((serverValue, index) => {
      const input = document.createElement("input");

      input.type = "checkbox";
      input.id = `checkbox-${index}`;
      input.checked = serverValue;

      input.addEventListener("change", (e) => {
        const checked = e.target.checked;
        console.log("checkbox changed", { index, isChecked: checked });
        socket.emit("client:checkbox:change", { index, checked });
        fetchStateFromServer();
      });

      container.appendChild(input);
    });
  }
}

window.addEventListener("load", async () => {
  fetchStateFromServer();
});
