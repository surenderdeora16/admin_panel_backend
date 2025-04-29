const Banner = require("../../models/Banner");
const Batch = require("../../models/Batch");
const Order = require("../../models/Order");
const Payment = require("../../models/Payment");
const UpcomingGovtExam = require("../../models/UpcomingGovtExam");
const catchAsync = require("../../utils/catchAsync");

exports.dashboard = async (req, res) => {
  try {
    const { limit = 5, pageNo = 1 } = req.query;

    // Fetch banners
    const banners = await Banner.findOne({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();
    const bannerImages = banners
      ? banners.images
          .filter((img) => !img.deletedAt && img.isActive)
          .sort((a, b) => a.order - b.order)
      : [];

    // Fetch top batches
    const batches = await Batch.find({ status: true, deletedAt: null })
      .sort({ sequence: 1, createdAt: -1 })
      .skip((pageNo - 1) * limit)
      .limit(limit)
      .lean();

    // Fetch upcoming govt exams
    const exams = await UpcomingGovtExam.find({ status: true, deletedAt: null })
      .sort({ examDate: 1 })
      .skip((pageNo - 1) * limit)
      .limit(limit)
      .lean();

    const response = {
      banners: bannerImages,
      batches,
      exams,
      timestamp: new Date(),
    };

    res.success(response);
  } catch (error) {
    logger.error(`Dashboard fetch error: ${error.message}`);
    res.someThingWentWrong(error);
  }
};

/**
 * @desc    Get user's payment history for mobile app
 * @route   GET /api/mobile/payments/history
 * @access  Private (User)
 */
exports.getUserPaymentHistory = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user._id;

  // Count total records
  const total = await Order.countDocuments({
    userId,
    deletedAt: null,
  });

  if (total === 0) {
    return res.datatableNoRecords();
  }

  // Get user's orders with pagination
  const orders = await Order.find({
    userId,
    deletedAt: null,
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate({
      path: "itemId",
      select: "title name price mrp",
    })
    .populate({
      path: "paymentId",
      select: "status method amount currency razorpayPaymentId createdAt",
    });

  // Format the response for mobile app
  const formattedPayments = orders.map((order) => {
    const payment = order.paymentId;
    const item = order.itemId;

    return {
      id: order._id,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      itemType: order.itemType,
      itemName: item ? item.title || item.name : "Unknown Item",
      amount: payment ? payment.amount / 100 : order.amount / 100, // Convert to rupees
      currency: payment ? payment.currency : "INR",
      status: payment ? payment.status : order.status,
      paymentMethod: payment ? payment.method : null,
      paymentId: payment ? payment.razorpayPaymentId : null,
      paymentDate: payment ? payment.createdAt : null,
      discount: order.discount ? order.discount / 100 : 0, // Convert to rupees
      originalPrice: item ? item.mrp / 100 : order.amount / 100, // Convert to rupees
      finalPrice: order.amount / 100, // Convert to rupees
    };
  });

  return res.pagination(formattedPayments, total, limit, page);
});

