// src/services/examService.js
const Exam = require("../models/Exam")
const ExamQuestion = require("../models/ExamQuestion")
const TestSeries = require("../models/TestSeries")
const Section = require("../models/Section")
const TestSeriesQuestion = require("../models/TestSeriesQuestion")
const Question = require("../models/Question")
const mongoose = require("mongoose")
const logger = require("../utils/logger")
const { autoSubmitExam } = require("../controllers/user/examController")

// Map to store scheduled auto-submit tasks
const scheduledTasks = new Map()

/**
 * Schedule auto-submit for an exam
 * @param {string} examId - Exam ID
 * @param {Date} endTime - Exam end time
 */
exports.scheduleExamAutoSubmit = (examId, endTime) => {
  try {
    // Cancel any existing scheduled task for this exam
    if (scheduledTasks.has(examId.toString())) {
      clearTimeout(scheduledTasks.get(examId.toString()))
    }

    // Calculate delay until end time
    const now = new Date()
    const endTimeDate = new Date(endTime)
    const delay = Math.max(0, endTimeDate.getTime() - now.getTime())

    if (delay <= 0) {
      // If end time has already passed, submit immediately
      logger.info(`Exam ${examId} end time has already passed. Auto-submitting immediately.`)
      autoSubmitExam(examId)
      return
    }

    // Schedule auto-submit
    logger.info(`Scheduling auto-submit for exam ${examId} in ${Math.round(delay / 1000)} seconds`)

    const taskId = setTimeout(async () => {
      try {
        await autoSubmitExam(examId)
        scheduledTasks.delete(examId.toString())
      } catch (error) {
        logger.error(`Error in scheduled auto-submit for exam ${examId}:`, error)
      }
    }, delay)

    // Store the task ID for potential cancellation
    scheduledTasks.set(examId.toString(), taskId)
  } catch (error) {
    logger.error(`Error scheduling auto-submit for exam ${examId}:`, error)
  }
}

/**
 * Cancel scheduled auto-submit for an exam
 * @param {string} examId - Exam ID
 */
exports.cancelExamAutoSubmit = (examId) => {
  try {
    if (scheduledTasks.has(examId.toString())) {
      clearTimeout(scheduledTasks.get(examId.toString()))
      scheduledTasks.delete(examId.toString())
      logger.info(`Auto-submit for exam ${examId} has been cancelled`)
    }
  } catch (error) {
    logger.error(`Error cancelling auto-submit for exam ${examId}:`, error)
  }
}

/**
 * Calculate exam result
 * @param {string} examId - Exam ID
 * @returns {Promise<Object>} - Exam result
 */
exports.calculateExamResult = async (examId) => {
  try {
    // Get exam
    const exam = await Exam.findById({_id: examId}).populate("testSeriesId")

    if (!exam) {
      throw new Error("Exam not found")
    }

    if (exam.status !== "COMPLETED") {
      throw new Error("Exam has not been completed yet")
    }

    // Get all exam questions
    const examQuestions = await ExamQuestion.find({
      examId,
    }).populate("questionId")

    // Calculate statistics
    const attemptedQuestions = examQuestions.filter((eq) => eq.status === "ATTEMPTED").length
    const correctAnswers = examQuestions.filter((eq) => eq.isCorrect === true).length
    const wrongAnswers = examQuestions.filter((eq) => eq.isCorrect === false).length
    const skippedQuestions = examQuestions.filter((eq) => eq.status === "SKIPPED").length
    const markedForReview = examQuestions.filter((eq) => eq.isMarkedForReview).length

    // Calculate total score
    const totalScore = correctAnswers * exam.testSeriesId.correctMarks - wrongAnswers * exam.testSeriesId.negativeMarks
    const maxScore = examQuestions.length * exam.testSeriesId.correctMarks
    const percentage = (totalScore / maxScore) * 100

    // Update exam
    exam.attemptedQuestions = attemptedQuestions
    exam.correctAnswers = correctAnswers
    exam.wrongAnswers = wrongAnswers
    exam.skippedQuestions = skippedQuestions
    exam.markedForReview = markedForReview
    exam.totalScore = totalScore
    exam.maxScore = maxScore
    exam.percentage = percentage

    await exam.save()

    // Calculate rank
    const betterExams = await Exam.countDocuments({
      testSeriesId: exam.testSeriesId._id,
      status: "COMPLETED",
      totalScore: { $gt: totalScore },
    })

    exam.rank = betterExams + 1
    await exam.save()

    return exam
  } catch (error) {
    logger.error(`Error calculating exam result: ${error.message}`, { error })
    throw error
  }
}

/**
 * Get section-wise statistics for an exam
 * @param {string} examId - Exam ID
 * @returns {Promise<Array>} - Section statistics
 */
exports.getSectionStatistics = async (examId) => {
  try {
    // Get exam
    const exam = await Exam.findById({_id: examId})

    if (!exam) {
      throw new Error("Exam not found")
    }

    // Get all sections
    const sections = await Section.find({
      testSeriesId: exam.testSeriesId,
    }).sort({ sequence: 1 })

    // Get section-wise statistics
    const sectionStats = []
    for (const section of sections) {
      const sectionQuestions = await ExamQuestion.find({
        examId,
        sectionId: section._id,
      })

      const sectionStat = {
        sectionId: section._id,
        name: section.name,
        totalQuestions: sectionQuestions.length,
        attempted: sectionQuestions.filter((eq) => eq.status === "ATTEMPTED").length,
        correct: sectionQuestions.filter((eq) => eq.isCorrect === true).length,
        wrong: sectionQuestions.filter((eq) => eq.isCorrect === false).length,
        skipped: sectionQuestions.filter((eq) => eq.status === "SKIPPED").length,
        markedForReview: sectionQuestions.filter((eq) => eq.isMarkedForReview).length,
      }

      sectionStats.push(sectionStat)
    }

    return sectionStats
  } catch (error) {
    logger.error(`Error getting section statistics: ${error.message}`, { error })
    throw error
  }
}

/**
 * Initialize auto-submit for all ongoing exams
 * This should be called when the server starts
 */
exports.initializeAutoSubmitForOngoingExams = async () => {
  try {
    // Find all ongoing exams
    const ongoingExams = await Exam.find({
      status: "STARTED",
      endTime: { $exists: true },
    })

    logger.info(`Found ${ongoingExams.length} ongoing exams to schedule for auto-submit`)

    // Schedule auto-submit for each ongoing exam
    for (const exam of ongoingExams) {
      this.scheduleExamAutoSubmit(exam._id, exam.endTime)
    }
  } catch (error) {
    logger.error("Error initializing auto-submit for ongoing exams:", error)
  }
}
