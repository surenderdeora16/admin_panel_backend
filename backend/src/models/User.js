const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 10,
      maxlength: 10,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "user/avatar.png",
      get: (value) => `${process.env.BASEURL}/uploads/user/${value}`,
    },
    password: { type: String, required: true, select: false },
    device_token: {
      type: String,
      default: null,
    },
    device_id: {
      type: String,
      default: null,
    },
    status: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toObject: { getters: true },
    toJSON: { getters: true },
  }
);

// Indexes for performance
UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
UserSchema.index({ mobile: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });


// Password hashing middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// JWT Token Generation
UserSchema.methods.getToken = function () {
  return jwt.sign({ subject: this._id }, process.env.ENCRYPTION_KEY, {
    expiresIn: "2d",
  });
};

// Password Verification
UserSchema.methods.checkPassword = async function (password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model("User", UserSchema);
