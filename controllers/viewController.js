import Gadget from "../models/gadgetModel.js";
import Cart from "../models/cartModel.js";
import Order from "../models/orderModel.js";
import Component from "../models/componentModel.js";

// ─── HELPER: cart item count ─────────────────────────────────────────────────
const getCartCount = async (userId) => {
  if (!userId) return 0;
  try {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return 0;
    return cart.items.reduce((acc, curr) => acc + curr.quantity, 0);
  } catch (e) {
    return 0;
  }
};

// ─── HOMEPAGE ────────────────────────────────────────────────────────────────
export const getOverview = async (req, res, next) => {
  try {
    const featuredGadgets = await Gadget.find({ isFeatured: true }).limit(4);
    const cartCount = res.locals.user
      ? await getCartCount(res.locals.user._id)
      : 0;

    res.status(200).render("home", {
      title: "AEROX | Engineered for Dominance",
      featuredGadgets,
      cartCount,
      user: res.locals.user,
    });
  } catch (err) {
    next(err);
  }
};

// ─── SHOP / ARSENAL ──────────────────────────────────────────────────────────
export const getShop = async (req, res, next) => {
  try {
    const queryObj = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);

    // Convert price[lte] style params to MongoDB operators
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`,
    );
    let filterQuery = JSON.parse(queryStr);

    // Strip empty string values (e.g. connectivity="" from "Any" radio)
    Object.keys(filterQuery).forEach((key) => {
      if (filterQuery[key] === "") delete filterQuery[key];
    });

    // Split categories into gadget vs component types
    const gadgetCats = ["keyboard", "mouse", "audio", "streaming", "ambient-lighting"];
    const componentCats = ["cpu", "gpu", "ram", "case"];

    let selectedCategories = [];
    if (filterQuery.category) {
      selectedCategories = Array.isArray(filterQuery.category)
        ? filterQuery.category
        : [filterQuery.category];
    }

    const wantsGadgets = selectedCategories.length === 0 || selectedCategories.some((c) => gadgetCats.includes(c));
    const wantsComponents = selectedCategories.length === 0 || selectedCategories.some((c) => componentCats.includes(c));

    // Build per-type filter objects
    const buildFilter = (cats) => {
      const f = { ...filterQuery };
      if (cats && cats.length) {
        f.category = cats.length === 1 ? cats[0] : { $in: cats };
      } else {
        delete f.category;
      }
      // Connectivity only applies to Gadget model
      if (f.connectivity) {
        f["specs.connectivity"] = f.connectivity;
        delete f.connectivity;
      }
      return f;
    };

    let gadgetFilter, componentFilter;
    if (selectedCategories.length > 0) {
      const gCats = selectedCategories.filter((c) => gadgetCats.includes(c));
      const cCats = selectedCategories.filter((c) => componentCats.includes(c));
      gadgetFilter = gCats.length ? buildFilter(gCats) : null;
      componentFilter = cCats.length ? buildFilter(cCats) : null;
    } else {
      gadgetFilter = buildFilter(null);
      componentFilter = buildFilter(null);
    }

    // Sorting
    const sort = req.query.sort || "-createdAt";

    // Run queries in parallel
    const promises = [];
    if (gadgetFilter !== null) {
      promises.push(Gadget.find(gadgetFilter).sort(sort));
    }
    if (componentFilter !== null) {
      promises.push(Component.find(componentFilter).sort(sort));
    }

    const results = await Promise.all(promises);
    const gadgets = results.flat();

    // Re-sort merged results
    if (sort.startsWith("-")) {
      const field = sort.slice(1);
      gadgets.sort((a, b) => (b[field] || 0) - (a[field] || 0));
    } else {
      gadgets.sort((a, b) => (a[sort] || 0) - (b[sort] || 0));
    }

    const cartCount = res.locals.user
      ? await getCartCount(res.locals.user._id)
      : 0;

    res.status(200).render("shop", {
      title: "AEROX | The Arsenal",
      gadgets,
      cartCount,
      currentFilters: req.query,
      user: res.locals.user,
    });
  } catch (err) {
    next(err);
  }
};

// ─── PRODUCT DETAIL ──────────────────────────────────────────────────────────
export const getProductDetail = async (req, res, next) => {
  try {
    let gadget = await Gadget.findOne({ slug: req.params.slug }).populate(
      "reviews",
    );
    let isComponent = false;

    if (!gadget) {
      gadget = await Component.findOne({ slug: req.params.slug });
      isComponent = true;
    }

    if (!gadget) {
      return res.status(404).render("error", {
        title: "AEROX | Access Denied",
        msg: "Target hardware not found.",
      });
    }

    // Convert to plain object so Pug doesn't see Mongoose internals
    const gadgetObj = gadget.toObject();

    // Convert Mongoose Map to plain object for Pug rendering
    if (isComponent && gadgetObj.specifications) {
      const specs = {};
      if (gadgetObj.specifications instanceof Map) {
        gadgetObj.specifications.forEach((val, key) => { specs[key] = val; });
      } else {
        for (const [key, val] of Object.entries(gadgetObj.specifications)) {
          specs[key] = val;
        }
      }
      gadgetObj.specifications = specs;
    }

    const cartCount = res.locals.user
      ? await getCartCount(res.locals.user._id)
      : 0;

    res.status(200).render("product", {
      title: `AEROX | ${gadgetObj.name}`,
      gadget: gadgetObj,
      cartCount,
      isComponent,
      user: res.locals.user,
    });
  } catch (err) {
    next(err);
  }
};

// ─── AUTH PAGES ──────────────────────────────────────────────────────────────
export const getLoginForm = (req, res) => {
  res.status(200).render("login", {
    title: "AEROX | Initialize System Access",
    googleClientId: process.env.GOOGLE_CLIENT_ID,
  });
};

export const getSignupForm = (req, res) => {
  res.status(200).render("signup", {
    title: "AEROX | Join the Elite",
    googleClientId: process.env.GOOGLE_CLIENT_ID,
  });
};

// ─── CART ────────────────────────────────────────────────────────────────────
export const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    const cartCount = cart
      ? cart.items.reduce((acc, curr) => acc + curr.quantity, 0)
      : 0;

    let totalPrice = 0;
    if (cart) {
      totalPrice = cart.items.reduce((acc, item) => {
        const price = item.product ? item.product.price || 0 : 0;
        return acc + price * item.quantity;
      }, 0);
    }

    res.status(200).render("cart", {
      title: "AEROX | Your Arsenal Loadout",
      cart,
      cartCount,
      totalPrice,
      user: req.user ? req.user.toObject() : null,
    });
  } catch (err) {
    next(err);
  }
};

// ─── CHECKOUT ────────────────────────────────────────────────────────────────
export const getCheckout = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    let totalPrice = 0;
    if (cart) {
      totalPrice = cart.items.reduce((acc, item) => {
        const price = item.product ? item.product.price || 0 : 0;
        return acc + price * item.quantity;
      }, 0);
    }
    const cartCount = cart
      ? cart.items.reduce((acc, curr) => acc + curr.quantity, 0)
      : 0;

    res.status(200).render("checkout", {
      title: "AEROX | Finalize Deployment Parameters",
      cart,
      cartCount,
      totalPrice,
      user: req.user ? req.user.toObject() : null,
    });
  } catch (err) {
    next(err);
  }
};

// ─── MY ACCOUNT ──────────────────────────────────────────────────────────────
export const getAccount = async (req, res, next) => {
  try {
    const cartCount = await getCartCount(req.user._id);
    res.status(200).render("account", {
      title: "AEROX | Profile Settings",
      user: req.user ? req.user.toObject() : null,
      cartCount,
    });
  } catch (err) {
    next(err);
  }
};

// ─── MY ORDERS ───────────────────────────────────────────────────────────────
export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort("-createdAt");
    const cartCount = await getCartCount(req.user._id);

    res.status(200).render("orders", {
      title: "AEROX | Dispatch Logistics Records",
      orders,
      cartCount,
      user: req.user ? req.user.toObject() : null,
    });
  } catch (err) {
    next(err);
  }
};
