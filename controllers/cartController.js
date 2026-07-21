import Cart from "../models/cartModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import Gadget from "../models/gadgetModel.js";
import Component from "../models/componentModel.js";
// Helper utility to inject live financial math safely into responses
const formatCartWithTotal = (cart) => {
  let totalAmount = 0;

  const processedItems = cart.items.map((item) => {
    if (!item.product) return item;

    // Check if item has an active sale price
    const currentPrice = item.product.priceDiscount || item.product.price;
    totalAmount += currentPrice * item.quantity;

    return item;
  });

  return {
    _id: cart._id,
    user: cart.user,
    items: processedItems,
    totalAmount, // Computed instantly!
  };
};

// 📥 1. GET OR INITIALIZE CART
export const getMyCart = catchAsync(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }

  res.status(200).json({
    status: "success",
    data: { cart: formatCartWithTotal(cart) },
  });
});

// ➕ 2. ADD TO CART (Increments quantities intelligently)
export const addToCart = catchAsync(async (req, res, next) => {
  const { product, quantity = 1 } = req.body; // 💡 Frontend only needs to send product (ID) now!

  if (!product) {
    return next(new AppError("Please provide a product ID.", 400));
  }

  // 🔎 1. Autodetect the Product Type by scanning collections
  let productType = null;

  const isGadget = await Gadget.exists({ _id: product });
  if (isGadget) {
    productType = "Gadget";
  } else {
    const isComponent = await Component.exists({ _id: product });
    if (isComponent) {
      productType = "Component";
    }
  }

  // If the ID wasn't found in either collection, reject it gracefully
  if (!productType) {
    return next(
      new AppError(
        "No product found with that ID in Gadgets or Components.",
        404,
      ),
    );
  }

  // 🛒 2. Find or create the user's cart
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }

  // 🔢 3. Check if this exact item is already in the cart array
  const itemIndex = cart.items.findIndex(
    (item) =>
      item.product._id.toString() === product &&
      item.productType === productType,
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += quantity;
  } else {
    cart.items.push({ productType, product, quantity });
  }

  await cart.save();

  // Re-fetch to apply population hooks flawlessly
  const fullyPopulatedCart = await Cart.findById(cart._id);

  res.status(200).json({
    status: "success",
    data: { cart: formatCartWithTotal(fullyPopulatedCart) },
  });
});

// 🔢 3. SET ABSOLUTE QUANTITY COUNTS
export const updateCartItemQuantity = catchAsync(async (req, res, next) => {
  const { quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new AppError("Cart not found", 404));

  const subDocItem = cart.items.id(req.params.itemId);
  if (!subDocItem) return next(new AppError("Item not found in cart", 404));

  subDocItem.quantity = quantity;
  await cart.save();

  const freshCart = await Cart.findById(cart._id);
  res.status(200).json({
    status: "success",
    data: { cart: formatCartWithTotal(freshCart) },
  });
});

// 🗑️ 4. DROP ITEM FROM ARRAY
export const removeFromCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new AppError("Cart not found", 404));

  cart.items.pull({ _id: req.params.itemId });
  await cart.save();

  const freshCart = await Cart.findById(cart._id);
  res.status(200).json({
    status: "success",
    data: { cart: formatCartWithTotal(freshCart) },
  });
});
