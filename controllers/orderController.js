import Order from "../models/orderModel.js";
import Gadget from "../models/gadgetModel.js"; // Or your respective Product model
import Component from "../models/componentModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

// 🛍️ 1. CREATE AN ORDER (Safe, Real-time Stock Checking & Price Calculation)
export const createOrder = catchAsync(async (req, res, next) => {
  const { items, shippingAddress } = req.body;

  if (!items || items.length === 0) {
    return next(new AppError("An order must contain at least one item.", 400));
  }

  let calculatedTotal = 0;
  const processedItems = [];

  // Step A: Safely verify stock, pull prices, and compile order items
  for (const item of items) {
    // 1) Identify target model dynamically based on user selection
    const Model = item.productType === "Gadget" ? Gadget : Component;
    const dbProduct = await Model.findById(item.product);

    if (!dbProduct) {
      return next(
        new AppError(`Product not found with ID: ${item.product}`, 404),
      );
    }

    // 2) Verify stock availability
    if (dbProduct.stock < item.quantity) {
      return next(
        new AppError(
          `Insufficient stock for "${dbProduct.name}". Only ${dbProduct.stock} left.`,
          400,
        ),
      );
    }

    // 3) Deduct from Inventory (Atomic Update)
    dbProduct.stock -= item.quantity;
    await dbProduct.save({ validateBeforeSave: false });

    // 4) Calculate price securely using DB value (accounts for potential discounts)
    const activePrice = dbProduct.priceDiscount || dbProduct.price;
    calculatedTotal += activePrice * item.quantity;

    processedItems.push({
      productType: item.productType,
      product: item.product,
      quantity: item.quantity,
      priceAtPurchase: activePrice,
    });
  }

  // Step B: Write order record to DB
  const newOrder = await Order.create({
    user: req.user.id, // Pulled safely from protect middleware
    items: processedItems,
    totalAmount: calculatedTotal,
    shippingAddress,
  });

  res.status(201).json({
    status: "success",
    data: { order: newOrder },
  });
});

// 🔍 2. GET ALL ORDERS (Admins see everything, Customers see only their own)
export const getAllOrders = catchAsync(async (req, res, next) => {
  let filter = {};

  // 🛡️ Security Guard: If not admin, restrict the query to the user's logged-in session ID
  if (req.user.role !== "admin") {
    filter = { user: req.user.id };
  }

  const orders = await Order.find(filter).sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: orders.length,
    data: { orders },
  });
});

// 🔍 3. GET SINGLE ORDER (Ownership Guard)
export const getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError("No order found with that ID", 404));
  }

  // 🛡️ Guard: Only Admin or the order owner can view this specific receipt
  if (order.user._id.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new AppError("You do not have permission to view this order.", 403),
    );
  }

  res.status(200).json({
    status: "success",
    data: { order },
  });
});

// 🛠️ 4. UPDATE ORDER STATUS (Admin Only - processing, shipped, delivered, etc.)
export const updateOrderStatus = catchAsync(async (req, res, next) => {
  const { orderStatus, paymentStatus } = req.body;

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { orderStatus, paymentStatus },
    { new: true, runValidators: true },
  );

  if (!order) {
    return next(new AppError("No order found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { order },
  });
});

// ❌ CANCEL ORDER (Advanced Inversion Workflow - Restores Stock)
export const cancelOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError("No order found with that ID", 404));
  }

  // 🛡️ Security Check: Customers can only cancel their OWN orders. Admins can cancel any.
  if (order.user._id.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new AppError("You do not have permission to cancel this order.", 403),
    );
  }

  // 🛑 Guard: Prevent canceling orders that are already shipped, delivered, or cancelled
  if (order.orderStatus !== "processing") {
    return next(
      new AppError(
        `Cannot cancel an order that is already marked as ${order.orderStatus}.`,
        400,
      ),
    );
  }

  // 🔄 LOOP & RESTORE STOCK: Put the items back into inventory!
  for (const item of order.items) {
    const Model = item.productType === "Gadget" ? Gadget : Component;

    // Increment the stock count back by the ordered quantity
    await Model.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }

  // 📝 Update order status instead of destroying the record
  order.orderStatus = "cancelled";
  await order.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "Order successfully cancelled and inventory stock restored.",
    data: { order },
  });
});
