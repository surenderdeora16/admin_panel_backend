const razorpayService = require("../services/razorpayService")
const Order = require("../models/Order")
const Payment = require("../models/Payment")
const UserPurchase = require("../models/UserPurchase")
const ExamPlan = require("../models/ExamPlan")
const TestSeries = require("../models/TestSeries")

// Create a new payment order
exports.createPaymentOrder = async (req, res) => {
  try {
    const { itemType, itemId } = req.body

    if (!itemType || !itemId) {
      return res.status(400).json({
        status: false,
        message: "Item type and item ID are required",
      })
    }

    // Validate item type
    if (!["EXAM_PLAN", "TEST_SERIES"].includes(itemType)) {
      return res.status(400).json({
        status: false,
        message: "Invalid item type",
      })
    }

    // Get item details and price
    let item
    if (itemType === "EXAM_PLAN") {
      item = await ExamPlan.findById(itemId)
    } else {
      item = await TestSeries.findById(itemId)
      
      // Check if test series is free
      if (item && item.isFree) {
        return res.status(400).json({
          status: false,
          message: "This test series is free and doesn't require payment",
        })
      }
    }

    if (!item) {
      return res.status(404).json({
        status: false,
        message: `${itemType === "EXAM_PLAN" ? "Exam plan" : "Test series"} not found`,
      })
    }

    // Check if user already has an active purchase for this item
    const hasActivePurchase = await razorpayService.checkUserPurchase(req.user._id, itemType, itemId)
    if (hasActivePurchase) {
      return res.status(400).json({
        status: false,
        message: `You already have an active purchase for this ${itemType === "EXAM_PLAN" ? "exam plan" : "test series"}`,
      })
    }

    // Create Razorpay order
    const { order, razorpayOrder } = await razorpayService.createOrder(
      req.user._id,
      itemType,
      itemId,
      item.price,
      "INR",
    )

    return res.status(201).json({
      status: true,
      message: "Payment order created successfully",
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: order.amount,
        currency: order.currency,
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        prefill: {
          name: req.user.name,
          email: req.user.email,
          contact: req.user.phone,
        },
        notes: {
          userId: req.user._id.toString(),
          itemType,
          itemId,
        },
      },
    })
  } catch (error) {
    console.error("Error creating payment order:", error)
    return res.status(500).json({
      status: false,
      message: "Failed to create payment order",
      error: error.message,
    })
  }
}

// Verify payment
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        status: false,
        message: "All payment details are required",
      })
    }

    // Process payment
    const result = await razorpayService.processPayment(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      req.user._id,
    )

    return res.status(200).json({
      status: true,
      message: "Payment verified successfully",
      data: {
        orderId: result.order._id,
        paymentId: result.payment._id,
        purchaseId: result.userPurchase._id,
        expiryDate: result.userPurchase.expiryDate,
      },
    })
  } catch (error) {
    console.error("Error verifying payment:", error)
    return res.status(500).json({
      status: false,
      message: "Failed to verify payment",
      error: error.message,
    })
  }
}

// Get user's payment history
exports.getUserPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query

    // Get user's orders
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate({
        path: "itemId",
        select: "title name",
      })
      .populate({
        path: "paymentId",
        select: "status method amount",
      })

    // Get total count
    const total = await Order.countDocuments({ userId: req.user._id })

    return res.status(200).json({
      status: true,
      data: orders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching payment history:", error)
    return res.status(500).json({
      status: false,
      message: "Failed to fetch payment history",
      error: error.message,
    })
  }
}

// Get user's active purchases
exports.getUserActivePurchases = async (req, res) => {
  try {
    const purchases = await UserPurchase.find({
      userId: req.user._id,
      status: "ACTIVE",
      expiryDate: { $gt: new Date() },
    })
      .populate({
        path: "itemId",
        select: "title name description",
      })
      .populate({
        path: "orderId",
        select: "orderNumber amount",
      })

    return res.status(200).json({
      status: true,
      data: purchases,
    })
  } catch (error) {
    console.error("Error fetching active purchases:", error)
    return res.status(500).json({
      status: false,
      message: "Failed to fetch active purchases",
      error: error.message,
    })
  }
}

// Get payment details
exports.getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params

    const payment = await Payment.findById(paymentId)
      .populate({
        path: "orderId",
        select: "orderNumber itemType itemId amount status",
        populate: {
          path: "itemId",
          select: "title name",
        },
      })
      .populate({
        path: "userId",
        select: "name email",
      })

    if (!payment) {
      return res.status(404).json({
        status: false,
        message: "Payment not found",
      })
    }

    // Check if the payment belongs to the user
    if (payment.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: false,
        message: "Unauthorized access to payment details",
      })
    }

    return res.status(200).json({
      status: true,
      data: payment,
    })
  } catch (error) {
    console.error("Error fetching payment details:", error)
    return res.status(500).json({
      status: false,
      message: "Failed to fetch payment details",
      error: error.message,
    })
  }
}

// Check if user has purchased an item
exports.checkPurchaseStatus = async (req, res) => {
  try {
    const { itemType, itemId } = req.params

    if (!itemType || !itemId) {
      return res.status(400).json({
        status: false,
        message: "Item type and item ID are required",
      })
    }

    // Validate item type
    if (!["EXAM_PLAN", "TEST_SERIES"].includes(itemType)) {
      return res.status(400).json({
        status: false,
        message: "Invalid item type",
      })
    }

    // Get item details
    let item
    let isFree = false
    
    if (itemType === "EXAM_PLAN") {
      item = await ExamPlan.findById(itemId)
    } else {
      item = await TestSeries.findById(itemId)
      if (item) {
        isFree = item.isFree
      }
    }

    if (!item) {
      return res.status(404).json({
        status: false,
        message: `${itemType === "EXAM_PLAN" ? "Exam plan" : "Test series"} not found`,
      })
    }

    // If test series is free, user has access
    if (itemType === "TEST_SERIES" && isFree) {
      return res.status(200).json({
        status: true,
        data: {
          hasPurchased: true,
          isFree: true,
        },
      })
    }

    // For test series, check if user has purchased the associated exam plan
    if (itemType === "TEST_SERIES" && !isFree) {
      const examPlanPurchase = await UserPurchase.findOne({
        userId: req.user._id,
        itemType: "EXAM_PLAN",
        itemId: item.examPlanId,
        status: "ACTIVE",
        expiryDate: { $gt: new Date() },
      })
      
      if (examPlanPurchase) {
        return res.status(200).json({
          status: true,
          data: {
            hasPurchased: true,
            isFree: false,
            purchase: {
              id: examPlanPurchase._id,
              purchaseDate: examPlanPurchase.purchaseDate,
              expiryDate: examPlanPurchase.expiryDate,
            },
            item: {
              id: item._id,
              title: item.title || item.name,
              examPlanId: item.examPlanId,
            },
          },
        })
      }
    }

    // Check if user has an active purchase for this specific item
    const purchase = await UserPurchase.findOne({
      userId: req.user._id,
      itemType,
      itemId,
      status: "ACTIVE",
      expiryDate: { $gt: new Date() },
    })

    return res.status(200).json({
      status: true,
      data: {
        hasPurchased: !!purchase,
        isFree: false,
        purchase: purchase
          ? {
              id: purchase._id,
              purchaseDate: purchase.purchaseDate,
              expiryDate: purchase.expiryDate,
            }
          : null,
        item: {
          id: item._id,
          title: item.title || item.name,
          price: item.price,
          mrp: item.mrp,
          validityDays: item.validityDays,
        },
      },
    })
  } catch (error) {
    console.error("Error checking purchase status:", error)
    return res.status(500).json({
      status: false,
      message: "Failed to check purchase status",
      error: error.message,
    })
  }
}

// Admin: Get all payments with filters
exports.getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, userId, startDate, endDate } = req.query

    // Build query
    const query = {}

    if (status) {
      query.status = status
    }

    if (userId) {
      query.userId = userId
    }

    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) {
        query.createdAt.$gte = new Date(startDate)
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate)
      }
    }

    // Get payments
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate({
        path: "orderId",
        select: "orderNumber itemType itemId amount status",
        populate: {
          path: "itemId",
          select: "title name",
        },
      })
      .populate({
        path: "userId",
        select: "name email",
      })

    // Get total count
    const total = await Payment.countDocuments(query)

    return res.status(200).json({
      status: true,
      data: payments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching payments:", error)
    return res.status(500).json({
      status: false,
      message: "Failed to fetch payments",
      error: error.message,
    })
  }
}

// Admin: Get payment statistics
exports.getPaymentStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    // Build date range
    const dateRange = {}
    if (startDate) {
      dateRange.$gte = new Date(startDate)
    }
    if (endDate) {
      dateRange.$lte = new Date(endDate)
    }

    // Get total payments
    const totalPayments = await Payment.countDocuments({
      ...(Object.keys(dateRange).length > 0 ? { createdAt: dateRange } : {}),
    })

    // Get successful payments
    const successfulPayments = await Payment.countDocuments({
      status: "CAPTURED",
      ...(Object.keys(dateRange).length > 0 ? { createdAt: dateRange } : {}),
    })

    // Get failed payments
    const failedPayments = await Payment.countDocuments({
      status: "FAILED",
      ...(Object.keys(dateRange).length > 0 ? { createdAt: dateRange } : {}),
    })

    // Get total revenue
    const revenueResult = await Payment.aggregate([
      {
        $match: {
          status: "CAPTURED",
          ...(Object.keys(dateRange).length > 0 ? { createdAt: dateRange } : {}),
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
        },
      },
    ])

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalAmount : 0

    // Get revenue by item type
    const revenueByItemType = await Order.aggregate([
      {
        $match: {
          status: "PAID",
          ...(Object.keys(dateRange).length > 0 ? { createdAt: dateRange } : {}),
        },
      },
      {
        $group: {
          _id: "$itemType",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ])

    return res.status(200).json({
      status: true,
      data: {
        totalPayments,
        successfulPayments,
        failedPayments,
        totalRevenue,
        revenueByItemType,
      },
    })
  } catch (error) {
    console.error("Error fetching payment statistics:", error)
    return res.status(500).json({
      status: false,
      message: "Failed to fetch payment statistics",
      error: error.message,
    })
  }
}
