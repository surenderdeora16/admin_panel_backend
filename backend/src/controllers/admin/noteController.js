const Note = require("../../models/Note")
const Subject = require("../../models/Subject")
const fs = require("fs")
const path = require("path")
const UserPurchase = require("../../models/UserPurchase")
const razorpayService = require("../../services/razorpayService")

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
    const { title, description, subjectId, examPlanId, mrp, price, isFree, validityDays, sequence, status } = req.body

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
      examPlanId,
      pdfFile: `/uploads/notes/${req.files.pdfFile[0].filename}`,
      mrp: mrp || 0,
      price: price || 0,
      isFree: isFree === "true" || isFree === true,
      validityDays: validityDays || 180,
      sequence: sequence || 0,
      status: status !== undefined ? status === "true" || status === true : true,
      createdBy: req.admin._id,
    }

    console.log("OK yHAA TAK POCH GYA")
    // Add thumbnail image if uploaded
    if (req.files && req.files.thumbnailImage) {
      noteData.thumbnailImage = `/uploads/notes/thumbnails/${req.files.thumbnailImage[0].filename}`
    }

    console.log("noteData", noteData)
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
// exports.getNotesBySubject = async (req, res) => {
//   try {
//     const { subjectId } = req.params

//     // Check if subject exists
//     const subject = await Subject.findById(subjectId)
//     if (!subject) {
//       return res.status(404).json({
//         status: false,
//         message: "Subject not found",
//       })
//     }

//     // Get active notes for this subject
//     const notes = await Note.find({
//       subjectId,
//       status: true,
//     }).sort({ sequence: 1 })

//     return res.status(200).json({
//       status: true,
//       data: notes,
//     })
//   } catch (error) {
//     console.error("Error fetching notes by subject:", error)
//     return res.status(500).json({
//       status: false,
//       message: "Failed to fetch notes",
//       error: error.message,
//     })
//   }
// }

// // Download note
// exports.downloadNote = async (req, res) => {
//   try {
//     const { noteId } = req.params

//     // Find note
//     const note = await Note.findById(noteId)

//     if (!note) {
//       return res.status(404).json({
//         status: false,
//         message: "Note not found",
//       })
//     }

//     // Check if note is active
//     if (!note.status) {
//       return res.status(400).json({
//         status: false,
//         message: "This note is not available",
//       })
//     }

//     // If note is free, allow download
//     if (note.isFree) {
//       // Get the file path
//       const filePath = path.join(__dirname, "../../../public", note.pdfFile)

//       // Check if file exists
//       if (!fs.existsSync(filePath)) {
//         return res.status(404).json({
//           status: false,
//           message: "PDF file not found",
//         })
//       }

//       // Send file
//       return res.download(filePath, `${note.title}.pdf`)
//     } else {
//       // For paid notes, check if user has purchased it
//       const hasPurchased = await razorpayService.checkUserPurchase(req.admin._id, "NOTE", noteId)

//       if (!hasPurchased) {
//         return res.status(403).json({
//           status: false,
//           message: "You need to purchase this note to download it",
//           data: {
//             noteId: note._id,
//             title: note.title,
//             price: note.price,
//             mrp: note.mrp,
//             validityDays: note.validityDays,
//             requiresPurchase: true,
//           },
//         })
//       }

//       // User has purchased, allow download
//       const filePath = path.join(__dirname, "../../../public", note.pdfFile)

//       // Check if file exists
//       if (!fs.existsSync(filePath)) {
//         return res.status(404).json({
//           status: false,
//           message: "PDF file not found",
//         })
//       }

//       // Send file
//       return res.download(filePath, `${note.title}.pdf`)
//     }
//   } catch (error) {
//     console.error("Error downloading note:", error)
//     return res.status(500).json({
//       status: false,
//       message: "Failed to download note",
//       error: error.message,
//     })
//   }
// }

// get notes by subject with purchase status
exports.getNotesBySubjectWithPurchaseStatus = async (req, res) => {
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

    // Get user's active purchases
    const userPurchases = await UserPurchase.find({
      userId: req.admin._id,
      itemType: "NOTE",
      status: "ACTIVE",
      expiryDate: { $gt: new Date() },
    })

    // Map of purchased note IDs
    const purchasedNoteIds = new Map(userPurchases.map((purchase) => [purchase.itemId.toString(), purchase]))

    // Add purchase status to each note
    const notesWithPurchaseStatus = notes.map((note) => {
      const noteObj = note.toObject()

      if (note.isFree) {
        noteObj.isPurchased = true
        noteObj.isFree = true
      } else {
        const purchase = purchasedNoteIds.get(note._id.toString())
        noteObj.isPurchased = !!purchase
        noteObj.isFree = false
        if (purchase) {
          noteObj.purchaseDetails = {
            purchaseId: purchase._id,
            purchaseDate: purchase.purchaseDate,
            expiryDate: purchase.expiryDate,
          }
        }
      }

      return noteObj
    })

    return res.status(200).json({
      status: true,
      data: notesWithPurchaseStatus,
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


// >>>>>>>>>>>>>>>

// Get notes by subject for user with access status
exports.getNotesBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params
    const userId = req.admin._id

    if (!subjectId || !ObjectId.isValid(subjectId)) {
      return res.status(400).json({
        status: false,
        message: "Valid Subject ID is required",
      })
    }

    // Check if subject exists
    const subject = await Subject.findById(subjectId)
    if (!subject) {
      return res.noRecords("Subject not found")
    }

    // Get all active notes for this subject
    const notes = await Note.find({
      subjectId,
      status: true,
    })
      .populate("examPlanId", "title price mrp validityDays")
      .sort({ sequence: 1, createdAt: -1 })

    // Get user's active purchases for exam plans
    const userPurchases = await UserPurchase.find({
      userId,
      itemType: "EXAM_PLAN",
      status: "ACTIVE",
      expiryDate: { $gt: new Date() },
    })

    // Create a Set of purchased exam plan IDs for quick lookups
    const purchasedExamPlanIds = new Set(userPurchases.map((purchase) => purchase.itemId.toString()))

    // Add access status to each note
    const notesWithAccessInfo = notes.map((note) => {
      const noteObj = note.toObject()

      if (note.isFree) {
        // Free notes are accessible by everyone
        noteObj.hasAccess = true
        noteObj.accessType = "FREE"
      } else {
        // Check if user has purchased the associated exam plan
        const hasExamPlanAccess = purchasedExamPlanIds.has(note.examPlanId._id.toString())

        noteObj.hasAccess = hasExamPlanAccess
        noteObj.accessType = hasExamPlanAccess ? "PURCHASED" : "LOCKED"

        if (hasExamPlanAccess) {
          const purchase = userPurchases.find((p) => p.itemId.toString() === note.examPlanId._id.toString())

          if (purchase) {
            noteObj.purchaseInfo = {
              purchaseId: purchase._id,
              purchaseDate: purchase.purchaseDate,
              expiryDate: purchase.expiryDate,
            }
          }
        }
      }

      return noteObj
    })

    return res.success(notesWithAccessInfo)
  } catch (error) {
    logger.error(`Error in getNotesBySubject: ${error.message}`, { error, userId: req.user?._id })
    return res.someThingWentWrong(error)
  }
}

// Get notes by exam plan for user with access status
exports.getNotesByExamPlan = async (req, res) => {
  try {
    const { examPlanId } = req.params
    const userId = req.admin._id

    if (!examPlanId || !ObjectId.isValid(examPlanId)) {
      return res.status(400).json({
        status: false,
        message: "Valid Exam Plan ID is required",
      })
    }

    // Check if exam plan exists
    const examPlan = await ExamPlan.findById(examPlanId)
    if (!examPlan) {
      return res.noRecords("Exam plan not found")
    }

    // Get all active notes for this exam plan
    const notes = await Note.find({
      examPlanId,
      status: true,
    })
      .populate("subjectId", "name")
      .sort({ sequence: 1, createdAt: -1 })

    // Check if the user has purchased this exam plan
    const purchase = await UserPurchase.findOne({
      userId,
      itemType: "EXAM_PLAN",
      itemId: examPlanId,
      status: "ACTIVE",
      expiryDate: { $gt: new Date() },
    })

    const hasPurchased = !!purchase

    // Add access status to each note
    const notesWithAccessInfo = notes.map((note) => {
      const noteObj = note.toObject()

      if (note.isFree) {
        // Free notes are accessible by everyone
        noteObj.hasAccess = true
        noteObj.accessType = "FREE"
      } else {
        // For paid notes, check if user has purchased the exam plan
        noteObj.hasAccess = hasPurchased
        noteObj.accessType = hasPurchased ? "PURCHASED" : "LOCKED"

        if (hasPurchased) {
          noteObj.purchaseInfo = {
            purchaseId: purchase._id,
            purchaseDate: purchase.purchaseDate,
            expiryDate: purchase.expiryDate,
          }
        }
      }

      return noteObj
    })

    return res.success({
      examPlan: {
        _id: examPlan._id,
        title: examPlan.title,
        hasPurchased,
        purchaseInfo: hasPurchased
          ? {
              purchaseId: purchase._id,
              purchaseDate: purchase.purchaseDate,
              expiryDate: purchase.expiryDate,
            }
          : null,
      },
      notes: notesWithAccessInfo,
    })
  } catch (error) {
    logger.error(`Error in getNotesByExamPlan: ${error.message}`, { error, userId: req.user?._id })
    return res.someThingWentWrong(error)
  }
}

// Download note
exports.downloadNote = async (req, res) => {
  try {
    const { noteId } = req.params

    if (!noteId || !ObjectId.isValid(noteId)) {
      return res.status(400).json({
        status: false,
        message: "Valid Note ID is required",
      })
    }

    // Find note
    const note = await Note.findById(noteId).populate("examPlanId")

    if (!note) {
      return res.noRecords("Note not found")
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

      // Log the download
      logger.info(`Free note downloaded: ${note.title}`, {
        userId: req.admin._id,
        noteId: note._id,
      })

      // Send file
      return res.download(filePath, `${note.title}.pdf`)
    } else {
      // For paid notes, check if user has purchased the associated exam plan
      const purchase = await UserPurchase.findOne({
        userId: req.admin._id,
        itemType: "EXAM_PLAN",
        itemId: note.examPlanId._id,
        status: "ACTIVE",
        expiryDate: { $gt: new Date() },
      })

      if (!purchase) {
        return res.status(403).json({
          status: false,
          message: "You need to purchase the associated exam plan to access this note",
          data: {
            noteId: note._id,
            title: note.title,
            examPlanId: note.examPlanId._id,
            examPlanTitle: note.examPlanId.title,
            examPlanPrice: note.examPlanId.price,
            examPlanMrp: note.examPlanId.mrp,
            validityDays: note.examPlanId.validityDays,
            requiresPurchase: true,
          },
        })
      }

      // User has purchased the exam plan, allow download
      const filePath = path.join(__dirname, "../../../public", note.pdfFile)

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          status: false,
          message: "PDF file not found",
        })
      }

      // Log the download
      logger.info(`Paid note downloaded: ${note.title}`, {
        userId: req.admin._id,
        noteId: note._id,
        examPlanId: note.examPlanId._id,
        purchaseId: purchase._id,
      })

      // Send file
      return res.download(filePath, `${note.title}.pdf`)
    }
  } catch (error) {
    logger.error(`Error in downloadNote: ${error.message}`, { error, userId: req.user?._id })
    return res.someThingWentWrong(error)
  }
}

// Get subjects with notes count by exam plan for user
exports.getSubjectsWithNotesCountByExamPlan = async (req, res) => {
  try {
    const { examPlanId } = req.params
    const userId = req.admin._id

    if (!examPlanId || !ObjectId.isValid(examPlanId)) {
      return res.status(400).json({
        status: false,
        message: "Valid Exam Plan ID is required",
      })
    }

    // Check if exam plan exists
    const examPlan = await ExamPlan.findById(examPlanId)
    if (!examPlan) {
      return res.noRecords("Exam plan not found")
    }

    // Check if the user has purchased this exam plan
    const purchase = await UserPurchase.findOne({
      userId,
      itemType: "EXAM_PLAN",
      itemId: examPlanId,
      status: "ACTIVE",
      expiryDate: { $gt: new Date() },
    })

    const hasPurchased = !!purchase

    // Aggregate to get subjects with notes count for this exam plan
    const subjectsWithNotesCount = await Note.aggregate([
      {
        $match: {
          examPlanId: ObjectId.createFromHexString(examPlanId),
          status: true,
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: "$subjectId",
          totalNotes: { $sum: 1 },
          freeNotes: {
            $sum: { $cond: [{ $eq: ["$isFree", true] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: "subjects",
          localField: "_id",
          foreignField: "_id",
          as: "subject",
        },
      },
      {
        $unwind: "$subject",
      },
      {
        $project: {
          _id: 1,
          subjectId: "$_id",
          subjectName: "$subject.name",
          totalNotes: 1,
          freeNotes: 1,
          paidNotes: { $subtract: ["$totalNotes", "$freeNotes"] },
          accessibleNotes: {
            $cond: [hasPurchased, "$totalNotes", "$freeNotes"],
          },
        },
      },
      {
        $sort: { "subject.name": 1 },
      },
    ])

    return res.success({
      examPlan: {
        _id: examPlan._id,
        title: examPlan.title,
        hasPurchased,
        purchaseInfo: hasPurchased
          ? {
              purchaseId: purchase._id,
              purchaseDate: purchase.purchaseDate,
              expiryDate: purchase.expiryDate,
            }
          : null,
      },
      subjects: subjectsWithNotesCount,
    })
  } catch (error) {
    logger.error(`Error in getSubjectsWithNotesCountByExamPlan: ${error.message}`, { error, userId: req.user?._id })
    return res.someThingWentWrong(error)
  }
}
