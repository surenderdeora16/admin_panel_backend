const mongoose = require("mongoose")
const Schema = mongoose.Schema

const OrderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    orderNumber: {
      type: String,
      required: [true, "Order number is required"],
      unique: true,
      index: true,
    },
    itemType: {
      type: String,
      enum: ["EXAM_PLAN", "TEST_SERIES"],
      required: [true, "Item type is required"],
    },
    itemId: {
      type: Schema.Types.ObjectId,
      required: [true, "Item ID is required"],
      refPath: "itemModel",
    },
    itemModel: {
      type: String,
      required: [true, "Item model is required"],
      enum: ["ExamPlan", "TestSeries"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "INR",
    },
    razorpayOrderId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ["CREATED", "PENDING", "PAID", "FAILED", "EXPIRED", "REFUNDED"],
      default: "CREATED",
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
    validUntil: {
      type: Date,
    },
    metadata: {
      type: Object,
      default: {},
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["CREATED", "PENDING", "PAID", "FAILED", "EXPIRED", "REFUNDED"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
)

// Pre-find middleware to exclude soft-deleted records
OrderSchema.pre(/^find/, function (next) {
  this.where({ deletedAt: null })
  next()
})

// Method to add status history
OrderSchema.methods.addStatusHistory = function (status, note = "") {
  this.statusHistory.push({
    status,
    timestamp: new Date(),
    note,
  })
  this.status = status
  return this
}

// Create compound index for user and item
OrderSchema.index({ userId: 1, itemType: 1, itemId: 1 })

module.exports = mongoose.model("Order", OrderSchema)
