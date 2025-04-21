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
    const { testSeriesId } = req.params;
    const userId = req.user._id;

    // Check if test series exists
    const testSeries = await TestSeries.findById(testSeriesId);
    if (!testSeries) {
      return res.noRecords("Test series not found");
    }

    // Check if test series is active
    if (!testSeries.status) {
      return res.noRecords("This test series is not available");
    }

    // If test series is free, allow access
    if (testSeries.isFree) {
      req.testSeries = testSeries;
      return next();
    }

    // For paid test series, check if user has purchased the exam plan
    const examPlanId = testSeries.examPlanId;
    
    const userPurchase = await UserPurchase.findOne({
      userId,
      itemType: "EXAM_PLAN",
      itemId: examPlanId,
      status: "ACTIVE",
      expiryDate: { $gt: new Date() },
    });

    if (!userPurchase) {
      return res.noRecords("You need to purchase this exam plan to access this test series");
    }

    // User has access, proceed
    req.testSeries = testSeries;
    req.userPurchase = userPurchase;
    next();
  } catch (error) {
    console.error("Error checking test series access:", error);
    return res.someThingWentWrong(error);
  }
};
