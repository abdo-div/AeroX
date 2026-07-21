import express from "express";
import * as componentController from "../controllers/componentController.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

// 🔓 Public Routes (Anyone can look up gaming components)
router.route("/").get(componentController.getAllComponents);

router.route("/:id").get(componentController.getComponent);

// 🔒 Protected & Restricted Routes (Admins Only)
router.use(authController.protect);
router.use(authController.restrictTo("admin"));

router.route("/").post(componentController.createComponent);

router
  .route("/:id")
  .patch(componentController.updateComponent)
  .delete(componentController.deleteComponent);

export default router;
