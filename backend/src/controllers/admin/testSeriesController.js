const TestSeries = require("../../models/TestSeries")
const TestSeriesQuestion = require("../../models/TestSeriesQuestion")
const Question = require("../../models/Question")
const Subject = require("../../models/Subject")
const Chapter = require("../../models/Chapter")
const Topic = require("../../models/Topic")

// Create a new test series
exports.createTestSeries = async (req, res) => {
  try {
    const { title, description, examId, duration, negativeMarks, passingPercentage, isFree } = req.body

    // Validate required fields
    if (!title || !examId || !duration) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      })
    }

    // Create new test series
    const testSeries = await TestSeries.create({
      title,
      description,
      examId,
      duration,
      negativeMarks: negativeMarks || 0.25,
      passingPercentage: passingPercentage || 33,
      isFree: isFree || false,
      createdBy: req.user._id,
    })

    return res.status(201).json({
      success: true,
      data: testSeries,
      message: "Test series created successfully",
    })
  } catch (error) {
    console.error("Error creating test series:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to create test series",
      error: error.message,
    })
  }
}

// Get all test series with pagination and filters
exports.getTestSeries = async (req, res) => {
  try {
    const { page = 1, limit = 10, examId, search, isActive } = req.query

    // Build query
    const query = { status: true }

    if (examId) query.examId = examId
    if (isActive !== undefined) query.isActive = isActive === "true"

    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    // Execute query with pagination
    const testSeries = await TestSeries.find(query)
      .populate("examId", "name")
      .skip((page - 1) * limit)
      .limit(Number.parseInt(limit))
      .sort({ createdAt: -1 })

    // Get total count
    const total = await TestSeries.countDocuments(query)

    return res.status(200).json({
      success: true,
      data: testSeries,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching test series:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to fetch test series",
      error: error.message,
    })
  }
}

// Get a single test series by ID
exports.getTestSeriesById = async (req, res) => {
  try {
    const testSeries = await TestSeries.findById(req.params.id).populate("examId", "name")

    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: "Test series not found",
      })
    }

    return res.status(200).json({
      success: true,
      data: testSeries,
    })
  } catch (error) {
    console.error("Error fetching test series:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to fetch test series",
      error: error.message,
    })
  }
}

// Update a test series
exports.updateTestSeries = async (req, res) => {
  try {
    const { title, description, examId, duration, negativeMarks, passingPercentage, isFree, isActive } = req.body

    // Find test series
    const testSeries = await TestSeries.findById(req.params.id)

    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: "Test series not found",
      })
    }

    // Update test series
    const updatedTestSeries = await TestSeries.findByIdAndUpdate(
      req.params.id,
      {
        title: title || testSeries.title,
        description: description || testSeries.description,
        examId: examId || testSeries.examId,
        duration: duration || testSeries.duration,
        negativeMarks: negativeMarks !== undefined ? negativeMarks : testSeries.negativeMarks,
        passingPercentage: passingPercentage !== undefined ? passingPercentage : testSeries.passingPercentage,
        isFree: isFree !== undefined ? isFree : testSeries.isFree,
        isActive: isActive !== undefined ? isActive : testSeries.isActive,
        updatedBy: req.user._id,
      },
      { new: true, runValidators: true },
    )

    return res.status(200).json({
      success: true,
      data: updatedTestSeries,
      message: "Test series updated successfully",
    })
  } catch (error) {
    console.error("Error updating test series:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to update test series",
      error: error.message,
    })
  }
}

// Delete a test series
exports.deleteTestSeries = async (req, res) => {
  try {
    const testSeries = await TestSeries.findById(req.params.id)

    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: "Test series not found",
      })
    }

    // Soft delete by updating status
    await TestSeries.findByIdAndUpdate(req.params.id, {
      status: false,
      updatedBy: req.user._id,
    })

    return res.status(200).json({
      success: true,
      message: "Test series deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting test series:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to delete test series",
      error: error.message,
    })
  }
}

// Ad questions to test series
exports.addQuestionsToTestSeries = async (req, res) => {
  try {
    const { testSeriesId } = req.params
    const { questionIds } = req.body

    if (!testSeriesId || !questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Test series ID and question IDs are required",
      })
    }

    // Check if test series exists
    const testSeries = await TestSeries.findById(testSeriesId)
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: "Test series not found",
      })
    }

    // Check if questions exist
    const questions = await Question.find({
      _id: { $in: questionIds },
      status: true,
    })

    if (questions.length !== questionIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some questions do not exist or are inactive",
      })
    }

    // Get existing questions in test series
    const existingQuestions = await TestSeriesQuestion.find({
      testSeriesId,
      questionId: { $in: questionIds },
    })

    const existingQuestionIds = existingQuestions.map((q) => q.questionId.toString())

    // Filter out questions that are already in the test series
    const newQuestionIds = questionIds.filter((id) => !existingQuestionIds.includes(id.toString()))

    if (newQuestionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All questions are already in the test series",
      })
    }

    // Get the highest sequence number
    const highestSequence = await TestSeriesQuestion.findOne({ testSeriesId }).sort({ sequence: -1 }).select("sequence")

    const startSequence = highestSequence ? highestSequence.sequence + 1 : 1

    // Create test series questions
    const testSeriesQuestions = newQuestionIds.map((questionId, index) => ({
      testSeriesId,
      questionId,
      sequence: startSequence + index,
      createdBy: req.user._id,
    }))

    // Insert test series questions
    await TestSeriesQuestion.insertMany(testSeriesQuestions)

    // Update test series total questions count
    await TestSeries.findByIdAndUpdate(testSeriesId, {
      $inc: { totalQuestions: newQuestionIds.length },
    })

    return res.status(201).json({
      success: true,
      message: `${newQuestionIds.length} questions added to test series successfully`,
    })
  } catch (error) {
    console.error("Error adding questions to test series:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to add questions to test series",
      error: error.message,
    })
  }
}

// Remove questions from test series
exports.removeQuestionsFromTestSeries = async (req, res) => {
  try {
    const { testSeriesId } = req.params
    const { questionIds } = req.body

    if (!testSeriesId || !questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Test series ID and question IDs are required",
      })
    }

    // Check if test series exists
    const testSeries = await TestSeries.findById(testSeriesId)
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: "Test series not found",
      })
    }

    // Remove questions from test series
    const result = await TestSeriesQuestion.deleteMany({
      testSeriesId,
      questionId: { $in: questionIds },
    })

    if (result.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "No questions found in the test series",
      })
    }

    // Update test series total questions count
    await TestSeries.findByIdAndUpdate(testSeriesId, {
      $inc: { totalQuestions: -result.deletedCount },
    })

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} questions removed from test series successfully`,
    })
  } catch (error) {
    console.error("Error removing questions from test series:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to remove questions from test series",
      error: error.message,
    })
  }
}

// Get questions in a test series
exports.getTestSeriesQuestions = async (req, res) => {
  try {
    const { testSeriesId } = req.params
    const { page = 1, limit = 10 } = req.query

    // Check if test series exists
    const testSeries = await TestSeries.findById(testSeriesId)
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: "Test series not found",
      })
    }

    // Get test series questions with pagination
    const testSeriesQuestions = await TestSeriesQuestion.find({ testSeriesId })
      .populate({
        path: "questionId",
        select: "questionText option1 option2 option3 option4 option5 rightAnswer explanation",
      })
      .skip((page - 1) * limit)
      .limit(Number.parseInt(limit))
      .sort({ sequence: 1 })

    // Get total count
    const total = await TestSeriesQuestion.countDocuments({ testSeriesId })

    return res.status(200).json({
      success: true,
      data: testSeriesQuestions,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching test series questions:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to fetch test series questions",
      error: error.message,
    })
  }
}

// Get subjects, chapters, and topics for test series question selection
exports.getSubjectsChaptersTopics = async (req, res) => {
  try {
    // Get all active subjects
    const subjects = await Subject.find({ status: true }).select("_id name")

    // Get all active chapters
    const chapters = await Chapter.find({ status: true }).select("_id name subjectId")

    // Get all active topics
    const topics = await Topic.find({ status: true }).select("_id name chapterId subjectId questionCount")

    return res.status(200).json({
      success: true,
      data: {
        subjects,
        chapters,
        topics,
      },
    })
  } catch (error) {
    console.error("Error fetching subjects, chapters, and topics:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subjects, chapters, and topics",
      error: error.message,
    })
  }
}
