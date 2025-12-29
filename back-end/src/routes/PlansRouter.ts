import PlansController from "../controllers/PlansController";
import { Router } from "express";

const router = Router();

router.get("/plans", PlansController.list);

export default router;

