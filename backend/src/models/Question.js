const mongoose = require("mongoose")
const Schema = mongoose.Schema

const QuestionSchema = new Schema(
  {
    questionText: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    option1: {
      type: String,
      required: [true, "Option 1 is required"],
      trim: true,
    },
    option2: {
      type: String,
      required: [true, "Option 2 is required"],
      trim: true,
    },
    option3: {
      type: String,
      required: true,
      trim: true,
    },
    option4: {
      type: String,
      required: true,
      trim: true,
    },
    option5: {
      type: String,
      trim: true,
    },
    rightAnswer: {
      type: String,
      required: [true, "Right answer is required"],
      enum: ["option1", "option2", "option3", "option4", "option5"],
    },
    explanation: {
      type: String,
      trim: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
      index: true,
    },
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: "Chapter",
      required: [true, "Chapter is required"],
      index: true,
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      required: [true, "Topic is required"],
      index: true,
    },
    correctMarks: {
      type: Number,
      default: 1,
    },
    negativeMarks: {
      type: Number,
      default: 0.25,
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
QuestionSchema.index({ questionText: "text" })

module.exports = mongoose.model("Question", QuestionSchema)
