import whatsappController from "../controllers/whatsappController";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import express from "express";

const router = express.Router();

router
  .post("/connect", AuthMiddleware, whatsappController.startConnection)
  .get("/connect", AuthMiddleware, whatsappController.findConnection)

  .get("/events/:sessionId", whatsappController.whatsappEvents)
  .patch("/disconnect/:sessionId", whatsappController.disconnect);

export default router;
