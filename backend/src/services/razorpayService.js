// src/services/razorpayService.js
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const UserPurchase = require("../models/UserPurchase");
const ExamPlan = require("../models/ExamPlan");
const Note = require("../models/Note");
const couponService = require("./couponService");
const logger = require("../utils/logger");

// Initialize Razorpay with your key_id and key_secret
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("Razorpay API credentials are missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables.");
}

/**
 * Generates a unique order number
 * @returns {string} - Unique order number
 */
const generateOrderNumber = () => {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  return `ORD-${timestamp}-${random}`;
};

/**
 * Creates a Razorpay order for an exam plan
 * @param {string} userId - The user ID
 * @param {string} examPlanId - The exam plan ID
 * @param {string} couponCode - Optional coupon code
 * @returns {Promise<Object>} - The created order and Razorpay order
 */
exports.createExamPlanOrder = async (userId, examPlanId, couponCode = null) => {
  try {
    logger.info(`Creating exam plan order for user ${userId}, exam plan ${examPlanId}`);

    // Validate exam plan exists
    const examPlan = await ExamPlan.findById(examPlanId);
    if (!examPlan) {
      throw new Error("Exam plan not found");
    }

    // Check if user already has an active purchase for this exam plan
    const hasActivePurchase = await this.checkUserPurchase(userId, "EXAM_PLAN", examPlanId);
    if (hasActivePurchase) {
      throw new Error("You already have an active purchase for this exam plan");
    }

    // Set original amount
    const originalAmount = examPlan.price;
    let discountAmount = 0;
    let finalAmount = originalAmount;
    let couponData = null;

    // Apply coupon if provided
    if (couponCode) {
      try {
        couponData = await couponService.validateCoupon(
          couponCode,
          userId,
          "EXAM_PLAN",
          examPlanId,
          originalAmount
        );

        discountAmount = couponData.discountAmount;
        finalAmount = couponData.finalAmount;
      } catch (error) {
        throw new Error(error.message);
      }
    }

    // Create Razorpay order
    const orderOptions = {
      amount: finalAmount * 100, 
      currency: "INR",
      receipt: generateOrderNumber(),
      notes: {
        userId: userId.toString(),
        itemType: "EXAM_PLAN",
        itemId: examPlanId.toString(),
        couponCode: couponCode || "NONE",
      },
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    logger.info(`Razorpay order created: ${razorpayOrder.id}`);

    // Create our internal order
    const order = new Order({
      userId,
      orderNumber: orderOptions.receipt,
      itemType: "EXAM_PLAN",
      itemId: examPlanId,
      itemModel: "ExamPlan",
      originalAmount,
      discountAmount,
      finalAmount,
      couponId: couponData ? couponData.coupon._id : null,
      couponCode: couponCode,
      currency: "INR",
      razorpayOrderId: razorpayOrder.id,
      status: "CREATED",
      validUntil: new Date(Date.now() + examPlan.validityDays * 24 * 60 * 60 * 1000),
      metadata: {
        razorpayOrder: razorpayOrder,
        examPlanDetails: {
          title: examPlan.title,
          validityDays: examPlan.validityDays,
        },
      },
    });

    // Add initial status to history
    order.addStatusHistory("CREATED", "Order created");

    await order.save();
    logger.info(`Internal order created: ${order._id}`);
    return {
      order,
      razorpayOrder,
    };
  } catch (error) {
    logger.error(`Error creating exam plan order: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Creates a Razorpay order for a note
 * @param {string} userId - The user ID
 * @param {string} noteId - The note ID
 * @param {string} couponCode - Optional coupon code
 * @returns {Promise<Object>} - The created order and Razorpay order
 */
exports.createNoteOrder = async (userId, noteId, couponCode = null) => {
  try {
    logger.info(`Creating note order for user ${userId}, note ${noteId}`);

    // Validate note exists
    const note = await Note.findById(noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    // Check if note is free
    if (note.isFree) {
      throw new Error("This note is free and doesn't require payment");
    }

    // Check if user already has an active purchase for this note
    const hasActivePurchase = await this.checkUserPurchase(userId, "NOTE", noteId);
    if (hasActivePurchase) {
      throw new Error("You already have an active purchase for this note");
    }

    // Set original amount
    const originalAmount = note.price;
    let discountAmount = 0;
    let finalAmount = originalAmount;
    let couponData = null;

    // Apply coupon if provided
    if (couponCode) {
      try {
        couponData = await couponService.validateCoupon(
          couponCode,
          userId,
          "NOTE",
          noteId,
          originalAmount
        );

        discountAmount = couponData.discountAmount;
        finalAmount = couponData.finalAmount;
      } catch (error) {
        throw new Error(error.message);
      }
    }

    // Create Razorpay order
    const orderOptions = {
      amount: finalAmount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: generateOrderNumber(),
      notes: {
        userId: userId.toString(),
        itemType: "NOTE",
        itemId: noteId.toString(),
        couponCode: couponCode || "NONE",
      },
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);
    logger.info(`Razorpay order created: ${razorpayOrder.id}`);

    // Create our internal order
    const order = new Order({
      userId,
      orderNumber: orderOptions.receipt,
      itemType: "NOTE",
      itemId: noteId,
      itemModel: "Note",
      originalAmount,
      discountAmount,
      finalAmount,
      couponId: couponData ? couponData.coupon._id : null,
      couponCode: couponCode,
      currency: "INR",
      razorpayOrderId: razorpayOrder.id,
      status: "CREATED",
      validUntil: new Date(Date.now() + note.validityDays * 24 * 60 * 60 * 1000),
      metadata: {
        razorpayOrder: razorpayOrder,
        noteDetails: {
          title: note.title,
          validityDays: note.validityDays,
        },
      },
    });

    // Add initial status to history
    order.addStatusHistory("CREATED", "Order created");

    await order.save();
    logger.info(`Internal order created: ${order._id}`);

    return {
      order,
      razorpayOrder,
    };
  } catch (error) {
    logger.error(`Error creating note order: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Verifies Razorpay payment signature
 * @param {string} razorpayOrderId - Razorpay order ID
 * @param {string} razorpayPaymentId - Razorpay payment ID
 * @param {string} razorpaySignature - Razorpay signature
 * @returns {boolean} - Whether the signature is valid
 */
exports.verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  try {
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    return generatedSignature === razorpaySignature;
  } catch (error) {
    logger.error(`Error verifying payment signature: ${error.message}`, { error });
    return false;
  }
};

/**
 * Processes payment verification and updates order status
 * @param {string} razorpayOrderId - Razorpay order ID
 * @param {string} razorpayPaymentId - Razorpay payment ID
 * @param {string} razorpaySignature - Razorpay signature
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - The processed payment result
 */
exports.processPayment = async (razorpayOrderId, razorpayPaymentId, razorpaySignature, userId) => {
  try {
    logger.info(`Processing payment for order ${razorpayOrderId}, payment ${razorpayPaymentId}`);

    // Verify signature
    const isValidSignature = this.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValidSignature) {
      logger.warn(`Invalid payment signature for order ${razorpayOrderId}`);
      throw new Error("Invalid payment signature");
    }

    // Get payment details from Razorpay
    const razorpayPayment = await razorpay.payments.fetch(razorpayPaymentId);
    logger.info(`Fetched Razorpay payment: ${JSON.stringify(razorpayPayment)}`);

    // Find our order
    const order = await Order.findOne({ razorpayOrderId });

    if (!order) {
      logger.warn(`Order not found for Razorpay order ID ${razorpayOrderId}`);
      throw new Error("Order not found");
    }

    // Verify user
    if (order.userId.toString() !== userId.toString()) {
      logger.warn(`Unauthorized access to order ${order._id} by user ${userId}`);
      throw new Error("Unauthorized access to order");
    }

    // Create payment record
    const payment = new Payment({
      orderId: order._id,
      userId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      amount: razorpayPayment.amount / 100, // Convert from paise to rupees
      currency: razorpayPayment.currency,
      status: razorpayPayment.status === "captured" ? "CAPTURED" : "AUTHORIZED",
      method: razorpayPayment.method,
      bank: razorpayPayment.bank,
      cardId: razorpayPayment.card_id,
      wallet: razorpayPayment.wallet,
      vpa: razorpayPayment.vpa,
      email: razorpayPayment.email,
      contact: razorpayPayment.contact,
      notes: razorpayPayment.notes,
      rawResponse: razorpayPayment,
    });

    // Add initial status to history
    payment.addStatusHistory(
      razorpayPayment.status === "captured" ? "CAPTURED" : "AUTHORIZED",
      "Payment processed"
    );

    await payment.save();
    logger.info(`Payment record created: ${payment._id}`);

    // Update order status
    order.paymentId = payment._id;
    order.status = "PAID";
    order.addStatusHistory("PAID", "Payment successful");
    await order.save();
    logger.info(`Order status updated to PAID: ${order._id}`);

    // Create user purchase record
    const userPurchase = new UserPurchase({
      userId,
      itemType: order.itemType,
      itemId: order.itemId,
      itemModel: order.itemModel,
      orderId: order._id,
      paymentId: payment._id,
      expiryDate: order.validUntil,
      status: "ACTIVE",
    });

    // Add initial status to history
    userPurchase.addStatusHistory("ACTIVE", "Purchase activated");

    await userPurchase.save();
    logger.info(`User purchase record created: ${userPurchase._id}`);

    // Record coupon usage if a coupon was used
    if (order.couponId) {
      await couponService.recordCouponUsage(
        userId,
        order.couponId,
        order._id,
        order.originalAmount,
        order.discountAmount,
        order.finalAmount
      );
      logger.info(`Coupon usage recorded for coupon ${order.couponCode}`);
    }

    return {
      success: true,
      order,
      payment,
      userPurchase,
    };
  } catch (error) {
    logger.error(`Error processing payment: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Checks if a payment has failed and updates status
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} - The updated order
 */
exports.checkPaymentStatus = async (orderId) => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    // If order is still in CREATED or PENDING status after 30 minutes, mark as EXPIRED
    if (["CREATED", "PENDING"].includes(order.status)) {
      const orderCreationTime = new Date(order.createdAt).getTime();
      const currentTime = new Date().getTime();
      const timeDifference = currentTime - orderCreationTime;

      // If more than 30 minutes have passed
      if (timeDifference > 30 * 60 * 1000) {
        logger.info(`Marking order ${order._id} as EXPIRED due to payment timeout`);
        order.status = "EXPIRED";
        order.addStatusHistory("EXPIRED", "Order expired due to payment timeout");
        await order.save();
      }
    }

    return order;
  } catch (error) {
    logger.error(`Error checking payment status: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Gets payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} - Payment details
 */
exports.getPaymentDetails = async (paymentId) => {
  try {
    return await razorpay.payments.fetch(paymentId);
  } catch (error) {
    logger.error(`Error fetching payment details: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Checks if user has active purchase for an item
 * @param {string} userId - User ID
 * @param {string} itemType - Item type (EXAM_PLAN or NOTE)
 * @param {string} itemId - Item ID
 * @returns {Promise<boolean>} - Whether user has active purchase
 */
exports.checkUserPurchase = async (userId, itemType, itemId) => {
  try {
    const purchase = await UserPurchase.findOne({
      userId,
      itemType,
      itemId,
      status: "ACTIVE",
      expiryDate: { $gt: new Date() },
    });

    return !!purchase;
  } catch (error) {
    logger.error(`Error checking user purchase: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Gets user's active purchases
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - User's active purchases
 */
exports.getUserActivePurchases = async (userId) => {
  try {
    return await UserPurchase.find({
      userId,
      status: "ACTIVE",
      expiryDate: { $gt: new Date() },
    });
  } catch (error) {
    logger.error(`Error getting user active purchases: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Updates expired purchases
 * @returns {Promise<number>} - Number of updated purchases
 */
exports.updateExpiredPurchases = async () => {
  try {
    const expiredPurchases = await UserPurchase.find({
      status: "ACTIVE",
      expiryDate: { $lt: new Date() },
    });

    logger.info(`Found ${expiredPurchases.length} expired purchases to update`);

    for (const purchase of expiredPurchases) {
      purchase.status = "EXPIRED";
      purchase.addStatusHistory("EXPIRED", "Purchase expired");
      await purchase.save();
      logger.info(`Updated purchase ${purchase._id} to EXPIRED`);
    }

    return expiredPurchases.length;
  } catch (error) {
    logger.error(`Error updating expired purchases: ${error.message}`, { error });
    throw error;
  }
};