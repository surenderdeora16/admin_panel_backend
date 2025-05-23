const Subject = require("../../models/Subject");
const Chapter = require("../../models/Chapter");
const Topic = require("../../models/Topic");
const Question = require("../../models/Question");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

// Get all subjects with pagination and search
exports.getSubjects = async (req, res) => {
  try {
    const {
      limit = 10,
      pageNo = 1,
      query = "",
      orderBy = "name",
      orderDirection = 1,
    } = req.query;

    const skip = (pageNo - 1) * limit;
    const sortOrder = Number(orderDirection) === 1 ? 1 : -1;

    // Create search filter
    const searchFilter = {
      deletedAt: null, // Only show records where deletedAt is null
      ...(query
        ? {
            $or: [
              { name: { $regex: query, $options: "i" } },
              { description: { $regex: query, $options: "i" } },
            ],
          }
        : {}),
    };

    // Count total documents
    const totalCount = await Subject.countDocuments(searchFilter);

    // Get subjects with pagination
    const subjects = await Subject.find(searchFilter)
      .sort({ [orderBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    if (!subjects || subjects.length === 0) {
      return res.noRecords("No subjects found");
    }

    // Get chapter counts for each subject
    const subjectsWithCounts = await Promise.all(
      subjects.map(async (subject) => {
        const chapterCount = await Chapter.countDocuments({
          subjectId: subject._id,
          deletedAt: null, // Only count active chapters
        });

        return {
          ...subject,
          chapterCount,
        };
      })
    );

    return res.pagination(
      subjectsWithCounts,
      totalCount,
      limit,
      Number(pageNo)
    );
  } catch (error) {
    console.error("Error in getSubjects:", error);
    return res.someThingWentWrong(error);
  }
};

// Get subject by ID
exports.getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid subject ID format",
      });
    }

    const subject = await Subject.findOne({ _id: id, deletedAt: null }).lean();

    if (!subject) {
      return res.noRecords("Subject not found");
    }

    // Get counts for active records only
    const chapterCount = await Chapter.countDocuments({
      subjectId: subject._id,
      deletedAt: null,
    });

    const topicCount = await Topic.countDocuments({
      subjectId: subject._id,
      deletedAt: null,
    });

    const questionCount = await Question.countDocuments({
      subjectId: subject._id,
      deletedAt: null,
    });

    return res.success({
      ...subject,
      chapterCount,
      topicCount,
      questionCount,
    });
  } catch (error) {
    console.error("Error in getSubjectById:", error);
    return res.someThingWentWrong(error);
  }
};

// Create new subject
exports.createSubject = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check for existing active subject with same name
    const existingSubject = await Subject.findOne({
      deletedAt: null,
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    // if (existingSubject) {
    //   return res.status(409).json({
    //     status: false,
    //     message: "Subject with this name already exists",
    //   });
    // }

    // Create new subject
    const subject = new Subject({
      name,
      description,
      createdBy: req.admin._id,
    });

    await subject.save();

    return res.successInsert(subject, "Subject created successfully");
  } catch (error) {
    console.error("Error in createSubject:", error);
    return res.someThingWentWrong(error);
  }
};

// Update subject
exports.updateSubject = async (req, res) => {
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
    const { name, description, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid subject ID format",
      });
    }

    // Check if active subject exists
    const subject = await Subject.findOne({ _id: id, deletedAt: null });
    if (!subject) {
      return res.noRecords("Subject not found");
    }

    // Check for name conflict with active subjects
    if (name && name !== subject.name) {
      const existingSubject = await Subject.findOne({
        _id: { $ne: id },
        deletedAt: null,
        name: { $regex: new RegExp(`^${name}$`, "i") },
      });

      if (existingSubject) {
        return res.status(409).json({
          status: false,
          message: "Subject with this name already exists",
        });
      }
    }

    // Update subject
    subject.name = name || subject.name;
    subject.description =
      description !== undefined ? description : subject.description;
    subject.status = status !== undefined ? status : subject.status;
    subject.updatedBy = req.admin._id;

    await subject.save();

    return res.successUpdate(subject);
  } catch (error) {
    console.error("Error in updateSubject:", error);
    return res.someThingWentWrong(error);
  }
};

// Soft delete subject
exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid subject ID format",
      });
    }

    // Check if active subject exists
    const subject = await Subject.findOne({ _id: id, deletedAt: null });
    if (!subject) {
      return res.noRecords("Subject not found");
    }

    // Check for active chapters
    const chapterCount = await Chapter.countDocuments({
      subjectId: id,
      deletedAt: null,
    });

    if (chapterCount > 0) {
      return res.status(409).json({
        status: false,
        message:
          "Cannot delete subject with existing chapters. Delete chapters first.",
      });
    }

    // Perform soft delete
    await Subject.findByIdAndUpdate(
      id,
      {
        $set: {
          deletedAt: new Date(),
          updatedBy: req.admin._id,
        },
      },
      { new: true }
    );

    return res.successDelete([], "Subject deleted successfully");
  } catch (error) {
    console.error("Error in deleteSubject:", error);
    return res.someThingWentWrong(error);
  }
};
