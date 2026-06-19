import http from "node:http";
import path from "node:path";
import express from "express";
import { Server } from "socket.io";

const CHECKBOX_SIZE = 100;
const state = {
  checkboxes: new Array(CHECKBOX_SIZE).fill(false),
};

async function main() {
  const app = express();
  const server = http.createServer(app);

  const PORT = process.env.PORT ?? 8080;

  const io = new Server();
  io.attach(server);

  io.on("connection", (socket) => {
    console.log("socket connected", { id: socket.id });

    socket.on("client:checkbox:change", (data) => {
      console.log(`[socket:${socket.id}]:client:checkbox:change`, data);
      io.emit("server:checkbox:change", data);
      state.checkboxes[data.index] = data.checked;
    });
  });

  app.use(express.json());
  app.use(express.static(path.resolve("./public")));

  app.get("/health", (_, res) =>
    res.json({ message: "everything is working fine", healthy: true }),
  );

  app.get("/checkboxes", (req, res) => {
    return res.json({ checkboxes: state.checkboxes });
  });

  server.listen(PORT, () => {
    console.log(`server is running on  http://localhost:${PORT}`);
  });
}

main();
