const ExamPlan = require("../../models/ExamPlan");
const Batch = require("../../models/Batch");
const TestSeries = require("../../models/TestSeries");
const fs = require("fs");
const path = require("path");
const UserPurchase = require("../../models/UserPurchase");

// Get all exam plans with pagination and filters
exports.getExamPlans = async (req, res) => {
  try {
    const { limit, pageNo, query, orderBy, orderDirection, batchId } =
      req.query;

    // Build query
    const queryObj = { deletedAt: null };

    if (query) {
      queryObj.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    if (batchId) {
      queryObj.batchId = batchId;
    }

    // Count total records
    const total = await ExamPlan.countDocuments(queryObj);

    if (total === 0) {
      return res.datatableNoRecords();
    }

    // Execute query with pagination and sorting
    const examPlans = await ExamPlan.find(queryObj)
      .populate("batchId", "name")
      .skip((pageNo - 1) * limit)
      .limit(limit)
      .sort({ [orderBy]: orderDirection === "asc" ? 1 : -1 });

    // Add active purchase count for each exam plan
    // Add active purchase count and remaining days for each exam plan
    const examPlansWithPurchaseInfo = await Promise.all(
      examPlans.map(async (examPlan) => {
        const currentDate = new Date();

        // Get active purchases for this exam plan
        const activePurchases = await UserPurchase.find({
          itemType: "EXAM_PLAN",
          itemId: examPlan._id,
          status: "ACTIVE",
          expiryDate: { $gt: currentDate },
          deletedAt: null,
        }).populate("userId", "name email");

        // Calculate remaining days for each active purchase
        const activePurchaseDetails = activePurchases.map((purchase) => {
          const expiryDate = new Date(purchase.expiryDate);
          const remainingDays = Math.ceil(
            (expiryDate - currentDate) / (1000 * 60 * 60 * 24)
          );

          return {
            userId: purchase.userId._id,
            userName: purchase.userId.name,
            userEmail: purchase.userId.email,
            purchaseDate: purchase.purchaseDate,
            expiryDate: purchase.expiryDate,
            remainingDays: remainingDays > 0 ? remainingDays : 0,
          };
        });

        // Convert to object and add purchase info
        const examPlanObj = examPlan.toObject();
        examPlanObj.activePurchaseCount = activePurchases.length;
        examPlanObj.activePurchaseDetails = activePurchaseDetails;

        return examPlanObj;
      })
    );

    return res.pagination(examPlansWithPurchaseInfo, total, limit, pageNo);
  } catch (error) {
    console.error("Error fetching exam plans:", error);
    return res.someThingWentWrong(error);
  }
};

// Get a single exam plan by ID
exports.getExamPlanById = async (req, res) => {
  try {
    const examPlan = await ExamPlan.findById(req.params.id).populate(
      "batchId",
      "name"
    );

    if (!examPlan) {
      return res.noRecords("Exam plan not found");
    }

    return res.success(examPlan);
  } catch (error) {
    console.error("Error fetching exam plan:", error);
    return res.someThingWentWrong(error);
  }
};

// Create a new exam plan
exports.createExamPlan = async (req, res) => {
  try {
    const {
      title,
      description,
      batchId,
      price,
      mrp,
      validityDays,
      isFree,
      sequence,
      status,
    } = req.body;

    // Check if batch exists
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(400).json({
        status: false,
        message: "Batch not found",
      });
    }

    // Create exam plan object
    const examPlanData = {
      title,
      description,
      batchId,
      price: price || 0,
      mrp: mrp || 0,
      validityDays: validityDays || 30,
      isFree: isFree === "true" || isFree === true,
      sequence: sequence || 0,
      status:
        status !== undefined ? status === "true" || status === true : true,
      createdBy: req.admin._id,
    };

    // Add image if uploaded
    if (req.file) {
      examPlanData.image = `/uploads/exam_plans/${req.file.filename}`;
    }

    // Create new exam plan
    const examPlan = await ExamPlan.create(examPlanData);

    return res.successInsert(examPlan);
  } catch (error) {
    console.error("Error creating exam plan:", error);

    // Delete uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(__dirname, "../../../public", req.file.path);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    return res.someThingWentWrong(error);
  }
};

// Update an exam plan
exports.updateExamPlan = async (req, res) => {
  try {
    const {
      title,
      description,
      batchId,
      price,
      mrp,
      validityDays,
      isFree,
      sequence,
      status,
    } = req.body;

    // Find exam plan
    const examPlan = await ExamPlan.findById(req.params.id);

    if (!examPlan) {
      return res.noRecords("Exam plan not found");
    }

    // Check if batch exists if batchId is provided
    if (batchId && batchId !== examPlan.batchId.toString()) {
      const batch = await Batch.findById(batchId);
      if (!batch) {
        return res.status(400).json({
          status: false,
          message: "Batch not found",
        });
      }
      examPlan.batchId = batchId;
    }

    // Update exam plan data
    if (title !== undefined) examPlan.title = title;
    if (description !== undefined) examPlan.description = description;
    if (price !== undefined) examPlan.price = price;
    if (mrp !== undefined) examPlan.mrp = mrp;
    if (validityDays !== undefined) examPlan.validityDays = validityDays;
    if (isFree !== undefined)
      examPlan.isFree = isFree === "true" || isFree === true;
    if (sequence !== undefined) examPlan.sequence = sequence;
    if (status !== undefined)
      examPlan.status = status === "true" || status === true;

    examPlan.updatedBy = req.admin._id;

    // Update image if uploaded
    if (req.file) {
      // Delete old image if exists
      if (examPlan.image) {
        const oldImagePath = path.join(
          __dirname,
          "../../../public",
          examPlan.image
        );
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error("Error deleting old image:", err);
        });
      }

      examPlan.image = `/uploads/exam_plans/${req.file.filename}`;
    }

    // Save updated exam plan
    await examPlan.save();

    return res.successUpdate(examPlan);
  } catch (error) {
    console.error("Error updating exam plan:", error);

    // Delete uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(__dirname, "../../../public", req.file.path);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    return res.someThingWentWrong(error);
  }
};

// Delete an exam plan (soft delete)
exports.deleteExamPlan = async (req, res) => {
  try {
    const examPlan = await ExamPlan.findById(req.params.id)

    if (!examPlan) {
      return res.noRecords("Exam plan not found")
    }

    // Check if exam plan has associated test series
    const testSeriesCount = await TestSeries.countDocuments({
      examPlanId: req.params.id,
      deletedAt: null,
    })

    if (testSeriesCount > 0) {
      return res.status(400).json({
        status: false,
        message: "Cannot delete exam plan with associated test series. Please delete the test series first.",
      })
    }

    // Check for active user purchases
    const currentDate = new Date()
    const activePurchaseCount = await UserPurchase.countDocuments({
      itemType: "EXAM_PLAN",
      itemId: req.params.id,
      status: "ACTIVE",
      expiryDate: { $gt: currentDate },
      deletedAt: null,
    })

    if (activePurchaseCount > 0) {
      return res.status(400).json({
        status: false,
        message: "Active users found, wait for expiry",
      })
    }

    // Soft delete by updating deletedAt
    examPlan.deletedAt = new Date()
    examPlan.updatedBy = req.admin._id
    await examPlan.save()

    return res.successDelete()
  } catch (error) {
    console.error("Error deleting exam plan:", error)
    return res.someThingWentWrong(error)
  }
}