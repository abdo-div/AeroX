import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  productType: {
    type: String,
    required: true,
    enum: ["Gadget", "Component"],
  },
  product: {
    type: mongoose.Schema.ObjectId,
    required: [true, "A cart item must link to a product"],
    refPath: "items.productType", // Keeps your exact dynamic reference system!
  },
  quantity: {
    type: Number,
    required: [true, "Please specify a quantity"],
    min: [1, "Quantity must be at least 1"],
    default: 1,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A cart must belong to a user"],
      unique: true, // One active cart per user account
    },
    items: [cartItemSchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ==========================================
// ⚡ QUERY MIDDLEWARE: AUTO-POPULATE LIVE PRICING
// ==========================================
cartSchema.pre(/^find/, function () {
  this.populate({
    path: "user",
    select: "name email",
  }).populate({
    path: "items.product",
    // 💡 Added price & priceDiscount so we can compute the live total dynamically in controllers
    select: "name imageCover price priceDiscount stock",
  });
});

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
