const { User } = require("../../models");
const Order = require("../../models/Order");
const Payment = require("../../models/Payment");
const UserPurchase = require("../../models/UserPurchase");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const logger = require("../../utils/logger");
const mongoose = require("mongoose")

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
    const {
      pageNo = 1,
      limit = 10,
      query,
      orderBy = "createdAt",
      orderDirection = "desc"
    } = req.query;

    const search = { deletedAt: null };

    if (query) {
      search.$or = [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }
      ];
    }

    const skip = (Number(pageNo) - 1) * Number(limit);

    // Do not populate if state/district is not ObjectId
    const usersRaw = await User.find(search)
      .select("name email mobile state district image device_token device_id status deletedAt createdAt updatedAt ")
      .sort({ [orderBy]: orderDirection === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const stateIds = [];
    const districtIds = [];

    usersRaw.forEach(user => {
      if (mongoose.Types.ObjectId.isValid(user.state)) {
        stateIds.push(user.state);
      }
      if (mongoose.Types.ObjectId.isValid(user.district)) {
        districtIds.push(user.district);
      }
    });

    const stateMap = {};
    const districtMap = {};

    const [states, districts] = await Promise.all([
      mongoose.model("State").find({ _id: { $in: stateIds } }, "_id name"),
      mongoose.model("District").find({ _id: { $in: districtIds } }, "_id name"),
    ]);

    states.forEach(state => stateMap[state._id] = state.name);
    districts.forEach(dist => districtMap[dist._id] = dist.name);

    const formattedUsers = usersRaw.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      stateName: stateMap[user.state] || (typeof user.state === 'string' ? user.state : null),
      districtName: districtMap[user.district] || (typeof user.district === 'string' ? user.district : null),
      image: user.image,
      device_token: user.device_token,
      device_id: user.device_id,
      status: user.status,
      deletedAt: user.deletedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    const total_count = await User.countDocuments(search);

    return res.pagination(formattedUsers, total_count, limit, pageNo);
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



exports.changeUserPasswordByAdmin = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword, confirmPassword } = req.body;

    // Validate input
    if (!newPassword || !confirmPassword) {
      return next(new AppError("New password and confirm password are required", 400));
    }

    if (newPassword !== confirmPassword) {
      return next(new AppError("Passwords do not match", 400));
    }

    if (newPassword.length < 6) {
      return next(new AppError("Password must be at least 6 characters long", 400));
    }

    // Find user
    const user = await User.findById(id).select("+password");
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return res.success([], "User password changed successfully");
  } catch (error) {
    logger.error(`Error changing user password: ${error.message}`, { error });
    return next(new AppError(error.message, error.statusCode || 500));
  }
});