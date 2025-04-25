const Payment = require("../../models/Payment")
const AppError = require("../../utils/appError")
const catchAsync = require("../../utils/catchAsync")
const logger = require("../../utils/logger")

/**
* @desc    Get recent payment logs
* @route   GET /api/admin/payment-logs
* @access  Private (Admin)
*/
exports.getPaymentLogs = catchAsync(async (req, res, next) => {
try {
  const { page = 1, limit = 10 } = req.query

  // Get recent payments
  const payments = await Payment.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate({
      path: "orderId",
      select: "orderNumber itemType itemId status",
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
  const total = await Payment.countDocuments()

  // Return payments
  return res.status(200).json({
    success: true,
    count: payments.length,
    total,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    },
    data: payments,
  })
} catch (error) {
  logger.error(`Error getting payment logs: ${error.message}`, { error })
  return next(new AppError(error.message, error.statusCode || 500))
}
})
