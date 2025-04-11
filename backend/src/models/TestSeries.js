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
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: [true, "Exam is required"],
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
    negativeMarks: {
      type: Number,
      default: 0.25,
    },
    passingPercentage: {
      type: Number,
      default: 33,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: Boolean,
      default: true,
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

module.exports = mongoose.model("TestSeries", TestSeriesSchema)
