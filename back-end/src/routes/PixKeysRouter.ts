import PixKeyController from "../controllers/PixKeyController";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { wrapException } from "../utils/wrapException";
import express from "express";

const router = express.Router();

router
  .get("/pix_keys", AuthMiddleware, wrapException(PixKeyController.listPixKeys))
  .post("/pix_keys", AuthMiddleware, wrapException(PixKeyController.createPixKey))
  .patch("/pix_keys/:id", AuthMiddleware, wrapException(PixKeyController.alterPixKey))
  .delete("/pix_keys/:id", AuthMiddleware, wrapException(PixKeyController.deletePixKey))
  .get("/pix_keys/:id", AuthMiddleware, wrapException(PixKeyController.findPixKey));

export default router;
