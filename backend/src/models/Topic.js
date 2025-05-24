const mongoose = require("mongoose")
const Schema = mongoose.Schema

const TopicSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Topic name is required"],
      trim: true,
      maxlength: [100, "Topic name cannot exceed 100 characters"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
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
    sequence: {
      type: Number,
      default: 0,
    },
    questionCount: {
      type: Number,
      default: 0,
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

// Create compound index for chapter+topic uniqueness
TopicSchema.index({ chapterId: 1, name: 1 })

// Create text index for search optimization
TopicSchema.index({ name: "text", description: "text" })

// Add error handling for duplicate entries
TopicSchema.post("save", (error, doc, next) => {
  if (error.name === "MongoError" && error.code === 11000) {
    next(new Error("Topic with this name already exists for this chapter"))
  } else {
    next(error)
  }
})

module.exports = mongoose.model("Topic", TopicSchema)
