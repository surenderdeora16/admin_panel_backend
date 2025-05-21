// src/controllers/user/userExamStatusController.js
const Exam = require("../../models/Exam")
const catchAsync = require("../../utils/catchAsync")
const AppError = require("../../utils/appError")

/**
 * @desc    Check if user has any ongoing exams
 * @route   GET /api/user/exams/ongoing
 * @access  Private (User)
 */
exports.checkOngoingExams = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user._id

    // Find any exams that are in STARTED status for this user
    const ongoingExams = await Exam.find({
      userId,
      status: "STARTED",
    })
      .populate({
        path: "testSeriesId",
        select: "title duration correctMarks negativeMarks",
      })
      .sort({ startTime: -1 }) // Most recent first

    if (!ongoingExams || ongoingExams.length === 0) {
      return res.success({ hasOngoingExam: false, exams: [] }, "No ongoing exams found")
    }

    // Check if any exam has expired but not auto-submitted yet
    const currentTime = new Date()
    const activeExams = ongoingExams.filter((exam) => new Date(exam.endTime) > currentTime)
    const expiredExams = ongoingExams.filter((exam) => new Date(exam.endTime) <= currentTime)

    // Format the response data
    const formattedExams = activeExams.map((exam) => ({
      id: exam._id,
      testSeriesId: exam.testSeriesId._id,
      testSeriesTitle: exam.testSeriesId.title,
      startTime: exam.startTime,
      endTime: exam.endTime,
      remainingTime: Math.max(0, new Date(exam.endTime).getTime() - currentTime.getTime()),
      totalQuestions: exam.totalQuestions,
      attemptedQuestions: exam.attemptedQuestions || 0,
    }))

    // If there are expired exams, log them for auto-submission
    if (expiredExams.length > 0) {
      console.log(`Found ${expiredExams.length} expired exams that need auto-submission for user ${userId}`)
      // These will be handled by the scheduled auto-submit task
    }

    return res.success(
      {
        hasOngoingExam: activeExams.length > 0,
        exams: formattedExams,
        count: formattedExams.length,
      },
      activeExams.length > 0 ? "Ongoing exams found" : "No active ongoing exams found",
    )
  } catch (error) {
    console.error("Error checking ongoing exams:", error)
    return res.someThingWentWrong(error)
  }
})

/**
 * @desc    Get detailed information about a specific ongoing exam
 * @route   GET /api/user/exams/ongoing/:examId
 * @access  Private (User)
 */
exports.getOngoingExamDetails = catchAsync(async (req, res, next) => {
  try {
    const { examId } = req.params
    const userId = req.user._id

    // Find the specific exam
    const exam = await Exam.findOne({
      _id: examId,
      userId,
      status: "STARTED",
    }).populate({
      path: "testSeriesId",
      select: "title duration correctMarks negativeMarks instructions",
    })

    if (!exam) {
      return res.noRecords("Ongoing exam not found")
    }

    // Check if exam has expired
    const currentTime = new Date()
    const isExpired = new Date(exam.endTime) <= currentTime

    if (isExpired) {
      return res.noRecords("This exam has expired and will be auto-submitted soon")
    }

    // Calculate remaining time
    const remainingTime = Math.max(0, new Date(exam.endTime).getTime() - currentTime.getTime())
    const remainingMinutes = Math.floor(remainingTime / 60000)
    const remainingSeconds = Math.floor((remainingTime % 60000) / 1000)

    // Format the response data
    const examDetails = {
      id: exam._id,
      testSeries: {
        id: exam.testSeriesId._id,
        title: exam.testSeriesId.title,
        duration: exam.testSeriesId.duration,
        correctMarks: exam.testSeriesId.correctMarks,
        negativeMarks: exam.testSeriesId.negativeMarks,
        instructions: exam.testSeriesId.instructions,
      },
      startTime: exam.startTime,
      endTime: exam.endTime,
      remainingTime: {
        milliseconds: remainingTime,
        formatted: `${remainingMinutes}:${remainingSeconds.toString().padStart(2, "0")}`,
      },
      totalQuestions: exam.totalQuestions,
      attemptedQuestions: exam.attemptedQuestions || 0,
      sectionTimings: exam.sectionTimings || [],
    }

    return res.success(examDetails, "Ongoing exam details retrieved successfully")
  } catch (error) {
    console.error("Error getting ongoing exam details:", error)
    return res.someThingWentWrong(error)
  }
})
