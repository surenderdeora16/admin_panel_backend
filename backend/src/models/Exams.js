const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ExamSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Exam name is required"],
      trim: true,
      maxlength: [100, "Exam name cannot exceed 100 characters"],
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
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
ExamSchema.index({ name: "text", description: "text" })

// Add error handling for duplicate entries
ExamSchema.post("save", (error, doc, next) => {
  if (error.name === "MongoError" && error.code === 11000) {
    next(new Error("Exam with this name already exists"))
  } else {
    next(error)
  }
})

module.exports = mongoose.model("Exam", ExamSchema)
