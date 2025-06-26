const ExamPlan = require("../../models/ExamPlan");
const UserPurchase = require("../../models/UserPurchase");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const TestSeries = require("../../models/TestSeries");
const Section = require("../../models/Section");

// * Get all exam plans with purchase status for the authenticated user
exports.getUserExamPlans = async (req, res) => {
  try {
    // Get query parameters for filtering and pagination
    const {
      limit,
      pageNo: page,
      query: search,
      orderBy: sortBy,
      orderDirection: sortOrder,
      batchId,
    } = req.query;

    // Build query object
    const query = {
      // status: true,
      deletedAt: null,
    };

    // Add batch filter if provided
    if (batchId) {
      query.batchId = mongoose.Types.ObjectId(batchId);
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination values
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit);
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // Get user ID from authenticated user
    const userId = req.user._id;

    // Find all exam plans
    const examPlans = await ExamPlan.find(query)
      .populate("batchId", "name")
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(Number.parseInt(limit));

    // Get total count for pagination
    const totalCount = await ExamPlan.countDocuments(query);

    // Return if no records found
    if (!examPlans.length) {
      return res.datatableNoRecords();
    }

    // Get user's purchases for these exam plans
    const userPurchases = await UserPurchase.find({
      userId,
      itemType: "examPlan",
      itemId: { $in: examPlans.map((plan) => plan._id) },
      expiryDate: { $gt: new Date() }, // Only active purchases
      status: "active",
    });

    // Create a map of purchased exam plan IDs for quick lookup
    const purchasedExamPlanIds = new Map();
    userPurchases.forEach((purchase) => {
      purchasedExamPlanIds.set(purchase.itemId.toString(), {
        purchaseId: purchase._id,
        purchaseDate: purchase.createdAt,
        expiryDate: purchase.expiryDate,
      });
    });

    // Add purchase status to each exam plan
    const examPlansWithPurchaseStatus = examPlans.map((plan) => {
      const planObj = plan.toObject();
      const planId = plan._id.toString();

      // Check if this plan is purchased
      if (purchasedExamPlanIds.has(planId)) {
        const purchaseInfo = purchasedExamPlanIds.get(planId);
        planObj.isPurchased = true;
        planObj.purchaseId = purchaseInfo.purchaseId;
        planObj.purchaseDate = purchaseInfo.purchaseDate;
        planObj.expiryDate = purchaseInfo.expiryDate;

        // Calculate remaining days
        const today = new Date();
        const expiryDate = new Date(purchaseInfo.expiryDate);
        const diffTime = Math.abs(expiryDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        planObj.remainingDays = diffDays;
      } else {
        planObj.isPurchased = false;
      }

      // Format image URL if exists
      if (planObj.image) {
        planObj.imageUrl = `${process.env.BASE_URL}${planObj.image}`;
      }

      return planObj;
    });

    // Return response with pagination
    return res.pagination(examPlansWithPurchaseStatus, totalCount, limit, page);
  } catch (error) {
    console.error("Error fetching exam plans:", error);
    return res.someThingWentWrong(error);
  }
};

// * Get exam plans by batch
exports.getExamPlansByBatch = async (req, res) => {
  try {
    const {
      limit,
      pageNo: page,
      query: search,
      orderBy: sortBy,
      orderDirection: sortOrder,
    } = req.query;
    const { batchId } = req.params;

    // Validate batchId
    if (!batchId) {
      return res.noRecords("Batch ID is required");
    }

    // Build query object
    const query = {
      batchId: new mongoose.Types.ObjectId(batchId),
      // status: true,
      deletedAt: null,
    };

    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination values
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit);
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // Fetch exam plans
    const examPlans = await ExamPlan.find(query)
      .populate("batchId", "name")
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(Number.parseInt(limit));

    // Get total count for pagination
    const totalCount = await ExamPlan.countDocuments(query);

    // Return if no records found
    if (!examPlans.length) {
      return res.datatableNoRecords();
    }

    // Format image URLs and prepare response
    const formattedExamPlans = examPlans.map((plan) => {
      const planObj = plan.toObject();
      if (planObj.image) {
        planObj.imageUrl = `${process.env.BASE_URL}${planObj.image}`;
      }
      return planObj;
    });

    // Return response with pagination
    return res.pagination(formattedExamPlans, totalCount, limit, page);
  } catch (error) {
    console.error("Error fetching exam plans by batch:", error);
    return res.someThingWentWrong(error);
  }
};

// * Get a single exam plan with purchase status
exports.getUserExamPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the exam plan
    const examPlan = await ExamPlan.findOne({
      _id: id,
      // status: true,
      deletedAt: null,
    }).populate("batchId", "name");

    if (!examPlan) {
      return res.noRecords("Exam plan not found");
    }

    // Check if user has purchased this exam plan
    const purchase = await UserPurchase.findOne({
      userId,
      itemType: "EXAM_PLAN",
      itemId: examPlan._id,
      expiryDate: { $gt: new Date() },
      status: "ACTIVE",
    });

    const examPlanObj = examPlan.toObject();

    if (purchase) {
      examPlanObj.isPurchased = true;
      examPlanObj.purchaseId = purchase._id;
      examPlanObj.purchaseDate = purchase.createdAt;
      examPlanObj.expiryDate = purchase.expiryDate;

      // Calculate remaining days
      const today = new Date();
      const expiryDate = new Date(purchase.expiryDate);
      const diffTime = Math.abs(expiryDate - today);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      examPlanObj.remainingDays = diffDays;
    } else {
      examPlanObj.isPurchased = false;
    }

    // Format image URL if exists
    if (examPlanObj.image) {
      examPlanObj.imageUrl = `${process.env.BASE_URL}${examPlanObj.image}`;
    }

    return res.success(examPlanObj);
  } catch (error) {
    console.error("Error fetching exam plan:", error);
    return res.someThingWentWrong(error);
  }
};

// Test Series
exports.getAllTestSeries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      examPlanId = null,
      sortBy = "createdAt",
      sortOrder = "desc",
      isFree = null,
    } = req.query;

    console.log(".......................................................");
    // Build query object
    const query = { status: true, deletedAt: null };

    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Add exam plan filter
    if (examPlanId) {
      console.log("examPlanId", examPlanId);
      query.examPlanId = new mongoose.Types.ObjectId(examPlanId);
    }

    // Add free/paid filter
    if (isFree !== null) {
      query.isFree = isFree === "true";
    }
    console.log("query", query);
    // Count total records
    const total = await TestSeries.countDocuments(query);

    console.log("total", total);

    if (total === 0) {
      return res.status(200).json({
        status: true,
        message: "No record found",
        data: {
          count: 0,
          current_page: parseInt(page),
          totalPages: 0,
          pagination: [],
          limit: parseInt(limit),
          record: [],
        },
      });
    }

    // Calculate pagination values
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalPages = Math.ceil(total / parseInt(limit));

    // Generate pagination array
    const pagination = [];
    for (let i = 1; i <= totalPages; i++) {
      pagination.push(i);
    }

    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with pagination and sorting
    const testSeries = await TestSeries.find(query)
      .populate({
        path: "examPlanId",
        select: "title batchId isFree price mrp validityDays",
        populate: {
          path: "batchId",
          select: "name",
        },
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOptions);

    // Get section counts and enhance test series data
    const enhancedTestSeries = await Promise.all(
      testSeries.map(async (series) => {
        const seriesObj = series.toObject();

        // Get section count
        const sectionCount = await Section.countDocuments({
          testSeriesId: series?._id,
          status: true,
          deletedAt: null,
        });
        seriesObj.sectionCount = sectionCount;

        // Get sections for this test series
        const sections = await Section.find({
          testSeriesId: series._id,
          status: true,
          deletedAt: null,
        })
          .select("name sequence totalQuestions")
          .sort({ sequence: 1 });

        seriesObj.sections = sections;

        // Check if user has purchased this test series (if it's not free)
        if (!series.isFree && req.user) {
          const userPurchase = await UserPurchase.findOne({
            userId: req.user._id,
            itemType: "EXAM_PLAN",
            itemId: series.examPlanId._id,
            status: "ACTIVE",
            expiryDate: { $gt: new Date() },
          });

          seriesObj.isPurchased = !!userPurchase;

          if (userPurchase) {
            seriesObj.expiryDate = userPurchase.expiryDate;
          }
        } else {
          seriesObj.isPurchased = series.isFree;
        }

        return seriesObj;
      })
    );

    // Return response
    return res.status(200).json({
      status: true,
      message: "Success",
      data: {
        count: total,
        current_page: parseInt(page),
        totalPages,
        pagination,
        limit: parseInt(limit),
        record: enhancedTestSeries,
      },
    });
  } catch (error) {
    console.error("Error fetching test series:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

/**
 * @desc    Get test series by ID
 * @route   GET /api/test-series/:id
 * @access  Private (User)
 */
exports.getTestSeriesById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find test series
    const testSeries = await TestSeries.findOne({
      _id: id,
      status: true,
      deletedAt: null,
    }).populate({
      path: "examPlanId",
      select: "title batchId isFree price mrp validityDays",
      populate: {
        path: "batchId",
        select: "name",
      },
    });

    if (!testSeries) {
      return res.status(404).json({
        status: false,
        message: "Test series not found",
        data: null,
      });
    }

    // Get sections for this test series
    const sections = await Section.find({
      testSeriesId: testSeries._id,
      status: true,
      deletedAt: null,
    }).sort({ sequence: 1 });

    // Check if user has purchased this test series (if it's not free)
    let isPurchased = testSeries.isFree;
    let expiryDate = null;

    if (!testSeries.isFree && req.user) {
      const userPurchase = await UserPurchase.findOne({
        userId: req.user._id,
        itemType: "EXAM_PLAN",
        itemId: testSeries.examPlanId._id,
        status: "ACTIVE",
        expiryDate: { $gt: new Date() },
      });

      isPurchased = !!userPurchase;

      if (userPurchase) {
        expiryDate = userPurchase.expiryDate;
      }
    }

    // Format response
    const result = testSeries.toObject();
    result.sections = sections;
    result.isPurchased = isPurchased;
    result.expiryDate = expiryDate;

    return res.status(200).json({
      status: true,
      message: "Success",
      data: result,
    });
  } catch (error) {
    console.error("Error fetching test series:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
