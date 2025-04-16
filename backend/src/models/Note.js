const mongoose = require("mongoose")
const Schema = mongoose.Schema

const NoteSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Note title is required"],
      trim: true,
      maxlength: [200, "Note title cannot exceed 200 characters"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
      index: true,
    },
    pdfFile: {
      type: String,
      required: [true, "PDF file is required"],
    },
    thumbnailImage: {
      type: String,
      default: null,
    },
    mrp: {
      type: Number,
      required: [true, "MRP is required"],
      min: [0, "MRP cannot be negative"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    validityDays: {
      type: Number,
      default: 180,
      min: [1, "Validity must be at least 1 day"],
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
NoteSchema.index({ title: "text", description: "text" })

// Pre-find middleware to exclude soft-deleted records
NoteSchema.pre(/^find/, function (next) {
  this.where({ deletedAt: null })
  next()
})

module.exports = mongoose.model("Note", NoteSchema)
