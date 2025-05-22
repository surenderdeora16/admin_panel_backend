const Note = require("../../models/Note")
const Subject = require("../../models/Subject")
const ExamPlan = require("../../models/ExamPlan")
const UserPurchase = require("../../models/UserPurchase")
const fs = require("fs")
const path = require("path")
const { ObjectId } = require("mongoose").Types
const logger = require("../../utils/logger")

// Get notes by subject for user with access status
exports.getNotesBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params
    const userId = req.user._id

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
    const userId = req.user._id

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
    }).sort({ sequence: 1, createdAt: -1 })

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
        userId: req.user._id,
        noteId: note._id,
      })

      // Send file
      return res.download(filePath, `${note.title}.pdf`)
    } else {
      // For paid notes, check if user has purchased the associated exam plan
      const purchase = await UserPurchase.findOne({
        userId: req.user._id,
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
        userId: req.user._id,
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
    const userId = req.user._id

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

// Get all available notes for user
exports.getAllNotes = async (req, res) => {
  try {
    const userId = req.user?._id

    // Get all active notes
    const notes = await Note.find({
      status: true,
    })
      .populate("examPlanId", "title price mrp validityDays")
      .sort({ examPlanId: 1, sequence: 1, createdAt: -1 })

    // Get user's active purchases for exam plans
    const userPurchases = await UserPurchase.find({
      userId,
      itemType: "EXAM_PLAN",
      status: "ACTIVE",
      expiryDate: { $gt: new Date() },
    })

    // Create a Set of purchased exam plan IDs for quick lookups
    const purchasedExamPlanIds = new Set(userPurchases.map((purchase) => purchase.itemId.toString()))

    // Group notes by exam plan
    const notesByExamPlan = {}

    notes?.forEach((note) => {
      const examPlanId = note.examPlanId?._id.toString()

      if (!notesByExamPlan[examPlanId]) {
        notesByExamPlan[examPlanId] = {
          examPlan: {
            _id: note.examPlanId?._id,
            title: note.examPlanId.title,
            price: note.examPlanId.price,
            mrp: note.examPlanId.mrp,
            validityDays: note.examPlanId.validityDays,
            hasPurchased: purchasedExamPlanIds.has(examPlanId),
          },
          notes: [],
        }

        // Add purchase info if available
        if (purchasedExamPlanIds.has(examPlanId)) {
          const purchase = userPurchases.find((p) => p.itemId.toString() === examPlanId)
          if (purchase) {
            notesByExamPlan[examPlanId].examPlan.purchaseInfo = {
              purchaseId: purchase?._id,
              purchaseDate: purchase.purchaseDate,
              expiryDate: purchase.expiryDate,
            }
          }
        }
      }

      const noteObj = note.toObject()

      // Determine access status
      if (note.isFree) {
        noteObj.hasAccess = true
        noteObj.accessType = "FREE"
      } else {
        const hasExamPlanAccess = purchasedExamPlanIds.has(examPlanId)
        noteObj.hasAccess = hasExamPlanAccess
        noteObj.accessType = hasExamPlanAccess ? "PURCHASED" : "LOCKED"
      }

      notesByExamPlan[examPlanId].notes.push(noteObj)
    })

    return res.success(Object.values(notesByExamPlan))
  } catch (error) {
    console.log("error", error)
    logger.error(`Error in getAllNotes: ${error.message}`, { error, userId: req.user?._id })
    return res.someThingWentWrong(error)
  }
}
