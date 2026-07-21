import fs from "fs";
import multer from "multer";
import sharp from "sharp";
import Gadget from "../models/gadgetModel.js";
import Review from "../models/reviewModel.js";
import APIFeatures from "../utils/apiFeatures.js";

// ==========================================
// 📸 HIGH-PERFORMANCE MULTI-IMAGE PROCESSING
// ==========================================
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload only images."), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// Middleware to accept up to 1 cover image and 6 sub-gallery images
export const uploadGadgetImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 6 },
]);

// Resizes, converts to JPEG, compresses, and writes images to disk from memory buffer
export const resizeGadgetImages = async (req, res, next) => {
  try {
    // Parse nested objects from multipart form-data (e.g., specs[connectivity] or specs as a JSON string)
    if (req.body) {
      if (req.body.specs && typeof req.body.specs === "string") {
        try {
          req.body.specs = JSON.parse(req.body.specs);
        } catch (e) {}
      }

      Object.keys(req.body).forEach((key) => {
        const match = key.match(/^(\w+)\[(\w+)\]$/);
        if (match) {
          const [, parent, child] = match;
          if (!req.body[parent]) req.body[parent] = {};
          req.body[parent][child] = req.body[key];
          delete req.body[key];
        }
      });
    }

    if (!req.files || (!req.files.imageCover && !req.files.images))
      return next();

    const uploadDir = "public/images/products";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 1) Process the core Cover Image
    if (req.files.imageCover) {
      req.body.imageCover = `gadget-${req.params.id || "new"}-${Date.now()}-cover.jpeg`;

      await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`${uploadDir}/${req.body.imageCover}`);
    }

    // 2) Process sub-gallery images loop
    if (req.files.images) {
      req.body.images = [];

      await Promise.all(
        req.files.images.map(async (file, i) => {
          const filename = `gadget-${req.params.id || "new"}-${Date.now()}-${i + 1}.jpeg`;

          await sharp(file.buffer)
            .resize(600, 600)
            .toFormat("jpeg")
            .jpeg({ quality: 85 })
            .toFile(`${uploadDir}/${filename}`);

          req.body.images.push(filename);
        }),
      );
    }

    next();
  } catch (err) {
    console.error("🔥 Error in resizeGadgetImages:", err);
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// ==========================================
// ⚙️ CONTROLLER ACTIONS
// ==========================================

// Pre-configures queries for: GET /api/v1/gadgets/top-5-premium
export const aliasTopPremium = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,category,imageCover,slug";
  next();
};

// Get All (Supports filtering, sorting, field limits, and paging)
export const getAllGadgets = async (req, res) => {
  try {
    const features = new APIFeatures(Gadget.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const gadgets = await features.query;

    res.status(200).json({
      status: "success",
      results: gadgets.length,
      data: { gadgets },
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// Get Single (Autopopulates virtual reviews)
export const getGadget = async (req, res) => {
  try {
    const gadget = await Gadget.findById(req.params.id).populate("reviews");
    if (!gadget)
      return res
        .status(404)
        .json({ status: "fail", message: "No gadget found with that ID" });

    res.status(200).json({ status: "success", data: { gadget } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// Create Single
export const createGadget = async (req, res) => {
  try {
    const newGadget = await Gadget.create(req.body);
    res.status(201).json({ status: "success", data: { gadget: newGadget } });
  } catch (err) {
    console.error("🔥 Error in createGadget:", err);
    res
      .status(400)
      .json({ status: "fail", message: err.message, stack: err.stack });
  }
};

// Update Single
export const updateGadget = async (req, res) => {
  try {
    const gadget = await Gadget.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!gadget)
      return res
        .status(404)
        .json({ status: "fail", message: "No gadget found with that ID" });

    res.status(200).json({ status: "success", data: { gadget } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// Delete Single
export const deleteGadget = async (req, res) => {
  try {
    const gadget = await Gadget.findByIdAndDelete(req.params.id);
    if (!gadget)
      return res
        .status(404)
        .json({ status: "fail", message: "No gadget found with that ID" });

    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// Mongoose Aggregate Stats Pipeline
export const getGadgetStats = async (req, res) => {
  try {
    const stats = await Gadget.aggregate([
      { $match: { ratingsAverage: { $gte: 4.0 } } },
      {
        $group: {
          _id: { $toUpper: "$category" },
          numGadgets: { $sum: 1 },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          totalStock: { $sum: "$stock" },
        },
      },
      { $sort: { avgPrice: 1 } },
    ]);

    res.status(200).json({ status: "success", data: { stats } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};
