const DynamicContent = require("../../models/DynamicContent")
const catchAsync = require("../../utils/catchAsync")
const AppError = require("../../utils/appError")

/**
 * @desc    Get dynamic content by type for users
 * @route   GET /api/user/content/:type
 * @access  Public
 */
exports.getDynamicContentByType = catchAsync(async (req, res, next) => {
  try {
    const { type } = req.params

    // Validate content type
    const validTypes = ["PRIVACY_POLICY", "TERMS_CONDITIONS", "ABOUT_US", "CONTACT_US", "FAQ", "HELP"]
    if (!validTypes.includes(type)) {
      return res.noRecords("Invalid content type")
    }

    // Find active content by type
    const dynamicContent = await DynamicContent.findOne({
      type,
      status: true,
    }).select("type title content updatedAt")

    if (!dynamicContent) {
      return res.noRecords("Content not found")
    }

    return res.success(dynamicContent)
  } catch (error) {
    console.error("Error getting dynamic content:", error)
    return res.someThingWentWrong(error)
  }
})

/**
 * @desc    Get all public dynamic content
 * @route   GET /api/user/content
 * @access  Public
 */
exports.getAllPublicContent = catchAsync(async (req, res, next) => {
  try {
    // Find all active content
    const dynamicContent = await DynamicContent.find({
      status: true,
    }).select("type title updatedAt")

    if (!dynamicContent || dynamicContent.length === 0) {
      return res.noRecords("No content found")
    }

    return res.success(dynamicContent)
  } catch (error) {
    console.error("Error getting all dynamic content:", error)
    return res.someThingWentWrong(error)
  }
})
