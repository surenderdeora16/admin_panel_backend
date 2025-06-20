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

// Create index for faster exam plan queries
NoteSchema.index({ examPlanId: 1 })

// Pre-find middleware to exclude soft-deleted records
NoteSchema.pre(/^find/, function (next) {
  this.where({ deletedAt: null })
  next()
})


// Auto prepend process.env.BASEURL to pdfFile on save
NoteSchema.pre("save", function (next) {
  if (this.pdfFile && !this.pdfFile.startsWith("http")) {
    this.pdfFile = `${process.env.BASEURL}${this.pdfFile}`;
  }
  next();
});

// Auto prepend process.env.BASEURL to pdfFile on update
NoteSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.pdfFile && !update.pdfFile.startsWith("http")) {
    update.pdfFile = `${process.env.BASEURL}${update.pdfFile}`;
    this.setUpdate(update);
  }
  next();
});


module.exports = mongoose.model("Note", NoteSchema)
