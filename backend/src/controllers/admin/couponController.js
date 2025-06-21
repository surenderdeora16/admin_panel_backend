const Coupon = require("../../models/Coupon")
const CouponUsage = require("../../models/CouponUsage")
const AppError = require("../../utils/appError")
const catchAsync = require("../../utils/catchAsync")
const logger = require("../../utils/logger")
const mongoose = require("mongoose")


/**
 * @desc    Create a new coupon
 * @route   POST /api/admin/coupons
 * @access  Private (Admin)
 */
exports.createCoupon = async (req, res) => {
  try {
    // Extract coupon data from request body
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      minPurchaseAmount,
      applicableFor,
      specificItems,
      startDate,
      endDate,
      usageLimit,
      perUserLimit,
      status,
    } = req.body;

    // Validate required fields
    if (!code || !discountType || !discountValue || !endDate) {
      return res.noRecords("Please provide all required fields");
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (existingCoupon) {
      return res.noRecords("Coupon code already exists");
    }

    // Create coupon
    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      minPurchaseAmount,
      applicableFor,
      specificItems,
      startDate: startDate || new Date(),
      endDate,
      usageLimit,
      perUserLimit,
      status: true,
      createdBy: req.admin._id,
    });

    // Return created coupon
    return res.successInsert(coupon, "Coupon created successfully");
  } catch (error) {
    console.error(`Error creating coupon: ${error.message}`, { error });
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Get all coupons
 * @route   GET /api/admin/coupons
 * @access  Private (Admin)
 */
exports.getAllCoupons = async (req, res) => {
  try {
    const { limit, pageNo, query, orderBy, orderDirection, status, applicableFor } = req.query;

    // Build query
    const queryObj = {};

    // Add search filter
    if (query) {
      queryObj.$or = [
        { code: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    // Add status filter
    if (status !== undefined) {
      queryObj.status = status === "true";
    }

    // Add applicableFor filter
    if (applicableFor) {
      queryObj.applicableFor = applicableFor;
    }

    // Count total records
    const total = await Coupon.countDocuments(queryObj);

    if (total === 0) {
      return res.datatableNoRecords();
    }

    // Get coupons with pagination and sorting
    const coupons = await Coupon.find(queryObj)
      .sort({ [orderBy]: orderDirection === "asc" ? 1 : -1 })
      .skip((pageNo - 1) * limit)
      .limit(Number(limit))
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    // Return coupons with pagination
    return res.pagination(coupons, total, limit, pageNo);
  } catch (error) {
    console.error(`Error getting coupons: ${error.message}`, { error });
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Get coupon by ID
 * @route   GET /api/admin/coupons/:id
 * @access  Private (Admin)
 */
exports.getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get coupon by ID
    const coupon = await Coupon.findById(id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    // Check if coupon exists
    if (!coupon) {
      return res.noRecords("Coupon not found");
    }

    // Return coupon
    return res.success(coupon);
  } catch (error) {
    console.error(`Error getting coupon: ${error.message}`, { error });
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Update coupon
 * @route   PUT /api/admin/coupons/:id
 * @access  Private (Admin)
 */
exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    // Extract coupon data from request body
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      minPurchaseAmount,
      applicableFor,
      specificItems,
      startDate,
      endDate,
      usageLimit,
      perUserLimit,
      status,
    } = req.body;

    // Get coupon by ID
    const coupon = await Coupon.findById(id);

    // Check if coupon exists
    if (!coupon) {
      return res.noRecords("Coupon not found");
    }

    // Update coupon fields
    if (code !== undefined) coupon.code = code;
    if (description !== undefined) coupon.description = description;
    if (discountType !== undefined) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (maxDiscountAmount !== undefined) coupon.maxDiscountAmount = maxDiscountAmount;
    if (minPurchaseAmount !== undefined) coupon.minPurchaseAmount = minPurchaseAmount;
    if (applicableFor !== undefined) coupon.applicableFor = applicableFor;
    if (specificItems !== undefined) coupon.specificItems = specificItems;
    if (startDate !== undefined) coupon.startDate = startDate;
    if (endDate !== undefined) coupon.endDate = endDate;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (perUserLimit !== undefined) coupon.perUserLimit = perUserLimit;
    if (status !== undefined) coupon.status = status;

    // Set updatedBy
    coupon.updatedBy = req.admin._id;

    // Save updated coupon
    await coupon.save();

    // Return updated coupon
    return res.successUpdate(coupon);
  } catch (error) {
    console.error(`Error updating coupon: ${error.message}`, { error });
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Delete coupon (soft delete)
 * @route   DELETE /api/admin/coupons/:id
 * @access  Private (Admin)
 */
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    // Get coupon by ID
    const coupon = await Coupon.findById(id);

    // Check if coupon exists
    if (!coupon) {
      return res.noRecords("Coupon not found");
    }

    // Soft delete coupon
    coupon.deletedAt = new Date();
    coupon.status = false;
    coupon.updatedBy = req.admin._id;

    // Save updated coupon
    await coupon.save();

    // Return success message
    return res.successDelete();
  } catch (error) {
    console.error(`Error deleting coupon: ${error.message}`, { error });
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Get coupon usage statistics
 * @route   GET /api/admin/coupons/:id/stats
 * @access  Private (Admin)
 */
exports.getCouponStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Get coupon by ID
    const coupon = await Coupon.findById(id);

    // Check if coupon exists
    if (!coupon) {
      return res.noRecords("Coupon not found");
    }

    // Get coupon usage count
    const usageCount = await CouponUsage.countDocuments({ couponId: id });

    // Get total discount amount
    const discountStats = await CouponUsage.aggregate([
      { $match: { couponId: mongoose.Types.ObjectId.createFromHexString(id) } },
      {
        $group: {
          _id: null,
          totalDiscountAmount: { $sum: "$discountAmount" },
          totalOriginalAmount: { $sum: "$originalAmount" },
          totalFinalAmount: { $sum: "$finalAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      usageCount,
      totalDiscountAmount: discountStats.length > 0 ? discountStats[0].totalDiscountAmount : 0,
      totalOriginalAmount: discountStats.length > 0 ? discountStats[0].totalOriginalAmount : 0,
      totalFinalAmount: discountStats.length > 0 ? discountStats[0].totalFinalAmount : 0,
      usageLimit: coupon.usageLimit,
      usagePercentage: coupon.usageLimit ? (usageCount / coupon.usageLimit) * 100 : null,
    };

    // Return coupon stats
    return res.success(stats);
  } catch (error) {
    console.error(`Error getting coupon stats: ${error.message}`, { error });
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Get coupon usage history
 * @route   GET /api/admin/coupons/:id/usage
 * @access  Private (Admin)
 */
exports.getCouponUsage = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit, pageNo } = req.query;

    // Get coupon by ID
    const coupon = await Coupon.findById(id);

    // Check if coupon exists
    if (!coupon) {
      return res.noRecords("Coupon not found");
    }

    // Count total records
    const total = await CouponUsage.countDocuments({ couponId: id });

    if (total === 0) {
      return res.datatableNoRecords();
    }

    // Get coupon usage with pagination
    const usage = await CouponUsage.find({ couponId: id })
      .sort({ usedAt: -1 })
      .skip((pageNo - 1) * limit)
      .limit(Number(limit))
      .populate("userId", "name email phone")
      .populate({
        path: "orderId",
        select: "orderNumber itemType itemId status",
        populate: {
          path: "itemId",
          select: "title name",
        },
      });

    // Return coupon usage with pagination
    return res.pagination(usage, total, limit, pageNo);
  } catch (error) {
    console.error(`Error getting coupon usage: ${error.message}`, { error });
    return res.someThingWentWrong(error);
  }
};