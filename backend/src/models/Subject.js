const mongoose = require("mongoose")
const Schema = mongoose.Schema

const SubjectSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
      maxlength: [100, "Subject name cannot exceed 100 characters"],
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
    deletedAt: {
        type: Date,
        default: null
    },
  },
  { timestamps: true },
)

// Create text index for search optimization
SubjectSchema.index({ name: "text", description: "text" })

// Add error handling for duplicate entries
SubjectSchema.post("save", (error, doc, next) => {
  if (error.name === "MongoError") {
    next(new Error("Subject with this name already exists"))
  } else {
    next(error)
  }
})

module.exports = mongoose.model("Subject", SubjectSchema)
