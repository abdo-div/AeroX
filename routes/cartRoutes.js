import express from "express";
import * as cartController from "../controllers/cartController.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

router.use(authController.protect); // Direct protection context

router.route("/").get(cartController.getMyCart).post(cartController.addToCart);

router
  .route("/item/:itemId")
  .patch(cartController.updateCartItemQuantity)
  .delete(cartController.removeFromCart);

export default router;
