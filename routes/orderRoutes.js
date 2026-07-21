import express from "express";
import * as orderController from "../controllers/orderController.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

router.use(authController.protect);

router
  .route("/")
  .get(orderController.getAllOrders)
  .post(
    authController.restrictTo("customer", "admin"),
    orderController.createOrder,
  );

router
  .route("/:id")
  .get(orderController.getOrder)
  .patch(authController.restrictTo("admin"), orderController.updateOrderStatus)
  .delete(
    authController.restrictTo("customer", "admin"),
    orderController.cancelOrder,
  );

export default router;
