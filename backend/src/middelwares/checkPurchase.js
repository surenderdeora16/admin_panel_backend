const razorpayService = require("../services/razorpayService")
const ExamPlan = require("../models/ExamPlan")
const TestSeries = require("../models/TestSeries")
const UserPurchase = require("../models/UserPurchase")
const mongoose = require("mongoose")
const Note = require("../models/Note")
const ObjectId = mongoose.Types.ObjectId

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
    req.purchase = hasPurchased
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


// Middleware to check if user has access to a note
exports.checkNoteAccess = async (req, res, next) => {
  try {
    const { noteId } = req.params

    if (!noteId || !ObjectId.isValid(noteId)) {
      return res.status(400).json({
        status: false,
        message: "Valid Note ID is required",
      })
    }

    // Get note details
    const note = await Note.findById(noteId).populate("examPlanId")

    if (!note) {
      return res.noRecords("Note not found")
    }

    // Check if note is active
    if (!note.status) {
      return res.status(400).json({
        status: false,
        message: "This note is not available",
      })
    }

    // If note is free, allow access
    if (note.isFree) {
      req.note = note
      return next()
    }

    // For paid notes, check if user has purchased the associated exam plan
    const purchase = await UserPurchase.findOne({
      userId: req.user._id,
      itemType: "EXAM_PLAN",
      itemId: note.examPlanId._id,
      status: "ACTIVE",
      expiryDate: { $gt: new Date() },
    })

    if (!purchase) {
      return res.status(403).json({
        status: false,
        message: "You need to purchase the associated exam plan to access this note",
        data: {
          noteId: note._id,
          title: note.title,
          examPlanId: note.examPlanId._id,
          examPlanTitle: note.examPlanId.title,
          examPlanPrice: note.examPlanId.price,
          examPlanMrp: note.examPlanId.mrp,
          validityDays: note.examPlanId.validityDays,
          requiresPurchase: true,
        },
      })
    }

    // User has purchased the exam plan, allow access
    req.note = note
    req.purchase = purchase
    next()
  } catch (error) {
    console.error("Error checking note access:", error)
    return res.someThingWentWrong(error)
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
      return res.noRecords("You need to purchase the associated exam plan to access this test series");
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
