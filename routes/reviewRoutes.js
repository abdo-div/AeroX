import express from "express";
import * as reviewController from "./../controllers/reviewController.js";
import * as authController from "./../controllers/authController.js";

// 💡 mergeParams: true is crucial here so we can access gadgetIds from nested routes!
// e.g., POST /api/v1/gadgets/:gadgetId/reviews
const router = express.Router({ mergeParams: true });

// 🔒 Protect all review routes below this line
router.use(authController.protect);

router.route("/").get(reviewController.getAllReviews).post(
  authController.restrictTo("customer", "admin"), // Only customers can write reviews
  reviewController.setGadgetUserIds, // Updated helper name for AeroX
  reviewController.createReview,
);

router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo("customer", "admin"), // We will handle owner authorization in the controller!
    reviewController.updateReview,
  )
  .delete(
    authController.restrictTo("customer", "admin"),
    reviewController.deleteReview,
  );

export default router;
