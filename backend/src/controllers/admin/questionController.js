const Question = require("../../models/Question")
const Topic = require("../../models/Topic")
const Chapter = require("../../models/Chapter")
const Subject = require("../../models/Subject")
const mongoose = require("mongoose")
const { validationResult } = require("express-validator")
const xlsx = require("xlsx")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")

// Get all questions with pagination and search
exports.getQuestions = async (req, res) => {
  try {
    const {
      limit = 10,
      pageNo = 1,
      query = "",
      subjectId = null,
      chapterId = null,
      topicId = null,
      difficultyLevel = null,
      questionType = null,
      orderBy = "createdAt",
      orderDirection = -1,
    } = req.query

    const skip = (pageNo - 1) * limit
    const sortOrder = Number(orderDirection) === 1 ? 1 : -1

    // Create search filter
    const searchFilter = {
      deletedAt: null // Only active questions
    }

    if (query) {
      searchFilter.$or = [
        { questionText: { $regex: query, $options: "i" } },
        { explanation: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } },
      ]
    }

    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
      searchFilter.subjectId = mongoose.Types.ObjectId(subjectId)
    }

    if (chapterId && mongoose.Types.ObjectId.isValid(chapterId)) {
      searchFilter.chapterId = mongoose.Types.ObjectId(chapterId)
    }

    if (topicId && mongoose.Types.ObjectId.isValid(topicId)) {
      searchFilter.topicId = mongoose.Types.ObjectId(topicId)
    }

    if (difficultyLevel) {
      searchFilter.difficultyLevel = difficultyLevel
    }

    if (questionType) {
      searchFilter.questionType = questionType
    }

    // Count total documents
    const totalCount = await Question.countDocuments(searchFilter)

    // Get questions with pagination
    const questions = await Question.find(searchFilter)
      .populate("subjectId", "name code")
      .populate("chapterId", "name code")
      .populate("topicId", "name code")
      .sort({ [orderBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .lean()

    if (!questions || questions.length === 0) {
      return res.noRecords("No questions found")
    }

    return res.pagination(questions, totalCount, limit, Number(pageNo))
  } catch (error) {
    console.error("Error in getQuestions:", error)
    return res.someThingWentWrong(error)
  }
}

// Get question by ID
exports.getQuestionById = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid question ID format",
      })
    }

    const question = await Question.findOne({ _id: id, deletedAt: null })
      .populate("subjectId", "name code")
      .populate("chapterId", "name code")
      .populate("topicId", "name code")
      .lean()

    if (!question) {
      return res.noRecords("Question not found or deleted")
    }

    return res.success(question)
  } catch (error) {
    console.error("Error in getQuestionById:", error)
    return res.someThingWentWrong(error)
  }
}

// Create new question
exports.createQuestion = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const { questionText, questionType, options, correctAnswer, explanation, difficultyLevel, marks, topicId, tags } =
      req.body

    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid topic ID format",
      })
    }

    // Check if active topic exists
    const topic = await Topic.findOne({ 
      _id: topicId, 
      deletedAt: null 
    })
    
    if (!topic) {
      return res.status(404).json({
        status: false,
        message: "Topic not found or deleted",
      })
    }

    // Validate options based on question type
    if (questionType === "MULTIPLE_CHOICE" && (!options || !Array.isArray(options) || options.length < 2)) {
      return res.status(400).json({
        status: false,
        message: "Multiple choice questions must have at least 2 options",
      })
    }

    if (questionType === "TRUE_FALSE" && (!options || !Array.isArray(options) || options.length !== 2)) {
      return res.status(400).json({
        status: false,
        message: "True/False questions must have exactly 2 options",
      })
    }

    // Create new question
    const question = new Question({
      questionText,
      questionType: questionType || "MULTIPLE_CHOICE",
      options: options || [],
      correctAnswer,
      explanation,
      difficultyLevel: difficultyLevel || "MEDIUM",
      marks: marks || { correct: 1, negative: 0 },
      topicId,
      chapterId: topic.chapterId,
      subjectId: topic.subjectId,
      tags: tags || [],
      createdBy: req.admin._id,
    })

    await question.save()

    // Update question count in topic
    await Topic.findByIdAndUpdate(topicId, { $inc: { questionCount: 1 } })

    return res.successInsert(question, "Question created successfully")
  } catch (error) {
    console.error("Error in createQuestion:", error)
    return res.someThingWentWrong(error)
  }
}

// Update question
exports.updateQuestion = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const { id } = req.params
    const {
      questionText,
      questionType,
      options,
      correctAnswer,
      explanation,
      difficultyLevel,
      marks,
      topicId,
      tags,
      status,
    } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid question ID format",
      })
    }

    // Check if active question exists
    const question = await Question.findOne({ 
      _id: id, 
      deletedAt: null 
    })
    
    if (!question) {
      return res.noRecords("Question not found or deleted")
    }

    // If topic is being changed, check if it exists
    let newChapterId = question.chapterId
    let newSubjectId = question.subjectId

    if (topicId && topicId !== question.topicId.toString()) {
      if (!mongoose.Types.ObjectId.isValid(topicId)) {
        return res.status(400).json({
          status: false,
          message: "Invalid topic ID format",
        })
      }

      const topic = await Topic.findOne({ 
        _id: topicId, 
        deletedAt: null 
      })
      
      if (!topic) {
        return res.status(404).json({
          status: false,
          message: "Topic not found or deleted",
        })
      }

      newChapterId = topic.chapterId
      newSubjectId = topic.subjectId
    }

    // Validate options based on question type
    const finalQuestionType = questionType || question.questionType
    const finalOptions = options || question.options

    if (
      finalQuestionType === "MULTIPLE_CHOICE" &&
      (!finalOptions || !Array.isArray(finalOptions) || finalOptions.length < 2)
    ) {
      return res.status(400).json({
        status: false,
        message: "Multiple choice questions must have at least 2 options",
      })
    }

    if (
      finalQuestionType === "TRUE_FALSE" &&
      (!finalOptions || !Array.isArray(finalOptions) || finalOptions.length !== 2)
    ) {
      return res.status(400).json({
        status: false,
        message: "True/False questions must have exactly 2 options",
      })
    }

    // Update question
    question.questionText = questionText || question.questionText
    question.questionType = finalQuestionType
    question.options = finalOptions
    question.correctAnswer = correctAnswer !== undefined ? correctAnswer : question.correctAnswer
    question.explanation = explanation !== undefined ? explanation : question.explanation
    question.difficultyLevel = difficultyLevel || question.difficultyLevel
    question.marks = marks || question.marks

    // If topic changed, update topic, chapter, and subject
    const oldTopicId = question.topicId
    if (topicId && topicId !== oldTopicId.toString()) {
      question.topicId = topicId
      question.chapterId = newChapterId
      question.subjectId = newSubjectId
    }

    question.tags = tags || question.tags
    question.status = status !== undefined ? status : question.status
    question.updatedBy = req.admin._id

    await question.save()

    // If topic changed, update question counts
    if (topicId && topicId !== oldTopicId.toString()) {
      await Topic.findByIdAndUpdate(oldTopicId, { $inc: { questionCount: -1 } })

      await Topic.findByIdAndUpdate(topicId, { $inc: { questionCount: 1 } })
    }

    return res.successUpdate(question)
  } catch (error) {
    console.error("Error in updateQuestion:", error)
    return res.someThingWentWrong(error)
  }
}

// Soft delete question
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid question ID format",
      })
    }

    // Check if active question exists
    const question = await Question.findOne({ 
      _id: id, 
      deletedAt: null 
    })
    
    if (!question) {
      return res.noRecords("Question not found or already deleted")
    }

    const topicId = question.topicId

    // Perform soft delete
    await Question.findByIdAndUpdate(
      id,
      {
        $set: {
          deletedAt: new Date(),
          updatedBy: req.admin._id
        }
      },
      { new: true }
    )

    // Update question count in topic
    await Topic.findByIdAndUpdate(topicId, { $inc: { questionCount: -1 } })

    return res.successDelete([], "Question deleted successfully")
  } catch (error) {
    console.error("Error in deleteQuestion:", error)
    return res.someThingWentWrong(error)
  }
}

// Bulk soft delete questions
exports.bulkDeleteQuestions = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { ids } = req.body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No question IDs provided",
      })
    }

    // Validate all IDs
    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id))
    if (validIds.length !== ids.length) {
      return res.status(400).json({
        status: false,
        message: "One or more invalid question ID formats",
      })
    }

    // Get active questions to be deleted
    const questions = await Question.find({ 
      _id: { $in: validIds }, 
      deletedAt: null 
    })
    
    if (!questions || questions.length === 0) {
      return res.noRecords("No active questions found with the provided IDs")
    }

    // Group questions by topic for updating counts
    const topicCounts = {}
    questions.forEach((question) => {
      const topicId = question.topicId.toString()
      topicCounts[topicId] = (topicCounts[topicId] || 0) + 1
    })

    // Perform soft delete
    await Question.updateMany(
      { _id: { $in: validIds } },
      {
        $set: {
          deletedAt: new Date(),
          updatedBy: req.admin._id
        }
      },
      { session }
    )

    // Update question counts in topics
    for (const [topicId, count] of Object.entries(topicCounts)) {
      await Topic.findByIdAndUpdate(topicId, { $inc: { questionCount: -count } }, { session })
    }

    await session.commitTransaction()
    session.endSession()

    return res.successDelete([], `${questions.length} questions deleted successfully`)
  } catch (error) {
    await session.abortTransaction()
    session.endSession()

    console.error("Error in bulkDeleteQuestions:", error)
    return res.someThingWentWrong(error)
  }
}

// Import questions from Excel
exports.importQuestions = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: "No file uploaded",
      })
    }

    // Check file type
    const fileExtension = path.extname(req.file.originalname).toLowerCase()
    if (![".xlsx", ".xls"].includes(fileExtension)) {
      return res.status(400).json({
        status: false,
        message: "Only Excel files (.xlsx, .xls) are allowed",
      })
    }

    // Read Excel file
    const workbook = xlsx.readFile(req.file.path)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = xlsx.utils.sheet_to_json(worksheet)

    if (!data || data.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Excel file is empty or has no valid data",
      })
    }

    // Validate required fields
    const requiredFields = ["questionText", "topicId"]
    const missingFields = []

    for (const field of requiredFields) {
      if (!data[0].hasOwnProperty(field)) {
        missingFields.push(field)
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      })
    }

    // Process each row
    const questions = []
    const errors = []
    const topicCounts = {}

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 2 // +2 because Excel starts at 1 and we have header row

      try {
        // Validate topicId
        if (!mongoose.Types.ObjectId.isValid(row.topicId)) {
          errors.push(`Row ${rowNum}: Invalid topic ID format`)
          continue
        }

        // Get active topic info
        const topic = await Topic.findOne({ 
          _id: row.topicId, 
          deletedAt: null 
        })
        
        if (!topic) {
          errors.push(`Row ${rowNum}: Topic not found or deleted`)
          continue
        }

        // Parse options if provided as string
        let options = row.options || []
        if (typeof options === "string") {
          try {
            options = JSON.parse(options)
          } catch (e) {
            errors.push(`Row ${rowNum}: Invalid options format. Must be valid JSON array`)
            continue
          }
        }

        // Validate options based on question type
        const questionType = row.questionType || "MULTIPLE_CHOICE"

        if (questionType === "MULTIPLE_CHOICE" && (!options || !Array.isArray(options) || options.length < 2)) {
          errors.push(`Row ${rowNum}: Multiple choice questions must have at least 2 options`)
          continue
        }

        if (questionType === "TRUE_FALSE" && (!options || !Array.isArray(options) || options.length !== 2)) {
          errors.push(`Row ${rowNum}: True/False questions must have exactly 2 options`)
          continue
        }

        // Parse marks if provided as string
        let marks = row.marks || { correct: 1, negative: 0 }
        if (typeof marks === "string") {
          try {
            marks = JSON.parse(marks)
          } catch (e) {
            errors.push(`Row ${rowNum}: Invalid marks format. Must be valid JSON object`)
            continue
          }
        }

        // Parse tags if provided as string
        let tags = row.tags || []
        if (typeof tags === "string") {
          try {
            tags = JSON.parse(tags)
          } catch (e) {
            // Try comma-separated format
            tags = tags.split(",").map((tag) => tag.trim())
          }
        }

        // Create question object
        const question = new Question({
          questionText: row.questionText,
          questionType: questionType,
          options: options,
          correctAnswer: row.correctAnswer,
          explanation: row.explanation || "",
          difficultyLevel: row.difficultyLevel || "MEDIUM",
          marks: marks,
          topicId: row.topicId,
          chapterId: topic.chapterId,
          subjectId: topic.subjectId,
          tags: tags,
          createdBy: req.admin._id,
        })

        await question.save({ session })
        questions.push(question)

        // Track topic counts for updating
        const topicId = topic._id.toString()
        topicCounts[topicId] = (topicCounts[topicId] || 0) + 1
      } catch (error) {
        errors.push(`Row ${rowNum}: ${error.message}`)
      }
    }

    // Update question counts in topics
    for (const [topicId, count] of Object.entries(topicCounts)) {
      await Topic.findByIdAndUpdate(topicId, { $inc: { questionCount: count } }, { session })
    }

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path)

    await session.commitTransaction()
    session.endSession()

    return res.status(200).json({
      status: true,
      message: `${questions.length} questions imported successfully`,
      data: {
        imported: questions.length,
        errors: errors,
      },
    })
  } catch (error) {
    await session.abortTransaction()
    session.endSession()

    // Clean up the uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }

    console.error("Error in importQuestions:", error)
    return res.someThingWentWrong(error)
  }
}

// Download sample Excel template
exports.downloadTemplate = async (req, res) => {
  try {
    // Create sample data
    const sampleData = [
      {
        questionText: "What is the capital of France?",
        questionType: "MULTIPLE_CHOICE",
        options: JSON.stringify([
          { optionText: "London", isCorrect: false },
          { optionText: "Paris", isCorrect: true },
          { optionText: "Berlin", isCorrect: false },
          { optionText: "Madrid", isCorrect: false },
        ]),
        correctAnswer: "Paris",
        explanation: "Paris is the capital and most populous city of France.",
        difficultyLevel: "EASY",
        marks: JSON.stringify({ correct: 1, negative: 0 }),
        topicId: "Enter valid Topic ID here",
        tags: JSON.stringify(["geography", "capitals", "europe"]),
      },
      {
        questionText: "The Earth revolves around the Sun.",
        questionType: "TRUE_FALSE",
        options: JSON.stringify([
          { optionText: "True", isCorrect: true },
          { optionText: "False", isCorrect: false },
        ]),
        correctAnswer: "True",
        explanation: "The Earth revolves around the Sun in an elliptical orbit.",
        difficultyLevel: "EASY",
        marks: JSON.stringify({ correct: 1, negative: 0 }),
        topicId: "Enter valid Topic ID here",
        tags: JSON.stringify(["astronomy", "solar system"]),
      },
    ]

    // Create workbook and worksheet
    const workbook = xlsx.utils.book_new()
    const worksheet = xlsx.utils.json_to_sheet(sampleData)

    // Add column widths
    const colWidths = [
      { wch: 40 }, // questionText
      { wch: 20 }, // questionType
      { wch: 50 }, // options
      { wch: 20 }, // correctAnswer
      { wch: 40 }, // explanation
      { wch: 15 }, // difficultyLevel
      { wch: 20 }, // marks
      { wch: 24 }, // topicId
      { wch: 30 }, // tags
    ]

    worksheet["!cols"] = colWidths

    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, "Questions")

    // Create temp file path
    const tempFilePath = path.join(
      __dirname,
      "../../../temp",
      `question_template_${crypto.randomBytes(4).toString("hex")}.xlsx`,
    )

    // Ensure temp directory exists
    const tempDir = path.dirname(tempFilePath)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // Write to file
    xlsx.writeFile(workbook, tempFilePath)

    // Send file
    res.download(tempFilePath, "question_import_template.xlsx", (err) => {
      // Delete temp file after sending
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
      }

      if (err) {
        console.error("Error sending template file:", err)
      }
    })
  } catch (error) {
    console.error("Error in downloadTemplate:", error)
    return res.someThingWentWrong(error)
  }
}
