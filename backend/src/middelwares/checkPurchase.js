const razorpayService = require("../services/razorpayService")
const ExamPlan = require("../models/ExamPlan")
const TestSeries = require("../models/TestSeries")
const UserPurchase = require("../models/UserPurchase")

// Middleware to check if user has purchased an exam plan
exports.checkExamPlanPurchase = async (req, res, next) => {
  try {
    const { examPlanId } = req.params

    if (!examPlanId) {
      return res.status(400).json({
        status: false,
        message: "Exam plan ID is required",
      })
    }

    // Get exam plan details
    const examPlan = await ExamPlan.findById(examPlanId)

    if (!examPlan) {
      return res.status(404).json({
        status: false,
        message: "Exam plan not found",
      })
    }

    // Check if user has purchased the exam plan
    const hasPurchased = await razorpayService.checkUserPurchase(req.user._id, "EXAM_PLAN", examPlanId)

    if (!hasPurchased) {
      return res.status(403).json({
        status: false,
        message: "You need to purchase this exam plan to access it",
        data: {
          examPlanId,
          title: examPlan.title,
          price: examPlan.price,
          mrp: examPlan.mrp,
          validityDays: examPlan.validityDays,
          requiresPurchase: true,
        },
      })
    }

    // User has purchased, allow access
    req.examPlan = examPlan
    next()
  } catch (error) {
    console.error("Error checking exam plan purchase:", error)
    return res.status(500).json({
      status: false,
      message: "Failed to check exam plan purchase",
      error: error.message,
    })
  }
}

// Middleware to check if user has access to a test series
exports.checkTestSeriesAccess = async (req, res, next) => {
  try {
    const { testSeriesId } = req.params

    if (!testSeriesId) {
      return res.status(400).json({
        status: false,
        message: "Test series ID is required",
      })
    }

    // Get test series details
    const testSeries = await TestSeries.findById(testSeriesId)

    if (!testSeries) {
      return res.status(404).json({
        status: false,
        message: "Test series not found",
      })
    }

    // If test series is free, allow access
    if (testSeries.isFree) {
      req.testSeries = testSeries
      return next()
    }

    // Check if user has purchased the associated exam plan
    const examPlanPurchase = await UserPurchase.findOne({
      userId: req.user._id,
      itemType: "EXAM_PLAN",
      itemId: testSeries.examPlanId,
      status: "ACTIVE",
      expiryDate: { $gt: new Date() },
    })

    if (examPlanPurchase) {
      req.testSeries = testSeries
      return next()
    }

    // Check if user has directly purchased this test series
    const testSeriesPurchase = await UserPurchase.findOne({
      userId: req.user._id,
      itemType: "TEST_SERIES",
      itemId: testSeriesId,
      status: "ACTIVE",
      expiryDate: { $gt: new Date() },
    })

    if (testSeriesPurchase) {
      req.testSeries = testSeries
      return next()
    }

    // Get exam plan details for the response
    const examPlan = await ExamPlan.findById(testSeries.examPlanId)

    // User hasn't purchased, deny access
    return res.status(403).json({
      status: false,
      message: "You need to purchase the exam plan to access this test series",
      data: {
        testSeriesId,
        title: testSeries.title,
        examPlanId: testSeries.examPlanId,
        examPlanTitle: examPlan ? examPlan.title : null,
        examPlanPrice: examPlan ? examPlan.price : null,
        requiresPurchase: true,
      },
    })
  } catch (error) {
    console.error("Error checking test series access:", error)
    return res.status(500).json({
      status: false,
      message: "Failed to check test series access",
      error: error.message,
    })
  }
}
