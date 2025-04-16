const Note = require("../../models/Note")
const Subject = require("../../models/Subject")
const fs = require("fs")
const path = require("path")

// Get all notes with pagination and filters
exports.getNotes = async (req, res) => {
  try {
    const { limit, pageNo, query, orderBy, orderDirection, subjectId } = req.query

    // Build query
    const queryObj = {}

    if (query) {
      queryObj.$or = [{ title: { $regex: query, $options: "i" } }, { description: { $regex: query, $options: "i" } }]
    }

    if (subjectId) {
      queryObj.subjectId = subjectId
    }

    // Count total records
    const total = await Note.countDocuments(queryObj)

    if (total === 0) {
      return res.datatableNoRecords()
    }

    // Execute query with pagination and sorting
    const notes = await Note.find(queryObj)
      .populate("subjectId", "name")
      .skip((pageNo - 1) * limit)
      .limit(limit)
      .sort({ [orderBy]: orderDirection === "asc" ? 1 : -1 })

    return res.pagination(notes, total, limit, pageNo)
  } catch (error) {
    console.error("Error fetching notes:", error)
    return res.someThingWentWrong(error)
  }
}

// Get a single note by ID
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate("subjectId", "name")

    if (!note) {
      return res.noRecords("Note not found")
    }

    return res.success(note)
  } catch (error) {
    console.error("Error fetching note:", error)
    return res.someThingWentWrong(error)
  }
}

// Create a new note
exports.createNote = async (req, res) => {
  try {
    const { title, description, subjectId, mrp, price, isFree, validityDays, sequence, status } = req.body

    // Check if subject exists
    const subject = await Subject.findById(subjectId)
    if (!subject) {
      return res.status(400).json({
        status: false,
        message: "Subject not found",
      })
    }

    // Check if PDF file is uploaded
    if (!req.files || !req.files.pdfFile) {
      return res.status(400).json({
        status: false,
        message: "PDF file is required",
      })
    }

    // Create note object
    const noteData = {
      title,
      description,
      subjectId,
      pdfFile: `/uploads/notes/${req.files.pdfFile[0].filename}`,
      mrp: mrp || 0,
      price: price || 0,
      isFree: isFree === "true" || isFree === true,
      validityDays: validityDays || 180,
      sequence: sequence || 0,
      status: status !== undefined ? status === "true" || status === true : true,
      createdBy: req.admin._id,
    }

    // Add thumbnail image if uploaded
    if (req.files && req.files.thumbnailImage) {
      noteData.thumbnailImage = `/uploads/notes/thumbnails/${req.files.thumbnailImage[0].filename}`
    }

    // Create new note
    const note = await Note.create(noteData)

    return res.successInsert(note)
  } catch (error) {
    console.error("Error creating note:", error)

    // Delete uploaded files if there was an error
    if (req.files) {
      if (req.files.pdfFile) {
        const pdfPath = path.join(__dirname, "../../../public/uploads/notes", req.files.pdfFile[0].filename)
        fs.unlink(pdfPath, (err) => {
          if (err) console.error("Error deleting PDF file:", err)
        })
      }
      if (req.files.thumbnailImage) {
        const thumbnailPath = path.join(
          __dirname,
          "../../../public/uploads/notes/thumbnails",
          req.files.thumbnailImage[0].filename,
        )
        fs.unlink(thumbnailPath, (err) => {
          if (err) console.error("Error deleting thumbnail image:", err)
        })
      }
    }

    return res.someThingWentWrong(error)
  }
}

// Update a note
exports.updateNote = async (req, res) => {
  try {
    const { title, description, subjectId, mrp, price, isFree, validityDays, sequence, status } = req.body

    // Find note
    const note = await Note.findById(req.params.id)

    if (!note) {
      return res.noRecords("Note not found")
    }

    // Check if subject exists if subjectId is provided
    if (subjectId && subjectId !== note.subjectId.toString()) {
      const subject = await Subject.findById(subjectId)
      if (!subject) {
        return res.status(400).json({
          status: false,
          message: "Subject not found",
        })
      }
      note.subjectId = subjectId
    }

    // Update note data
    if (title !== undefined) note.title = title
    if (description !== undefined) note.description = description
    if (mrp !== undefined) note.mrp = mrp
    if (price !== undefined) note.price = price
    if (isFree !== undefined) note.isFree = isFree === "true" || isFree === true
    if (validityDays !== undefined) note.validityDays = validityDays
    if (sequence !== undefined) note.sequence = sequence
    if (status !== undefined) note.status = status === "true" || status === true

    note.updatedBy = req.admin._id

    // Update PDF file if uploaded
    if (req.files && req.files.pdfFile) {
      // Delete old PDF file if exists
      if (note.pdfFile) {
        const oldPdfPath = path.join(__dirname, "../../../public", note.pdfFile)
        fs.unlink(oldPdfPath, (err) => {
          if (err) console.error("Error deleting old PDF file:", err)
        })
      }

      note.pdfFile = `/uploads/notes/${req.files.pdfFile[0].filename}`
    }

    // Update thumbnail image if uploaded
    if (req.files && req.files.thumbnailImage) {
      // Delete old thumbnail image if exists
      if (note.thumbnailImage) {
        const oldThumbnailPath = path.join(__dirname, "../../../public", note.thumbnailImage)
        fs.unlink(oldThumbnailPath, (err) => {
          if (err) console.error("Error deleting old thumbnail image:", err)
        })
      }

      note.thumbnailImage = `/uploads/notes/thumbnails/${req.files.thumbnailImage[0].filename}`
    }

    // Save updated note
    await note.save()

    return res.successUpdate(note)
  } catch (error) {
    console.error("Error updating note:", error)

    // Delete uploaded files if there was an error
    if (req.files) {
      if (req.files.pdfFile) {
        const pdfPath = path.join(__dirname, "../../../public/uploads/notes", req.files.pdfFile[0].filename)
        fs.unlink(pdfPath, (err) => {
          if (err) console.error("Error deleting PDF file:", err)
        })
      }
      if (req.files.thumbnailImage) {
        const thumbnailPath = path.join(
          __dirname,
          "../../../public/uploads/notes/thumbnails",
          req.files.thumbnailImage[0].filename,
        )
        fs.unlink(thumbnailPath, (err) => {
          if (err) console.error("Error deleting thumbnail image:", err)
        })
      }
    }

    return res.someThingWentWrong(error)
  }
}

// Delete a note (soft delete)
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)

    if (!note) {
      return res.noRecords("Note not found")
    }

    // Soft delete by updating deletedAt
    note.deletedAt = new Date()
    note.updatedBy = req.admin._id
    await note.save()

    return res.successDelete()
  } catch (error) {
    console.error("Error deleting note:", error)
    return res.someThingWentWrong(error)
  }
}

// Get notes by subject for user
exports.getNotesBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params

    // Check if subject exists
    const subject = await Subject.findById(subjectId)
    if (!subject) {
      return res.status(404).json({
        status: false,
        message: "Subject not found",
      })
    }

    // Get active notes for this subject
    const notes = await Note.find({
      subjectId,
      status: true,
    }).sort({ sequence: 1 })

    return res.status(200).json({
      status: true,
      data: notes,
    })
  } catch (error) {
    console.error("Error fetching notes by subject:", error)
    return res.status(500).json({
      status: false,
      message: "Failed to fetch notes",
      error: error.message,
    })
  }
}

// Download note
exports.downloadNote = async (req, res) => {
  try {
    const { noteId } = req.params

    // Find note
    const note = await Note.findById(noteId)

    if (!note) {
      return res.status(404).json({
        status: false,
        message: "Note not found",
      })
    }

    // Check if note is active
    if (!note.status) {
      return res.status(400).json({
        status: false,
        message: "This note is not available",
      })
    }

    // If note is free, allow download
    if (note.isFree) {
      // Get the file path
      const filePath = path.join(__dirname, "../../../public", note.pdfFile)

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          status: false,
          message: "PDF file not found",
        })
      }

      // Send file
      return res.download(filePath, `${note.title}.pdf`)
    } else {
      // For paid notes, check if user has purchased it
      // This would typically involve checking a purchases collection
      // For now, we'll just return the file path that would be used in a frontend download
      return res.status(200).json({
        status: true,
        message: "Note is available for purchase",
        data: {
          noteId: note._id,
          title: note.title,
          price: note.price,
          mrp: note.mrp,
          validityDays: note.validityDays,
          isPurchased: false, // This would be determined by checking user purchases
        },
      })
    }
  } catch (error) {
    console.error("Error downloading note:", error)
    return res.status(500).json({
      status: false,
      message: "Failed to download note",
      error: error.message,
    })
  }
}
