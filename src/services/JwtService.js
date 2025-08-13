import jwt from "jsonwebtoken";
import { Config } from "../config/index.js";

class JwtService {
  static sign(payload, expiry = "7d", secret = Config.JWT_SECRET) {
    return jwt.sign(payload, secret, { expiresIn: expiry });
  }

  static verify(token, secret = Config.JWT_SECRET) {
    return jwt.verify(token, secret);
  }
}

export default JwtService;
