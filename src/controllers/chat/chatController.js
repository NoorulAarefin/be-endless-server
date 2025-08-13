// TEMPORARILY DISABLED: Chat functionality not required for this project
/*
import Joi from "joi";
import logger from "../../config/logger.js";
import { Chat } from "../../models/chatModel/chatModel.js";
import { Message } from "../../models/chatModel/messageModel.js";
import { User } from "../../models/authModel/userModel.js";
import { Notification } from "../../models/notification/notificationModel.js";
import { notification } from "../../helper/notification.js";

// <!-- ====== get chat controller ====== -->
export const getActiveChat = async (req, res, next) => {
  try {
    // Find all single chats for the current user in the specified project
    Chat.find({
      "users.userId": req.user._id,
    })
      .sort({ updatedAt: -1 }) // Sort chats by updatedAt in descending order
      .populate("users.userId", "fullName") // Populate user details for each user in the chat
      .populate("latestMessage")
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "fullName avatar email",
        });

        const updatedChats = results.map((chat) => ({
          ...chat.toObject(),
          users: chat.users.filter((user) => user.userId.id !== req.user._id),
        }));

        // Respond with the updated chats
        res.status(200).json(updatedChats);
      });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== send message controller ====== -->
export const sendMessage = async (req, res, next) => {
  // Validation using Joi for the request body
  const sendMessageSchema = Joi.object({
    content: Joi.string().required(),
    chatId: Joi.string().required(),
  });
  // Validate the request body against the defined schema
  const { error } = sendMessageSchema.validate(req.body);

  // If validation fails, return an error to the next middleware
  if (error) {
    return next(error);
  }

  // Extract content, chatId, and path from the request body
  const { content, chatId } = req.body;

  // Create a new message object
  var newMessage = {
    sender: req.user._id,
    content: content,
    chatId: chatId,
    readBy: [req.user._id],
  };

  try {
    // Create a new message in database
    var message = await Message.create(newMessage);

    // Populate additional information for sender, projectId, chat, and users
    message = await message.populate("sender", "fullName");
    message = await message.populate("chatId");
    message = await User.populate(message, {
      path: "chat.users",
      select: "fullName",
    });

    // Update the latest message of the chat with the newly created message
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    // Find the userId that is not equal to the sender's userId (req.user._id)
    const recipient = message.chatId.users.find(
      (user) => user.userId !== req.user._id,
    );

    if (recipient) {
      await new Notification({
        title: `New message from ${message.sender.fullName}`,
        body: `${message.content}`,
        userId: recipient.userId,
        isChat: true,
        chatId: chatId,
      }).save();
      // Send push notification to recipient
      const recipientUser = await User.findById(recipient.userId).select('fcmToken fullName');
      if (recipientUser && recipientUser.fcmToken) {
        await notification({
          title: `New message from ${message.sender.fullName}`,
          body: `${message.content}`,
          to: recipientUser.fcmToken,
        });
      }
    }

    // Respond with the data and path of the sent message
    // path is for notification msg redirect link
    res.status(200).json({ data: message });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== get all messages controller ====== -->
export const allMessages = async (req, res, next) => {
  try {
    // Retrieve messages from the database for the specified chatId
    const messages = await Message.find({ chatId: req.params.chatId })
      .populate("sender", "fullName avatar")
      .populate("chatId"); // Populate chat information

    // readBy messages for the current user in the specified chat
    await Message.updateMany(
      { chat: req.params.chatId, readBy: { $ne: req.user._id } },
      { $push: { readBy: req.user._id } },
    );

    res.status(200).json(messages);
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};
*/
