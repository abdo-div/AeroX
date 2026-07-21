import express from "express";
import * as checkoutController from "../controllers/checkoutController.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

router.use(authController.protect);

router.post(
  "/create-session",
  authController.restrictTo("customer", "admin"),
  checkoutController.createCheckoutSession,
);

export default router;

// Webhook is exported separately (needs raw body, no auth)
export const webhookRouter = express.Router();
webhookRouter.post(
  "/",
  express.raw({ type: "application/json" }),
  checkoutController.stripeWebhook,
);
