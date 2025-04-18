const mongoose = require("mongoose")
const Schema = mongoose.Schema

const UserPurchaseSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
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
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: [true, "Payment is required"],
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
    },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "CANCELLED"],
      default: "ACTIVE",
    },
    metadata: {
      type: Object,
      default: {},
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["ACTIVE", "EXPIRED", "CANCELLED"],
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
UserPurchaseSchema.pre(/^find/, function (next) {
  this.where({ deletedAt: null })
  next()
})

// Method to add status history
UserPurchaseSchema.methods.addStatusHistory = function (status, note = "") {
  this.statusHistory.push({
    status,
    timestamp: new Date(),
    note,
  })
  this.status = status
  return this
}

// Create compound index for user and item
UserPurchaseSchema.index({ userId: 1, itemType: 1, itemId: 1 })

module.exports = mongoose.model("UserPurchase", UserPurchaseSchema)
