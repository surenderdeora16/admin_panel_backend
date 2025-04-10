const Topic = require("../../models/Topic");
const Chapter = require("../../models/Chapter");
const Subject = require("../../models/Subject");
const Question = require("../../models/Question");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

// Get all topics with pagination and search
exports.getTopics = async (req, res) => {
  try {
    const {
      limit = 10,
      pageNo = 1,
      query = "",
      subjectId = null,
      chapterId = null,
      orderBy = "name",
      orderDirection = 1,
    } = req.query;

    const skip = (pageNo - 1) * limit;
    const sortOrder = Number(orderDirection) === 1 ? 1 : -1;

    // Create search filter
    const searchFilter = {
      deletedAt: null, // Only active topics
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

    if (chapterId && mongoose.Types.ObjectId.isValid(chapterId)) {
      searchFilter.chapterId = mongoose.Types.ObjectId(chapterId);
    }

    // Count total documents
    const totalCount = await Topic.countDocuments(searchFilter);

    // Get topics with pagination
    const topics = await Topic.find(searchFilter)
      .populate("subjectId", "name")
      .populate("chapterId", "name")
      .sort({ [orderBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    if (!topics || topics.length === 0) {
      return res.noRecords("No topics found");
    }

    // Get question counts for active questions only
    const topicsWithCounts = await Promise.all(
      topics.map(async (topic) => {
        const questionCount = await Question.countDocuments({
          topicId: topic._id,
          deletedAt: null,
        });

        return {
          ...topic,
          questionCount,
        };
      })
    );

    return res.pagination(topicsWithCounts, totalCount, limit, Number(pageNo));
  } catch (error) {
    console.error("Error in getTopics:", error);
    return res.someThingWentWrong(error);
  }
};

// Get topic by ID
exports.getTopicById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid topic ID format",
      });
    }

    const topic = await Topic.findOne({ _id: id, deletedAt: null })
      .populate("subjectId", "name")
      .populate("chapterId", "name")
      .lean();

    if (!topic) {
      return res.noRecords("Topic not found");
    }

    // Get active question count
    const questionCount = await Question.countDocuments({
      topicId: topic._id,
      deletedAt: null,
    });

    return res.success({
      ...topic,
      questionCount,
    });
  } catch (error) {
    console.error("Error in getTopicById:", error);
    return res.someThingWentWrong(error);
  }
};

// Create new topic
exports.createTopic = async (req, res) => {
  try {
    const { name, description, chapterId, sequence } = req.body;

    // Check if chapter exists and is active
    const chapter = await Chapter.findOne({ 
      _id: chapterId, 
      deletedAt: null 
    });
    
    if (!chapter) {
      return res.status(404).json({
        status: false,
        message: "Chapter not found or deleted",
      });
    }

    // Check for existing active topic with same name in chapter
    const existingTopic = await Topic.findOne({
      chapterId,
      deletedAt: null,
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, "i") } },
      ],
    });

    if (existingTopic) {
      return res.status(409).json({
        status: false,
        message: "Topic with this name already exists for this chapter",
      });
    }

    // Get max sequence if not provided
    let topicSequence = sequence;
    if (!topicSequence) {
      const maxSequenceTopic = await Topic.findOne({ 
        chapterId, 
        deletedAt: null 
      })
      .sort({ sequence: -1 })
      .limit(1);

      topicSequence = maxSequenceTopic ? maxSequenceTopic.sequence + 1 : 1;
    }

    // Create new topic
    const topic = new Topic({
      name,
      description,
      chapterId,
      subjectId: chapter.subjectId,
      sequence: topicSequence,
      createdBy: req.admin._id,
    });

    await topic.save();

    return res.successInsert(topic, "Topic created successfully");
  } catch (error) {
    console.error("Error in createTopic:", error);
    return res.someThingWentWrong(error);
  }
};

// Update topic
exports.updateTopic = async (req, res) => {
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
    const { name, description, chapterId, sequence, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid topic ID format",
      });
    }

    // Check if active topic exists
    const topic = await Topic.findOne({ _id: id, deletedAt: null });
    if (!topic) {
      return res.noRecords("Topic not found or deleted");
    }

    // Validate chapter if being changed
    let subjectId = topic.subjectId;
    if (chapterId && chapterId !== topic.chapterId.toString()) {
      const chapter = await Chapter.findOne({ 
        _id: chapterId, 
        deletedAt: null 
      });
      
      if (!chapter) {
        return res.status(404).json({
          status: false,
          message: "Chapter not found or deleted",
        });
      }
      subjectId = chapter.subjectId;
    }

    // Check for name conflicts in target chapter
    const finalChapterId = chapterId || topic.chapterId;
    if (name || chapterId) {
      const conflictFilter = {
        _id: { $ne: id },
        chapterId: finalChapterId,
        deletedAt: null,
        $or: []
      };

      if (name) conflictFilter.$or.push({ name: new RegExp(`^${name}$`, "i") });

      if (conflictFilter.$or.length > 0) {
        const existingTopic = await Topic.findOne(conflictFilter);
        if (existingTopic) {
          return res.status(409).json({
            status: false,
            message: "Topic with this name already exists in target chapter",
          });
        }
      }
    }

    // Update topic fields
    topic.name = name || topic.name;
    topic.description = description ?? topic.description;
    topic.chapterId = finalChapterId;
    topic.subjectId = subjectId;
    topic.sequence = sequence ?? topic.sequence;
    topic.status = status ?? topic.status;
    topic.updatedBy = req.admin._id;

    await topic.save();

    // Update active questions if chapter changed
    if (chapterId && chapterId !== topic.chapterId.toString()) {
      await Question.updateMany(
        { 
          topicId: topic._id,
          deletedAt: null 
        },
        {
          chapterId: finalChapterId,
          subjectId: subjectId,
        }
      );
    }

    return res.successUpdate(topic);
  } catch (error) {
    console.error("Error in updateTopic:", error);
    return res.someThingWentWrong(error);
  }
};

// Soft delete topic
exports.deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid topic ID format",
      });
    }

    // Check if active topic exists
    const topic = await Topic.findOne({ _id: id, deletedAt: null });
    if (!topic) {
      return res.noRecords("Topic not found or already deleted");
    }

    // Check for active questions
    const questionCount = await Question.countDocuments({ 
      topicId: id,
      deletedAt: null 
    });
    
    if (questionCount > 0) {
      return res.status(409).json({
        status: false,
        message: "Cannot delete topic with active questions",
      });
    }

    // Perform soft delete
    await Topic.findByIdAndUpdate(
      id,
      {
        $set: {
          deletedAt: new Date(),
          updatedBy: req.admin._id
        }
      },
      { new: true }
    );

    return res.successDelete([], "Topic deleted successfully");
  } catch (error) {
    console.error("Error in deleteTopic:", error);
    return res.someThingWentWrong(error);
  }
};