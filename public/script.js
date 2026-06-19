const socket = io();
const container = document.getElementById("container");

socket.on("server:checkbox:change", (data) => {
  console.log(`socket server event`, data);
  const { index, checked } = data;
  const input = document.getElementById(`checkbox-${index}`);
  if (input) {
    input.checked = checked;
  }
});

window.addEventListener("load", async () => {
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
      });

      container.appendChild(input);
    });
  }
});
