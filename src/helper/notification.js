import logger from "../config/logger.js";
// import Firebase from "../firebase/index.js";

export const notification = async ({ title, body, to }) => {
  try {
    if (!to) return;

    // Firebase notifications disabled - not needed for now
    // const response = await Firebase.messaging().send({
    //   token: to,
    //   notification: {
    //     title: title,
    //     body: body,
    //   },
    //   data: {
    //     title: title,
    //     message: body,
    //   },
    // });

    // logger.info(response, "response from Firebase");
    
    // Log notification attempt instead of sending
    logger.info(`Notification disabled - would have sent: "${title}" to token: ${to ? to.substring(0, 10) + '...' : 'no token'}`);
    console.log(`📱 Notification (disabled): "${title}" - "${body}"`);
  } catch (error) {
    logger.error(error.message);
  }
};
