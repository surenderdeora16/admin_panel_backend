const mongoose = require("mongoose")
const Schema = mongoose.Schema

const BatchSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Batch name is required"],
      trim: true,
      maxlength: [100, "Batch name cannot exceed 100 characters"],
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    image: {
      type: String,
      default: null,
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

// Create text index for search optimization
BatchSchema.index({ name: "text", description: "text" })

// Pre-find middleware to exclude soft-deleted records
BatchSchema.pre(/^find/, function (next) {
  this.where({ deletedAt: null })
  next()
})

module.exports = mongoose.model("Batch", BatchSchema)
