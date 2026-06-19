import http from "node:http";
import path from "node:path";
import express from "express";
import { Server } from "socket.io";
import { publisher, subscriber } from "./redis-connection.js";

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

  await subscriber.subscribe("internal-server:checkbox:change");
  subscriber.on("message", (channel, data) => {
    if (channel === "internal-server:checkbox:change") {
      const { index, checked } = JSON.parse(data);
      state.checkboxes[index] = checked;
      io.emit("server:checkbox:change", { index, checked });
    }
  });

  io.on("connection", (socket) => {
    console.log("socket connected", { id: socket.id });

    socket.on("client:checkbox:change", async (data) => {
      console.log(`[socket:${socket.id}]:client:checkbox:change`, data);

      await publisher.publish(
        "internal-server:checkbox:change",
        JSON.stringify(data),
      );
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
