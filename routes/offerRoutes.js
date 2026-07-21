import express from "express";
import multer from "multer";
import * as offerController from "../controllers/offerController.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.use(authController.protect);
router.use(authController.restrictTo("admin"));

router
  .route("/")
  .get(offerController.getAllOffers)
  .post(upload.single("imageCover"), offerController.createOffer);

router.patch("/:id/status", offerController.updateOfferStatus);

export default router;
