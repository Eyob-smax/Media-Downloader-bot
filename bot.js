import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

app.use(express.static("public"));

const io = new Server(httpServer);

io.on("connection", (socket) => {
  console.log("new user connected", socket.id);
  socket.emit("connect message", "now you are connected");

  socket.on("message", (data) => {
    socket.broadcast.emit("message", data);
  });
});
// ✅ Use httpServer instead of app.listen
httpServer.listen(8000, () => {
  console.log("Express + Socket.IO running on http://localhost:8000");
});
