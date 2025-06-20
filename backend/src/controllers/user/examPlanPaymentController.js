const razorpayService = require("../../services/razorpayService");
const couponService = require("../../services/couponService");
const Order = require("../../models/Order");
const Payment = require("../../models/Payment");
const UserPurchase = require("../../models/UserPurchase");
const ExamPlan = require("../../models/ExamPlan");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const logger = require("../../utils/logger");
const mongoose = require("mongoose")
/**
 * @desc    Create a payment order for an exam plan
 * @route   POST /api/exam-plans/:examPlanId/order
 * @access  Private (User)
 */
exports.createExamPlanOrder = async (req, res) => {
  try {
    const { examPlanId } = req.params;
    const { couponCode } = req.body;

    // Validate exam plan ID
    if (!examPlanId) {
      return res.noRecords("Exam plan ID is required");
    }

    // Create order
    const { order, razorpayOrder } = await razorpayService.createExamPlanOrder(
      req?.user_id,
      examPlanId,
      couponCode
    );

    // Return order details
    return res.successInsert(
      {
        orderId: order._id,
        orderNumber: order.orderNumber,
        originalAmount: order.originalAmount,
        discountAmount: order.discountAmount,
        finalAmount: order.finalAmount,
        couponCode: order.couponCode,
        currency: order.currency,
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        prefill: {
          name: req.user.name,
          email: req.user.email,
          contact: req.user.phone,
        },
        notes: {
          userId: req?.user_id.toString(),
          itemType: "EXAM_PLAN",
          itemId: examPlanId,
        },
      },
      "Exam plan order created successfully"
    );
  } catch (error) {
    console.error(`Error creating exam plan order: ${error.message}`, {
      error,
    });
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Verify payment for an exam plan
 * @route   POST /api/exam-plans/verify-payment
 * @access  Private (User)
 */
exports.verifyExamPlanPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Validate required fields
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.noRecords("All payment details are required");
    }

    // Process payment
    const result = await razorpayService.processPayment(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      req?.user_id
    );

    // Verify that this is an exam plan order
    const order = result.order;
    if (order.itemType !== "EXAM_PLAN") {
      return res.noRecords("Invalid order type");
    }

    // Return success response
    return res.success(
      {
        orderId: result.order._id,
        orderNumber: result.order.orderNumber,
        paymentId: result.payment._id,
        purchaseId: result.userPurchase._id,
        examPlanId: result.order.itemId,
        expiryDate: result.userPurchase.expiryDate,
        originalAmount: result.order.originalAmount,
        discountAmount: result.order.discountAmount,
        finalAmount: result.order.finalAmount,
        couponCode: result.order.couponCode,
      },
      "Exam plan payment verified successfully"
    );
  } catch (error) {
    console.error(`Error verifying exam plan payment: ${error.message}`, {
      error,
    });
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Get user's purchased exam plans
 * @route   GET /api/exam-plans/purchased
 * @access  Private (User)
 */
exports.getUserPurchasedExamPlans = async (req, res) => {
  try {
    const purchases = await UserPurchase.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req?.user_id),
          itemType: "EXAM_PLAN",
          status: "ACTIVE",
          expiryDate: { $gt: new Date() },
          deletedAt: null, // skip deleted purchases
        },
      },
      {
        $lookup: {
          from: "examplans", // collection name (lowercase, plural usually)
          localField: "itemId",
          foreignField: "_id",
          as: "examPlan",
        },
      },
      {
        $unwind: {
          path: "$examPlan",
          preserveNullAndEmptyArrays: true, // include even if exam plan is deleted
        },
      },
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "order",
        },
      },
      {
        $unwind: {
          path: "$order",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          itemType: 1,
          expiryDate: 1,
          status: 1,
          purchaseDate: 1,
          metadata: 1,
          examPlan: {
            _id: 1,
            title: 1,
            description: 1,
            image: 1,
            price: 1,
            mrp: 1,
            validityDays: 1,
          },
          order: {
            orderNumber: 1,
            originalAmount: 1,
            discountAmount: 1,
            finalAmount: 1,
            couponCode: 1,
          },
        },
      },
    ]);

    return res.success(purchases);
  } catch (error) {
    console.error(`Error getting user purchased exam plans: ${error.message}`, { error });
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Check if user has purchased an exam plan
 * @route   GET /api/exam-plans/:examPlanId/check-purchase
 * @access  Private (User)
 */
exports.checkExamPlanPurchase = async (req, res) => {
  try {
    const { examPlanId } = req.params;
    const { couponCode } = req.body;
    const userId = req?.user_id;
    // Validate exam plan ID
    if (!examPlanId) {
      return res.noRecords("Exam plan ID is required");
    }

    // Get exam plan details
    const examPlan = await ExamPlan.findById(examPlanId);

    if (!examPlan) {
      return res.noRecords("Exam plan not found");
    }

    const originalAmount = examPlan?.price;
    let discountAmount = null;
    let finalAmount = null;

    if (couponCode) {
      try {
        couponData = await couponService.validateCoupon(
          couponCode,
          userId,
          "EXAM_PLAN",
          examPlanId,
          originalAmount
        );

        discountAmount = couponData?.discountAmount;
        finalAmount = couponData?.finalAmount;
      } catch (error) {
        throw new Error(error.message);
      }
    }

    // Check if user has an active purchase
    const purchase = await UserPurchase.findOne({
      userId: req?.user_id,
      itemType: "EXAM_PLAN",
      itemId: examPlanId,
      status: "ACTIVE",
      expiryDate: { $gt: new Date() },
    });

    // Calculate remaining validity days if purchased
    let remainingDays = 0;
    if (purchase) {
      const now = new Date();
      const expiryDate = new Date(purchase.expiryDate);
      remainingDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    }

    // Return purchase status
    return res.success({
      hasPurchased: !!purchase,
      purchase: purchase
        ? {
            id: purchase?._id,
            purchaseDate: purchase.purchaseDate,
            expiryDate: purchase.expiryDate,
            remainingDays,
          }
        : null,
      examPlan: {
        id: examPlan?._id,
        title: examPlan.title,
        price: examPlan.price,
        mrp: examPlan.mrp,
        discountAmount,
        finalAmount,
        validityDays: examPlan.validityDays,
      },
    });
  } catch (error) {
    console.error(`Error checking exam plan purchase: ${error.message}`, {
      error,
    });
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Get applicable coupons for an exam plan
 * @route   GET /api/exam-plans/:examPlanId/coupons
 * @access  Private (User)
 */
exports.getExamPlanCoupons = async (req, res) => {
  try {
    const { examPlanId } = req.params;

    // Validate exam plan ID
    if (!examPlanId) {
      return res.noRecords("Exam plan ID is required");
    }

    // Get exam plan details
    const examPlan = await ExamPlan.findById(examPlanId);

    if (!examPlan) {
      return res.noRecords("Exam plan not found");
    }

    // Get applicable coupons
    const coupons = await couponService.getApplicableCoupons(
      req?.user_id,
      "EXAM_PLAN",
      examPlanId,
      examPlan.price
    );

    // Return coupons
    return res.success(coupons);
  } catch (error) {
    console.error(`Error getting exam plan coupons: ${error.message}`, {
      error,
    });
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Validate coupon for an exam plan
 * @route   POST /api/exam-plans/:examPlanId/validate-coupon
 * @access  Private (User)
 */
exports.validateExamPlanCoupon = async (req, res) => {
  try {
    const { examPlanId } = req.params;
    const { couponCode } = req.body;

    // Validate required fields
    if (!examPlanId) {
      return res.noRecords("Exam plan ID is required");
    }

    if (!couponCode) {
      return res.noRecords("Coupon code is required");
    }

    // Get exam plan details
    const examPlan = await ExamPlan.findById(examPlanId);

    if (!examPlan) {
      return res.noRecords("Exam plan not found");
    }

    // Validate coupon
    const couponData = await couponService.validateCoupon(
      couponCode,
      req?.user_id,
      "EXAM_PLAN",
      examPlanId,
      examPlan.price
    );

    // Return coupon validation result
    return res.success(
      {
        couponCode: couponData.coupon.code,
        discountType: couponData.coupon.discountType,
        discountValue: couponData.coupon.discountValue,
        originalAmount: couponData.originalAmount,
        discountAmount: couponData.discountAmount,
        finalAmount: couponData.finalAmount,
      },
      "Coupon validated successfully"
    );
  } catch (error) {
    console.error(`Error validating exam plan coupon: ${error.message}`, {
      error,
    });
    return res.someThingWentWrong(error);
  }
};
