const mongoose = require("mongoose")
const Schema = mongoose.Schema

const CouponSchema = new Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FIXED"],
      required: [true, "Discount type is required"],
    },
    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"],
    },
    maxDiscountAmount: {
      type: Number,
      default: null, // For percentage discounts, can set a maximum discount amount
    },
    minPurchaseAmount: {
      type: Number,
      default: 0, // Minimum purchase amount to apply the coupon
    },
    applicableFor: {
      type: String,
      enum: ["ALL", "EXAM_PLAN", "NOTE"],
      default: "ALL",
    },
    specificItems: [
      {
        itemType: {
          type: String,
          enum: ["EXAM_PLAN", "NOTE"],
        },
        itemId: {
          type: Schema.Types.ObjectId,
          refPath: "specificItems.itemType",
        },
      },
    ],
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
    },
    perUserLimit: {
      type: Number,
      default: 1,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true },
)

// Create index for faster coupon code lookup
CouponSchema.index({ code: 1, isActive: 1 })

// Pre-find middleware to exclude soft-deleted records
CouponSchema.pre(/^find/, function (next) {
  this.where({ deletedAt: null })
  next()
})

// Method to check if coupon is valid
CouponSchema.methods.isValid = function () {
  const now = new Date()

  // Check if coupon is active
  if (!this.isActive) return false

  // Check if coupon is within valid date range
  if (now < this.startDate || now > this.endDate) return false

  // Check if usage limit is reached
  if (this.usageLimit !== null && this.usageCount >= this.usageLimit) return false

  return true
}

// Method to check if coupon is applicable for a specific item
CouponSchema.methods.isApplicableFor = function (itemType, itemId) {
  // If applicable for all items
  if (this.applicableFor === "ALL") return true

  // If applicable for a specific item type
  if (this.applicableFor === itemType) return true

  // If applicable for specific items
  if (this.specificItems && this.specificItems.length > 0) {
    return this.specificItems.some((item) => item.itemType === itemType && item.itemId.toString() === itemId.toString())
  }

  return false
}

// Method to calculate discount amount
CouponSchema.methods.calculateDiscount = function (originalAmount) {
  let discountAmount = 0

  if (this.discountType === "PERCENTAGE") {
    discountAmount = (originalAmount * this.discountValue) / 100

    // Apply maximum discount cap if set
    if (this.maxDiscountAmount !== null && discountAmount > this.maxDiscountAmount) {
      discountAmount = this.maxDiscountAmount
    }
  } else if (this.discountType === "FIXED") {
    discountAmount = this.discountValue

    // Ensure discount doesn't exceed the original amount
    if (discountAmount > originalAmount) {
      discountAmount = originalAmount
    }
  }

  return discountAmount
}

// Method to increment usage count
CouponSchema.methods.incrementUsage = async function () {
  this.usageCount += 1
  await this.save()
}

module.exports = mongoose.model("Coupon", CouponSchema)
