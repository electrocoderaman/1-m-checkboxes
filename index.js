import http from "node:http";
import path from "node:path";
import express from "express";
import { Server } from "socket.io";
import { publisher, subscriber, redis } from "./redis-connection.js";

const CHECKBOX_SIZE = 100;
const CHECKBOX_STATE_KEY = "checkbox-state:v2";

const rateLimitHashMap = new Map();

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
      io.emit("server:checkbox:change", { index, checked });
    }
  });

  io.on("connection", (socket) => {
    console.log("socket connected", { id: socket.id });

    socket.on("client:checkbox:change", async (data) => {
      console.log(`[socket:${socket.id}]:client:checkbox:change`, data);

      const lastOperationTime = rateLimitHashMap.get(socket.id);
      if (lastOperationTime) {
        const timeElapsed = Date.now() - lastOperationTime;
        if (timeElapsed < 5 * 1000) {
          socket.emit("server:error", {
            error: `please wait for ${timeElapsed / 1000} seconds before trying`,
          });
          return;
        }
      }
      rateLimitHashMap.set(socket.id, Date.now());

      const existingData = await redis.get(CHECKBOX_STATE_KEY);

      if (existingData) {
        const remoteData = JSON.parse(existingData);
        remoteData[data.index] = data.checked;

        await redis.set(CHECKBOX_STATE_KEY, JSON.stringify(remoteData));
      } else {
        await redis.set(
          CHECKBOX_STATE_KEY,
          JSON.stringify(new Array(CHECKBOX_SIZE).fill(false)),
        );
      }

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

  app.get("/checkboxes", async (req, res) => {
    const existingData = await redis.get(CHECKBOX_STATE_KEY);
    if (existingData) {
      const remoteData = JSON.parse(existingData);
      return res.json({ checkboxes: remoteData });
    }
    return res.json({ checkboxes: new Array(CHECKBOX_SIZE).fill(false) });
  });

  server.listen(PORT, () => {
    console.log(`server is running on  http://localhost:${PORT}`);
  });
}

main();
