import Stripe from "stripe";
import Cart from "../models/cartModel.js";
import Order from "../models/orderModel.js";
import Gadget from "../models/gadgetModel.js";
import Component from "../models/componentModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

let stripe;
const getStripe = () => {
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripe;
};

export const createCheckoutSession = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate(
    "items.product",
  );

  if (!cart || cart.items.length === 0) {
    return next(new AppError("Your cart is empty.", 400));
  }

  const shippingAddress = req.body.shippingAddress || "Local Pickup";

  const lineItems = cart.items.map((item) => {
    if (!item.product) return null;
    const price = item.product.priceDiscount || item.product.price;
    const images = req.protocol === "https" && item.product.imageCover
      ? [`${req.protocol}://${req.get("host")}/images/products/${item.product.imageCover}`]
      : [];
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: item.product.name,
          images,
        },
        unit_amount: Math.round(price * 100),
      },
      quantity: item.quantity,
    };
  }).filter(Boolean);

  if (lineItems.length === 0) {
    return next(new AppError("No valid products in cart.", 400));
  }

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: req.user.email,
    client_reference_id: cart._id.toString(),
    metadata: {
      userId: req.user.id,
      cartId: cart._id.toString(),
      shippingAddress,
    },
    line_items: lineItems,
    success_url: `${req.protocol}://${req.get("host")}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.protocol}://${req.get("host")}/checkout`,
  });

  res.status(200).json({
    status: "success",
    url: session.url,
  });
});

export const stripeWebhook = catchAsync(async (req, res, next) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const cart = await Cart.findById(session.client_reference_id).populate(
      "items.product",
    );

    if (!cart) return res.status(200).json({ received: true });

    let calculatedTotal = 0;
    const processedItems = [];

    for (const item of cart.items) {
      if (!item.product) continue;

      const Model = item.productType === "Gadget" ? Gadget : Component;
      const dbProduct = await Model.findById(item.product._id);

      if (!dbProduct || dbProduct.stock < item.quantity) continue;

      dbProduct.stock -= item.quantity;
      await dbProduct.save({ validateBeforeSave: false });

      const activePrice = dbProduct.priceDiscount || dbProduct.price;
      calculatedTotal += activePrice * item.quantity;

      processedItems.push({
        productType: item.productType,
        product: item.product._id,
        quantity: item.quantity,
        priceAtPurchase: activePrice,
      });
    }

    if (processedItems.length > 0) {
      await Order.create({
        user: session.metadata.userId,
        items: processedItems,
        totalAmount: calculatedTotal,
        shippingAddress: session.metadata.shippingAddress,
        paymentStatus: "paid",
        orderStatus: "processing",
      });
    }

    await Cart.findByIdAndDelete(cart._id);
  }

  res.status(200).json({ received: true });
});

export const getCheckoutSuccess = catchAsync(async (req, res, next) => {
  const sessionId = req.query.session_id;

  if (!sessionId) {
    return res.redirect("/my-orders");
  }

  let session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId);
  } catch {
    return res.redirect("/my-orders");
  }

  if (session.payment_status !== "paid") {
    return res.redirect("/checkout");
  }

  // Check if order already created by webhook
  const existingOrder = await Order.findOne({ user: req.user.id }).sort(
    "-createdAt",
  );

  const cartId = session.client_reference_id;

  // If webhook hasn't created the order yet, create it here
  if (!existingOrder || existingOrder.createdAt < new Date(session.created * 1000)) {
    const cart = await Cart.findById(cartId).populate("items.product");

    if (cart && cart.items.length > 0) {
      let calculatedTotal = 0;
      const processedItems = [];

      for (const item of cart.items) {
        if (!item.product) continue;

        const Model = item.productType === "Gadget" ? Gadget : Component;
        const dbProduct = await Model.findById(item.product._id);

        if (!dbProduct || dbProduct.stock < item.quantity) continue;

        dbProduct.stock -= item.quantity;
        await dbProduct.save({ validateBeforeSave: false });

        const activePrice = dbProduct.priceDiscount || dbProduct.price;
        calculatedTotal += activePrice * item.quantity;

        processedItems.push({
          productType: item.productType,
          product: item.product._id,
          quantity: item.quantity,
          priceAtPurchase: activePrice,
        });
      }

      if (processedItems.length > 0) {
        await Order.create({
          user: req.user.id,
          items: processedItems,
          totalAmount: calculatedTotal,
          shippingAddress: session.metadata.shippingAddress,
          paymentStatus: "paid",
          orderStatus: "processing",
        });
      }

      await Cart.findByIdAndDelete(cart._id);
    }
  }

  res.status(200).render("checkoutSuccess", {
    title: "AEROX | Order Confirmed",
    cartCount: 0,
    user: res.locals.user ? res.locals.user.toObject() : null,
  });
});
