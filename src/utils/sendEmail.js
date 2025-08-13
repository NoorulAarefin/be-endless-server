import nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import path from "path";
import logger from "../config/logger.js";
import { Config } from "../config/index.js";

const sendEmail = async ({ data }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: Config.HOST,
      service: Config.SERVICE,
      port: Number(Config.EMAIL_PORT),
      secure: Boolean(Config.SECURE),
      auth: {
        user: Config.USERID,
        pass: Config.PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // point to the template folder
    const handlebarOptions = {
      viewEngine: {
        partialsDir: path.resolve("./src/views/"),
        defaultLayout: false,
      },
      viewPath: path.resolve("./src/views/"),
      // Set the allowProtoPropertiesByDefault option to true
      allowProtoPropertiesByDefault: true,
    };

    // use a template file with nodemailer
    transporter.use("compile", hbs(handlebarOptions));

    if (data.sub === "verifyEmail") {
      var mailOptions = {
        from: Config.USERID,
        to: data.email,
        subject: data.subject,
        template: "email", // the name of the template file i.e email.handlebars
        context: {
          otp: data.otp,
          name: data.name,
        },
        attachments: [
          {
            filename: "twira-1.png",
            path: path.resolve("./src/public/twira-1.png"),
            cid: "Twira01",
          },
        ],
      };
    }
    // trigger the sending of the E-mail
    // eslint-disable-next-line no-unused-vars
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        logger.error(error.message);
        return logger.error("email not sent!");
      }
      logger.error("email sent successfully");
    });
  } catch (error) {
    logger.error("email not sent!");
    logger.error(error.message);
  }
};

export default sendEmail;
