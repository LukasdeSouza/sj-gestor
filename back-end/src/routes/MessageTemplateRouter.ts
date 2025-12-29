import MessageTemplateController from "../controllers/MessageTemplateController";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { wrapException } from "../utils/wrapException";
import express from "express";

const router = express.Router();

router
  .get("/message_templates", AuthMiddleware, wrapException(MessageTemplateController.listMessageTemplates))
  .post("/message_templates", AuthMiddleware, wrapException(MessageTemplateController.createMessageTemplates))
  .patch("/message_templates/:id", AuthMiddleware, wrapException(MessageTemplateController.alterMessageTemplates))
  .delete("/message_templates/:id", AuthMiddleware, wrapException(MessageTemplateController.deleteMessageTemplates))
  .get("/message_templates/:id", AuthMiddleware, wrapException(MessageTemplateController.findMessageTemplates));

export default router;
