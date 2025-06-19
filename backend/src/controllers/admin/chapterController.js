const Chapter = require("../../models/Chapter");
const Topic = require("../../models/Topic");
const Question = require("../../models/Question");
const Subject = require("../../models/Subject");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

// Get all chapters with pagination and search
exports.getChapters = async (req, res) => {
  try {
    const {
      limit = 10,
      pageNo = 1,
      query = "",
      subjectId = null,
      orderBy = "name",
      orderDirection = 1,
    } = req.query;

    const skip = (pageNo - 1) * limit;
    const sortOrder = Number(orderDirection) === 1 ? 1 : -1;

    // Create search filter
    const searchFilter = {
      deletedAt: null, // Only active chapters
    };

    if (query) {
      searchFilter.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
      searchFilter.subjectId = mongoose.Types.ObjectId(subjectId);
    }

    // Count total documents
    const totalCount = await Chapter.countDocuments(searchFilter);

    // Get chapters with pagination
    const chapters = await Chapter.find(searchFilter)
      .populate("subjectId", "name")
      .sort({ [orderBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    if (!chapters || chapters.length === 0) {
      return res.noRecords("No chapters found");
    }

    // Get counts for active records only
    const chaptersWithCounts = await Promise.all(
      chapters.map(async (chapter) => {
        const topicCount = await Topic.countDocuments({
          chapterId: chapter._id,
          deletedAt: null,
        });

        const questionCount = await Question.countDocuments({
          chapterId: chapter._id,
          deletedAt: null,
        });

        return {
          ...chapter,
          topicCount,
          questionCount: topicCount == 0 ? 0 : questionCount,
        };
      })
    );

    return res.pagination(
      chaptersWithCounts,
      totalCount,
      limit,
      Number(pageNo)
    );
  } catch (error) {
    console.error("Error in getChapters:", error);
    return res.someThingWentWrong(error);
  }
};

// Get chapter by ID
exports.getChapterById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid chapter ID format",
      });
    }

    const chapter = await Chapter.findOne({ _id: id, deletedAt: null })
      .populate("subjectId", "name")
      .lean();

    if (!chapter) {
      return res.noRecords("Chapter not found or deleted");
    }

    // Get active counts
    const topicCount = await Topic.countDocuments({
      chapterId: chapter._id,
      deletedAt: null,
    });

    const questionCount = await Question.countDocuments({
      chapterId: chapter._id,
      deletedAt: null,
    });

    return res.success({
      ...chapter,
      topicCount,
      questionCount,
    });
  } catch (error) {
    console.error("Error in getChapterById:", error);
    return res.someThingWentWrong(error);
  }
};

// Get chapters by subject ID
exports.getChaptersBySubjectId = async (req, res) => {
  try {
    const { subjectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid subject ID format",
      });
    }

    // Aggregate chapters with topic and question counts
    const chapters = await Chapter.aggregate([
      {
        $match: {
          subjectId: new mongoose.Types.ObjectId(subjectId),
          deletedAt: null,
        },
      },
      { $sort: { sequence: 1 } }, // Sort by sequence
      {
        $lookup: {
          from: "topics",
          localField: "_id",
          foreignField: "chapterId",
          as: "topics",
          pipeline: [{ $match: { deletedAt: null } }],
        },
      },
      {
        $lookup: {
          from: "questions",
          localField: "_id",
          foreignField: "chapterId",
          as: "questions",
          pipeline: [{ $match: { deletedAt: null } }],
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          subjectId: 1,
          sequence: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          topicCount: { $size: "$topics" },
          questionCount: { $size: "$questions" },
        },
      },
    ]);

    if (!chapters || chapters.length === 0) {
      return res.noRecords("No chapters found for the given subject");
    }

    return res.success(chapters);
  } catch (error) {
    console.error("Error in getChaptersBySubjectId:", error);
    return res.someThingWentWrong(error);
  }
};

// Create new chapter
exports.createChapter = async (req, res) => {
  try {
    const { name, description, subjectId, sequence } = req.body;

    if (!subjectId) {
      return res.status(400).json({
        status: false,
        message: "Subject ID is required",
      });
    }

    // Check if active subject exists
    const subject = await Subject.findOne({
      _id: subjectId,
      deletedAt: null,
    });
    if (!subject) {
      return res.status(404).json({
        status: false,
        message: "Subject not found or deleted",
      });
    }

    // Check for existing active chapter
    const existingChapter = await Chapter.findOne({
      subjectId,
      deletedAt: null,
      $or: [{ name: { $regex: new RegExp(`^${name}$`, "i") } }],
    });

    if (existingChapter) {
      return res.status(409).json({
        status: false,
        message: "Chapter with this name already exists for subject",
      });
    }

    // Get sequence from active chapters
    let chapterSequence = sequence;
    if (!chapterSequence) {
      const maxSequenceChapter = await Chapter.findOne({
        subjectId,
        deletedAt: null,
      })
        .sort({ sequence: -1 })
        .limit(1);

      chapterSequence = maxSequenceChapter
        ? maxSequenceChapter.sequence + 1
        : 1;
    }
    // Create new chapter
    const chapter = new Chapter({
      name,
      description,
      subjectId,
      sequence: chapterSequence,
      createdBy: req.admin._id,
    });
    await chapter.save();

    return res.successInsert(chapter, "Chapter created successfully");
  } catch (error) {
    console.error("Error in createChapter:", error);
    return res.someThingWentWrong(error);
  }
};

// Update chapter
exports.updateChapter = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { name, description, subjectId, sequence, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid chapter ID format",
      });
    }

    // Check if active chapter exists
    const chapter = await Chapter.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!chapter) {
      return res.noRecords("Chapter not found or deleted");
    }

    // Validate new subject if changing
    let finalSubjectId = chapter.subjectId;
    if (subjectId && subjectId !== chapter.subjectId.toString()) {
      const subject = await Subject.findOne({
        _id: subjectId,
        deletedAt: null,
      });

      if (!subject) {
        return res.status(404).json({
          status: false,
          message: "Subject not found or deleted",
        });
      }
      finalSubjectId = subjectId;
    }

    // Check for name conflicts
    if (name || subjectId) {
      const conflictFilter = {
        _id: { $ne: id },
        subjectId: finalSubjectId,
        deletedAt: null,
        $or: [],
      };

      if (name)
        conflictFilter.$or.push({
          name: new RegExp(`^${name}$`, "i"),
        });

      if (conflictFilter.$or.length > 0) {
        const existingChapter = await Chapter.findOne(conflictFilter);
        if (existingChapter) {
          return res.status(409).json({
            status: false,
            message: "Chapter with this name exists in target subject",
          });
        }
      }
    }

    // Update chapter
    chapter.name = name || chapter.name;
    chapter.description = description ?? chapter.description;
    chapter.subjectId = finalSubjectId;
    chapter.sequence = sequence ?? chapter.sequence;
    chapter.status = status ?? chapter.status;
    chapter.updatedBy = req.admin._id;

    await chapter.save();

    // Update active related documents if subject changed
    if (subjectId && subjectId !== chapter.subjectId.toString()) {
      await Topic.updateMany(
        {
          chapterId: chapter._id,
          deletedAt: null,
        },
        { subjectId: finalSubjectId }
      );

      await Question.updateMany(
        {
          chapterId: chapter._id,
          deletedAt: null,
        },
        { subjectId: finalSubjectId }
      );
    }

    return res.successUpdate(chapter);
  } catch (error) {
    console.error("Error in updateChapter:", error);
    return res.someThingWentWrong(error);
  }
};

// Soft delete chapter
exports.deleteChapter = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid chapter ID format",
      });
    }

    // Check if active chapter exists
    const chapter = await Chapter.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!chapter) {
      return res.noRecords("Chapter not found or already deleted");
    }

    // Check for active topics
    const topicCount = await Topic.countDocuments({
      chapterId: id,
      deletedAt: null,
    });

    if (topicCount > 0) {
      return res.status(409).json({
        status: false,
        message: "Cannot delete chapter with active topics, delete Topic first",
      });
    }

    // Perform soft delete
    await Chapter.findByIdAndUpdate(
      id,
      {
        $set: {
          deletedAt: new Date(),
          updatedBy: req.admin._id,
        },
      },
      { new: true }
    );

    return res.successDelete([], "Chapter deleted successfully");
  } catch (error) {
    console.error("Error in deleteChapter:", error);
    return res.someThingWentWrong(error);
  }
};
