const mongoose = require("mongoose")
const Schema = mongoose.Schema

const TestSeriesQuestionSchema = new Schema(
  {
    testSeriesId: {
      type: Schema.Types.ObjectId,
      ref: "TestSeries",
      required: [true, "Test series is required"],
      index: true,
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: "Section",
      required: [true, "Section is required"],
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: [true, "Question is required"],
      index: true,
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

// Create compound index for test series + question uniqueness
// TestSeriesQuestionSchema.index({ testSeriesId: 1, questionId: 1 }, { unique: true })
TestSeriesQuestionSchema.index({ testSeriesId: 1, sectionId: 1, questionId: 1 }, { unique: true })


module.exports = mongoose.model("TestSeriesQuestion", TestSeriesQuestionSchema)
