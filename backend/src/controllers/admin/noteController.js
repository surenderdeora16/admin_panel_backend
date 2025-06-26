const Note = require("../../models/Note");
const ExamPlan = require("../../models/ExamPlan");
const fs = require("fs");
const path = require("path");
const UserPurchase = require("../../models/UserPurchase");
const razorpayService = require("../../services/razorpayService");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const { ObjectId } = require("mongoose").Types;

// Get all notes with pagination and filters
exports.getNotes = async (req, res) => {
  try {
    const { limit, pageNo, query, orderBy, orderDirection, examPlanId } =
      req.query;

    // Build query
    const queryObj = {deletedAt: null};

    if (query) {
      queryObj.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    if (examPlanId && ObjectId.isValid(examPlanId)) {
      queryObj.examPlanId = examPlanId;
    }

    // Count total records
    const total = await Note.countDocuments(queryObj);

    if (total === 0) {
      return res.datatableNoRecords();
    }

    // Execute query with pagination and sorting
    const notes = await Note.find(queryObj)
      .populate("examPlanId", "title")
      .skip((pageNo - 1) * limit)
      .limit(limit)
      .sort({ [orderBy]: orderDirection === "asc" ? 1 : -1 });

    return res.pagination(notes, total, limit, pageNo);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return res.someThingWentWrong(error);
  }
};

// Get a single note by ID
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate(
      "examPlanId",
      "title"
    );

    if (!note) {
      return res.noRecords("Note not found");
    }

    return res.success(note);
  } catch (error) {
    console.error("Error fetching note:", error);
    return res.someThingWentWrong(error);
  }
};

// Create a new note
exports.createNote = async (req, res) => {
  try {
    const { title, description, examPlanId, isFree, sequence, status } =
      req.body;

    // Check if exam plan exists
    const examPlan = await ExamPlan.findById(examPlanId);
    if (!examPlan) {
      return res.status(400).json({
        status: false,
        message: "Exam plan not found",
      });
    }

    // Check if PDF file is uploaded
    if (!req.files || !req.files.pdfFile) {
      return res.status(400).json({
        status: false,
        message: "PDF file is required",
      });
    }

    console.log("body frere", isFree);
    // Create note object
    const noteData = {
      title,
      description,
      examPlanId,
      pdfFile: `/uploads/notes/${req.files.pdfFile[0].filename}`,
      isFree: isFree,
      sequence: sequence || 0,
      status:
        status !== undefined ? status === "true" || status === true : true,
      createdBy: req.admin._id,
    };
    console.log("noteData", noteData);
    // Add thumbnail image if uploaded
    if (req.files && req.files.thumbnailImage) {
      noteData.thumbnailImage = `/uploads/notes/thumbnails/${req.files.thumbnailImage[0].filename}`;
    }

    // Create new note
    const note = await Note.create(noteData);

    return res.successInsert(note);
  } catch (error) {
    console.error("Error creating note:", error);

    // Delete uploaded files if there was an error
    if (req.files) {
      if (req.files.pdfFile) {
        const pdfPath = path.join(
          __dirname,
          "../../../public/uploads/notes",
          req.files.pdfFile[0].filename
        );
        fs.unlink(pdfPath, (err) => {
          if (err) console.error("Error deleting PDF file:", err);
        });
      }
      if (req.files.thumbnailImage) {
        const thumbnailPath = path.join(
          __dirname,
          "../../../public/uploads/notes/thumbnails",
          req.files.thumbnailImage[0].filename
        );
        fs.unlink(thumbnailPath, (err) => {
          if (err) console.error("Error deleting thumbnail image:", err);
        });
      }
    }

    return res.someThingWentWrong(error);
  }
};

// Update a note
exports.updateNote = async (req, res) => {
  try {
    const { title, description, examPlanId, isFree, sequence, status } =
      req.body;

    // Find note
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.noRecords("Note not found");
    }

    // Check if exam plan exists if examPlanId is provided
    if (examPlanId && examPlanId !== note.examPlanId.toString()) {
      const examPlan = await ExamPlan.findById(examPlanId);
      if (!examPlan) {
        return res.status(400).json({
          status: false,
          message: "Exam plan not found",
        });
      }
      note.examPlanId = examPlanId;
    }

    // Update note data
    if (title !== undefined) note.title = title;
    if (description !== undefined) note.description = description;
    if (isFree !== undefined) note.isFree = isFree;
    if (sequence !== undefined) note.sequence = sequence;
    if (status !== undefined)
      note.status = status === "true" || status === true;

    note.updatedBy = req.admin._id;

    // Update PDF file if uploaded
    if (req.files && req.files.pdfFile) {
      // Delete old PDF file if exists
      if (note.pdfFile) {
        const oldPdfPath = path.join(
          __dirname,
          "../../../public",
          note.pdfFile
        );
        fs.unlink(oldPdfPath, (err) => {
          if (err) console.error("Error deleting old PDF file:", err);
        });
      }

      note.pdfFile = `/uploads/notes/${req.files.pdfFile[0].filename}`;
    }

    // Update thumbnail image if uploaded
    if (req.files && req.files.thumbnailImage) {
      // Delete old thumbnail image if exists
      if (note.thumbnailImage) {
        const oldThumbnailPath = path.join(
          __dirname,
          "../../../public",
          note.thumbnailImage
        );
        fs.unlink(oldThumbnailPath, (err) => {
          if (err) console.error("Error deleting old thumbnail image:", err);
        });
      }

      note.thumbnailImage = `/uploads/notes/thumbnails/${req.files.thumbnailImage[0].filename}`;
    }

    // Save updated note
    await note.save();

    return res.successUpdate(note);
  } catch (error) {
    console.error("Error updating note:", error);

    // Delete uploaded files if there was an error
    if (req.files) {
      if (req.files.pdfFile) {
        const pdfPath = path.join(
          __dirname,
          "../../../public/uploads/notes",
          req.files.pdfFile[0].filename
        );
        fs.unlink(pdfPath, (err) => {
          if (err) console.error("Error deleting PDF file:", err);
        });
      }
      if (req.files.thumbnailImage) {
        const thumbnailPath = path.join(
          __dirname,
          "../../../public/uploads/notes/thumbnails",
          req.files.thumbnailImage[0].filename
        );
        fs.unlink(thumbnailPath, (err) => {
          if (err) console.error("Error deleting thumbnail image:", err);
        });
      }
    }

    return res.someThingWentWrong(error);
  }
};

// Delete a note (soft delete)
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.noRecords("Note not found");
    }

    // Soft delete by updating deletedAt
    note.deletedAt = new Date();
    note.updatedBy = req.admin._id;
    await note.save();

    return res.successDelete();
  } catch (error) {
    console.error("Error deleting note:", error);
    return res.someThingWentWrong(error);
  }
};

// Download note
exports.downloadNote = async (req, res) => {
  try {
    const { noteId } = req.params;

    // Find note
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({
        status: false,
        message: "Note not found",
      });
    }

    // Check if note is active
    if (!note.status) {
      return res.status(400).json({
        status: false,
        message: "This note is not available",
      });
    }

    // If note is free, allow download
    if (note.isFree) {
      // Get the file path
      const filePath = path.join(__dirname, "../../../public", note.pdfFile);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          status: false,
          message: "PDF file not found",
        });
      }

      // Send file
      return res.download(filePath, `${note.title}.pdf`);
    } else {
      // For paid notes, check if user has purchased the exam plan
      const hasPurchasedExamPlan = await razorpayService.checkUserPurchase(
        req.admin._id,
        "EXAM_PLAN",
        note.examPlanId
      );

      if (!hasPurchasedExamPlan) {
        return res.status(403).json({
          status: false,
          message: "You need to purchase the exam plan to download this note",
          data: {
            noteId: note._id,
            title: note.title,
            examPlanId: note.examPlanId,
            requiresPurchase: true,
          },
        });
      }

      // User has purchased, allow download
      const filePath = path.join(__dirname, "../../../public", note.pdfFile);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          status: false,
          message: "PDF file not found",
        });
      }

      // Send file
      return res.download(filePath, `${note.title}.pdf`);
    }
  } catch (error) {
    console.error("Error downloading note:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to download note",
      error: error.message,
    });
  }
};

// Get notes by exam plan ID
exports.getNotesByExamPlan = async (req, res) => {
  try {
    const { examPlanId } = req.params;

    if (!examPlanId || !ObjectId.isValid(examPlanId)) {
      return res.status(400).json({
        status: false,
        message: "Valid Exam plan ID is required",
      });
    }

    // Check if exam plan exists
    const examPlan = await ExamPlan.findById(examPlanId);
    if (!examPlan) {
      return res.noRecords("Exam plan not found");
    }

    // Get active notes for this exam plan
    const notes = await Note.find({
      examPlanId,
      status: true,
    }).sort({ sequence: 1, createdAt: -1 });

    return res.success(notes);
  } catch (error) {
    console.error("Error fetching notes by exam plan:", error);
    return res.someThingWentWrong(error);
  }
};

// Get notes by exam plan with purchase status for users
exports.getNotesByExamPlanWithPurchaseStatus = async (req, res) => {
  try {
    const { examPlanId } = req.params;

    if (!examPlanId || !ObjectId.isValid(examPlanId)) {
      return res.status(400).json({
        status: false,
        message: "Valid Exam plan ID is required",
      });
    }

    // Check if exam plan exists
    const examPlan = await ExamPlan.findById(examPlanId);
    if (!examPlan) {
      return res.status(404).json({
        status: false,
        message: "Exam plan not found",
      });
    }

    // Get active notes for this exam plan
    const notes = await Note.find({
      examPlanId,
      status: true,
    }).sort({ sequence: 1, createdAt: -1 });

    // Check if user has purchased the exam plan
    const hasPurchasedExamPlan = await razorpayService.checkUserPurchase(
      req.admin._id,
      "EXAM_PLAN",
      examPlanId
    );

    // Add purchase status to each note
    const notesWithPurchaseStatus = notes.map((note) => {
      const noteObj = note.toObject();

      if (note.isFree) {
        noteObj.isPurchased = true;
        noteObj.isFree = true;
      } else {
        noteObj.isPurchased = hasPurchasedExamPlan;
        noteObj.isFree = false;
      }

      return noteObj;
    });

    return res.status(200).json({
      status: true,
      data: {
        examPlan: {
          _id: examPlan._id,
          title: examPlan.title,
          isPurchased: hasPurchasedExamPlan,
        },
        notes: notesWithPurchaseStatus,
      },
    });
  } catch (error) {
    console.error("Error fetching notes by exam plan:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch notes",
      error: error.message,
    });
  }
};
