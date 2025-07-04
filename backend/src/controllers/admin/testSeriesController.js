const TestSeries = require("../../models/TestSeries");
const ExamPlan = require("../../models/ExamPlan");
const Section = require("../../models/Section");
const TestSeriesQuestion = require("../../models/TestSeriesQuestion");
const Question = require("../../models/Question");
const Subject = require("../../models/Subject");
const Chapter = require("../../models/Chapter");
const Topic = require("../../models/Topic");
const UserPurchase = require("../../models/UserPurchase");
const razorpayService = require("../../services/razorpayService"); // Added razorpayService import

// Get all test series with pagination and filters
exports.getTestSeries = async (req, res) => {
  try {
    const { limit, pageNo, query, orderBy, orderDirection, examPlanId } =
      req.query;

    // Build query
    const queryObj = { deletedAt: null };

    if (query) {
      queryObj.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    if (examPlanId) {
      queryObj.examPlanId = examPlanId;
    }

    // Count total records
    const total = await TestSeries.countDocuments(queryObj);

    if (total === 0) {
      return res.datatableNoRecords();
    }

    // Execute query with pagination and sorting
    const testSeries = await TestSeries.find(queryObj)
      .populate({
        path: "examPlanId",
        select: "title batchId",
        populate: {
          path: "batchId",
          select: "name",
        },
      })
      .skip((pageNo - 1) * limit)
      .limit(limit)
      .sort({ [orderBy]: orderDirection === "asc" ? 1 : -1 });

    // Get section counts for each test series
    const testSeriesWithSections = await Promise.all(
      testSeries.map(async (series) => {
        const sectionCount = await Section.countDocuments({
          testSeriesId: series._id,
          deletedAt: null,
        });
        const seriesObj = series.toObject();
        seriesObj.sectionCount = sectionCount;
        return seriesObj;
      })
    );

    return res.pagination(testSeriesWithSections, total, limit, pageNo);
  } catch (error) {
    console.error("Error fetching test series:", error);
    return res.someThingWentWrong(error);
  }
};

// Get a single test series by ID
exports.getTestSeriesById = async (req, res) => {
  try {
    const testSeries = await TestSeries.findOne({
      _id: req.params.id,
      deletedAt: null,
    }).populate({
      path: "examPlanId",
      select: "title batchId",
      populate: {
        path: "batchId",
        select: "name",
      },
    });

    if (!testSeries) {
      return res.noRecords("Test series not found");
    }

    // Get sections for this test series (only not deleted)
    const sections = await Section.find({
      testSeriesId: req.params.id,
      deletedAt: null,
    }).sort({ sequence: 1 });

    // Get question counts for each section (only not deleted)
    const sectionsWithCounts = await Promise.all(
      sections.map(async (section) => {
        const questionCount = await TestSeriesQuestion.countDocuments({
          testSeriesId: req.params.id,
          sectionId: section._id,
          deletedAt: null,
        });
        const sectionObj = section.toObject();
        sectionObj.questionCount = questionCount;
        return sectionObj;
      })
    );

    const result = testSeries.toObject();

    result.sections = sectionsWithCounts;

    return res.success(result);
  } catch (error) {
    console.error("Error fetching test series:", error);
    return res.someThingWentWrong(error);
  }
};

// Create a new test series
exports.createTestSeries = async (req, res) => {
  try {
    const {
      title,
      description,
      examPlanId,
      duration,
      correctMarks,
      negativeMarks,
      passingPercentage,
      instructions,
      isFree,
      sequence,
      status,
      sections,
    } = req.body;

    // Check if exam plan exists
    const examPlan = await ExamPlan.findById(examPlanId);
    if (!examPlan) {
      return res.status(400).json({
        status: false,
        message: "Exam plan not found",
      });
    }

    // Create test series object
    const testSeriesData = {
      title,
      description,
      examPlanId,
      duration: duration || 60,
      correctMarks: correctMarks || 1,
      negativeMarks: negativeMarks || 0.25,
      passingPercentage: passingPercentage || 33,
      instructions,
      isFree:
        isFree !== undefined ? isFree === "true" || isFree === true : false,
      sequence: sequence || 0,
      status:
        status !== undefined ? status === "true" || status === true : true,
      createdBy: req.admin._id,
    };

    // Create new test series
    const testSeries = await TestSeries.create(testSeriesData);

    // Create sections if provided
    if (sections && Array.isArray(sections) && sections.length > 0) {
      const sectionPromises = sections.map(async (section, index) => {
        return Section.create({
          name: section.name,
          testSeriesId: testSeries._id,
          sequence: index,
          status: true,
          createdBy: req.admin._id,
        });
      });

      await Promise.all(sectionPromises);
    } else {
      // Create a default section if none provided
      await Section.create({
        name: "General",
        testSeriesId: testSeries._id,
        sequence: 0,
        status: true,
        createdBy: req.admin._id,
      });
    }

    return res.successInsert(testSeries);
  } catch (error) {
    console.error("Error creating test series:", error);
    return res.someThingWentWrong(error);
  }
};

// Update a test series
exports.updateTestSeries = async (req, res) => {
  try {
    const {
      title,
      description,
      examPlanId,
      duration,
      correctMarks,
      negativeMarks,
      passingPercentage,
      instructions,
      isFree,
      sequence,
      status,
    } = req.body;

    // Find test series
    const testSeries = await TestSeries.findById(req.params.id);

    if (!testSeries) {
      return res.noRecords("Test series not found");
    }

    // Check if exam plan exists if examPlanId is provided
    if (examPlanId && examPlanId !== testSeries.examPlanId.toString()) {
      const examPlan = await ExamPlan.findById(examPlanId);
      if (!examPlan) {
        return res.status(400).json({
          status: false,
          message: "Exam plan not found",
        });
      }
      testSeries.examPlanId = examPlanId;
    }

    // Update test series data
    if (title !== undefined) testSeries.title = title;
    if (description !== undefined) testSeries.description = description;
    if (duration !== undefined) testSeries.duration = duration;
    if (correctMarks !== undefined) testSeries.correctMarks = correctMarks;
    if (negativeMarks !== undefined) testSeries.negativeMarks = negativeMarks;
    if (passingPercentage !== undefined)
      testSeries.passingPercentage = passingPercentage;
    if (instructions !== undefined) testSeries.instructions = instructions;
    if (isFree !== undefined)
      testSeries.isFree = isFree === "true" || isFree === true;
    if (sequence !== undefined) testSeries.sequence = sequence;
    if (status !== undefined)
      testSeries.status = status === "true" || status === true;

    testSeries.updatedBy = req.admin._id;

    // Save updated test series
    await testSeries.save();

    return res.successUpdate(testSeries);
  } catch (error) {
    console.error("Error updating test series:", error);
    return res.someThingWentWrong(error);
  }
};

// Get test series with purchase status
exports.getTestSeriesWithPurchaseStatus = async (req, res) => {
  try {
    const { examPlanId } = req.params;

    // Check if exam plan exists
    const examPlan = await ExamPlan.findById(examPlanId);
    if (!examPlan) {
      return res.status(404).json({
        status: false,
        message: "Exam plan not found",
      });
    }

    // Check if user has purchased the exam plan
    const examPlanPurchase = await UserPurchase.findOne({
      userId: req.admin._id,
      itemType: "EXAM_PLAN",
      itemId: examPlanId,
      status: "ACTIVE",
      expiryDate: { $gt: new Date() },
    });

    const hasExamPlanAccess = !!examPlanPurchase;

    // Get test series for this exam plan
    const testSeries = await TestSeries.find({
      examPlanId,
      status: true,
    }).sort({ sequence: 1 });

    // Process test series to include access status
    const testSeriesWithAccess = testSeries.map((series) => {
      const seriesObj = series.toObject();

      // User can access if:
      // 1. The test series is free, OR
      // 2. The user has purchased the exam plan
      const canAccess = seriesObj.isFree || hasExamPlanAccess;

      return {
        ...seriesObj,
        isAccessible: canAccess,
        requiresPurchase: !seriesObj.isFree && !hasExamPlanAccess,
      };
    });

    return res.status(200).json({
      status: true,
      data: {
        examPlan: {
          _id: examPlan._id,
          title: examPlan.title,
          description: examPlan.description,
          price: examPlan.price,
          mrp: examPlan.mrp,
          validityDays: examPlan.validityDays,
        },
        isPurchased: hasExamPlanAccess,
        testSeries: testSeriesWithAccess,
      },
    });
  } catch (error) {
    console.error("Error fetching test series with purchase status:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch test series",
      error: error.message,
    });
  }
};

// Delete a test series (soft delete)
exports.deleteTestSeries = async (req, res) => {
  try {
    const testSeries = await TestSeries.findById(req.params.id);

    if (!testSeries) {
      return res.noRecords("Test series not found");
    }

    // Soft delete by updating deletedAt
    testSeries.deletedAt = new Date();
    testSeries.updatedBy = req.admin._id;
    await testSeries.save();

    // Also soft delete all associated sections
    await Section.updateMany(
      { testSeriesId: req.params.id },
      { deletedAt: new Date(), updatedBy: req.admin._id }
    );

    // Also soft delete all associated test series questions
    await TestSeriesQuestion.updateMany(
      { testSeriesId: req.params.id },
      { deletedAt: new Date(), updatedBy: req.admin._id }
    );

    return res.successDelete();
  } catch (error) {
    console.error("Error deleting test series:", error);
    return res.someThingWentWrong(error);
  }
};

// Get sections for a test series
exports.getTestSeriesSections = async (req, res) => {
  try {
    const { testSeriesId } = req.params;

    // Check if test series exists
    const testSeries = await TestSeries.findById({_id:testSeriesId, deletedAt: null});
    if (!testSeries) {
      return res.noRecords("Test series not found");
    }

    // Get sections
    const sections = await Section.find({ testSeriesId, deletedAt: null }).sort({ sequence: 1 });

    // Get question counts for each section
    const sectionsWithCounts = await Promise.all(
      sections.map(async (section) => {
        const questionCount = await TestSeriesQuestion.countDocuments({
          testSeriesId,
          sectionId: section._id,
          deletedAt: null
        });
        const sectionObj = section.toObject();
        sectionObj.questionCount = questionCount;
        return sectionObj;
      })
    );

    return res.pagination(
      sectionsWithCounts,
      sectionsWithCounts.length,
      req.query.limit,
      req.query.pageNo
    );
  } catch (error) {
    console.error("Error fetching test series sections:", error);
    return res.someThingWentWrong(error);
  }
};

// Create a section for a test series
exports.createSection = async (req, res) => {
  try {
    const { testSeriesId } = req.params;
    const { name, sequence } = req.body;

    // Check if test series exists
    const testSeries = await TestSeries.findById(testSeriesId);
    if (!testSeries) {
      return res.noRecords("Test series not found");
    }

    // Check if section with same name already exists for this test series
    const existingSection = await Section.findOne({ testSeriesId, name });
    if (existingSection) {
      return res.status(400).json({
        status: false,
        message: "Section with this name already exists for this test series",
      });
    }

    // Create section
    const section = await Section.create({
      name,
      testSeriesId,
      sequence: sequence || 0,
      status: true,
      createdBy: req.admin._id,
    });

    return res.successInsert(section);
  } catch (error) {
    console.error("Error creating section:", error);
    return res.someThingWentWrong(error);
  }
};

// Update a section
exports.updateSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { name, sequence, status } = req.body;

    // Find section
    const section = await Section.findById(sectionId);

    if (!section) {
      return res.noRecords("Section not found");
    }

    // Check if section with same name already exists for this test series (excluding current section)
    if (name && name !== section.name) {
      const existingSection = await Section.findOne({
        testSeriesId: section.testSeriesId,
        name,
        _id: { $ne: sectionId },
      });

      if (existingSection) {
        return res.status(400).json({
          status: false,
          message: "Section with this name already exists for this test series",
        });
      }
    }

    // Update section data
    if (name !== undefined) section.name = name;
    if (sequence !== undefined) section.sequence = sequence;
    if (status !== undefined)
      section.status = status === "true" || status === true;

    section.updatedBy = req.admin._id;

    // Save updated section
    await section.save();

    return res.successUpdate(section);
  } catch (error) {
    console.error("Error updating section:", error);
    return res.someThingWentWrong(error);
  }
};

// Delete a section (soft delete)
exports.deleteSection = async (req, res) => {
  try {
    const { sectionId } = req.params;

    // Find section
    const section = await Section.findById(sectionId);

    if (!section) {
      return res.noRecords("Section not found");
    }

    // Check if section has associated questions
    const questionCount = await TestSeriesQuestion.countDocuments({
      sectionId,
    });

    if (questionCount > 0) {
      return res.status(400).json({
        status: false,
        message:
          "Cannot delete section with associated questions. Please remove the questions first.",
      });
    }

    // Soft delete by updating deletedAt
    section.deletedAt = new Date();
    section.updatedBy = req.admin._id;
    await section.save();

    return res.successDelete();
  } catch (error) {
    console.error("Error deleting section:", error);
    return res.someThingWentWrong(error);
  }
};

// Get questions for a test series section
exports.getSectionQuestions = async (req, res) => {
  try {
    const { testSeriesId, sectionId } = req.params;
    const { limit, pageNo } = req.query;

    // Check if test series and section exist
    const testSeries = await TestSeries.findOne({ _id: testSeriesId, deletedAt: null });
    if (!testSeries) {
      return res.noRecords("Test series not found");
    }

    const section = await Section.findById({_id:sectionId, deletedAt: null});
    if (!section) {
      return res.noRecords("Section not found");
    }

    // Count total records (only not deleted)
    const total = await TestSeriesQuestion.countDocuments({
      testSeriesId,
      sectionId,
      deletedAt: null,
    });

    if (total === 0) {
      return res.datatableNoRecords();
    }

    // Get questions with pagination (only not deleted)
    const testSeriesQuestions = await TestSeriesQuestion.find({
      testSeriesId,
      sectionId,
      deletedAt: null,
    })
      .populate({
        path: "questionId",
        select:
          "questionText option1 option2 option3 option4 option5 rightAnswer explanation",
      })
      .skip((pageNo - 1) * limit)
      .limit(limit)
      .sort({ sequence: 1 });

    return res.pagination(testSeriesQuestions, total, limit, pageNo);
  } catch (error) {
    console.error("Error fetching section questions:", error);
    return res.someThingWentWrong(error);
  }
};

// Add questions to a test series section
exports.addQuestionsToSection = async (req, res) => {
  try {
    const { testSeriesId, sectionId } = req.params;
    const { questionIds } = req.body;

    if (
      !questionIds ||
      !Array.isArray(questionIds) ||
      questionIds.length === 0
    ) {
      return res.status(400).json({
        status: false,
        message: "Question IDs are required",
      });
    }

    // Check if test series and section exist
    const testSeries = await TestSeries.findById(testSeriesId);
    if (!testSeries) {
      return res.noRecords("Test series not found");
    }

    const section = await Section.findById(sectionId);
    if (!section) {
      return res.noRecords("Section not found");
    }

    // Check if questions exist
    const questions = await Question.find({
      _id: { $in: questionIds },
      status: true,
      deletedAt: null,
    });

    if (questions.length !== questionIds.length) {
      return res.status(400).json({
        status: false,
        message: "Some questions do not exist or are inactive",
      });
    }

    // Get existing questions in this section
    const existingQuestions = await TestSeriesQuestion.find({
      testSeriesId,
      sectionId,
      questionId: { $in: questionIds },
    });

    const existingQuestionIds = existingQuestions.map((q) =>
      q.questionId.toString()
    );

    // Filter out questions that are already in the section
    const newQuestionIds = questionIds.filter(
      (id) => !existingQuestionIds.includes(id.toString())
    );

    if (newQuestionIds.length === 0) {
      return res.status(400).json({
        status: false,
        message: "All questions are already in the section",
      });
    }

    // Get the highest sequence number
    const highestSequence = await TestSeriesQuestion.findOne({
      testSeriesId,
      sectionId,
    })
      .sort({ sequence: -1 })
      .select("sequence");

    const startSequence = highestSequence ? highestSequence.sequence + 1 : 1;

    // Create test series questions
    const testSeriesQuestions = newQuestionIds.map((questionId, index) => ({
      testSeriesId,
      sectionId,
      questionId,
      sequence: startSequence + index,
      createdBy: req.admin._id,
    }));

    // Insert test series questions
    await TestSeriesQuestion.insertMany(testSeriesQuestions);

    // Update test series total questions count
    await TestSeries.findByIdAndUpdate(testSeriesId, {
      $inc: { totalQuestions: newQuestionIds.length },
    });

    // Update section total questions count
    await Section.findByIdAndUpdate(sectionId, {
      $inc: { totalQuestions: newQuestionIds.length },
    });

    return res.success({
      addedCount: newQuestionIds.length,
      message: `${newQuestionIds.length} questions added to section successfully`,
    });
  } catch (error) {
    console.error("Error adding questions to section:", error);
    return res.someThingWentWrong(error);
  }
};

// Remove questions from a test series section
exports.removeQuestionsFromSection = async (req, res) => {
  try {
    const { testSeriesId, sectionId } = req.params;
    const { questionIds } = req.body;

    if (
      !questionIds ||
      !Array.isArray(questionIds) ||
      questionIds.length === 0
    ) {
      return res.status(400).json({
        status: false,
        message: "Question IDs are required",
      });
    }

    // Check if test series and section exist
    const testSeries = await TestSeries.findById({
      _id: testSeriesId,
      deletedAt: null,
    });
    if (!testSeries) {
      return res.noRecords("Test series not found");
    }

    const section = await Section.findById({ _id: sectionId, deletedAt: null });
    if (!section) {
      return res.noRecords("Section not found");
    }

    const find = await TestSeriesQuestion.find({
      testSeriesId,
      sectionId,
      questionId: { $in: questionIds },
      // deletedAt: null,
    });
    console.log("find ||||", find);

    const result = await TestSeriesQuestion.updateMany(
      {
        testSeriesId,
        sectionId,
        questionId: { $in: questionIds },
        deletedAt: null,
      },
      { deletedAt: new Date(), updatedBy: req.admin._id }
    );

    // For Mongoose 6+, use result.modifiedCount; for older, use result.nModified
    const removedCount =
      result.modifiedCount !== undefined
        ? result.modifiedCount
        : result.nModified;

    if (removedCount === 0) {
      return res.status(400).json({
        status: false,
        message: "No questions found in the section",
      });
    }

    // Update test series total questions count
    await TestSeries.findByIdAndUpdate(testSeriesId, {
      $inc: { totalQuestions: -removedCount },
    });

    // Update section total questions count
    await Section.findByIdAndUpdate(sectionId, {
      $inc: { totalQuestions: -removedCount },
    });

    return res.success({
      removedCount,
      message: `${removedCount} questions removed from section successfully`,
    });
  } catch (error) {
    console.error("Error removing questions from section:", error);
    return res.someThingWentWrong(error);
  }
};

// Get subjects, chapters, topics, and questions for test series question selection
exports.getQuestionSelectionData = async (req, res) => {
  try {
    // Get all active subjects
    const subjects = await Subject.find({ status: true, deletedAt: null })
      .select("_id name")
      .sort({ name: 1 });

    return res.success({
      subjects,
    });
  } catch (error) {
    console.error("Error fetching question selection data:", error);
    return res.someThingWentWrong(error);
  }
};

// Get chapters by subject
exports.getChaptersBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    // Check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.noRecords("Subject not found");
    }

    // Get chapters
    const chapters = await Chapter.find({
      subjectId,
      status: true,
      deletedAt: null,
    })
      .select("_id name")
      .sort({ name: 1 });

    return res.success(chapters);
  } catch (error) {
    console.error("Error fetching chapters by subject:", error);
    return res.someThingWentWrong(error);
  }
};

// Get topics by chapter
exports.getTopicsByChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;

    // Check if chapter exists
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.noRecords("Chapter not found");
    }

    // Get topics
    const topics = await Topic.find({
      chapterId,
      status: true,
      deletedAt: null,
    })
      .select("_id name questionCount")
      .sort({ name: 1 });

    return res.success(topics);
  } catch (error) {
    console.error("Error fetching topics by chapter:", error);
    return res.someThingWentWrong(error);
  }
};

// Get questions by topic
exports.getQuestionsByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { limit, pageNo, query } = req.query;

    // Check if topic exists
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.noRecords("Topic not found");
    }

    // Build query
    const queryObj = {
      topicId,
      status: true,
      deletedAt: null,
    };

    if (query) {
      queryObj.$or = [
        { questionText: { $regex: query, $options: "i" } },
        { option1: { $regex: query, $options: "i" } },
        { option2: { $regex: query, $options: "i" } },
        { option3: { $regex: query, $options: "i" } },
        { option4: { $regex: query, $options: "i" } },
        { option5: { $regex: query, $options: "i" } },
      ];
    }

    // Count total records
    const total = await Question.countDocuments(queryObj);

    if (total === 0) {
      return res.datatableNoRecords();
    }

    // Get questions with pagination
    const questions = await Question.find(queryObj)
      .select(
        "_id questionText option1 option2 option3 option4 option5 rightAnswer"
      )
      .skip((pageNo - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.pagination(questions, total, limit, pageNo);
  } catch (error) {
    console.error("Error fetching questions by topic:", error);
    return res.someThingWentWrong(error);
  }
};

// Add this function to the existing testSeriesController.js file

// Get test series with purchase status
exports.getTestSeriesWithPurchaseStatus = async (req, res) => {
  try {
    const { examPlanId } = req.params;

    // Check if exam plan exists
    const examPlan = await ExamPlan.findById(examPlanId);
    if (!examPlan) {
      return res.status(404).json({
        status: false,
        message: "Exam plan not found",
      });
    }

    // Check if user has purchased the exam plan (if it's not free)
    let canAccessExamPlan = examPlan.isFree;
    if (!canAccessExamPlan) {
      canAccessExamPlan = await razorpayService.checkUserPurchase(
        req.admin._id,
        "EXAM_PLAN",
        examPlanId
      );
    }

    // Get test series for this exam plan
    const testSeries = await TestSeries.find({
      examPlanId,
      status: true,
    }).sort({ sequence: 1 });

    // If user hasn't purchased the exam plan, return limited info
    if (!canAccessExamPlan) {
      return res.status(200).json({
        status: true,
        data: {
          examPlan: {
            _id: examPlan._id,
            title: examPlan.title,
            price: examPlan.price,
            mrp: examPlan.mrp,
            validityDays: examPlan.validityDays,
            isFree: examPlan.isFree,
          },
          isPurchased: false,
          requiresPurchase: true,
          testSeries: testSeries.map((series) => ({
            _id: series._id,
            title: series.title,
            duration: series.duration,
            totalQuestions: series.totalQuestions,
            isLocked: true,
          })),
        },
      });
    }

    // User has access to the exam plan, return full info
    return res.status(200).json({
      status: true,
      data: {
        examPlan: {
          _id: examPlan._id,
          title: examPlan.title,
          description: examPlan.description,
          price: examPlan.price,
          mrp: examPlan.mrp,
          validityDays: examPlan.validityDays,
          isFree: examPlan.isFree,
        },
        isPurchased: true,
        testSeries: testSeries.map((series) => ({
          _id: series._id,
          title: series.title,
          description: series.description,
          duration: series.duration,
          totalQuestions: series.totalQuestions,
          correctMarks: series.correctMarks,
          negativeMarks: series.negativeMarks,
          passingPercentage: series.passingPercentage,
          instructions: series.instructions,
          isLocked: false,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching test series with purchase status:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch test series",
      error: error.message,
    });
  }
};
