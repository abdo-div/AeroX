import crypto from "crypto";
import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "please tell us your name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "please provied your email address "],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "plese provide a valid email address"],
  },
  photo: {
    type: String,
    default: "default-userInfo.jpg",
  },
  role: {
    type: String,
    enum: ["customer", "moderator", "admin"],
    default: "customer",
  },
  password: {
    type: String,
    required: function () {
      return this.authMethod !== "google";
    },
    mingLength: [8, "A password must have at least 8 characters"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: function () {
      return this.authMethod !== "google";
    },
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "passwords do not match!",
    },
  },
  authMethod: {
    type: String,
    enum: ["local", "google"],
    default: "local",
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// 🔒 SECURITY MIDDLEWARE (HOOKS)

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
});

userSchema.pre("save", function () {
  if (!this.isModified("password") || this.isNew) return;

  this.passwordChangedAt = Date.now() - 1000;
});

userSchema.pre(/^find/, function () {
  this.find({ active: { $ne: false } });
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassowrd,
) {
  return await bcrypt.compare(candidatePassword, userPassowrd);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  // False means the password has NOT been changed since token issuance
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Store a strongly hashed version of the token in the database for security verification
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set token expiration to 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // Return the unhashed raw token to send via email
  return resetToken;
};

const User = mongoose.model("User", userSchema);

export default User;
