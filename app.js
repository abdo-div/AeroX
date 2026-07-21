import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";

// Utility & Global Handlers
import gadgetRouter from "./routes/gadgetRoutes.js";
import userRouter from "./routes/userRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";
import componentRouter from "./routes/componentRouter.js";
import orderRouter from "./routes/orderRoutes.js";
import cartRouter from "./routes/cartRoutes.js";
import offerRouter from "./routes/offerRoutes.js";
import checkoutRouter, { webhookRouter } from "./routes/checkoutRoutes.js";
import viewRouter from "./routes/viewRoutes.js";
// Setup __dirname workaround for ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Stripe webhook needs raw body — must come before express.json()
app.use("/webhook", webhookRouter);

app.set("query parser", "extended");
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(cors());
app.options(/(.*)/, cors());

app.use(express.static(path.join(__dirname, "public")));

// Set security HTTP headers
// Set security HTTP headers with custom Content Security Policy (CSP) settings
app.use(
  helmet({
    // 1. THIS FIXES THE BLANK POPUP ISSUE
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },

    // 2. CSP DIRECTIVES FOR GOOGLE AUTH
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", "data:", "blob:"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        scriptSrc: [
          "'self'",
          "https://cdn.tailwindcss.com",
          "https://accounts.google.com/gsi/client", // Explicit script path
          "https://*.googleusercontent.com",
          "https://accounts.google.com",
          "'unsafe-inline'",
        ],
        styleSrc: ["'self'", "https:", "'unsafe-inline'"],
        imgSrc: [
          "'self'",
          "https:",
          "data:",
          "https://*.googleusercontent.com",
        ], // Allows user Google profile pictures
        connectSrc: [
          "'self'",
          "https:",
          "wss:",
          "https://accounts.google.com/gsi/",
        ],
        frameSrc: [
          "'self'",
          "https://accounts.google.com",
          "https://accounts.google.com/gsi/", // Allows Google Auth iframe/popup
        ],
      },
    },
  }),
);
// Development logging profile
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1 hour window
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// Parsing incoming bodies & cookies into req.body / req.cookies
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Cyber Security: Data sanitization against NoSQL query injection
app.use((req, res, next) => {
  Object.defineProperty(req, "query", {
    value: req.query,
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
});

app.use(mongoSanitize());

// Cyber Security: Data sanitization against Cross-Site Scripting (XSS)
app.use(xss());

app.use(
  hpp({
    whitelist: [
      "price",
      "rating",
      "brand",
      "category",
      "stock",
      "connectivity",
    ],
  }),
);

app.use(compression());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});
// 2) Bind the gadgetRouter to your base endpoint
app.use("/api/v1/gadgets", gadgetRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/components", componentRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/carts", cartRouter);
app.use("/api/v1/offers", offerRouter);
app.use("/api/v1/checkout", checkoutRouter);
app.use("/", viewRouter);

app.get("/", (req, res) => {
  res.send("🚀 AeroX connection test is live and running!");
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("💥 GLOBAL ERROR HANDLER:", err);
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode || 500).json({
      status: err.status || "fail",
      message: err.message,
    });
  }
  res.status(err.statusCode || 500).render("error", {
    title: "AEROX | System Error",
    msg: err.message || "Something went wrong.",
  });
});

export default app;
