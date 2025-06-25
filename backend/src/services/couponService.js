// src/services/couponService.js
const Coupon = require("../models/Coupon");
const CouponUsage = require("../models/CouponUsage");
const AppError = require("../utils/appError")

/**
 * Validates a coupon for a specific user and item
 * @param {string} couponCode - The coupon code to validate
 * @param {string} userId - The user ID
 * @param {string} itemType - The type of item (EXAM_PLAN or NOTE)
 * @param {string} itemId - The ID of the item
 * @param {number} amount - The original amount
 * @returns {Promise<Object>} - The validated coupon with discount information
 */
exports.validateCoupon = async (couponCode, userId, itemType, itemId, amount) => {
  try {
    // Find the coupon by code
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), status: true });

    // Check if coupon exists
    if (!coupon) {
      throw new Error("Invalid coupon code");
    }

    // Check if coupon is valid
    if (!coupon.$isValid()) {
      throw new Error("Coupon has expired or is no longer valid");
    }

    // Check if coupon is applicable for this item
    if (!coupon.isApplicableFor(itemType, itemId)) {
      throw new Error("Coupon is not applicable for this item");
    }

    // Check minimum purchase amount
    if (amount < coupon.minPurchaseAmount) {
      throw new Error(`Minimum purchase amount of ₹${coupon.minPurchaseAmount} required to use this coupon`);
    }

    // Check if user has already used this coupon up to the limit
    const userUsageCount = await CouponUsage.countDocuments({ userId, couponId: coupon._id });

    if (userUsageCount >= coupon.perUserLimit) {
      throw new Error(`You have already used this coupon ${userUsageCount} time(s)`);
    }

    // Calculate discount amount
    const discountAmount = coupon.calculateDiscount(amount);
    const finalAmount = amount - discountAmount;

    return {
      coupon,
      originalAmount: amount,
      discountAmount,
      finalAmount,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Records the usage of a coupon
 * @param {string} userId - The user ID
 * @param {string} couponId - The coupon ID
 * @param {string} orderId - The order ID
 * @param {number} originalAmount - The original amount
 * @param {number} discountAmount - The discount amount
 * @param {number} finalAmount - The final amount after discount
 * @returns {Promise<Object>} - The created coupon usage record
 */
exports.recordCouponUsage = async (userId, couponId, orderId, originalAmount, discountAmount, finalAmount) => {
  try {
    // Create coupon usage record
    const couponUsage = await CouponUsage.create({
      userId,
      couponId,
      orderId,
      originalAmount,
      discountAmount,
      finalAmount,
      usedAt: new Date(),
    });

    // Increment coupon usage count
    const coupon = await Coupon.findById(couponId);
    await coupon.incrementUsage();

    return couponUsage;
  } catch (error) {
    throw error;
  }
};

/**
 * Gets all coupons applicable for a user and item
 * @param {string} userId - The user ID
 * @param {string} itemType - The type of item (EXAM_PLAN or NOTE)
 * @param {string} itemId - The ID of the item
 * @param {number} amount - The original amount
 * @returns {Promise<Array>} - Array of applicable coupons with discount information
 */
exports.getApplicableCoupons = async (userId, itemType, itemId, amount) => {
  try {
    // Get all active coupons
    const coupons = await Coupon.find({
      status: true,
      endDate: { $gte: new Date() },
      // startDate: { $lte: new Date() },
      $or: [
      { applicableFor: "ALL" },
      { applicableFor: itemType },
      {
        specificItems: {
        $elemMatch: { itemType, itemId },
        },
      },
      ],
      minPurchaseAmount: { $lte: amount },
      deletedAt: null
    });

    // Filter coupons based on user usage limit
    const applicableCoupons = [];
    
    for (const coupon of coupons) {
      // Check if usage limit is reached
      if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
        continue;
      }

      // Check if user has already used this coupon up to the limit
      const userUsageCount = await CouponUsage.countDocuments({ userId, couponId: coupon._id });

      if (userUsageCount >= coupon.perUserLimit) {
        continue;
      }

      // Calculate discount amount
      const discountAmount = coupon.calculateDiscount(amount);
      const finalAmount = amount - discountAmount;

      applicableCoupons.push({
        coupon,
        originalAmount: amount,
        discountAmount,
        finalAmount,
      });
    }

    return applicableCoupons;
  } catch (error) {
    throw error;
  }
};