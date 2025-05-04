const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ChapterSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Chapter name is required"],
      trim: true,
      maxlength: [100, "Chapter name cannot exceed 100 characters"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
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

// Create compound index for subject+chapter uniqueness
ChapterSchema.index({ subjectId: 1, name: 1 }, { unique: true })
// ChapterSchema.index({ subjectId: 1, code: 1 }, { unique: true })

// Create text index for search optimization
ChapterSchema.index({ name: "text", description: "text" })

// Add error handling for duplicate entries
ChapterSchema.post("save", (error, doc, next) => {
  if (error.name === "MongoError") {
    next(new Error("Chapter with this name already exists for this subject"))
  } else {
    next(error)
  }
})

module.exports = mongoose.model("Chapter", ChapterSchema)
  