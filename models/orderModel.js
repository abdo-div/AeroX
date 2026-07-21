import mongoose from "mongoose";
import User from "./userModel.js";

const orederItemSchema = new mongoose.Schema({
  productType: {
    type: String,
    required: true,
    enum: ["Gadget", "Component"],
  },
  product: {
    type: mongoose.Schema.ObjectId,
    required: [true, "an order item must link to a product"],
    refPath: "items.productType",
  },
  quantity: {
    type: Number,
    required: [true, "please specify quantity for this item"],
    min: [1, "quantity must be at least 1"],
  },
  priceAtPurchase: {
    type: Number,
    required: [
      true,
      "price at purchase is required to safeguard transaction history",
    ],
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "an order must belong to a user"],
    },
    items: [orederItemSchema],
    totalAmount: {
      type: Number,
      required: [true, "An order must have a total amount"],
    },
    shippingAddress: {
      type: String,
      default: "local pickup/ digital delivery",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"],
      default: "processing",
    },
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

orderSchema.pre(/^find/, function () {
  this.populate({
    path: "user",
    select: "name email",
  }).populate({
    path: "items.product",
    select: "name imageCover price",
  });
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
