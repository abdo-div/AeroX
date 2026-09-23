import crypto from "crypto";
import Stripe from "stripe";
import Cart from "../models/cartModel.js";
import Order from "../models/orderModel.js";
import Gadget from "../models/gadgetModel.js";
import Component from "../models/componentModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import {
  getHostedCheckoutBaseUrl,
  verifyTransaction,
} from "../services/moamalatService.js";

let stripe;
const getStripe = () => {
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripe;
};

const formatMoamalatDate = (
  date = new Date(),
  timeZone = process.env.MOAMALAT_TIME_ZONE || "Africa/Tripoli",
) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );

  return `${values.year}${values.month}${values.day}${values.hour}${values.minute}${values.second}`;
};

export const createMoamalatCheckout = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

  if (!cart || cart.items.length === 0) {
    return next(new AppError('Your cart is empty.', 400));
  }

  const shippingAddress = req.body.shippingAddress || 'Local Pickup';

  let totalAmount = 0;
  for (const item of cart.items) {
    if (!item.product) continue;
    const price = item.product.priceDiscount || item.product.price;
    totalAmount += price * item.quantity;
  }

  if (totalAmount <= 0) {
    return next(new AppError('Invalid checkout amount.', 400));
  }

  const merchantReference = `AEROX-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const processedItems = cart.items
    .filter((item) => item.product)
    .map((item) => ({
      productType: item.productType,
      product: item.product._id,
      quantity: item.quantity,
      priceAtPurchase: item.product.priceDiscount || item.product.price,
    }));

  const order = await Order.create({
    user: req.user.id,
    items: processedItems,
    totalAmount,
    shippingAddress,
    merchantReference,
    paymentStatus: 'pending',
    orderStatus: 'processing',
  });

  const MID = process.env.MOAMALAT_MERCHANT_ID;
  const TID = process.env.MOAMALAT_TERMINAL_ID;
  const secureKey = process.env.MOAMALAT_SECURE_KEY;
  if (!MID || !TID || !secureKey) {
    return next(new AppError("Moamalat credentials are not configured.", 500));
  }

  const AmountTrxn = Math.round(totalAmount * 1000);
  const TrxDateTime = formatMoamalatDate();
  const hashString =
    `AmountTrxn=${AmountTrxn}` +
    `&MID=${MID}` +
    `&MerchantReference=${merchantReference}` +
    `&TID=${TID}` +
    `&TrxDateTime=${TrxDateTime}`;
  const SecureHash = crypto
    .createHmac("sha256", Buffer.from(secureKey, "hex"))
    .update(hashString)
    .digest("hex")
    .toUpperCase();

  const checkout = {
    MID,
    TID,
    AmountTrxn,
    MerchantReference: merchantReference,
    TrxDateTime,
    SecureHash,
  };
  const configuredBaseUrl = process.env.APP_URL || `https://${req.get("host")}`;
  const baseUrl = configuredBaseUrl
    .replace(/^http:\/\//i, "https://")
    .replace(/\/+$/, "");
  const returnUrl = `${baseUrl}/checkout/success?ref=${encodeURIComponent(merchantReference)}`;
  const hostedCheckoutUrl = new URL(
    `${getHostedCheckoutBaseUrl()}/light-box-hosted-checkout`,
  );
  hostedCheckoutUrl.search = new URLSearchParams({
    OrderID: merchantReference,
    MID: checkout.MID,
    TID: checkout.TID,
    amount: String(AmountTrxn),
    AmountTrxn: String(AmountTrxn),
    Referrer: "",
    PaymentMethodFromLightBox: "2",
    MerchantReference: checkout.MerchantReference,
    secureHashAnonymous: checkout.SecureHash,
    trxDateTime: checkout.TrxDateTime,
    TrxDateTime: checkout.TrxDateTime,
    returnUrl,
  }).toString();

  res.status(200).json({
    status: 'success',
    MID,
    TID,
    AmountTrxn,
    MerchantReference: merchantReference,
    TrxDateTime,
    SecureHash,
    merchantReference,
    orderId: order._id,
    shippingAddress,
    checkout,
    hostedCheckoutUrl: hostedCheckoutUrl.toString(),
  });
});

const completeMoamalatOrder = async (order, userId) => {
  if (order.paymentStatus === "paid") return order;

  const products = [];
  for (const item of order.items) {
    const Model = item.productType === "Gadget" ? Gadget : Component;
    const productId = item.product?._id || item.product;
    const product = await Model.findById(productId);

    if (!product || product.stock < item.quantity) {
      throw new AppError(`Insufficient stock for order item ${productId}.`, 409);
    }

    products.push({ product, quantity: item.quantity });
  }

  for (const { product, quantity } of products) {
    product.stock -= quantity;
    await product.save({ validateBeforeSave: false });
  }

  order.user = userId;
  order.paymentStatus = "paid";
  order.isPaid = true;
  order.paidAt = new Date();
  order.status = "Processing";
  await order.save();
  await Cart.findOneAndDelete({ user: userId });
  return order;
};

export const confirmMoamalatPayment = catchAsync(async (req, res, next) => {
  const { merchantReference } = req.body;
  if (!merchantReference) {
    return next(new AppError("Merchant reference is required.", 400));
  }

  const order = await Order.findOne({
    merchantReference,
    user: req.user.id,
  }).select("+merchantReference");

  if (!order) return next(new AppError("Payment order not found.", 404));
  if (order.paymentStatus === "paid" || order.isPaid) {
    return res.status(200).json({ status: "success", paid: true });
  }

  const approved = await verifyTransaction(merchantReference);
  if (!approved) {
    return next(new AppError("Moamalat has not approved this payment.", 402));
  }

  await completeMoamalatOrder(order, req.user.id);
  res.status(200).json({ status: "success", paid: true });
});

export const handleMoamalatSuccess = catchAsync(async (req, res, next) => {
  const { ref } = req.query;
  if (!ref) return next(new AppError("No transaction reference found.", 400));

  const order = await Order.findOne({
    merchantReference: ref,
    user: req.user.id,
  });
  if (!order) return next(new AppError("Order not found.", 404));

  if (!order.isPaid && order.paymentStatus !== "paid") {
    const isApproved = await verifyTransaction(ref);
    if (!isApproved) {
      return next(
        new AppError(
          "Payment verification failed or transaction was rejected.",
          400,
        ),
      );
    }
    await completeMoamalatOrder(order, req.user.id);
  }

  res.status(200).render("success", {
    title: "Payment Successful",
    order,
    user: res.locals.user ? res.locals.user.toObject() : null,
    cartCount: 0,
  });
});

export const handleMoamalatCancel = catchAsync(async (req, res) => {
  const { ref } = req.query;

  if (ref) {
    await Order.findOneAndUpdate(
      { merchantReference: ref, user: req.user.id, isPaid: false },
      {
        status: "Cancelled",
        paymentStatus: "failed",
        orderStatus: "cancelled",
      },
    );
  }

  res.status(200).render("cancel", {
    title: "Payment Cancelled",
    user: res.locals.user ? res.locals.user.toObject() : null,
  });
});

export const createCheckoutSession = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate(
    "items.product",
  );

  if (!cart || cart.items.length === 0) {
    return next(new AppError("Your cart is empty.", 400));
  }

  const shippingAddress = req.body.shippingAddress || "Local Pickup";

  const lineItems = cart.items
    .map((item) => {
      if (!item.product) return null;
      const price = item.product.priceDiscount || item.product.price;
      const images =
        req.protocol === "https" && item.product.imageCover
          ? [
              `${req.protocol}://${req.get("host")}/images/products/${item.product.imageCover}`,
            ]
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
    })
    .filter(Boolean);

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
  const merchantReference = req.query.ref;
  if (merchantReference) {
    const order = await Order.findOne({
      merchantReference,
      user: req.user.id,
    });

    if (!order) {
      return res.redirect("/checkout");
    }

    if (order.paymentStatus !== "paid") {
      const approved = await verifyTransaction(merchantReference);
      if (!approved) return res.redirect("/checkout");
      await completeMoamalatOrder(order, req.user.id);
    }

    return res.status(200).render("checkoutSuccess", {
      title: "AEROX | Order Confirmed",
      cartCount: 0,
      user: res.locals.user ? res.locals.user.toObject() : null,
      paymentProvider: "Moamalat",
    });
  }

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
  if (
    !existingOrder ||
    existingOrder.createdAt < new Date(session.created * 1000)
  ) {
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
