// src/models/Exam.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ExamSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    testSeriesId: {
      type: Schema.Types.ObjectId,
      ref: "TestSeries",
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["STARTED", "COMPLETED", "ABANDONED"],
      default: "STARTED",
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    attemptedQuestions: {
      type: Number,
      default: 0,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    wrongAnswers: {
      type: Number,
      default: 0,
    },
    skippedQuestions: {
      type: Number,
      default: 0,
    },
    markedForReview: {
      type: Number,
      default: 0,
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    maxScore: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
    },
    sectionTimings: [
      {
        sectionId: {
          type: Schema.Types.ObjectId,
          ref: "Section",
        },
        startTime: {
          type: Date,
        },
        endTime: {
          type: Date,
        },
        totalTimeSpent: {
          type: Number, // in seconds
          default: 0,
        },
      },
    ],
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);


// Add index in Exam model
ExamSchema.index({ status: 1, endTime: 1 }); // For faster expired exam queries
ExamSchema.index({ testSeriesId: 1, totalScore: -1 }); // For faster ranking

// Pre-find middleware to exclude soft-deleted records
ExamSchema.pre(/^find/, function (next) {
  this.where({ deletedAt: null });
  next();
});

module.exports = mongoose.model("Exam", ExamSchema);