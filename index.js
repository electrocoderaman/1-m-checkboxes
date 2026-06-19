import http from "node:http";

import express from "express";

async function main() {
  const app = express();
  app.use(express.json());
  const server = http.createServer(app);
  const PORT = process.env.PORT ?? 8080;

  app.get("/", (_, res) => res.json({ message: "aur bhai fir se yhi" }));

  app.get("/health", (_, res) =>
    res.json({ message: "everything is working fine", healthy: true }),
  );

  server.listen(PORT, () => {
    console.log(`server is running on  http://localhost:${PORT}`);
  });
}

main();
