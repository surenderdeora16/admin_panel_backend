const ExamPlan = require("../../models/ExamPlan")
const UserPurchase = require("../../models/UserPurchase")
const mongoose = require("mongoose")
const path = require("path")
const fs = require("fs")


// * Get all exam plans with purchase status for the authenticated user
exports.getUserExamPlans = async (req, res) => {
  try {
    // Get query parameters for filtering and pagination
    const { limit = 10, page = 1, search = "", sortBy = "createdAt", sortOrder = "desc", batchId = null } = req.query

    // Build query object
    const query = {
      status: true,
      deletedAt: null,
    }

    // Add batch filter if provided
    if (batchId) {
      query.batchId = mongoose.Types.ObjectId(batchId)
    }

    // Add search filter if provided
    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    // Calculate pagination values
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)
    const sortDirection = sortOrder === "asc" ? 1 : -1

    // Get user ID from authenticated user
    const userId = req.user._id

    // Find all exam plans
    const examPlans = await ExamPlan.find(query)
      .populate("batchId", "name")
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(Number.parseInt(limit))

    // Get total count for pagination
    const totalCount = await ExamPlan.countDocuments(query)

    // Get user's purchases for these exam plans
    const userPurchases = await UserPurchase.find({
      userId,
      itemType: "examPlan",
      itemId: { $in: examPlans.map((plan) => plan._id) },
      expiryDate: { $gt: new Date() }, // Only active purchases
      status: "active",
    })

    // Create a map of purchased exam plan IDs for quick lookup
    const purchasedExamPlanIds = new Map()
    userPurchases.forEach((purchase) => {
      purchasedExamPlanIds.set(purchase.itemId.toString(), {
        purchaseId: purchase._id,
        purchaseDate: purchase.createdAt,
        expiryDate: purchase.expiryDate,
      })
    })

    // Add purchase status to each exam plan
    const examPlansWithPurchaseStatus = examPlans.map((plan) => {
      const planObj = plan.toObject()
      const planId = plan._id.toString()

      // Check if this plan is purchased
      if (purchasedExamPlanIds.has(planId)) {
        const purchaseInfo = purchasedExamPlanIds.get(planId)
        planObj.isPurchased = true
        planObj.purchaseId = purchaseInfo.purchaseId
        planObj.purchaseDate = purchaseInfo.purchaseDate
        planObj.expiryDate = purchaseInfo.expiryDate

        // Calculate remaining days
        const today = new Date()
        const expiryDate = new Date(purchaseInfo.expiryDate)
        const diffTime = Math.abs(expiryDate - today)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        planObj.remainingDays = diffDays
      } else {
        planObj.isPurchased = false
      }

      // Format image URL if exists
      if (planObj.image) {
        planObj.imageUrl = `${process.env.BASE_URL}${planObj.image}`
      }

      return planObj
    })

    // Return response with pagination
    return res.status(200).json({
      success: true,
      data: examPlansWithPurchaseStatus,
      pagination: {
        total: totalCount,
        page: Number.parseInt(page),
        pages: Math.ceil(totalCount / Number.parseInt(limit)),
        limit: Number.parseInt(limit),
      },
    })
  } catch (error) {
    console.error("Error fetching exam plans:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to fetch exam plans",
      error: error.message,
    })
  }
}


// * Get a single exam plan with purchase status
exports.getUserExamPlanById = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user._id

    // Find the exam plan
    const examPlan = await ExamPlan.findOne({
      _id: id,
      status: true,
      deletedAt: null,
    }).populate("batchId", "name")

    if (!examPlan) {
      return res.status(404).json({
        success: false,
        message: "Exam plan not found",
      })
    }

    // Check if user has purchased this exam plan
    const purchase = await UserPurchase.findOne({
      userId,
      itemType: "examPlan",
      itemId: examPlan._id,
      expiryDate: { $gt: new Date() },
      status: "active",
    })

    const examPlanObj = examPlan.toObject()

    if (purchase) {
      examPlanObj.isPurchased = true
      examPlanObj.purchaseId = purchase._id
      examPlanObj.purchaseDate = purchase.createdAt
      examPlanObj.expiryDate = purchase.expiryDate

      // Calculate remaining days
      const today = new Date()
      const expiryDate = new Date(purchase.expiryDate)
      const diffTime = Math.abs(expiryDate - today)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      examPlanObj.remainingDays = diffDays
    } else {
      examPlanObj.isPurchased = false
    }

    // Format image URL if exists
    if (examPlanObj.image) {
      examPlanObj.imageUrl = `${process.env.BASE_URL}${examPlanObj.image}`
    }

    return res.status(200).json({
      success: true,
      data: examPlanObj,
    })
  } catch (error) {
    console.error("Error fetching exam plan:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to fetch exam plan",
      error: error.message,
    })
  }
}
