import mongoose from "mongoose";
import Gadget from "./gadgetModel.js";
import User from "./userModel.js";

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review text cannot be empty"],
      trim: true,
      maxLength: [500, "A review must have less or equal than 500 characters"],
    },
    rating: {
      type: Number,
      required: [true, "please provide a rating"],
      min: [1, "rating must be at least 1.0"],
      max: [5, "rating cannot be above 5.0"],
    },
    gadget: {
      type: mongoose.Schema.ObjectId,
      ref: "Gadget",
      required: [true, "review must belong to a gadget"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "review must belong to a user"],
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// 🔍 DATABASE INDEXING

reviewSchema.index({ gadget: 1, user: 1 }, { unique: true });

// ⚡ QUERY MIDDLEWARE: AUTO-POPULATE

reviewSchema.pre(/^find/, function () {
  this.populate({
    path: "user",
    select: "name photo",
  });
});

// 📊 STATIC METHOD: CALC AVERAGE RATINGS (AGGREGATION)

reviewSchema.statics.calcAverageRatings = async function (gadgetId) {
  const stats = await this.aggregate([
    {
      $match: { gadget: gadgetId },
    },
    {
      $group: {
        _id: "$gadget",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await Gadget.findByIdAndUpdate(gadgetId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    // Fallback default values if no reviews are left
    await Gadget.findByIdAndUpdate(gadgetId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.pre(/^findOneAnd/, async function () {
  // Execute query to find the document before update runs, and save it on the query context
  this.r = await this.model.findOne(this.getQuery());
});

// Recalculate averages after the document changes in the database
reviewSchema.post(/^findOneAnd/, async function () {
  if (this.r) {
    await this.r.constructor.calcAverageRatings(this.r.gadget);
  }
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
