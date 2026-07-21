import Component from "../models/componentModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import APIFeatures from "../utils/APIFeatures.js"; // 💡 Import your class here!

// 🔍 GET ALL COMPONENTS (Using your clean APIFeatures class)
export const getAllComponents = catchAsync(async (req, res, next) => {
  // 1) Execute features chain: Filter -> Sort -> Limit Fields -> Paginate
  const features = new APIFeatures(Component.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const components = await features.query;

  // 2) Send the response
  res.status(200).json({
    status: "success",
    results: components.length,
    data: { components },
  });
});

// 🔍 GET SINGLE COMPONENT
export const getComponent = catchAsync(async (req, res, next) => {
  const component = await Component.findById(req.params.id);

  if (!component) {
    return next(new AppError("No component found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { component },
  });
});

// ⚡ CREATE COMPONENT (Admin Only)
export const createComponent = catchAsync(async (req, res, next) => {
  const newComponent = await Component.create(req.body);

  res.status(201).json({
    status: "success",
    data: { component: newComponent },
  });
});

// ⚡ UPDATE COMPONENT (Admin Only)
export const updateComponent = catchAsync(async (req, res, next) => {
  const component = await Component.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!component) {
    return next(new AppError("No component found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { component },
  });
});

// ⚡ DELETE COMPONENT (Admin Only)
export const deleteComponent = catchAsync(async (req, res, next) => {
  const component = await Component.findByIdAndDelete(req.params.id);

  if (!component) {
    return next(new AppError("No component found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
