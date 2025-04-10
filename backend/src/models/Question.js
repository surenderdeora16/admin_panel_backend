const mongoose = require("mongoose")
const Schema = mongoose.Schema

const QuestionSchema = new Schema(
  {
    questionText: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
      maxlength: [2000, "Question text cannot exceed 2000 characters"],
    },
    questionType: {
      type: String,
      enum: ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_BLANK", "DESCRIPTIVE"],
      default: "MULTIPLE_CHOICE",
    },
    options: [
      {
        optionText: {
          type: String,
          required: true,
          trim: true,
          maxlength: [500, "Option text cannot exceed 500 characters"],
        },
        isCorrect: {
          type: Boolean,
          default: false,
        },
      },
    ],
    correctAnswer: {
      type: String,
      trim: true,
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: [2000, "Explanation cannot exceed 2000 characters"],
    },
    difficultyLevel: {
      type: String,
      enum: ["EASY", "MEDIUM", "HARD"],
      default: "MEDIUM",
    },
    marks: {
      correct: {
        type: Number,
        default: 1,
      },
      negative: {
        type: Number,
        default: 0,
      },
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      required: [true, "Topic is required"],
      index: true,
    },
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: "Chapter",
      required: [true, "Chapter is required"],
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
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
QuestionSchema.index({ questionText: "text", explanation: "text", tags: "text" })

// Create compound index for efficient filtering
QuestionSchema.index({ subjectId: 1, chapterId: 1, topicId: 1, status: 1 })

module.exports = mongoose.model("Question", QuestionSchema)
