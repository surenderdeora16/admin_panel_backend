const mongoose = require("mongoose")
const Schema = mongoose.Schema

const PaymentSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      index: true,
    },
    razorpaySignature: {
      type: String,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["INITIATED", "AUTHORIZED", "CAPTURED", "FAILED", "REFUNDED"],
      default: "INITIATED",
    },
    method: {
      type: String,
    },
    bank: {
      type: String,
    },
    cardId: {
      type: String,
    },
    wallet: {
      type: String,
    },
    vpa: {
      type: String,
    },
    email: {
      type: String,
    },
    contact: {
      type: String,
    },
    error: {
      code: String,
      description: String,
      source: String,
      step: String,
      reason: String,
    },
    notes: {
      type: Object,
      default: {},
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["INITIATED", "AUTHORIZED", "CAPTURED", "FAILED", "REFUNDED"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],
    rawResponse: {
      type: Object,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
)

// Pre-find middleware to exclude soft-deleted records
PaymentSchema.pre(/^find/, function (next) {
  this.where({ deletedAt: null })
  next()
})

// Method to add status history
PaymentSchema.methods.addStatusHistory = function (status, note = "") {
  this.statusHistory.push({
    status,
    timestamp: new Date(),
    note,
  })
  this.status = status
  return this
}

module.exports = mongoose.model("Payment", PaymentSchema)
