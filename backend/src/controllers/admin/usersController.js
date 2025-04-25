const { User } = require("../../models");
const Order = require("../../models/Order");
const Payment = require("../../models/Payment");
const UserPurchase = require("../../models/UserPurchase");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const logger = require("../../utils/logger");

exports.list = async (req, res) => {
  try {
    var { limit, pageNo, query, orderBy, orderDirection } = req.query;

    limit = limit ? parseInt(limit) : 10;
    pageNo = pageNo ? parseInt(pageNo) : 1;
    query = query || null;
    orderBy = orderBy || "createdAt";
    orderDirection = orderDirection ? parseInt(orderDirection) : -1;

    var search = { deletedAt: null };
    if (query) {
      search.$or = [
        { first_name: new RegExp(query, "i") },
        { email: new RegExp(query, "i") },
      ];
    }

    var results = await User.find(search)
      .select(
        "first_name last_name email mobile image status device_token device_id createdAt"
      )
      .limit(limit)
      .skip((pageNo - 1) * limit)
      .sort({ [orderBy]: orderDirection });

    const total_count = await User.countDocuments(search);
    if (results.length > 0) {
      return res.pagination(results, total_count, limit, pageNo);
    } else {
      return res.datatableNoRecords();
    }
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
    try {
        const { pageNo, limit, query, orderBy, orderDirection } = req.query;

        // Build query
        const search = { deletedAt: null };
        if (query) {
            search.$or = [
                { first_name: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } },
            ];
        }

        // Get users
        const users = await User.find(search)
            .sort({ [orderBy]: orderDirection === "asc" ? 1 : -1 })
            .skip((pageNo - 1) * limit)
            .limit(limit);

        // Get total count
        const total_count = await User.countDocuments(search);

        // Return users with pagination
        if (users.length > 0) {
            return res.pagination(users, total_count, limit, pageNo);
        } else {
            return res.datatableNoRecords();
        }
    } catch (error) {
        logger.error(`Error getting users: ${error.message}`, { error });
        return next(new AppError(error.message, error.statusCode || 500));
    }
});

/**
 * @desc    Get user details
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin)
 */
exports.getUserDetails = catchAsync(async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get user
        const user = await User.findById(id);

        if (!user) {
            return next(new AppError(language.USER_NOT_FOUND, 404));
        }

        // Get user's purchases
        const purchases = await UserPurchase.find({ userId: id })
            .populate({
                path: "itemId",
                select: "title name",
            })
            .populate({
                path: "orderId",
                select: "orderNumber",
            });

        // Get user's payments
        const payments = await Payment.find({ userId: id }).populate("orderId");

        // Return user details
        return res.success({
            user,
            purchases,
            payments,
        });
    } catch (error) {
        logger.error(`Error getting user details: ${error.message}`, { error });
        return next(new AppError(error.message, error.statusCode || 500));
    }
});
