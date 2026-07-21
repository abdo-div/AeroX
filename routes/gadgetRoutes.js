import express from "express";
import * as gadgetController from "../controllers/gadgetController.js";
import * as authController from "../controllers/authController.js";
import reviewRouter from "./reviewRoutes.js";

const router = express.Router();

router.use((req, res, next) => {
  console.log("🔥 GADGET ROUTER HIT:", req.originalUrl);
  next();
});

// 🔗 NESTED ROUTE: Redirect gadget-specific review requests directly to the review router
router.use("/:gadgetId/reviews", reviewRouter);

// ==========================================
// 🚀 SPECIAL ALIAS & AGGREGATION ROUTES
// ==========================================
router
  .route("/top-5-premium")
  .get(gadgetController.aliasTopPremium, gadgetController.getAllGadgets);

router.route("/gadget-stats").get(
  // authController.protect,
  // authController.restrictTo("admin", "moderator"),
  gadgetController.getGadgetStats,
);

// ==========================================
// 🗺️ GENERAL GADGET CRUD ROUTES
// ==========================================
router.route("/").get(gadgetController.getAllGadgets).post(
  // authController.protect,
  // authController.restrictTo("admin"),
  gadgetController.uploadGadgetImages,
  gadgetController.resizeGadgetImages,
  gadgetController.createGadget,
);

router
  .route("/:id")
  .get(gadgetController.getGadget)
  .patch(
    // authController.protect,
    //  authController.restrictTo("admin"),
    gadgetController.uploadGadgetImages,
    gadgetController.resizeGadgetImages,
    gadgetController.updateGadget,
  )
  .delete(
    //  authController.protect,
    // authController.restrictTo("admin"),
    gadgetController.deleteGadget,
  );

export default router;
