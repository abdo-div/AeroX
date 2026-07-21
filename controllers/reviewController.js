import Review from "./../models/reviewModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js"; // 💡 Added this import so your authorization errors work!

// 🔗 1. NESTED ROUTE PREP MIDDLEWARE
// Automatically grabs the Gadget ID from the URL and User ID from the login session if missing
export const setGadgetUserIds = (req, res, next) => {
  // If the gadget wasn't specified in the request body, look for it in the nested URL parameters
  if (!req.body.gadget) req.body.gadget = req.params.gadgetId;

  // The user ID always comes directly from the protected login session token
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

// 📝 2. CORE CRUD CONTROLLERS

export const getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};

  // If we hit a nested route (e.g., /api/v1/gadgets/:gadgetId/reviews), only fetch reviews for that gadget
  if (req.params.gadgetId) filter = { gadget: req.params.gadgetId };

  const reviews = await Review.find(filter);

  res.status(200).json({
    status: "success",
    results: reviews.length,
    data: { reviews },
  });
});

// 🔗 NESTED ROUTE PREP MIDDLEWARE
// Automatically grabs the Gadget ID from the URL and User ID from the login session if missing

export const createReview = catchAsync(async (req, res, next) => {
  const newReview = await Review.create(req.body);

  res.status(201).json({
    status: "success",
    data: { newReview },
  });
});

// Fetch an individual single review by its personal ID
export const getReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError("No review found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { review },
  });
});

export const updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError("No review found with that ID", 404));
  }

  // 🛡️ Security Check: Only the review creator OR an admin can edit it
  if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new AppError("You can only update your own reviews.", 403));
  }

  Object.assign(review, req.body);
  await review.save();

  res.status(200).json({
    status: "success",
    data: { review },
  });
});

export const deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError("No review found with that ID", 404));
  }

  // 🛡️ Security Check: Only the review creator OR an admin can delete it
  if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new AppError("You can only delete your own reviews.", 403));
  }

  await Review.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
