// src/models/ExamQuestion.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ExamQuestionSchema = new Schema(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: "Section",
      required: true,
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
      index: true,
    },
    userAnswer: {
      type: String, // option1, option2, etc.
      default: null,
    },
    isCorrect: {
      type: Boolean,
      default: null,
    },
    isMarkedForReview: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["UNATTEMPTED", "ATTEMPTED", "SKIPPED"],
      default: "UNATTEMPTED",
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0,
    },
    visitCount: {
      type: Number,
      default: 0,
    },
    sequence: {
      type: Number,
      required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Pre-find middleware to exclude soft-deleted records
ExamQuestionSchema.pre(/^find/, function (next) {
  this.where({ deletedAt: null });
  next();
});

// Create compound index for exam + section + question uniqueness
ExamQuestionSchema.index({ examId: 1, sectionId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model("ExamQuestion", ExamQuestionSchema);