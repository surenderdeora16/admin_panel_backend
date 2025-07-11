const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ChapterSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Chapter name is required"],
      trim: true,
      maxlength: [100, "Chapter name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
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



// Add error handling for duplicate entries
// ChapterSchema.post("save", (error, doc, next) => {
//   if (error.name === "MongoError") {
//     next(new Error("Chapter with this name already exists for this subject"))
//   } else {
//     next(error)
//   }
// })

module.exports = mongoose.model("Chapter", ChapterSchema)
  