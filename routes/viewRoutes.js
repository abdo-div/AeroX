import express from "express";
import * as viewsController from "../controllers/viewController.js";
import * as offerController from "../controllers/offerController.js";
import * as checkoutController from "../controllers/checkoutController.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

// 💡 Custom hook: runs on every view route to check for cookie JWTs
// and injects user profiles into templates as standard local variables (res.locals.user)
router.use(authController.isLoggedIn);

router.get("/", viewsController.getOverview);
router.get("/shop", viewsController.getShop);
router.get("/product/:slug", viewsController.getProductDetail);
router.get("/login", viewsController.getLoginForm);
router.get("/signup", viewsController.getSignupForm);

  // Admin-only pages
  router.get(
    "/make-offer",
    authController.protect,
    authController.restrictTo("admin"),
    offerController.getMakeOfferPage,
  );

// Protected UI pages (User must absolutely be logged in to view)
router.get("/cart", authController.protect, viewsController.getCart);
router.get("/checkout", authController.protect, viewsController.getCheckout);
router.get("/checkout/success", authController.protect, checkoutController.getCheckoutSuccess);
router.get("/me", authController.protect, viewsController.getAccount);
router.get("/my-orders", authController.protect, viewsController.getOrders);

export default router;
