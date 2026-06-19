import http from "node:http";
import path from "node:path";
import express from "express";
import { Server } from "socket.io";

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
    });
  });

  app.use(express.json());
  app.use(express.static(path.resolve("./public")));

  app.get("/health", (_, res) =>
    res.json({ message: "everything is working fine", healthy: true }),
  );

  server.listen(PORT, () => {
    console.log(`server is running on  http://localhost:${PORT}`);
  });
}

main();
