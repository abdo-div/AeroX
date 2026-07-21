import User from "./../models/userModel.js";
import catchAsync from "./../utils/catchAsync.js";
import AppError from "./../utils/appError.js";
import multer from "multer";
import sharp from "sharp";

const multerStorage = multer.memoryStorage();

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// 🌟 1. THE ME MIDDLEWARE
// Injects the logged-in user's ID into the params so getUser can handle it seamlessly

export const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// 👤 2. USER SELF-SERVICE CONTROLLERS

// Update standard profile details (Name, Email, Phone, etc.)

export const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return res.status(400).json({
      status: "fail",
      message:
        "this route is not for password update please use /updatePassword",
    });
  }
  const filterdbody = filterObj(req.body, "name", "email");
  if (req.file) filterdbody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterdbody, {
    returnDocument: "after",
    runValidators: true,
  });
  res.status(200).json({
    status: "success",
    data: { user: updatedUser },
  });
});

export const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: "success",
    data: { users },
    results: users.length,
  });
});

export const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ status: "fail", message: "user not found" });
  }
  res.status(200).json({
    status: "success",
    data: { user },
  });
});

export const updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!user) {
    return res
      .status(404)
      .json({ status: "fail", message: "no user found with that id" });
  }
  res.status(200).json({
    status: "success",
    data: { user },
  });
});

export const deleteUser = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({
    status: "success",
    data: null,
  });
});

export const createUser = (req, res) => {
  res
    .status(500)
    .json({ status: "error", message: "Please use /signup instead!" });
};

// 2. Filter out non-image files
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

export const uploadUserPhoto = upload.single("photo");

// 3. Process the buffer with Sharp
export const resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // Define the filename and attach it back to req.file so updateMe can read it
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  // Process the image buffer completely in memory and save to your public directory
  await sharp(req.file.buffer)
    .resize(500, 500) // Crops to a perfect square aspect ratio
    .toFormat("jpeg")
    .jpeg({ quality: 90 }) // Compresses quality to save space
    .toFile(`public/images/users/${req.file.filename}`); // Writes it to disk

  next();
});
