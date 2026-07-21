import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    gadget: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gadget",
      required: [true, "An offer must be linked to a gadget"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "An offer must have a user"],
    },
    originalPrice: {
      type: Number,
      required: true,
    },
    offerPrice: {
      type: Number,
      required: [true, "Please provide an offer price"],
      min: [0, "Offer price must be positive"],
    },
    adminNote: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending",
    },
  },
  { timestamps: true },
);

const Offer = mongoose.model("Offer", offerSchema);

export default Offer;
