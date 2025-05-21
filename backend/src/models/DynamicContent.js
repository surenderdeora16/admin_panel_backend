const mongoose = require("mongoose")
const Schema = mongoose.Schema

const DynamicContentSchema = new Schema(
  {
    type: {
      type: String,
      required: [true, "Content type is required"],
      enum: ["PRIVACY_POLICY", "TERMS_CONDITIONS"],
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    status: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("DynamicContent", DynamicContentSchema)
