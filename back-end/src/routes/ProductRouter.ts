import ProductController from "../controllers/ProductController";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { wrapException } from "../utils/wrapException";
import express from "express";

const router = express.Router();

router
  .get("/products", AuthMiddleware, wrapException(ProductController.listProducts))
  .post("/products", AuthMiddleware, wrapException(ProductController.createProduct))
  .patch("/products/:id", AuthMiddleware, wrapException(ProductController.alterProduct))
  .delete("/products/:id", AuthMiddleware, wrapException(ProductController.deleteProduct))
  .get("/products/:id", AuthMiddleware, wrapException(ProductController.findProduct));

export default router;
