const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SectionSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Section name is required"],
      trim: true,
      maxlength: [100, "Section name cannot exceed 100 characters"],
    },
    testSeriesId: {
      type: Schema.Types.ObjectId,
      ref: "TestSeries",
      required: [true, "Test series is required"],
      index: true,
    },
    totalQuestions: {
      type: Number,
      default: 0,
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
  { timestamps: true }
);

// Create compound index for test series + section name uniqueness
SectionSchema.index({ testSeriesId: 1, name: 1 }, { unique: true });

// Pre-find middleware to exclude soft-deleted records
SectionSchema.pre(/^find/, function (next) {
  if (!this.getOptions().withDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

module.exports = mongoose.model("Section", SectionSchema);
