import app from "./app.js";
import { connectDB } from "./config/database.js";
import logger from "./config/logger.js";
import { Server } from "socket.io";
// import { Message } from "./models/chatModel/messageModel.js"; // TEMPORARILY DISABLED - Chat functionality not required
import { Config } from "./config/index.js";

let server;

const startServer = async () => {
  await connectDB();

  // Prefer platform-provided PORT (e.g., Render), then env-configured, then local default
  const PORT = process.env.PORT || Config.PORT || 10000;

  try {
    server = app.listen(PORT, () => logger.info(`Server listening on ${PORT}`));
  } catch (error) {
    logger.error(error.message);
    // synchronous behavior ki wajah se ham ise settimeout mai procces ko exit karenge
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
};

startServer();

// socket.io config
const io = new Server(server, {
  pingTimeout: 60000,
});

io.on("connection", (socket) => {
  socket.on("setup", (userData) => {
    try {
      socket.join(userData._id);
      socket.emit("connected", "Socket connected");
    } catch (error) {
      logger.error(error);
    }
  });

  // TEMPORARILY DISABLED: Chat functionality not required for this project
  /*
  socket.on("join chat", async (room) => {
    try {
      socket.join(room);
    } catch (error) {
      logger.error(error);
    }
  });

  socket.on("new message", (newMessageData) => {
    try {
      const newMessageRecieved = newMessageData.data;

      var chat = newMessageRecieved.chatId;
      if (!chat.users) return logger.info("chat.users not defined");

      chat.users.forEach(async (user) => {
        if (user.userId == newMessageRecieved.sender._id) return;

        socket.to(user.userId).emit("message recieved", newMessageRecieved);
      });
    } catch (error) {
      logger.error(error);
    }
  });

  // Handle unread messages
  socket.on("markAsRead", async (receiveMsg) => {
    try {
      await Message.updateMany(
        { chat: receiveMsg.chatId, readBy: { $ne: receiveMsg.userId } },
        { $push: { readBy: receiveMsg.userId } },
      );
    } catch (error) {
      logger.error(error);
    }
  });
  */

  socket.off("setup", (userData) => {
    try {
      logger.info("USER DISCONNECTED");
      socket.leave(userData._id);
    } catch (error) {
      logger.error(error);
    }
  });
});
