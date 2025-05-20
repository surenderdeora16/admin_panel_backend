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
    examPlanId: {
      type: Schema.Types.ObjectId,
      ref: "ExamPlan",
      required: [true, "Exam Plan is required"],
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
    isFree: {
      type: Boolean,
      default: false,
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

// Create composite index for faster exam plan + subject queries
NoteSchema.index({ examPlanId: 1, subjectId: 1 })

// Pre-find middleware to exclude soft-deleted records
NoteSchema.pre(/^find/, function (next) {
  this.where({ deletedAt: null })
  next()
})

module.exports = mongoose.model("Note", NoteSchema)
