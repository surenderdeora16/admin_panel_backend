const DynamicContent = require("../../models/DynamicContent")
const catchAsync = require("../../utils/catchAsync")
const AppError = require("../../utils/appError")

/**
 * @desc    Get all dynamic content
 * @route   GET /api/admin/dynamic-content
 * @access  Private (Admin)
 */
exports.getAllDynamicContent = catchAsync(async (req, res, next) => {
  try {
    const { limit, pageNo, query, orderBy, orderDirection } = req.query
    const skip = (pageNo - 1) * limit

    // Build query
    const queryObj = {}
    if (query) {
      queryObj.$or = [{ title: { $regex: query, $options: "i" } }, { type: { $regex: query, $options: "i" } }]
    }

    // Count total records
    const totalCount = await DynamicContent.countDocuments(queryObj)

    if (totalCount === 0) {
      return res.datatableNoRecords()
    }

    // Get records with pagination and sorting
    const sortObj = {}
    sortObj[orderBy] = orderDirection === "asc" ? 1 : -1

    const dynamicContents = await DynamicContent.find(queryObj)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .select("type title status updatedAt")

    return res.pagination(dynamicContents, totalCount, limit, pageNo)
  } catch (error) {
    console.error("Error getting dynamic content:", error)
    return res.someThingWentWrong(error)
  }
})

/**
 * @desc    Get dynamic content by ID
 * @route   GET /api/admin/dynamic-content/:id
 * @access  Private (Admin)
 */
exports.getDynamicContentById = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params

    const dynamicContent = await DynamicContent.findById(id)

    if (!dynamicContent) {
      return res.noRecords("Dynamic content not found")
    }

    return res.success(dynamicContent)
  } catch (error) {
    console.error("Error getting dynamic content by ID:", error)
    return res.someThingWentWrong(error)
  }
})

/**
 * @desc    Get dynamic content by type
 * @route   GET /api/admin/dynamic-content/type/:type
 * @access  Private (Admin)
 */
exports.getDynamicContentByType = catchAsync(async (req, res, next) => {
  try {
    const { type } = req.params

    const dynamicContent = await DynamicContent.findOne({ type })

    if (!dynamicContent) {
      return res.noRecords("Dynamic content not found")
    }

    return res.success(dynamicContent)
  } catch (error) {
    console.error("Error getting dynamic content by type:", error)
    return res.someThingWentWrong(error)
  }
})

/**
 * @desc    Create dynamic content
 * @route   POST /api/admin/dynamic-content
 * @access  Private (Admin)
 */
exports.createDynamicContent = catchAsync(async (req, res, next) => {
  try {
    const { type, title, content, status } = req.body
    const adminId = req.admin._id

    // Check if content with this type already exists
    const existingContent = await DynamicContent.findOne({ type })
    if (existingContent) {
      return res.noRecords(`Dynamic content with type ${type} already exists`)
    }

    // Create new dynamic content
    const dynamicContent = new DynamicContent({
      type,
      title,
      content,
      status,
      updatedBy: adminId,
    })

    await dynamicContent.save()

    return res.successInsert(dynamicContent, "Dynamic content created successfully")
  } catch (error) {
    console.error("Error creating dynamic content:", error)
    return res.someThingWentWrong(error)
  }
})

/**
 * @desc    Update dynamic content
 * @route   PUT /api/admin/dynamic-content/:id
 * @access  Private (Admin)
 */
exports.updateDynamicContent = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params
    const { title, content, status } = req.body
    const adminId = req.admin._id

    // Find dynamic content
    const dynamicContent = await DynamicContent.findById(id)

    if (!dynamicContent) {
      return res.noRecords("Dynamic content not found")
    }

    // Update fields
    dynamicContent.title = title || dynamicContent.title
    dynamicContent.content = content || dynamicContent.content
    dynamicContent.status = status !== undefined ? status : dynamicContent.status
    dynamicContent.updatedBy = adminId

    await dynamicContent.save()

    return res.successUpdate(dynamicContent)
  } catch (error) {
    console.error("Error updating dynamic content:", error)
    return res.someThingWentWrong(error)
  }
})

/**
 * @desc    Delete dynamic content
 * @route   DELETE /api/admin/dynamic-content/:id
 * @access  Private (Admin)
 */
exports.deleteDynamicContent = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params

    // Find and delete dynamic content
    const dynamicContent = await DynamicContent.findByIdAndDelete(id)

    if (!dynamicContent) {
      return res.noRecords("Dynamic content not found")
    }

    return res.successDelete({}, "Dynamic content deleted successfully")
  } catch (error) {
    console.error("Error deleting dynamic content:", error)
    return res.someThingWentWrong(error)
  }
})
