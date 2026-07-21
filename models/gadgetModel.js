import mongoose from "mongoose";

import slugify from "slugify";

const gadgetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A gadget must have a name"],
      unique: true,
      trim: true,
      maxLength: [
        40,
        "A gadget name must have less or equal than 40 characters",
      ],
      minLength: [5, "A gadget name must have more or equal than 5 characters"],
    },
    slug: String,
    category: {
      type: String,
      required: [true, "A gadget must have a category"],
      enum: {
        values: ["keyboard", "mouse", "audio", "streaming", "ambient-lighting"],
        message:
          "Category is either: keyboard, mouse, audio, streaming, or ambient-lighting",
      },
    },
    price: {
      type: Number,
      required: [true, "A gadget must have a price"],
      min: [0, "price must be positive number"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message:
          "discount price ({VALUE}) must be lower than the regular price",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "rating must be above 1.0"],
      max: [5, "rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    specs: {
      connectivity: {
        type: String,
        required: [true, "specify connectivity type"],
        enum: ["wireless", "wired", "hybrid"],
      },
      weight: Number,
      sensor: String,
      switchType: String,
      batteryLife: String,
    },
    stock: {
      type: Number,
      required: [true, "stock status is required"],
      min: [0, "stock cannot be negative"],
    },
    imageCover: {
      type: String,
      required: [true, "A gadget must have a conver image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: {
      virtuals: true,
    },
  },
);
// 🔍 INDEXES FOR HIGH-PERFORMANCE SEARCH

gadgetSchema.index({ price: 1 });

gadgetSchema.index({ price: 1, ratingsAverage: -1 });

gadgetSchema.index({ name: "text", "specs.sensor": "text" });

// 🚀 VIRTUAL POPULATE (Links reviews without storing them directly)

gadgetSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "gadget",
  localField: "_id",
});

gadgetSchema.pre("save", function () {
  this.slug = slugify(this.name, { lower: true });
});

const Gadget = mongoose.model("Gadget", gadgetSchema);

export default Gadget;
