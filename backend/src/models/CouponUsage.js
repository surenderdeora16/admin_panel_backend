const mongoose = require("mongoose")
const Schema = mongoose.Schema

const CouponUsageSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    couponId: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      required: [true, "Coupon is required"],
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
      index: true,
    },
    originalAmount: {
      type: Number,
      required: [true, "Original amount is required"],
    },
    discountAmount: {
      type: Number,
      required: [true, "Discount amount is required"],
    },
    finalAmount: {
      type: Number,
      required: [true, "Final amount is required"],
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

// Create compound index for faster lookups
CouponUsageSchema.index({ userId: 1, couponId: 1 })

module.exports = mongoose.model("CouponUsage", CouponUsageSchema)
