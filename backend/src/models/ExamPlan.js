const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ExamPlanSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Exam plan title is required"],
      trim: true,
      maxlength: [200, "Exam plan title cannot exceed 200 characters"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: [true, "Batch is required"],
      index: true,
    },
    image: {
      type: String,
      default: null,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    mrp: {
      type: Number,
      required: [true, "MRP is required"],
      min: [0, "MRP cannot be negative"],
    },
    validityDays: {
      type: Number,
      required: [true, "Validity days is required"],
      min: [1, "Validity must be at least 1 day"],
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    sequence: {
      type: Number,
      default: 0,
    },
    status: {
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

// Create text index for search optimization
ExamPlanSchema.index({ title: "text", description: "text" })

// Pre-find middleware to exclude soft-deleted records
ExamPlanSchema.pre(/^find/, function (next) {
  this.where({ deletedAt: null })
  next()
})

module.exports = mongoose.model("ExamPlan", ExamPlanSchema)
