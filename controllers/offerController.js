import Offer from "../models/offerModel.js";
import Gadget from "../models/gadgetModel.js";
import Component from "../models/componentModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createOffer = catchAsync(async (req, res, next) => {
  const {
    productType,
    name,
    category,
    price,
    stock,
    connectivity,
    weight,
    sensor,
    switchType,
    batteryLife,
    offerPrice,
    adminNote,
    specKeys,
    specValues,
  } = req.body;

  if (!name || !category || !price || !offerPrice) {
    return next(new AppError("Please fill in all required fields.", 400));
  }

  let imageCover = "";

  if (req.file) {
    const filename = `offer-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
      .resize(800, 800, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(path.join(__dirname, "..", "public", "images", "products", filename));
    imageCover = filename;
  }

  let product;
  if (productType === "component") {
    const specifications = new Map();
    if (Array.isArray(specKeys) && Array.isArray(specValues)) {
      specKeys.forEach((k, i) => {
        if (k && specValues[i]) specifications.set(k, specValues[i]);
      });
    }
    product = await Component.create({
      name,
      category,
      price: Number(price),
      stock: Number(stock) || 0,
      imageCover,
      specifications,
    });
  } else {
    product = await Gadget.create({
      name,
      category,
      price: Number(price),
      stock: Number(stock) || 0,
      imageCover,
      specs: {
        connectivity: connectivity || "wired",
        weight: weight ? Number(weight) : undefined,
        sensor,
        switchType,
        batteryLife,
      },
    });
  }

  const offer = await Offer.create({
    gadget: product._id,
    user: req.user.id,
    originalPrice: product.price,
    offerPrice: Number(offerPrice),
    adminNote,
  });

  res.status(201).json({
    status: "success",
    data: { offer, product },
  });
});

export const getAllOffers = catchAsync(async (req, res, next) => {
  const offers = await Offer.find()
    .populate("gadget", "name price imageCover slug")
    .populate("user", "name email")
    .sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: offers.length,
    data: { offers },
  });
});

export const updateOfferStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;

  if (!["accepted", "rejected"].includes(status)) {
    return next(new AppError("Status must be 'accepted' or 'rejected'.", 400));
  }

  const offer = await Offer.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true },
  );

  if (!offer) {
    return next(new AppError("No offer found with that ID.", 404));
  }

  res.status(200).json({
    status: "success",
    data: { offer },
  });
});

export const getMakeOfferPage = catchAsync(async (req, res, next) => {
  res.status(200).render("makeOffer", {
    title: "AEROX | Make Offer",
    cartCount: res.locals.cartCount || 0,
    user: res.locals.user ? res.locals.user.toObject() : null,
  });
});
