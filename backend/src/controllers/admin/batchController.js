const Batch = require("../../models/Batch")
const ExamPlan = require("../../models/ExamPlan")
const fs = require("fs")
const path = require("path")

// Get all batches with pagination and filters
exports.getBatches = async (req, res) => {
  try {
    const { limit, pageNo, query, orderBy, orderDirection } = req.query

    // Build query
    const queryObj = {}

    if (query) {
      queryObj.$or = [{ name: { $regex: query, $options: "i" } }, { description: { $regex: query, $options: "i" } }]
    }

    // Count total records
    const total = await Batch.countDocuments(queryObj)

    if (total === 0) {
      return res.datatableNoRecords()
    }

    // Execute query with pagination and sorting
    const batches = await Batch.find(queryObj)
      .skip((pageNo - 1) * limit)
      .limit(limit)
      .sort({ [orderBy]: orderDirection === "asc" ? 1 : -1 })

    return res.pagination(batches, total, limit, pageNo)
  } catch (error) {
    console.error("Error fetching batches:", error)
    return res.someThingWentWrong(error)
  }
}

// Get a single batch by ID
exports.getBatchById = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)

    if (!batch) {
      return res.noRecords("Batch not found")
    }

    return res.success(batch)
  } catch (error) {
    console.error("Error fetching batch:", error)
    return res.someThingWentWrong(error)
  }
}

// Create a new batch
exports.createBatch = async (req, res) => {
  try {
    const { name, description, sequence, status } = req.body

    // Check if batch with same name already exists
    const existingBatch = await Batch.findOne({ name })
    if (existingBatch) {
      return res.status(400).json({
        status: false,
        message: "Batch with this name already exists",
      })
    }

    // Create batch object
    const batchData = {
      name,
      description,
      sequence: sequence || 0,
      status: status !== undefined ? status : true,
      createdBy: req.admin._id,
    }

    // Add image if uploaded
    if (req.file) {
      batchData.image = `/uploads/batches/${req.file.filename}`
    }

    // Create new batch
    const batch = await Batch.create(batchData)

    return res.successInsert(batch)
  } catch (error) {
    console.error("Error creating batch:", error)

    // Delete uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(__dirname, "../../../public", req.file.path)
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err)
      })
    }

    return res.someThingWentWrong(error)
  }
}

// Update a batch
exports.updateBatch = async (req, res) => {
  try {
    const { name, description, sequence, status } = req.body

    // Find batch
    const batch = await Batch.findById(req.params.id)

    if (!batch) {
      return res.noRecords("Batch not found")
    }

    // Check if batch with same name already exists (excluding current batch)
    if (name && name !== batch.name) {
      const existingBatch = await Batch.findOne({ name, _id: { $ne: req.params.id } })
      if (existingBatch) {
        return res.status(400).json({
          status: false,
          message: "Batch with this name already exists",
        })
      }
    }

    // Update batch data
    batch.name = name || batch.name
    batch.description = description !== undefined ? description : batch.description
    batch.sequence = sequence !== undefined ? sequence : batch.sequence
    batch.status = status !== undefined ? status : batch.status
    batch.updatedBy = req.admin._id

    // Update image if uploaded
    if (req.file) {
      // Delete old image if exists
      if (batch.image) {
        const oldImagePath = path.join(__dirname, "../../../public", batch.image)
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error("Error deleting old image:", err)
        })
      }

      batch.image = `/uploads/batches/${req.file.filename}`
    }

    // Save updated batch
    await batch.save()

    return res.successUpdate(batch)
  } catch (error) {
    console.error("Error updating batch:", error)

    // Delete uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(__dirname, "../../../public", req.file.path)
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err)
      })
    }

    return res.someThingWentWrong(error)
  }
}

// Delete a batch (soft delete)
exports.deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)

    if (!batch) {
      return res.noRecords("Batch not found")
    }

    // Check if batch has associated exam plans
    const examPlansCount = await ExamPlan.countDocuments({ batchId: req.params.id, deletedAt:null })

    if (examPlansCount > 0) {
      return res.status(400).json({
        status: false,
        message: "Cannot delete batch with associated exam plans. Please delete the exam plans first.",
      })
    }

    // Soft delete by updating deletedAt
    batch.deletedAt = new Date()
    batch.updatedBy = req.admin._id
    await batch.save()

    return res.successDelete()
  } catch (error) {
    console.error("Error deleting batch:", error)
    return res.someThingWentWrong(error)
  }
}
