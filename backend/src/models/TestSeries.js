const mongoose = require("mongoose")
const Schema = mongoose.Schema

const TestSeriesSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Test series title is required"],
      trim: true,
      maxlength: [200, "Test series title cannot exceed 200 characters"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    examPlanId: {
      type: Schema.Types.ObjectId,
      ref: "ExamPlan",
      required: [true, "Exam plan is required"],
      index: true,
    },
    duration: {
      type: Number, // in minutes
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    correctMarks: {
      type: Number,
      default: 1,
    },
    negativeMarks: {
      type: Number,
      default: 0.25,
    },
    passingPercentage: {
      type: Number,
      default: 33,
      min: [0, "Passing percentage cannot be negative"],
      max: [100, "Passing percentage cannot exceed 100"],
    },
    instructions: {
      type: String,
      trim: true,
    },
    isFree: {
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
TestSeriesSchema.index({ title: "text", description: "text" })

// Pre-find middleware to exclude soft-deleted records
TestSeriesSchema.pre(/^find/, function (next) {
  this.where({ deletedAt: null })
  next()
})

module.exports = mongoose.model("TestSeries", TestSeriesSchema)
