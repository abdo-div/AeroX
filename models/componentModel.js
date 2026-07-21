import mongoose from "mongoose";
import slugify from "slugify";

const componentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "a component must have a name"],
      unique: true,
      trim: true,
      maxLength: [100, "a component name cannot exceed 100 characters"],
      minlength: [5, "A component name must have at least 5 characters"],
    },
    slug: String,
    category: {
      type: String,
      required: [true, "A component must have a category"],
      lowercase: true,
    },
    price: {
      type: Number,
      required: [true, "A component must have a price"],
      min: [0, "price cannot be negative"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: "discount price({VALUE}) must be lower than the regular price",
      },
    },
    stock: {
      type: Number,
      required: [true, "please specify stock quantity"],
      min: [0, "stock cannot be negative"],
    },
    imageCover: {
      type: String,
      required: [true, "a component must have a cover image"],
    },
    images: String,
    specifications: {
      type: Map,
      of: String,
      required: [true, "please provide key technical specifications"],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// 🔍 HIGH-PERFORMANCE INDEXES

componentSchema.index({ price: 1, ratingsAverage: -1 });
componentSchema.index({ name: "text", category: "text" });

// 🚀 DOCUMENT MIDDLEWARE

componentSchema.pre("save", function () {
  this.slug = slugify(this.name, { lower: true });
});

const Component = mongoose.model("Component", componentSchema);

export default Component;
