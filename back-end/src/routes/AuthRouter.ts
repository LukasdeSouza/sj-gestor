import AuthController from "../controllers/AuthController";
import { wrapException } from "../utils/wrapException";
import express from "express";

const router = express.Router();

router
  .post("/auth/login", wrapException(AuthController.login))
  .post("/register", wrapException(AuthController.register));

export default router;