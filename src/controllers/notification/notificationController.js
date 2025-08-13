import logger from "../../config/logger.js";
import { Notification } from "../../models/notification/notificationModel.js";

// <!-- ====== notification controller ====== -->
export const getNotifications = async (req, res, next) => {
  try {
    const data = await Notification.find({
      userId: req.user._id,
    });

    res.status(200).json({ data, success: true });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.body; // or req.params if using URL param
    
    // If id is provided, mark specific notification as read
    if (id) {
      const notification = await Notification.findOneAndUpdate(
        { _id: id, userId: req.user._id },
        { isRead: true },
        { new: true },
      );
      if (!notification) {
        return res
          .status(404)
          .json({ success: false, message: "Notification not found" });
      }
      return res.status(200).json({ success: true, data: notification });
    }
    
    // If no id provided, mark all unread notifications as read
    const result = await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );
    
    res.status(200).json({ 
      success: true, 
      message: `Marked ${result.modifiedCount} notifications as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};
